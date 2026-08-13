import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, RotateCcw, Cpu, Zap, ArrowRight, Activity, Flame, Sparkles } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { WaferCanvas } from '../components/common/WaferCanvas';

export const GenerateDriftPage: React.FC = () => {
  const navigate = useNavigate();

  // Interactive Drift Controls
  const [dx, setDx] = useState(42.8);
  const [dy, setDy] = useState(-18.3);
  const [rotation, setRotation] = useState(0.14);
  const [noise, setNoise] = useState(0.15);
  const [thermalStrain, setThermalStrain] = useState(5); // %

  const handleResetSimulator = () => {
    setDx(0);
    setDy(0);
    setRotation(0);
    setNoise(0.05);
    setThermalStrain(0);
  };

  const handleRandomizeJitter = () => {
    setDx(Number((Math.random() * 200 - 100).toFixed(1)));
    setDy(Number((Math.random() * 200 - 100).toFixed(1)));
    setRotation(Number((Math.random() * 0.8 - 0.4).toFixed(2)));
    setNoise(Number((Math.random() * 0.4).toFixed(2)));
  };

  const handleRunPredictionWithCustom = () => {
    navigate(`/prediction?dx=${dx}&dy=${dy}&rot=${rotation}&noise=${noise}`);
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <Sliders className="w-6 h-6 text-cyan-400" />
            Micro-Stage Physical Jitter & Thermal Drift Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inject synthetic mechanical backlash, thermal expansion warpage, and SEM noise to test AI recovery robustness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomizeJitter}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Random Jitter
          </button>
          <button
            type="button"
            onClick={handleResetSimulator}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Stage
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Sliders */}
        <div className="lg:col-span-5 space-y-5">
          <GlassCard glow glowColor="cyan" className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center justify-between border-b border-slate-700/80 pb-3">
              <span>Stage Drift Parameters</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                RESOLUTION: 0.1 nm
              </span>
            </h3>

            {/* Slider 1: Translation X (dx) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Stage X Displacement (dx):</span>
                <span className="text-cyan-400 font-bold">{dx > 0 ? `+${dx}` : dx} nm</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="0.5"
                value={dx}
                onChange={(e) => setDx(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-150 nm</span>
                <span>0 nm</span>
                <span>+150 nm</span>
              </div>
            </div>

            {/* Slider 2: Translation Y (dy) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Stage Y Displacement (dy):</span>
                <span className="text-cyan-400 font-bold">{dy > 0 ? `+${dy}` : dy} nm</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="0.5"
                value={dy}
                onChange={(e) => setDy(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-150 nm</span>
                <span>0 nm</span>
                <span>+150 nm</span>
              </div>
            </div>

            {/* Slider 3: Rotation Angle (θ) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Rotation Angle (θ):</span>
                <span className="text-amber-400 font-bold">{rotation > 0 ? `+${rotation}` : rotation}°</span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={rotation}
                onChange={(e) => setRotation(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-0.5°</span>
                <span>0°</span>
                <span>+0.5°</span>
              </div>
            </div>

            {/* Slider 4: SEM Noise Level */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">SEM Electron Noise Level:</span>
                <span className="text-slate-200 font-bold">{Math.round(noise * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={noise}
                onChange={(e) => setNoise(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Slider 5: Thermal Expansion Strain */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Thermal Warpage Ratio:</span>
                <span className="text-purple-400 font-bold">{thermalStrain}% strain</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={thermalStrain}
                onChange={(e) => setThermalStrain(parseInt(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </GlassCard>

          <button
            type="button"
            onClick={handleRunPredictionWithCustom}
            className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Zap className="w-4 h-4 fill-current" />
            Evaluate Custom Drift in AI Engine
          </button>
        </div>

        {/* Right Column: Real-time Canvas Render */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Real-Time Wafer Stage Preview
              </h3>
              <div className="text-xs font-mono text-cyan-400">
                EUCLIDEAN DRIFT DISTANCE: {Math.sqrt(dx * dx + dy * dy).toFixed(2)} nm
              </div>
            </div>

            <WaferCanvas
              type="drifted"
              driftXNm={dx}
              driftYNm={dy}
              rotationDeg={rotation}
              noiseLevel={noise}
              title={`Simulated Jitter (dx: ${dx}nm, dy: ${dy}nm)`}
              height={380}
            />

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">TOTAL DISPLACEMENT</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {Math.sqrt(dx * dx + dy * dy).toFixed(1)} nm
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">ROTATION ANGLE</span>
                <span className="text-amber-400 font-bold text-sm">{rotation}°</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">NOISE / STRAIN</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {Math.round(noise * 100)}% / {thermalStrain}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
