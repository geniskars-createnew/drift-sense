import React, { useState } from 'react';
import { ShieldCheck, Info, Check, AlertCircle, Filter } from 'lucide-react';
import { GlassCard } from './GlassCard';

export const ConfusionMatrixHeatmap: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<'TP' | 'FP' | 'FN' | 'TN'>('TP');

  const matrixData = {
    TP: {
      label: 'TRUE POSITIVES (TP)',
      count: 18,
      percentage: '100%',
      desc: 'Correctly identified drifting wafer lots',
      color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
      lots: [
        'CENTER_GROWTH_LOT_06 to LOT_11 (6 Lots)',
        'EDGE_RING_ONSET_LOT_06 to LOT_11 (6 Lots)',
        'SCRATCH_MIGRATION_LOT_06 to LOT_11 (6 Lots)',
      ],
    },
    FP: {
      label: 'FALSE POSITIVES (FP)',
      count: 0,
      percentage: '0.0%',
      desc: 'False drift alarms on pristine stable wafers',
      color: 'border-slate-800 bg-slate-900/60 text-slate-400',
      lots: ['None - Zero false alarms across all 30 stable lots'],
    },
    FN: {
      label: 'FALSE NEGATIVES (FN)',
      count: 0,
      percentage: '0.0%',
      desc: 'Missed drift occurrences (zero risk)',
      color: 'border-slate-800 bg-slate-900/60 text-slate-400',
      lots: ['None - Zero missed drift occurrences across dataset'],
    },
    TN: {
      label: 'TRUE NEGATIVES (TN)',
      count: 30,
      percentage: '100%',
      desc: 'Correctly verified stable non-drifting wafer lots',
      color: 'border-blue-500/50 bg-blue-950/40 text-blue-300',
      lots: [
        'STABLE_BASELINE_LOT_00 to LOT_11 (12 Lots)',
        'CENTER_GROWTH_LOT_00 to LOT_05 (6 Lots)',
        'EDGE_RING_ONSET_LOT_00 to LOT_05 (6 Lots)',
        'SCRATCH_MIGRATION_LOT_00 to LOT_05 (6 Lots)',
      ],
    },
  };

  const current = matrixData[selectedCell];

  return (
    <GlassCard glow glowColor="cyan" className="space-y-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            48-LOT CONFUSION MATRIX HEATMAP VISUALIZER
          </h3>
          <p className="text-[11px] text-slate-400">
            Interactive classification performance matrix across ground truth vs AI model predictions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded font-bold">
            PRECISION: 100%
          </span>
          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2.5 py-1 rounded font-bold">
            RECALL: 100%
          </span>
        </div>
      </div>

      {/* Matrix Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* $2 \times 2$ Grid */}
        <div className="md:col-span-7 space-y-2">
          <div className="text-[10px] font-mono text-center text-slate-400 font-bold tracking-wider">
            PREDICTED CLASS →
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            {/* TP */}
            <button
              type="button"
              onClick={() => setSelectedCell('TP')}
              className={`p-4 rounded-xl border text-left transition-all ${
                matrixData.TP.color
              } ${selectedCell === 'TP' ? 'ring-2 ring-emerald-400 scale-[1.02]' : 'hover:opacity-90'}`}
            >
              <div className="text-[10px] font-bold text-emerald-400">PREDICTED DRIFT (TP)</div>
              <div className="text-3xl font-black text-white my-1">18</div>
              <div className="text-[10px] text-emerald-300/80">Ground Truth: DRIFT</div>
            </button>

            {/* FP */}
            <button
              type="button"
              onClick={() => setSelectedCell('FP')}
              className={`p-4 rounded-xl border text-left transition-all ${
                matrixData.FP.color
              } ${selectedCell === 'FP' ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:opacity-90'}`}
            >
              <div className="text-[10px] font-bold text-slate-400">PREDICTED DRIFT (FP)</div>
              <div className="text-3xl font-black text-slate-400 my-1">0</div>
              <div className="text-[10px] text-slate-500">Ground Truth: STABLE</div>
            </button>

            {/* FN */}
            <button
              type="button"
              onClick={() => setSelectedCell('FN')}
              className={`p-4 rounded-xl border text-left transition-all ${
                matrixData.FN.color
              } ${selectedCell === 'FN' ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:opacity-90'}`}
            >
              <div className="text-[10px] font-bold text-slate-400">PREDICTED STABLE (FN)</div>
              <div className="text-3xl font-black text-slate-400 my-1">0</div>
              <div className="text-[10px] text-slate-500">Ground Truth: DRIFT</div>
            </button>

            {/* TN */}
            <button
              type="button"
              onClick={() => setSelectedCell('TN')}
              className={`p-4 rounded-xl border text-left transition-all ${
                matrixData.TN.color
              } ${selectedCell === 'TN' ? 'ring-2 ring-blue-400 scale-[1.02]' : 'hover:opacity-90'}`}
            >
              <div className="text-[10px] font-bold text-blue-400">PREDICTED STABLE (TN)</div>
              <div className="text-3xl font-black text-white my-1">30</div>
              <div className="text-[10px] text-blue-300/80">Ground Truth: STABLE</div>
            </button>
          </div>
        </div>

        {/* Selected Cell Inspection Details */}
        <div className="md:col-span-5 bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              {current.label}
            </span>
            <span className="text-cyan-400 font-bold">{current.count} / 48 Lots</span>
          </div>

          <p className="text-[11px] text-slate-300">{current.desc}</p>

          <div className="space-y-1 pt-1">
            <div className="text-[10px] text-slate-400 font-bold">MATCHED WAFER LOTS:</div>
            <div className="space-y-1 text-[11px]">
              {current.lots.map((lot, idx) => (
                <div key={idx} className="p-1.5 bg-slate-900 rounded border border-slate-800 text-slate-200">
                  • {lot}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
