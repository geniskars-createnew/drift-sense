import React, { useState, useEffect } from 'react';
import { Zap, Play, RotateCcw, Sliders, Activity } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface PiezoMotorSimulatorProps {
  initialDriftX?: number;
  initialDriftY?: number;
  initialRotation?: number;
  onCompensationComplete?: () => void;
}

export const PiezoMotorSimulator: React.FC<PiezoMotorSimulatorProps> = ({
  initialDriftX = 42.82,
  initialDriftY = -18.3,
  initialRotation = 0.142,
  onCompensationComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);

  // Motor values decaying to zero
  const [currentX, setCurrentX] = useState(initialDriftX);
  const [currentY, setCurrentY] = useState(initialDriftY);
  const [currentRot, setCurrentRot] = useState(initialRotation);

  // Actuator feedback voltages
  const [voltageX, setVoltageX] = useState(12.4);
  const [voltageY, setVoltageY] = useState(-5.8);
  const [voltageRot, setVoltageRot] = useState(1.82);

  const [logs, setLogs] = useState<string[]>([
    'PIEZO ACTUATORS READY - OPEN-LOOP RESIDUAL DRIFT DETECTED',
  ]);

  const handleStartClosedLoop = () => {
    setIsRunning(true);
    setStep(0);
    setCurrentX(initialDriftX);
    setCurrentY(initialDriftY);
    setCurrentRot(initialRotation);
    setLogs((prev) => ['[START] Engaging Closed-Loop Piezo Feedback Control Loop...', ...prev]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStep(0);
    setCurrentX(initialDriftX);
    setCurrentY(initialDriftY);
    setCurrentRot(initialRotation);
    setVoltageX(12.4);
    setVoltageY(-5.8);
    setVoltageRot(1.82);
    setLogs(['PIEZO ACTUATORS READY - RESET TO INITIAL OPEN-LOOP DISPLACEMENT']);
  };

  useEffect(() => {
    if (!isRunning) return;

    if (step >= 5) {
      setIsRunning(false);
      setCurrentX(0.022);
      setCurrentY(-0.011);
      setCurrentRot(0.001);
      setVoltageX(0.05);
      setVoltageY(-0.02);
      setVoltageRot(0.01);
      setLogs((prev) => [
        `[COMPLETE] Closed-loop convergence achieved! Residual RMSE: 0.022 nm. Stage locked.`,
        ...prev,
      ]);
      if (onCompensationComplete) onCompensationComplete();
      return;
    }

    const timer = setTimeout(() => {
      setStep((prevStep) => {
        const nextStep = prevStep + 1;
        const factor = Math.pow(0.22, nextStep);

        const newX = parseFloat((initialDriftX * factor).toFixed(3));
        const newY = parseFloat((initialDriftY * factor).toFixed(3));
        const newRot = parseFloat((initialRotation * factor).toFixed(4));

        const newVx = parseFloat((12.4 * factor).toFixed(2));
        const newVy = parseFloat((-5.8 * factor).toFixed(2));
        const newVrot = parseFloat((1.82 * factor).toFixed(2));

        setCurrentX(newX);
        setCurrentY(newY);
        setCurrentRot(newRot);
        setVoltageX(newVx);
        setVoltageY(newVy);
        setVoltageRot(newVrot);

        setLogs((prev) => [
          `[STEP ${nextStep}/5] Actuator Pulse ${nextStep}: dx -> ${newX}nm, dy -> ${newY}nm, rot -> ${newRot}°`,
          ...prev,
        ]);

        return nextStep;
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [isRunning, step, initialDriftX, initialDriftY, initialRotation, onCompensationComplete]);

  const isCompleted = step >= 5 && !isRunning;

  return (
    <GlassCard glow glowColor={isCompleted ? 'emerald' : isRunning ? 'cyan' : 'blue'} className="space-y-4 p-4 border-[#1e2d4a]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b2844] pb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${isRunning ? 'text-amber-400 animate-bounce' : 'text-cyan-400'}`} />
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
              REAL-TIME PIEZO-MOTOR CLOSED-LOOP SIMULATOR
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Closed-loop feedback control using piezo-electric stage actuators to zero out wafer drift.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning && !isCompleted ? (
            <button
              type="button"
              onClick={handleStartClosedLoop}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded shadow-[0_0_12px_rgba(0,229,255,0.25)] font-mono uppercase transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START LIVE CLOSED-LOOP
            </button>
          ) : isRunning ? (
            <div className="flex items-center gap-2 bg-amber-950/80 text-amber-300 border border-amber-500/40 px-3 py-1 rounded text-xs font-mono font-bold animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              ACTUATING PIEZO MOTORS... ({step}/5)
            </div>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-[#0e1628] hover:bg-[#152038] text-slate-200 border border-[#233554] px-3 py-1.5 rounded text-xs font-mono font-bold transition-all uppercase"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              RESET STAGE
            </button>
          )}
        </div>
      </div>

      {/* Actuator Output Metrics & Live Voltage Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
        <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
          <div className="text-[10px] text-slate-400">DISPLACEMENT dx</div>
          <div
            className={`text-base font-extrabold mt-0.5 ${
              Math.abs(currentX) < 0.1 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {currentX > 0 ? `+${currentX}` : currentX} nm
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">X Piezo Stack</div>
        </div>

        <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
          <div className="text-[10px] text-slate-400">DISPLACEMENT dy</div>
          <div
            className={`text-base font-extrabold mt-0.5 ${
              Math.abs(currentY) < 0.1 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {currentY > 0 ? `+${currentY}` : currentY} nm
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Y Piezo Stack</div>
        </div>

        <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
          <div className="text-[10px] text-slate-400">ROTATION θ</div>
          <div
            className={`text-base font-extrabold mt-0.5 ${
              Math.abs(currentRot) < 0.01 ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            {currentRot > 0 ? `+${currentRot}` : currentRot}°
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Goniometer Stage</div>
        </div>

        <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
          <div className="text-[10px] text-slate-400">ACTUATOR VOLTAGE Vx</div>
          <div className="text-base font-extrabold text-cyan-400 mt-0.5">{voltageX} V</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Range ±150V</div>
        </div>

        <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
          <div className="text-[10px] text-slate-400">ACTUATOR VOLTAGE Vy</div>
          <div className="text-base font-extrabold text-indigo-300 mt-0.5">{voltageY} V</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Range ±150V</div>
        </div>

        <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
          <div className="text-[10px] text-slate-400">RESIDUAL RMSE</div>
          <div
            className={`text-base font-extrabold mt-0.5 ${
              isCompleted ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            {isCompleted ? '0.022 nm' : `${(Math.abs(currentX) * 0.08).toFixed(3)} nm`}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Spec: &lt;0.05nm</div>
        </div>
      </div>

      {/* Actuator Step Progress Indicator */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>CLOSED-LOOP FEEDBACK STEP ({step}/5)</span>
          <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
            {isCompleted
              ? '✓ SUB-NANOMETER STAGE ALIGNMENT LOCKED'
              : isRunning
              ? 'PULSING PIEZO STACK...'
              : 'READY TO COMPENSATE'}
          </span>
        </div>
        <div className="w-full bg-[#080d1a] h-2 rounded overflow-hidden border border-[#1b2844]">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-400 shadow-[0_0_10px_#10B981]'
                : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400'
            }`}
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Real-time Actuator Event Log Console */}
      <div className="bg-[#080d1a] rounded p-2.5 border border-[#1b2844] font-mono text-[10px] text-slate-400 h-20 overflow-y-auto space-y-1">
        {logs.map((log, idx) => (
          <div key={idx} className={idx === 0 ? 'text-cyan-300 font-semibold' : 'opacity-80'}>
            &gt; {log}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
