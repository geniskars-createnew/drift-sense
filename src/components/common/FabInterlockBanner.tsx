import React, { useState } from 'react';
import {
  AlertOctagon,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  FileCode,
  Zap,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface FabInterlockBannerProps {
  driftStrength?: number;
  lotId?: string;
  scenario?: string;
  forceShow?: boolean;
  onCompensateComplete?: () => void;
}

export const FabInterlockBanner: React.FC<FabInterlockBannerProps> = ({
  driftStrength = 0.65,
  lotId = 'LOT_08',
  scenario = 'center_growth',
  forceShow = false,
  onCompensateComplete,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCompensating, setIsCompensating] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [compensateStep, setCompensateStep] = useState(0);

  const isInterlockTriggered = (driftStrength >= 0.5 || forceShow) && !isDismissed;

  const handleStartAutoCompensate = () => {
    setIsCompensating(true);
    setCompensateStep(1);

    const stepInterval = setInterval(() => {
      setCompensateStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          setIsCompensating(false);
          setIsResolved(true);
          if (onCompensateComplete) onCompensateComplete();
          return 4;
        }
        return prev + 1;
      });
    }, 450);
  };

  if (!isInterlockTriggered && !isResolved) return null;

  if (isResolved) {
    return (
      <div className="relative bg-gradient-to-r from-emerald-950/90 via-[#062419] to-emerald-950/90 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-[0_0_25px_rgba(16,185,129,0.3)] space-y-3 font-mono text-xs text-white z-40 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/40 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-emerald-200 tracking-wider">
                  ✓ INTERLOCK CLEARED: STAGE NOMINAL &amp; REALIGNED
                </span>
                <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px]">
                  ACCURACY: 99.98% (RMSE &lt; 0.022 nm)
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                Piezo micro-actuators compensated residual drift on Lot <span className="font-bold underline">{lotId}</span>. EUV Laser Shutter unlocked. Lithography stage running in optimal production state.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded font-bold">
              STATUS: ONLINE (100% OPERATIONAL)
            </span>
          </div>
        </div>

        {/* Real-time Restored Stage Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 bg-slate-950/80 rounded border border-emerald-500/30 flex items-center justify-between">
            <span className="text-slate-400">EUV BEAM SHUTTER:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              OPEN (ACTIVE)
            </span>
          </div>

          <div className="p-2 bg-slate-950/80 rounded border border-emerald-500/30 flex items-center justify-between">
            <span className="text-slate-400">RESIDUAL RMSE:</span>
            <span className="text-emerald-400 font-bold">0.022 nm (PASS)</span>
          </div>

          <div className="p-2 bg-slate-950/80 rounded border border-emerald-500/30 flex items-center justify-between">
            <span className="text-slate-400">WAFER BUFFER:</span>
            <span className="text-emerald-300 font-bold">DISCHARGED TO TRACK</span>
          </div>

          <div className="p-2 bg-slate-950/80 rounded border border-emerald-500/30 flex items-center justify-between">
            <span className="text-slate-400">SECS/GEM EVENT:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              S6F11 RESUMED 0x00
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.35)] space-y-3 font-mono text-xs text-white z-40">
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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {isCompensating ? (
            <div className="flex items-center gap-2 bg-amber-950/90 text-amber-300 border border-amber-500/50 px-3.5 py-1.5 rounded-lg text-xs font-bold animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              AUTO-COMPENSATING PIEZO MOTORS ({compensateStep}/4)...
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartAutoCompensate}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all whitespace-nowrap uppercase cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                ⚡ Auto-Compensate &amp; Clear Interlock (High Accuracy)
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-red-200 border border-red-500/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                Override &amp; Reset
              </button>
            </>
          )}
        </div>
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

