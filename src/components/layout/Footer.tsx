import React from 'react';
import { Cpu, ShieldCheck, Github, ExternalLink, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <div className="flex flex-col mt-auto">
      {/* Main Footer Content */}
      <footer className="bg-[#0F172A] border-t border-white/10 text-slate-400 text-xs py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="font-bold text-slate-100 text-sm tracking-wide">Drift-Sense AI</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Sub-nanometer navigation drift estimation & automated error recovery for EUV lithography, optical SEM, and wafer inspection tools.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-slate-900/80 px-2.5 py-1 rounded border border-white/10 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SEMI E187/E188 Compliant Architecture
              </div>
            </div>

            {/* Core Algorithms */}
            <div>
              <h4 className="font-mono text-slate-200 text-xs uppercase tracking-wider mb-3">Core Modules</h4>
              <ul className="space-y-2 text-slate-400 text-xs font-mono">
                <li>• Spatial Drift Regression</li>
                <li>• Sub-Pixel Phase Correlation</li>
                <li>• Dense Deformable Attention</li>
                <li>• Residual Heatmap Registration</li>
                <li>• Real-Time Motor Offset Loop</li>
              </ul>
            </div>

            {/* Industry Standards */}
            <div>
              <h4 className="font-mono text-slate-200 text-xs uppercase tracking-wider mb-3">Tool Integrations</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>300mm FOUP Automatic Alignment</li>
                <li>EUV Scanner Stage Compensation</li>
                <li>Darkfield & Brightfield SEM Defect Review</li>
                <li>FastAPI Microservices Architecture</li>
                <li>High-Throughput PyTorch C++ Engine</li>
              </ul>
            </div>

            {/* Specifications */}
            <div className="space-y-2">
              <h4 className="font-mono text-slate-200 text-xs uppercase tracking-wider mb-3">Performance Benchmark</h4>
              <div className="p-3 bg-slate-900/90 rounded-lg border border-white/10 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span>RMSE Accuracy:</span>
                  <span className="text-emerald-400">&lt; 0.42 nm</span>
                </div>
                <div className="flex justify-between">
                  <span>Inference Latency:</span>
                  <span className="text-cyan-400">11.4 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Capture Range:</span>
                  <span className="text-slate-200">± 120 µm</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              © {new Date().getFullYear()} Drift-Sense AI. Built for Next-Gen Semiconductor Metrology & Inspection.
            </div>
            <div className="flex items-center gap-4">
              <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy Specification</a>
              <a href="#terms" className="hover:text-slate-300 transition-colors">SEMI Protocol Docs</a>
              <a href="#contact" className="hover:text-slate-300 transition-colors">Engineering Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sleek Bottom Status Terminal Bar */}
      <div className="h-8 border-t border-white/5 bg-[#0F172A] px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
        <div className="flex gap-6">
          <span>NODE: WFR-ISR-US01</span>
          <span>STORAGE: 84% FULL</span>
          <span>UPTIME: 142d 12h 4m</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
          SECURE CONNECTION ESTABLISHED
        </div>
      </div>
    </div>
  );
};
