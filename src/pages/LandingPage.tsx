import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Target,
  Layers,
  Flame,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronRight,
  Compass,
  BarChart,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { WaferCanvas } from '../components/common/WaferCanvas';
import { SAMPLE_WAFERS } from '../data/mockData';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');

  // Feature cards data
  const features = [
    {
      icon: Cpu,
      title: 'AI Drift Prediction',
      desc: 'Predicts sub-nanometer translational (dx, dy) and rotational (θ) stage drift using hybrid ResNet-Transformer networks.',
      color: 'blue' as const,
    },
    {
      icon: Layers,
      title: 'Image Registration',
      desc: 'High-throughput sub-pixel registration between golden reference die images and current distorted wafer scans.',
      color: 'cyan' as const,
    },
    {
      icon: Target,
      title: 'Automatic Alignment',
      desc: 'Calculates real-time motor feedback vectors to automatically reposition stage positioners within < 12ms.',
      color: 'emerald' as const,
    },
    {
      icon: Flame,
      title: 'Heatmap Visualization',
      desc: 'Generates spatial residual error heatmaps highlighting localized non-linear wafer warping and thermal strain.',
      color: 'amber' as const,
    },
    {
      icon: Activity,
      title: 'Sub-Nanometer Precision',
      desc: 'Achieves < 0.42 nm RMSE localization accuracy across 300mm logic wafers and EUV reticle photomasks.',
      color: 'purple' as const,
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      desc: 'GPU-accelerated C++ TensorRT pipeline processing over 80 wafer fields-of-view per second.',
      color: 'cyan' as const,
    },
  ];

  // How it works workflow steps
  const workflowSteps = [
    {
      step: '01',
      title: 'Reference Image',
      desc: 'CAD layout or golden reference die image acquired from CAD database or pristine wafer FOV.',
      type: 'reference' as const,
    },
    {
      step: '02',
      title: 'Drifted Image',
      desc: 'Current inspection die image suffering from stage backlash, vibration, or thermal drift.',
      type: 'drifted' as const,
      dx: 45,
      dy: -25,
      rot: 0.15,
    },
    {
      step: '03',
      title: 'DriftNet AI Engine',
      desc: 'Deep Neural Network estimates non-linear feature offsets and spatial displacement vectors.',
      type: 'heatmap' as const,
      dx: 45,
      dy: -25,
    },
    {
      step: '04',
      title: 'Alignment Correction',
      desc: 'Precision feedback vector offsets the piezo-stage to restore perfect die-to-die alignment.',
      type: 'aligned' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800/80">
        {/* Animated Cyber Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/20 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono shadow-lg shadow-cyan-500/10">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>NEXT-GEN METROLOGY & INSPECTION</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                AI-Powered <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Navigation Error Recovery</span> for Wafer Inspection
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Overcome physical stage backlash, thermal expansion distortion, and mechanical vibration. Recover sub-nanometer die positioning using deep neural spatial registration.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/prediction"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-95 text-white font-semibold px-6 py-3.5 rounded-xl shadow-xl shadow-cyan-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Try Live Demo
                </Link>

                <Link
                  to="/upload"
                  className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-medium px-5 py-3.5 rounded-xl border border-slate-700/80 hover:border-cyan-500/50 transition-all duration-300"
                >
                  <Compass className="w-5 h-5 text-cyan-400" />
                  Upload Wafer Images
                </Link>

                <a
                  href="#how-it-works"
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 text-sm font-mono px-3 py-2 transition-colors"
                >
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Quick Spec Metrics Bar */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">&lt; 0.42 nm</div>
                  <div className="text-xs text-slate-400">Localization RMSE</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">11.4 ms</div>
                  <div className="text-xs text-slate-400">Inference Speed</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400">± 120 µm</div>
                  <div className="text-xs text-slate-400">Capture Range</div>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic: Live Interactive Wafer Simulator */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glowing Border Card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500" />

                <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Cpu className="w-4 h-4" />
                      LIVE WAFER INSPECTION SIMULATOR
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      300mm DIE #14B
                    </span>
                  </div>

                  {/* Interactive Wafer View */}
                  <WaferCanvas
                    type="drifted"
                    driftXNm={42.8}
                    driftYNm={-18.3}
                    rotationDeg={0.14}
                    title="Real-time Stage Jitter (42.8nm dx)"
                    height={320}
                  />

                  {/* Overlay Metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">ESTIMATED ΔX:</span>
                      <span className="text-cyan-400 font-bold">+42.82 nm</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                      <span className="text-slate-400">ESTIMATED ΔY:</span>
                      <span className="text-cyan-400 font-bold">-18.29 nm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="py-16 bg-slate-900/50 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Capabilities</h2>
            <p className="text-2xl sm:text-3xl font-bold text-white">Engineered for Sub-Nanometer Wafer Precision</p>
            <p className="text-slate-400 text-sm mt-2">
              Next-generation deep learning model tailored specifically for semiconductor defect review, lithography alignment, and high-NA optical inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <GlassCard key={idx} glow glowColor={feat.color} className="group">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS WORKFLOW */}
      <section id="how-it-works" className="py-20 border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">Automated Workflow</h2>
            <p className="text-2xl sm:text-3xl font-bold text-white">End-to-End Navigation Recovery Pipeline</p>
            <p className="text-slate-400 text-sm mt-2">
              From raw SEM image acquisition to micro-piezo stage compensation in under 12 milliseconds.
            </p>
          </div>

          {/* Workflow Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative group">
                <GlassCard className="h-full flex flex-col justify-between border-slate-700/80">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        STEP {step.step}
                      </span>
                      {idx < 3 && <ChevronRight className="w-4 h-4 text-slate-500 hidden lg:block" />}
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 mb-1">{step.title}</h3>
                    <p className="text-xs text-slate-400 mb-4">{step.desc}</p>
                  </div>

                  {/* Visual canvas for this step */}
                  <WaferCanvas
                    type={step.type}
                    driftXNm={step.dx}
                    driftYNm={step.dy}
                    rotationDeg={step.rot}
                    showControls={false}
                    height={180}
                  />
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT PROJECT & PROBLEM STATEMENT */}
      <section className="py-20 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Semiconductor Challenge</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Why Classical Template Matching Fails at <span className="text-cyan-400">Sub-3nm Nodes</span>
              </h2>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('problem')}
                  className={`pb-3 px-4 border-b-2 font-semibold transition-colors ${
                    activeTab === 'problem'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Root Causes of Stage Drift
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('solution')}
                  className={`pb-3 px-4 border-b-2 font-semibold transition-colors ${
                    activeTab === 'solution'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  The AI Advantage
                </button>
              </div>

              {activeTab === 'problem' ? (
                <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Thermal Expansion & Warpage:</span> High-intensity EUV laser illumination causes localized thermal expansion on the wafer substrate, shifting features by 20–80 nm.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Mechanical Stage Backlash:</span> High-speed step-and-repeat piezo motors experience microscopic mechanical hysteresis during acceleration/deceleration.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">SEM Charging & Environmental Noise:</span> Electron beam charging introduces non-linear brightness gradients that break cross-correlation and classical optical flow algorithms.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Non-Linear Feature Deformation:</span> Deep Convolutional & Transformer layers model complex optical distortion rather than rigid pixel shifts.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">100x Larger Capture Range:</span> Recovers from massive stage drifts up to ±120 µm where classical template matching loses lock entirely.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Sub-Pixel Deep Regression:</span> Directly regresses continuous floating-point dx/dy offsets down to 0.1 nm resolution.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Callout Card */}
            <div className="lg:col-span-6">
              <GlassCard glow glowColor="blue" className="p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700/80 pb-3">
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">Metrology Benchmark</h3>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
                    300mm WAFER BENCHMARK
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <div className="flex justify-between mb-1 text-slate-400">
                      <span>Template Matching (NCC) Error:</span>
                      <span className="text-amber-400 font-bold">125.4 nm</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[85%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-400">
                      <span>ORB Feature Matcher Error:</span>
                      <span className="text-amber-400 font-bold">82.0 nm</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[60%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-400">
                      <span>Drift-Sense AI (ResNet-Transformer) Error:</span>
                      <span className="text-emerald-400 font-bold">0.42 nm</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[2%]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">ACCURACY IMPROVEMENT:</span>
                  <span className="text-emerald-400 font-bold text-sm font-mono">+298x PRECISION RECOVERY</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to Integrate Drift-Sense into Your Wafer Metrology Tools?
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto">
            Test custom semiconductor image pairs, simulate micro-stage jitter, evaluate neural model performance, and export compliance reports.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/dashboard"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-sm"
            >
              Enter Dashboard Suite
            </Link>
            <Link
              to="/comparison"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3 rounded-xl transition-all text-sm"
            >
              Explore Classical Algorithm Matrix
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
