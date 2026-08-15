import React, { useState, useRef } from 'react';
import {
  Eye,
  Flame,
  Sliders,
  CheckCircle2,
  ZoomIn,
  FileCode,
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { WaferCanvas } from '../components/common/WaferCanvas';
import { PiezoMotorSimulator } from '../components/common/PiezoMotorSimulator';
import { FabInterlockBanner } from '../components/common/FabInterlockBanner';

export const VisualizationPage: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [enableLoupe, setEnableLoupe] = useState(true);
  const [waferType, setWaferType] = useState('Logic 2nm');

  // Loupe mouse inspection coordinates
  const [loupePos, setLoupePos] = useState({ x: 200, y: 180, visible: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const [compensated, setCompensated] = useState(false);

  const handleCompensated = () => {
    setCompensated(true);
    setSliderPos(0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !enableLoupe) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLoupePos({ x, y, visible: true });
  };

  const handleMouseLeave = () => {
    setLoupePos((prev) => ({ ...prev, visible: false }));
  };

  const handleExportSecsGem = () => {
    const secsGemLog = `SECS/GEM EQUIPMENT MESSAGE LOG [S6F11 - WAFER METROLOGY EVENT]
====================================================================
STREAM: 6 (Data Collection) / FUNCTION: 11 (Event Report Send)
DATA COLLECTION ID: 10482
EQUIPMENT ID: FAB_EUV_METROLOGY_STAGE_04
TIMESTAMP: ${new Date().toISOString()}

WAFER LOT ID: CENTER_GROWTH_LOT_06
PATTERN TYPE: ${waferType.toUpperCase()}
FIELD OF VIEW: 150.0 um x 150.0 um

PREDICTED DRIFT VECTOR:
  dx: +42.821 nm
  dy: -18.304 nm
  rotation_theta: +0.142 deg
RESIDUAL STAGE RMSE: 0.022 nm
MODEL INFERENCE LATENCY: 11.2 ms
ALIGNMENT STATUS: COMPENSATED (PASS)
====================================================================`;

    const blob = new Blob([secsGemLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SECS_GEM_Metrology_Log_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2844] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white font-heading">
            <Eye className="w-5 h-5 text-cyan-400" />
            Interactive Wafer Metrology &amp; Spatial Vector Inspection
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Compare uncorrected stage drift against AI-aligned dies using interactive split slider, 4x magnifying loupe, and vector displacement heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">DIE PATTERN:</span>
            <select
              value={waferType}
              onChange={(e) => setWaferType(e.target.value)}
              className="bg-[#080d1a] border border-[#1b2844] text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-400 font-mono text-xs"
            >
              <option value="Logic 2nm">GAAFET 2nm Logic Die</option>
              <option value="NAND 3D">3D NAND 232-Layer Array</option>
              <option value="EUV Mask">EUV Reticle Photomask</option>
              <option value="FO-WLP">DRAM Fan-Out WLP</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportSecsGem}
            className="flex items-center gap-1.5 bg-[#0e1628] hover:bg-[#152038] text-slate-200 text-xs font-mono px-3 py-1.5 rounded border border-[#233554] transition-colors uppercase"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            Export SECS/GEM Log
          </button>
        </div>
      </div>

      {/* FAB EMERGENCY INTERLOCK BANNER */}
      <FabInterlockBanner
        driftStrength={compensated ? 0.022 : 0.62}
        lotId="LOT_08"
        scenario="center_growth"
        onCompensateComplete={handleCompensated}
      />

      {/* Interactive Metrology Toolbar */}
      <GlassCard className="p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono border-[#1e2d4a]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">HEATMAP:</span>
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1 rounded border font-bold transition-colors uppercase ${
                showHeatmap
                  ? 'bg-amber-950/70 text-amber-400 border-amber-500/40'
                  : 'bg-[#080d1a] text-slate-400 border-[#1b2844]'
              }`}
            >
              {showHeatmap ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">4X LOUPE LENS:</span>
            <button
              type="button"
              onClick={() => setEnableLoupe(!enableLoupe)}
              className={`px-2.5 py-1 rounded border font-bold transition-colors uppercase ${
                enableLoupe
                  ? 'bg-cyan-950/70 text-cyan-400 border-cyan-500/40'
                  : 'bg-[#080d1a] text-slate-400 border-[#1b2844]'
              }`}
            >
              {enableLoupe ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="h-4 w-px bg-[#1b2844]" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400">SPLIT COMPARISON:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(parseInt(e.target.value))}
              className="w-28 sm:w-36 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold">{sliderPos}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            dx: +42.8 nm
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            dy: -18.3 nm
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RMSE: 0.022 nm
          </span>
        </div>
      </GlassCard>

      {/* Main Large Viewer Canvas with Magnifier Loupe Overlay */}
      <GlassCard className="p-2 relative overflow-hidden border-[#1e2d4a]">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative cursor-crosshair"
        >
          <WaferCanvas
            type="drifted"
            datasetScenario="center_growth"
            driftStrength={0.667}
            driftXNm={42.8 * (sliderPos / 100)}
            driftYNm={-18.3 * (sliderPos / 100)}
            rotationDeg={0.14 * (sliderPos / 100)}
            showHeatmap={showHeatmap}
            showControls={true}
            height={520}
          />

          {/* 4x Magnifying Loupe Overlay Lens */}
          {enableLoupe && loupePos.visible && (
            <div
              className="absolute pointer-events-none rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.6)] overflow-hidden bg-[#060a14]/90 z-30"
              style={{
                width: '140px',
                height: '140px',
                left: `${loupePos.x - 70}px`,
                top: `${loupePos.y - 70}px`,
              }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold border border-cyan-500/40 rounded-full"
                style={{
                  transform: `scale(2.2) translate(${-(loupePos.x - 200) * 0.3}px, ${-(loupePos.y - 200) * 0.3}px)`,
                }}
              >
                <div className="w-full h-full p-2 bg-emerald-950/40 flex flex-col items-center justify-center text-center font-mono">
                  <div className="w-8 h-8 rounded-full border border-rose-500/80 bg-rose-500/30 mb-1" />
                  <span>4X MICRON LOUPE</span>
                  <span className="text-[8px] text-slate-300">Res: 0.01nm</span>
                </div>
              </div>
              <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none" />
            </div>
          )}
        </div>
      </GlassCard>

      {/* REAL-TIME PIEZO MOTOR CLOSED-LOOP COMPENSATOR */}
      <PiezoMotorSimulator initialDriftX={42.82} initialDriftY={-18.3} initialRotation={0.142} />

      {/* Feature Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <GlassCard glow glowColor="blue" className="space-y-2 border-[#1e2d4a]">
          <div className="flex items-center gap-2 font-bold text-slate-200 font-heading">
            <Flame className="w-4 h-4 text-amber-400" />
            Spatial Distortion Heatmap
          </div>
          <p className="text-slate-400 leading-relaxed">
            Highlights non-linear wafer bowing, thermal strain gradients, and localized pattern distortion across the 300mm substrate. Red regions indicate localized vectors exceeding 50nm.
          </p>
        </GlassCard>

        <GlassCard glow glowColor="emerald" className="space-y-2 border-[#1e2d4a]">
          <div className="flex items-center gap-2 font-bold text-slate-200 font-heading">
            <ZoomIn className="w-4 h-4 text-emerald-400" />
            4x Precision Magnifying Loupe
          </div>
          <p className="text-slate-400 leading-relaxed">
            Hover your cursor over any section of the wafer substrate to magnify silicon circuit interconnects, fiducial reticle marks, and red defect clusters under 400% optical zoom.
          </p>
        </GlassCard>

        <GlassCard glow glowColor="cyan" className="space-y-2 border-[#1e2d4a]">
          <div className="flex items-center gap-2 font-bold text-slate-200 font-heading">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Real-Time Motor Compensation
          </div>
          <p className="text-slate-400 leading-relaxed">
            Verify how piezo-stage motor feedback vectors nullify physical jitter prior to subsequent laser exposure or defect inspection passes.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
