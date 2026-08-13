import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, XCircle, RotateCcw, Lock, CheckCircle2, FileCode } from 'lucide-react';

interface FabInterlockBannerProps {
  driftStrength?: number;
  lotId?: string;
  scenario?: string;
  forceShow?: boolean;
}

export const FabInterlockBanner: React.FC<FabInterlockBannerProps> = ({
  driftStrength = 0.65,
  lotId = 'LOT_08',
  scenario = 'center_growth',
  forceShow = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const isInterlockTriggered = (driftStrength >= 0.5 || forceShow) && !isDismissed;

  if (!isInterlockTriggered) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.35)] animate-pulse space-y-3 font-mono text-xs text-white z-40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/40 pb-3">
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="w-6 h-6 text-red-400 animate-bounce flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-red-200 tracking-wider">
                🚨 FAB INTERLOCK ACTIVATED: LITHOGRAPHY STAGE PAUSED
              </span>
              <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded text-[10px] animate-pulse">
                HIGH DRIFT CRITICAL (&gt; 0.50)
              </span>
            </div>
            <p className="text-[11px] text-red-300/90 mt-0.5">
              Substrate displacement threshold exceeded on Lot <span className="font-bold underline">{lotId}</span> ({scenario.toUpperCase()}). EUV laser shutter closed automatically to prevent reticle damage.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-red-200 border border-red-500/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap self-start sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
          OVERRIDE & RESET INTERLOCK
        </button>
      </div>

      {/* Safety Interlock System Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="p-2 bg-slate-950/80 rounded border border-red-500/30 flex items-center justify-between">
          <span className="text-slate-400">EUV BEAM SHUTTER:</span>
          <span className="text-red-400 font-bold flex items-center gap-1">
            <Lock className="w-3 h-3" />
            CLOSED (LOCKED)
          </span>
        </div>

        <div className="p-2 bg-slate-950/80 rounded border border-red-500/30 flex items-center justify-between">
          <span className="text-slate-400">DRIFT MAGNITUDE:</span>
          <span className="text-amber-400 font-bold">{driftStrength.toFixed(3)} (&gt; 0.500)</span>
        </div>

        <div className="p-2 bg-slate-950/80 rounded border border-red-500/30 flex items-center justify-between">
          <span className="text-slate-400">WAFER BUFFER:</span>
          <span className="text-rose-300 font-bold">QUARANTINED</span>
        </div>

        <div className="p-2 bg-slate-950/80 rounded border border-red-500/30 flex items-center justify-between">
          <span className="text-slate-400">SECS/GEM EVENT:</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <FileCode className="w-3 h-3" />
            S6F11 ALARM 0x89
          </span>
        </div>
      </div>
    </div>
  );
};
