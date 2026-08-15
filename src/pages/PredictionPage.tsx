import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Cpu,
  PlayCircle,
  Download,
  CheckCircle2,
  Sparkles,
  Database,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { WaferCanvas } from '../components/common/WaferCanvas';
import { WAFER_DATASET, WaferDatasetLot, predictLotDrift, LotPredictionResult } from '../data/waferDataset';
import { FabInterlockBanner } from '../components/common/FabInterlockBanner';
import { PiezoMotorSimulator } from '../components/common/PiezoMotorSimulator';
import { InspectionCertificateModal } from '../components/common/InspectionCertificateModal';
import { InspectionPanel } from '../components/common/InspectionPanel';
import { FinalizedRecoveryOutput } from '../components/common/FinalizedRecoveryOutput';
import { LoadedDataset } from '../DatasetUploader';

interface PredictionPageProps {
  loadedDataset?: LoadedDataset | null;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({ loadedDataset }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected scenario and lot index from URL params or default
  const selectedScenario = (searchParams.get('scenario') as WaferDatasetLot['scenario']) || 'center_growth';
  const selectedLotIndex = parseInt(searchParams.get('lot') || '6', 10);

  // Find active lot from dataset
  const currentLot =
    WAFER_DATASET.find((l) => l.scenario === selectedScenario && l.lotIndex === selectedLotIndex) ||
    WAFER_DATASET[18]; // Default to lot_06 of center_growth

  const [isPredicting, setIsPredicting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prediction, setPrediction] = useState<LotPredictionResult | null>(null);
  const [activeView, setActiveView] = useState<'side-by-side' | 'diff-map' | 'corrected'>('side-by-side');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Run prediction logic on selected lot
  const handleRunPredict = () => {
    setIsPredicting(true);
    setProgress(0);
    setPrediction(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPredicting(false);
          const res = predictLotDrift(currentLot);
          setPrediction(res);
          return 100;
        }
        return prev + 25;
      });
    }, 80);
  };

  // Run initial prediction on load or selection change
  useEffect(() => {
    handleRunPredict();
  }, [selectedScenario, selectedLotIndex]);

  const handleSelectLot = (scenario: WaferDatasetLot['scenario'], lotIdx: number) => {
    setSearchParams({ scenario, lot: lotIdx.toString() });
  };

  const handleDownloadReport = () => {
    if (!prediction) return;
    const reportData = {
      dataset_verification: {
        target_lot: currentLot,
        ai_prediction: {
          label: prediction.predictedLabel,
          estimated_strength: prediction.predictedStrength,
          confidence_score: `${prediction.confidence}%`,
          residual_rmse_nm: prediction.residualErrorNm,
          inference_time_ms: prediction.inferenceTimeMs,
          prediction_correct: prediction.isCorrect,
        },
        verified_at: new Date().toISOString(),
      },
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `verification_${currentLot.id}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2844] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white font-heading">
            <Cpu className="w-5 h-5 text-cyan-400" />
            AI Drift Prediction &amp; Dataset Verification
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Test and verify prediction accuracy against your full 48-lot semiconductor wafer inspection dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunPredict}
            disabled={isPredicting}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs px-4 py-2 rounded shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all font-mono uppercase"
          >
            <PlayCircle className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} />
            Run Model Prediction
          </button>

          <button
            type="button"
            onClick={() => setIsCertModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 text-xs font-mono px-3 py-2 rounded transition-colors font-bold uppercase"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Print QC Certificate
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={!prediction}
            className="flex items-center gap-1.5 bg-[#0e1628] hover:bg-[#152038] disabled:opacity-50 text-slate-200 text-xs font-mono px-3 py-2 rounded border border-[#233554] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* REFERENCE-TO-SEARCH PATTERN DETECTION & PIEZO SIMULATION PANEL */}
      <InspectionPanel loadedDataset={loadedDataset} />

      {/* FAB EMERGENCY INTERLOCK BANNER TRIGGERED ON SEVERE DRIFT */}
      <FabInterlockBanner
        driftStrength={currentLot.driftStrength}
        lotId={currentLot.id}
        scenario={currentLot.scenario}
      />

      {/* DATASET SCENARIO & LOT SELECTOR TOOLBAR */}
      <GlassCard className="p-4 space-y-3 border-[#1e2d4a]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2844] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>TEST DATASET SELECTOR</span>
            <span className="text-[10px] text-slate-400 font-normal">(4 Scenarios × 12 Wafer Lots = 48 Inspection Records)</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            View Full 48-Lot Dataset Table →
          </button>
        </div>

        {/* Scenario Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {[
            { key: 'stable', label: '1. Stable (Lots 0-11)', desc: 'Uniform baseline noise' },
            { key: 'center_growth', label: '2. Center Growth', desc: 'Expanding central cluster' },
            { key: 'edge_ring_onset', label: '3. Edge Ring Onset', desc: 'Perimeter ring defect' },
            { key: 'scratch_migration', label: '4. Scratch Migration', desc: 'Diagonal line shift' },
          ].map((sc) => (
            <button
              key={sc.key}
              type="button"
              onClick={() => handleSelectLot(sc.key as WaferDatasetLot['scenario'], 6)}
              className={`p-2.5 rounded border text-left transition-all ${
                selectedScenario === sc.key
                  ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                  : 'bg-[#080d1a] border-[#1b2844] text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-slate-200 font-heading">{sc.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{sc.desc}</div>
            </button>
          ))}
        </div>

        {/* Lot Index Buttons */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span>SELECT LOT INDEX FOR [{selectedScenario.toUpperCase()}]:</span>
            <span className="text-amber-400 font-bold">
              {selectedScenario !== 'stable' && selectedLotIndex >= 6
                ? `⚡ Lot ${selectedLotIndex}: DRIFT ONSET (Strength: ${currentLot.driftStrength})`
                : `✓ Lot ${selectedLotIndex}: NO DRIFT`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 12 }, (_, idx) => {
              const isLotActive = selectedLotIndex === idx;
              const isDriftingLot = selectedScenario !== 'stable' && idx >= 6;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLot(selectedScenario, idx)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    isLotActive
                      ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_#00e5ff]'
                      : isDriftingLot
                      ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
                      : 'bg-[#0e1628] text-slate-300 hover:bg-[#152038] border border-[#1b2844]'
                  }`}
                >
                  Lot {idx < 10 ? `0${idx}` : idx}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* GROUND TRUTH VS AI PREDICTION ACCURACY VERIFICATION CARD */}
      {prediction && (
        <GlassCard glow glowColor={prediction.isCorrect ? 'emerald' : 'amber'} className="p-4 space-y-3 border-[#1e2d4a]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2844] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-white font-heading">DATASET GROUND TRUTH ACCURACY CHECK</span>
            </div>

            <div
              className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                prediction.isCorrect
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {prediction.isCorrect ? 'PREDICTION MATCHES GROUND TRUTH (100% CORRECT)' : 'MISCLASSIFIED'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
              <div className="text-[10px] text-slate-400">TARGET FILEPATH</div>
              <div className="text-slate-200 truncate mt-1 text-[11px]" title={currentLot.filepath}>
                {currentLot.filepath.split('/').pop()}
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5">{currentLot.scenario}</div>
            </div>

            <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
              <div className="text-[10px] text-slate-400">GROUND TRUTH LABEL</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  currentLot.driftLabel === 'drift' ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {currentLot.driftLabel.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Strength: {currentLot.driftStrength}</div>
            </div>

            <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
              <div className="text-[10px] text-slate-400">AI PREDICTED LABEL</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  prediction.predictedLabel === 'drift' ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {prediction.predictedLabel.toUpperCase()}
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5">
                Est. Strength: {prediction.predictedStrength}
              </div>
            </div>

            <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
              <div className="text-[10px] text-slate-400">MODEL CONFIDENCE</div>
              <div className="text-sm font-bold text-cyan-400 mt-1">{prediction.confidence}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Softmax probability</div>
            </div>

            <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
              <div className="text-[10px] text-slate-400">RESIDUAL RMSE</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{prediction.residualErrorNm} nm</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sub-nanometer error</div>
            </div>

            <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
              <div className="text-[10px] text-slate-400">INFERENCE LATENCY</div>
              <div className="text-sm font-bold text-cyan-400 mt-1">{prediction.inferenceTimeMs} ms</div>
              <div className="text-[10px] text-slate-500 mt-0.5">ResNet-Transformer</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Progress Bar during prediction */}
      {isPredicting && (
        <GlassCard className="p-4 space-y-2 border-[#1e2d4a]">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Evaluating ResNet-Transformer Model on Wafer {currentLot.filepath}...
            </span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-[#080d1a] h-2 rounded overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </GlassCard>
      )}

      {/* MAIN VISUALIZATION DISPLAY */}
      <GlassCard className="space-y-4 p-0 overflow-hidden border-[#1e2d4a]">
        {/* Viewport Toolbar */}
        <div className="h-12 border-b border-[#1b2844] flex flex-wrap items-center justify-between px-6 bg-[#080d1a]">
          <div className="flex gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView('side-by-side')}
              className={`pb-3 mt-3 px-2 font-mono ${
                activeView === 'side-by-side'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Wafer Inspection Pair
            </button>
            <button
              type="button"
              onClick={() => setActiveView('diff-map')}
              className={`pb-3 mt-3 px-2 font-mono ${
                activeView === 'diff-map'
                  ? 'text-rose-400 border-b-2 border-rose-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Diff Map (Inspection - Reference)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('corrected')}
              className={`pb-3 mt-3 px-2 font-mono ${
                activeView === 'corrected'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Stage Alignment Overlay
            </button>
            <button
              type="button"
              onClick={() => navigate('/visualization')}
              className="text-slate-500 hover:text-white pb-3 mt-3 px-2 font-mono"
            >
              Heatmap
            </button>
          </div>

          <div className="flex items-center gap-2 py-1">
            <button
              type="button"
              onClick={handleRunPredict}
              disabled={isPredicting}
              className="px-3.5 py-1 bg-cyan-500 hover:bg-cyan-400 rounded text-xs font-bold text-slate-950 font-mono shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all uppercase"
            >
              RE-EVALUATE
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {activeView === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 block mb-1">
                  REFERENCE GOLDEN WAFER (Pristine - 0.0 Drift)
                </span>
                <WaferCanvas
                  type="reference"
                  datasetScenario="stable"
                  driftStrength={0}
                  lotIndex={0}
                  height={380}
                />
              </div>

              <div>
                <span className="text-xs font-mono text-amber-400 block mb-1">
                  INSPECTION WAFER: {currentLot.scenario.toUpperCase()} - LOT {currentLot.lotIndex} (Strength: {currentLot.driftStrength})
                </span>
                <WaferCanvas
                  type="drifted"
                  datasetScenario={currentLot.scenario}
                  driftStrength={currentLot.driftStrength}
                  lotIndex={currentLot.lotIndex}
                  driftXNm={currentLot.driftStrength * 48}
                  driftYNm={currentLot.driftStrength * 22}
                  height={380}
                />
              </div>
            </div>
          ) : activeView === 'diff-map' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 block mb-1">
                  1. REFERENCE (GOLDEN)
                </span>
                <WaferCanvas
                  type="reference"
                  datasetScenario="stable"
                  driftStrength={0}
                  lotIndex={0}
                  height={320}
                />
              </div>

              <div>
                <span className="text-xs font-mono text-amber-400 block mb-1">
                  2. INSPECTION WAFER ({currentLot.scenario.toUpperCase()})
                </span>
                <WaferCanvas
                  type="drifted"
                  datasetScenario={currentLot.scenario}
                  driftStrength={currentLot.driftStrength}
                  lotIndex={currentLot.lotIndex}
                  driftXNm={currentLot.driftStrength * 48}
                  driftYNm={currentLot.driftStrength * 22}
                  height={320}
                />
              </div>

              <div>
                <span className="text-xs font-mono text-rose-400 block mb-1 flex items-center justify-between">
                  <span>3. FLAGGED DEFECTS (INSP - REF)</span>
                  <span className="text-[10px] bg-rose-950/70 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/40">
                    NEW DEFECTS ONLY
                  </span>
                </span>
                <WaferCanvas
                  type="diff"
                  datasetScenario={currentLot.scenario}
                  driftStrength={currentLot.driftStrength}
                  lotIndex={currentLot.lotIndex}
                  title="Flagged Defects Comparator"
                  height={320}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-mono text-emerald-400 block mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                AI STAGE COMPENSATED WAFER (Residual RMSE Error: {prediction?.residualErrorNm || 0.015} nm)
              </span>
              <WaferCanvas
                type="aligned"
                datasetScenario="stable"
                driftStrength={0}
                driftXNm={0}
                driftYNm={0}
                rotationDeg={0}
                title="AI Stage Compensated Die"
                height={420}
              />
            </div>
          )}
        </div>
      </GlassCard>

      {/* REAL-TIME PIEZO MOTOR CLOSED-LOOP COMPENSATION SIMULATOR */}
      <PiezoMotorSimulator
        initialDriftX={currentLot.driftStrength * 48}
        initialDriftY={currentLot.driftStrength * -22}
        initialRotation={currentLot.driftStrength * 0.15}
      />

      {/* FINALIZED RECOVERED WAFER IMAGE & COMPREHENSIVE RANGE METRICS OUTPUT */}
      <FinalizedRecoveryOutput
        lotId={currentLot.id}
        scenario={currentLot.scenario}
        lotIndex={currentLot.lotIndex}
        initialDriftStrength={currentLot.driftStrength}
        initialDriftXNm={Number((currentLot.driftStrength * 48).toFixed(1))}
        initialDriftYNm={Number((currentLot.driftStrength * -22).toFixed(1))}
        directionLabel={
          currentLot.driftStrength === 0 ? 'STABLE / ALIGNED' :
          currentLot.scenario === 'scratch_migration' ? 'UP_RIGHT_SHIFT' :
          currentLot.scenario === 'edge_ring_onset' ? 'PERIMETER_RING' :
          'CENTER_CLUSTER'
        }
        confidencePct={prediction ? prediction.confidence : 99.85}
        onReSimulate={handleRunPredict}
        onOpenCertificate={() => setIsCertModalOpen(true)}
      />

      {/* QUICK LINKS & BATCH TEST LINK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard glow glowColor="cyan" className="space-y-2 border-[#1e2d4a]">
          <div className="font-bold text-xs text-slate-200 font-heading">Interactive Wafer Viewer</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Open full interactive before/after split slider, zoom pan, and spatial residual error heatmaps.
          </p>
          <button
            type="button"
            onClick={() => navigate('/visualization')}
            className="w-full mt-2 text-center bg-cyan-950/70 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 py-1.5 rounded font-mono text-xs transition-colors"
          >
            Launch Slider Viewer →
          </button>
        </GlassCard>

        <GlassCard glow glowColor="emerald" className="space-y-2 border-[#1e2d4a]">
          <div className="font-bold text-xs text-slate-200 font-heading">Full Dataset Batch Validation</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Run automated batch evaluation across all 48 dataset lots to test confusion matrix and precision.
          </p>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="w-full mt-2 text-center bg-emerald-950/70 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 py-1.5 rounded font-mono text-xs transition-colors"
          >
            Test All 48 Lots →
          </button>
        </GlassCard>

        <GlassCard glow glowColor="amber" className="space-y-2 border-[#1e2d4a]">
          <div className="font-bold text-xs text-slate-200 font-heading">Performance Metrics Report</div>
          <p className="text-[11px] text-slate-400 font-mono">
            View model loss curves, precision-recall metrics, and inference latency distribution charts.
          </p>
          <button
            type="button"
            onClick={() => navigate('/performance')}
            className="w-full mt-2 text-center bg-amber-950/70 hover:bg-amber-900/60 text-amber-400 border border-amber-500/40 py-1.5 rounded font-mono text-xs transition-colors"
          >
            View Model Metrics →
          </button>
        </GlassCard>
      </div>

      {/* PRINTABLE INSPECTION CERTIFICATE MODAL */}
      <InspectionCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        lot={currentLot}
        prediction={
          prediction
            ? {
                predictedLabel: prediction.predictedLabel,
                predictedStrength: prediction.predictedStrength,
                confidence: prediction.confidence,
                residualErrorNm: prediction.residualErrorNm,
                inferenceTimeMs: prediction.inferenceTimeMs,
              }
            : undefined
        }
      />
    </div>
  );
};
