import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Cpu,
  Activity,
  Sparkles,
  Download,
  ShieldCheck,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { MatchResult, localizeReference } from '../../localization/matcher';
import { classifyDefect, computeNavigationError, NavError } from '../../localization/navigationError';
import { isPlausibleWafer } from '../../localization/waferValidator';
import {
  PiezoState,
  createPiezoSimulation,
  stepSimulation,
  injectDisturbance,
} from '../../simulation/piezoController';
import { LoadedDataset } from '../../DatasetUploader';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface InspectionPanelProps {
  loadedDataset?: LoadedDataset | null;
  inspectionImageSrc?: string;
  refImageSrc?: string;
  inspectionFileName?: string;
}

// Helper to create synthetic wafer pattern images for out-of-the-box demo if no dataset is present
function generateSyntheticWaferImages(): Promise<{ refImg: HTMLImageElement; searchImg: HTMLImageElement; groundTruth: { x: number; y: number } }> {
  return new Promise((resolve) => {
    // 1. Search Image (300x300 canvas with grid array and shifted wafer pattern)
    const searchCanvas = document.createElement('canvas');
    searchCanvas.width = 320;
    searchCanvas.height = 320;
    const sCtx = searchCanvas.getContext('2d')!;

    // Dark silicon wafer background
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 320, 320);

    // Die lattice grid
    sCtx.strokeStyle = '#1e293b';
    sCtx.lineWidth = 1;
    for (let x = 20; x < 320; x += 30) {
      sCtx.beginPath();
      sCtx.moveTo(x, 0);
      sCtx.lineTo(x, 320);
      sCtx.stroke();
    }
    for (let y = 20; y < 320; y += 30) {
      sCtx.beginPath();
      sCtx.moveTo(0, y);
      sCtx.lineTo(320, y);
      sCtx.stroke();
    }

    // Ground Truth center of the reference feature in search image
    const gtX = 184; // Drifted from center (160, 160) by +24px
    const gtY = 138; // Drifted from center (160, 160) by -22px

    // Draw reference structure at ground truth location on search canvas
    sCtx.fillStyle = '#38bdf8'; // Cyan feature
    sCtx.fillRect(gtX - 25, gtY - 25, 50, 50);
    sCtx.fillStyle = '#f59e0b'; // Amber center dot
    sCtx.beginPath();
    sCtx.arc(gtX, gtY, 12, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.strokeStyle = '#e2e8f0';
    sCtx.lineWidth = 3;
    sCtx.strokeRect(gtX - 18, gtY - 18, 36, 36);

    // 2. Reference Image (100x100 crop of the baseline feature)
    const refCanvas = document.createElement('canvas');
    refCanvas.width = 80;
    refCanvas.height = 80;
    const rCtx = refCanvas.getContext('2d')!;

    rCtx.fillStyle = '#0f172a';
    rCtx.fillRect(0, 0, 80, 80);
    rCtx.fillStyle = '#38bdf8';
    rCtx.fillRect(15, 15, 50, 50);
    rCtx.fillStyle = '#f59e0b';
    rCtx.beginPath();
    rCtx.arc(40, 40, 12, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.strokeStyle = '#e2e8f0';
    rCtx.lineWidth = 3;
    rCtx.strokeRect(22, 22, 36, 36);

    // Load into HTMLImageElements
    let loadedCount = 0;
    const refImg = new Image();
    const searchImg = new Image();

    const checkDone = () => {
      loadedCount++;
      if (loadedCount === 2) {
        resolve({ refImg, searchImg, groundTruth: { x: gtX, y: gtY } });
      }
    };

    refImg.onload = checkDone;
    searchImg.onload = checkDone;

    refImg.src = refCanvas.toDataURL();
    searchImg.src = searchCanvas.toDataURL();
  });
}

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  loadedDataset,
  inspectionImageSrc,
  refImageSrc,
  inspectionFileName,
}) => {
  // Detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [defectInfo, setDefectInfo] = useState<{ isDefect: boolean; reason: string } | null>(null);
  const [navError, setNavError] = useState<NavError | null>(null);
  const [groundTruth, setGroundTruth] = useState<{ x: number; y: number }>({ x: 184, y: 138 });
  const [errorThreshold, setErrorThreshold] = useState<number>(0.40);
  const [validationError, setValidationError] = useState<{ isError: boolean; reason: string } | null>(null);

  // Piezo simulation state
  const [piezoState, setPiezoState] = useState<PiezoState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [recoveryTimeMs, setRecoveryTimeMs] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recoveryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const searchImgRef = useRef<HTMLImageElement | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const handleThresholdChange = (newVal: number) => {
    setErrorThreshold(newVal);
    if (matchResult) {
      const updatedDefect = classifyDefect(matchResult, newVal);
      setDefectInfo(updatedDefect);
      console.log(`[InspectionPanel] Updated defect classification with threshold ${newVal}:`, updatedDefect);
    }
  };

  // 1. Run Detection Handler
  const handleRunDetection = async () => {
    setIsDetecting(true);
    setValidationError(null);

    try {
      console.log('[InspectionPanel] STAGE 1: Loading inspection image and golden reference...');

      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.src = url;
        });
      };

      let searchElement: HTMLImageElement | null = null;
      let refElement: HTMLImageElement | null = null;
      let gt = groundTruth;

      // 1. Load Inspection Image
      if (inspectionImageSrc) {
        console.log('[InspectionPanel] Loading user uploaded/selected inspection image:', inspectionFileName || 'Inspection Image');
        searchElement = await loadImage(inspectionImageSrc);
      } else if (loadedDataset && loadedDataset.files.length >= 2) {
        console.log('[InspectionPanel] Loading inspection image from loaded dataset...');
        const searchFile = loadedDataset.files.find((f) => f.path.includes('inspections/') || f.path.includes('curr')) || loadedDataset.files[1];
        searchElement = await loadImage(searchFile.url);
      }

      // 2. Load Golden Reference Image
      if (refImageSrc) {
        console.log('[InspectionPanel] Loading custom golden reference image...');
        refElement = await loadImage(refImageSrc);
      } else if (loadedDataset && loadedDataset.files.length >= 1) {
        console.log('[InspectionPanel] Loading matching reference from dataset under references/...');
        const refFile = loadedDataset.files.find((f) => f.path.includes('references/') || f.path.includes('ref')) || loadedDataset.files[0];
        refElement = await loadImage(refFile.url);
      }

      // Fallback if either image is missing
      if (!searchElement || !refElement) {
        console.log('[InspectionPanel] Using synthetic wafer benchmark pair fallback...');
        const syn = await generateSyntheticWaferImages();
        searchElement = searchElement || syn.searchImg;
        refElement = refElement || syn.refImg;
        gt = syn.groundTruth;
        setGroundTruth(gt);
      }

      if (searchElement) {
        searchImgRef.current = searchElement;
      }

      console.log(`[InspectionPanel] Stage 1 Complete: SearchImg=${searchElement.naturalWidth || searchElement.width}x${searchElement.naturalHeight || searchElement.height}, RefImg=${refElement.naturalWidth || refElement.width}x${refElement.naturalHeight || refElement.height}`);

      // STAGE 2: Pre-check domain validator (isPlausibleWafer)
      console.log('[InspectionPanel] STAGE 2: Running isPlausibleWafer() domain validator check...');
      const valResult = isPlausibleWafer(searchElement);
      console.log('[InspectionPanel] Validator Result:', valResult);

      if (!valResult.valid) {
        console.warn('[InspectionPanel] REJECTED BY DOMAIN VALIDATOR (Not a wafer):', valResult.reason);
        setValidationError({ isError: true, reason: valResult.reason });
        setMatchResult(null);
        setDefectInfo(null);
        setNavError(null);
        return;
      }

      // STAGE 3: Execute template matching localization
      console.log('[InspectionPanel] STAGE 3: Executing multi-scale NCC template matching...');
      const result = await localizeReference(refElement, searchElement, gt);
      console.log(`[InspectionPanel] Match Confidence Score: ${result.confidence.toFixed(1)}% at location (${result.x}, ${result.y})`);

      // STAGE 4: Classify Defect with confidence threshold
      console.log(`[InspectionPanel] STAGE 4: Classifying defect status with errorThreshold=${errorThreshold}...`);
      const defect = classifyDefect(result, errorThreshold);
      console.log('[InspectionPanel] Final Classification Result:', defect);

      const err = computeNavigationError({ x: result.x, y: result.y }, gt, 5);

      setMatchResult(result);
      setDefectInfo(defect);
      setNavError(err);

      // Reset piezo state when new detection runs
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsSimulating(false);
      setPiezoState(null);
      setRecoveryTimeMs(null);
    } catch (e) {
      console.error('[InspectionPanel] Detection error:', e);
    } finally {
      setIsDetecting(false);
    }
  };

  // 2. Start Piezo Simulation Handler
  const handleStartPiezoCorrection = () => {
    if (!matchResult) return;

    // Start position = detected position (matchResult.x, matchResult.y)
    // Target position = groundTruth or reference alignment center (160, 160)
    const targetPos = { x: 160, y: 160 };
    const startPos = { x: matchResult.x, y: matchResult.y };

    const initialState = createPiezoSimulation(startPos, targetPos);
    setPiezoState(initialState);
    setIsSimulating(true);
    setRecoveryTimeMs(null);
    startTimeRef.current = Date.now();

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = window.setInterval(() => {
      setPiezoState((prevState) => {
        if (!prevState) return null;
        const nextState = stepSimulation(prevState);

        if (nextState.status === 'recovered') {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          setIsSimulating(false);
          setRecoveryTimeMs(Date.now() - startTimeRef.current);
        }

        return nextState;
      });
    }, 200);
  };

  // 3. Inject Disturbance Handler
  const handleInjectDisturbance = () => {
    if (!piezoState) return;

    // Inject random offset (dx in [+4, +8], dy in [-6, -2])
    const dx = Math.floor(Math.random() * 5) + 4;
    const dy = -(Math.floor(Math.random() * 5) + 2);

    const disturbedState = injectDisturbance(piezoState, dx, dy);
    setPiezoState(disturbedState);
    setIsSimulating(true);
    setRecoveryTimeMs(null);
    startTimeRef.current = Date.now();

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = window.setInterval(() => {
      setPiezoState((prevState) => {
        if (!prevState) return null;
        const nextState = stepSimulation(prevState);

        if (nextState.status === 'recovered') {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          setIsSimulating(false);
          setRecoveryTimeMs(Date.now() - startTimeRef.current);
        }

        return nextState;
      });
    }, 200);
  };

  // Render HTML5 Stage Movement Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (!piezoState) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting Piezo Simulation Launch', w / 2, h / 2);
      return;
    }

    // Scale canvas coordinates to fit canvas bounds
    const scaleX = w / 320;
    const scaleY = h / 320;

    const targetCanvasX = piezoState.target.x * scaleX;
    const targetCanvasY = piezoState.target.y * scaleY;

    const currentCanvasX = piezoState.position.x * scaleX;
    const currentCanvasY = piezoState.position.y * scaleY;

    // Vector line between current and target
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentCanvasX, currentCanvasY);
    ctx.lineTo(targetCanvasX, targetCanvasY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target position (GREEN DOT)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TARGET (Reference)', targetCanvasX + 12, targetCanvasY + 4);

    // Current Stage Position (BLUE DOT)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(currentCanvasX, currentCanvasY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('CURRENT STAGE', currentCanvasX + 12, currentCanvasY - 8);
  }, [piezoState]);

  // Render Recovered Wafer Image Canvas when piezo simulation finishes
  useEffect(() => {
    if (piezoState?.status !== 'recovered') return;
    const canvas = recoveryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw search image or dark wafer backdrop
    if (searchImgRef.current) {
      ctx.drawImage(searchImgRef.current, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Grid overlay
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Semi-transparent contrast mask
    ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
    ctx.fillRect(0, 0, w, h);

    const imgW = searchImgRef.current?.naturalWidth || searchImgRef.current?.width || 320;
    const imgH = searchImgRef.current?.naturalHeight || searchImgRef.current?.height || 320;
    const scaleX = w / imgW;
    const scaleY = h / imgH;

    const initialRecord = piezoState.history[0];
    const initialPos = initialRecord
      ? { x: initialRecord.posX, y: initialRecord.posY }
      : { x: matchResult?.x ?? 0, y: matchResult?.y ?? 0 };
    const finalPos = { x: piezoState.position.x, y: piezoState.position.y };
    const targetPos = { x: piezoState.target.x, y: piezoState.target.y };

    const initCanvasX = initialPos.x * scaleX;
    const initCanvasY = initialPos.y * scaleY;
    const finalCanvasX = finalPos.x * scaleX;
    const finalCanvasY = finalPos.y * scaleY;
    const targetCanvasX = targetPos.x * scaleX;
    const targetCanvasY = targetPos.y * scaleY;

    // 2. Dashed displacement vector line connecting Original -> Final
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(initCanvasX, initCanvasY);
    ctx.lineTo(finalCanvasX, finalCanvasY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. ORIGINAL DETECTED POSITION (Faded Red Marker)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath();
    ctx.arc(initCanvasX, initCanvasY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(initCanvasX, initCanvasY, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Red Crosshairs
    ctx.beginPath();
    ctx.moveTo(initCanvasX - 14, initCanvasY);
    ctx.lineTo(initCanvasX + 14, initCanvasY);
    ctx.moveTo(initCanvasX, initCanvasY - 14);
    ctx.lineTo(initCanvasX, initCanvasY + 14);
    ctx.stroke();

    // Red Label
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ORIGINAL (${initialPos.x.toFixed(1)}, ${initialPos.y.toFixed(1)})`, initCanvasX + 16, initCanvasY - 6);

    // 4. Target position (Subtle Cyan dashed ring)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. FINAL CORRECTED POSITION (Bright Green Marker & Crosshair)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.beginPath();
    ctx.arc(finalCanvasX, finalCanvasY, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(finalCanvasX, finalCanvasY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Green Crosshairs
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(finalCanvasX - 18, finalCanvasY);
    ctx.lineTo(finalCanvasX + 18, finalCanvasY);
    ctx.moveTo(finalCanvasX, finalCanvasY - 18);
    ctx.lineTo(finalCanvasX, finalCanvasY + 18);
    ctx.stroke();

    // Green Label
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FINAL CORRECTED (${finalPos.x.toFixed(1)}, ${finalPos.y.toFixed(1)})`, finalCanvasX + 18, finalCanvasY + 14);

    // Watermark Header Badge
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(10, 10, 260, 26);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 260, 26);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DRIFT-SENSE: WAFER ALIGNED', 20, 26);
  }, [piezoState, matchResult]);

  const handleDownloadReport = () => {
    const canvas = recoveryCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `wafer-piezo-recovery-report-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const lastHistory = piezoState?.history[piezoState.history.length - 1];

  const initialRecord = piezoState?.history[0];
  const initialPos = initialRecord
    ? { x: initialRecord.posX, y: initialRecord.posY }
    : { x: matchResult?.x ?? 0, y: matchResult?.y ?? 0 };
  const targetPos = piezoState ? piezoState.target : { x: 160, y: 160 };
  const finalPos = piezoState ? piezoState.position : { x: 160, y: 160 };

  const totalXDisplacement = initialPos.x - finalPos.x;
  const totalYDisplacement = initialPos.y - finalPos.y;
  const totalEuclideanDisplacement = Math.sqrt(totalXDisplacement * totalXDisplacement + totalYDisplacement * totalYDisplacement);

  const iterations = piezoState?.iteration ?? 0;
  const recoveryTimeSec = (iterations * 0.2).toFixed(1);
  const finalResidualError = lastHistory?.error ?? 0;

  return (
    <div className="space-y-6 font-mono text-slate-100">
      {/* SECTION 1: DETECTION & LOCALIZATION PANEL */}
      <GlassCard className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-cyan-400" />
              Reference-to-Search Pattern Detection & Localization
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Multi-scale Normalized Cross-Correlation (NCC) with periodic pattern disambiguation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunDetection}
            disabled={isDetecting}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isDetecting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                Matching NCC Template...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Detection
              </>
            )}
          </button>
        </div>

        {/* Threshold Slider & Active Target Banner */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-bold">Defect Detection Threshold:</span>
              <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                {Math.round(errorThreshold * 100)}% ({errorThreshold.toFixed(2)})
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-64">
              <span className="text-[10px] text-slate-500">Sensitive (0.20)</span>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={errorThreshold}
                onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Strict (0.80)</span>
            </div>
          </div>

          {inspectionFileName && (
            <div className="flex items-center justify-between text-xs font-mono bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/30">
              <span className="text-cyan-300 font-bold">Active Inspection Image: {inspectionFileName}</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40">
                User Selected Target
              </span>
            </div>
          )}
        </div>

        {/* DOMAIN VALIDATION ERROR DISPLAY (NON-WAFER REJECTED) */}
        {validationError && validationError.isError && (
          <div className="p-4 bg-red-950/40 border border-red-500/60 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
              <span>REJECTED: NON-WAFER IMAGE DETECTED</span>
            </div>
            <p className="text-slate-200 bg-slate-950/90 p-3 rounded-lg border border-red-900/50">
              {validationError.reason}
            </p>
            <p className="text-[11px] text-slate-400">
              Only structurally plausible semiconductor wafer or die images pass domain validation. Please upload a valid wafer image.
            </p>
          </div>
        )}

        {/* DETECTION RESULTS DISPLAY */}
        {matchResult ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Match Coordinates & Confidence */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Detected Center (X, Y)</div>
              <div className="text-base font-bold text-cyan-400">
                ({matchResult.x}, {matchResult.y}) px
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                <span>NCC Confidence:</span>
                <span className="font-bold text-white">{matchResult.confidence}%</span>
              </div>
            </div>

            {/* Classification Badge */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Classification Status</div>
              {defectInfo?.isDefect ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  DEFECT DETECTED
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  STABLE / ALIGNED
                </div>
              )}
              <p className="text-[10px] text-slate-400 truncate" title={defectInfo?.reason}>
                {defectInfo?.reason}
              </p>
            </div>

            {/* Navigation Error Metrology */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Stage Drift Error</div>
              {navError ? (
                <div className="space-y-1">
                  <div className="text-sm font-bold text-amber-400">
                    {navError.euclidean} px ({navError.euclidean * 48} nm)
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>ΔX: {navError.deltaX} px</span>
                    <span>ΔY: {navError.deltaY} px</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">No ground truth provided</div>
              )}
            </div>

            {/* Action Trigger */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Closed-Loop Actuator</div>
              <button
                type="button"
                onClick={handleStartPiezoCorrection}
                disabled={!defectInfo?.isDefect || isSimulating}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs py-2 rounded-lg transition-all shadow-md shadow-amber-500/10"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Start Piezo Correction
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-1">
            <Sparkles className="w-5 h-5 text-cyan-400 mx-auto" />
            <p>Click "Run Detection" above to execute template matching on reference & search images.</p>
          </div>
        )}
      </GlassCard>

      {/* SECTION 2: SIMULATED CLOSED-LOOP PIEZO ACTUATOR PANEL */}
      {piezoState && (
        <GlassCard className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Sliders className="w-5 h-5 text-amber-400" />
                Closed-Loop Piezo Actuator PID Control Loop
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                  Simulated piezo actuator — software closed-loop demonstration
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {piezoState.status === 'recovered' && (
                <button
                  type="button"
                  onClick={handleInjectDisturbance}
                  disabled={isSimulating}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-purple-600/20"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Inject Disturbance (+6px, -3px)
                </button>
              )}
            </div>
          </div>

          {/* MOTOR & TELEMETRY DASHBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: HTML5 Canvas Stage Movement */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Stage Vector Visualization
                </span>
                <span className="text-[11px] text-slate-400">Step {piezoState.iteration} / 50</span>
              </div>

              <div className="bg-slate-950 rounded-xl p-2 border border-slate-800">
                <canvas ref={canvasRef} width={320} height={240} className="w-full h-auto rounded-lg block" />
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  piezoState.status === 'recovered'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : piezoState.status === 'correcting' || piezoState.status === 'stabilizing'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse'
                    : 'bg-red-500/10 border-red-500/40 text-red-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-bold uppercase">STATUS: {piezoState.status.replace('_', ' ')}</span>
                </div>
                {recoveryTimeMs && (
                  <span className="text-[11px] font-mono">
                    Recovered in {piezoState.iteration} steps ({recoveryTimeMs}ms)
                  </span>
                )}
              </div>
            </div>

            {/* Right Col: Motor Telemetry & Live Recharts Convergence */}
            <div className="lg:col-span-7 space-y-4">
              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">X PIEZO VOLTAGE</div>
                  <div className="text-amber-400 font-bold mt-1 text-sm">{lastHistory?.voltageX ?? 0} V</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Y PIEZO VOLTAGE</div>
                  <div className="text-amber-400 font-bold mt-1 text-sm">{lastHistory?.voltageY ?? 0} V</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">CURRENT ERROR</div>
                  <div className="text-cyan-400 font-bold mt-1 text-sm">{lastHistory?.error ?? 0} px</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">PID GAINS</div>
                  <div className="text-slate-300 font-bold mt-1 text-[11px]">
                    Kp=0.6 Ki=0.05
                  </div>
                </div>
              </div>

              {/* Recharts Convergence Plot */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Euclidean Error Convergence vs Iteration</span>
                  <span className="text-[10px] text-slate-500 font-normal">Tolerance = 2.0 px</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={piezoState.history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="iteration" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="error"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#f59e0b' }}
                        activeDot={{ r: 5 }}
                        name="Error (px)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* RECOVERY SUMMARY & VISUALIZATION PANEL (WHEN RECOVERED) */}
          {piezoState.status === 'recovered' && (
            <div className="border-t border-slate-800 pt-6 mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/40 shadow-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Closed-Loop Piezo Stage Recovery Complete
                    </h3>
                    <p className="text-xs text-slate-300 font-bold mt-0.5">
                      ✅ POSITION RECOVERED — WAFER ALIGNED
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download Recovery Report
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Col: Recovered Wafer Image Canvas */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Recovered Wafer Visualization
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">PNG Export Canvas</span>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-xl border border-emerald-500/30 shadow-md">
                    <canvas
                      ref={recoveryCanvasRef}
                      width={400}
                      height={400}
                      className="w-full h-auto rounded-lg block"
                    />
                  </div>

                  <div className="flex items-center justify-around text-[10px] text-slate-400 font-mono p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                      Initial Position
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                      Final Position
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                      Target Reference
                    </span>
                  </div>
                </div>

                {/* Right Col: Recovery Summary Table & Metrics */}
                <div className="lg:col-span-7 space-y-3 font-mono">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Recovery Telemetry Summary</span>
                  </div>

                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 divide-y divide-slate-800/80 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Initial Detected Position:</span>
                      <span className="text-red-400 font-bold">
                        ({initialPos.x.toFixed(1)}, {initialPos.y.toFixed(1)}) px
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Target / Reference Position:</span>
                      <span className="text-cyan-400 font-bold">
                        ({targetPos.x.toFixed(1)}, {targetPos.y.toFixed(1)}) px
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Final Corrected Position:</span>
                      <span className="text-emerald-400 font-bold">
                        ({finalPos.x.toFixed(1)}, {finalPos.y.toFixed(1)}) px
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Total X Displacement Corrected:</span>
                      <span className="text-amber-400 font-bold">
                        {totalXDisplacement >= 0 ? '+' : ''}{totalXDisplacement.toFixed(2)} px
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Total Y Displacement Corrected:</span>
                      <span className="text-amber-400 font-bold">
                        {totalYDisplacement >= 0 ? '+' : ''}{totalYDisplacement.toFixed(2)} px
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Total Euclidean Distance Corrected:</span>
                      <span className="text-amber-400 font-bold">
                        {totalEuclideanDisplacement.toFixed(2)} px
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Iterations to Converge:</span>
                      <span className="text-white font-bold">{iterations} steps</span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Recovery Time:</span>
                      <span className="text-white font-bold">
                        {recoveryTimeSec} s ({iterations * 200} ms)
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Final Residual Error:</span>
                      <span className="text-emerald-400 font-bold">
                        {finalResidualError.toFixed(2)} px (Tolerance ≤ 2.0 px)
                      </span>
                    </div>

                    <div className="pt-3 pb-1 flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                        ✅ POSITION RECOVERED — WAFER ALIGNED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
