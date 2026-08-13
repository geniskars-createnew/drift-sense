import React from 'react';
import { GitCompare, CheckCircle2, XCircle, AlertTriangle, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { CLASSICAL_COMPARISON_DATA } from '../data/mockData';

export const ComparisonPage: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
          <GitCompare className="w-6 h-6 text-cyan-400" />
          Classical vs AI Navigation Error Recovery Matrix
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Benchmarking Deep Neural Deformable Regression against Classical Normalized Cross-Correlation (NCC), ORB, and AKAZE feature detectors.
        </p>
      </div>

      {/* COMPARISON MATRIX TABLE */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Algorithm Benchmark Comparison Matrix
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            TEST SET: 300mm SILICON DIES (N=1,428)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ALGORITHM</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">ACCURACY (RMSE)</th>
                <th className="py-3 px-4">CAPTURE RANGE</th>
                <th className="py-3 px-4">INFERENCE LATENCY</th>
                <th className="py-3 px-4">LOW CONTRAST</th>
                <th className="py-3 px-4">SEM NOISE</th>
                <th className="py-3 px-4">THERMAL TOLERANCE</th>
                <th className="py-3 px-4">COMPUTE COST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {CLASSICAL_COMPARISON_DATA.map((algo, idx) => {
                const isAI = algo.category === 'Deep Learning';
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isAI
                        ? 'bg-blue-950/40 text-white font-semibold border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                      {isAI && <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />}
                      {algo.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          isAI
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {algo.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-sm">
                      <span className={isAI ? 'text-emerald-400' : 'text-amber-400'}>
                        {algo.accuracyNm} nm
                      </span>
                    </td>
                    <td className="py-3.5 px-4">± {algo.maxDriftRangeMicrons} µm</td>
                    <td className="py-3.5 px-4">
                      <span className={isAI ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                        {algo.inferenceTimeMs} ms
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <div className="w-12 bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isAI ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${algo.robustnessLowContrast * 10}%` }}
                          />
                        </div>
                        <span>{algo.robustnessLowContrast}/10</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <div className="w-12 bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isAI ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${algo.robustnessNoise * 10}%` }}
                          />
                        </div>
                        <span>{algo.robustnessNoise}/10</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={isAI ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {algo.thermalExpansionTolerance}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{algo.computeCost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* DETAILED TECHNICAL BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard glow glowColor="amber" className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <XCircle className="w-5 h-5 text-amber-400" />
            Limitations of Classical Template Matching (NCC)
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Rigid Pixel Assumption:</strong> Fails when EUV laser exposure creates non-linear thermal expansion stretching die features.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Sensitivity to SEM Charging:</strong> Electron beam charge buildup creates severe brightness gradients that destroy normalized cross-correlation peaks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Narrow Capture Range:</strong> Loses tracking lock completely when physical stage jitter exceeds ±15 µm.</span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard glow glowColor="emerald" className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            The Drift-Sense Deep AI Breakthrough
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Deformable Attention Modules:</strong> Dynamically adapts to non-linear spatial warping and localized wafer strain.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Sub-Nanometer Direct Regression:</strong> Regresses continuous floating-point dx, dy, and θ vectors rather than discrete pixel grids.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>100x Capture Range:</strong> Robustly locks onto fiducial targets up to ±120 µm displacement with &lt; 12ms latency.</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};
