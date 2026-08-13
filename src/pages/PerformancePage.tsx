import React, { useState } from 'react';
import { BarChart3, Activity, Zap, Target, ShieldCheck, CheckCircle2, FileCheck, Printer } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { MODEL_METRICS_HISTORY } from '../data/mockData';
import { ConfusionMatrixHeatmap } from '../components/common/ConfusionMatrixHeatmap';
import { InspectionCertificateModal } from '../components/common/InspectionCertificateModal';
import { WAFER_DATASET } from '../data/waferDataset';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const PerformancePage: React.FC = () => {
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  // Latency vs Resolution benchmark data
  const latencyData = [
    { res: '1024x1024', PyTorch: 4.2, TensorRT: 2.1, Classical: 18.5 },
    { res: '2048x2048', PyTorch: 8.6, TensorRT: 4.8, Classical: 42.1 },
    { res: '4096x4096', PyTorch: 18.4, TensorRT: 11.4, Classical: 125.4 },
    { res: '8192x8192', PyTorch: 42.1, TensorRT: 24.2, Classical: 480.0 },
  ];

  // Error distribution histogram
  const errorDistData = [
    { range: '0.0-0.2 nm', count: 842 },
    { range: '0.2-0.4 nm', count: 480 },
    { range: '0.4-0.6 nm', count: 85 },
    { range: '0.6-0.8 nm', count: 18 },
    { range: '> 0.8 nm', count: 3 },
  ];

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Neural Model Performance Analytics & 48-Lot Benchmark
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep Learning training convergence, localization accuracy, confusion matrix, and C++ TensorRT latency profiling.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCertModalOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 font-mono transition-all self-start sm:self-center"
        >
          <FileCheck className="w-4 h-4" />
          Export Quality Inspection Certificate
        </button>
      </div>

      {/* KPI METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard glow glowColor="emerald" className="p-4">
          <div className="text-[10px] font-mono text-slate-400">48-LOT DATASET ACCURACY</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">100.0%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">48 / 48 Lots Correct</div>
        </GlassCard>

        <GlassCard glow glowColor="blue" className="p-4">
          <div className="text-[10px] font-mono text-slate-400">RESIDUAL RMSE</div>
          <div className="text-2xl font-extrabold font-mono text-blue-400 mt-1">0.022 nm</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sub-nanometer Stage Standard</div>
        </GlassCard>

        <GlassCard glow glowColor="cyan" className="p-4">
          <div className="text-[10px] font-mono text-slate-400">MODEL PRECISION & RECALL</div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">100.0%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">F1 Score: 100.0%</div>
        </GlassCard>

        <GlassCard glow glowColor="purple" className="p-4">
          <div className="text-[10px] font-mono text-slate-400">AVG INFERENCE LATENCY</div>
          <div className="text-2xl font-extrabold font-mono text-purple-400 mt-1">11.2 ms</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">TensorRT C++ Pipeline</div>
        </GlassCard>
      </div>

      {/* 48-LOT INTERACTIVE CONFUSION MATRIX HEATMAP */}
      <ConfusionMatrixHeatmap />

      {/* ACCURACY BREAKDOWN ACROSS 4 DEFECT SCENARIOS */}
      <GlassCard className="space-y-3">
        <div className="font-bold text-sm text-white border-b border-slate-800 pb-2 font-mono">
          Model Accuracy & Test Lot Verification Breakdown Across All 4 Scenarios
        </div>

          <div className="space-y-2.5 font-mono text-xs">
            {[
              { name: '1. Stable Baseline (Lots 0-11)', total: 12, correct: 12, acc: '100%' },
              { name: '2. Center Growth (Lots 0-11)', total: 12, correct: 12, acc: '100%' },
              { name: '3. Edge Ring Onset (Lots 0-11)', total: 12, correct: 12, acc: '100%' },
              { name: '4. Scratch Migration (Lots 0-11)', total: 12, correct: 12, acc: '100%' },
            ].map((sc, i) => (
              <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">{sc.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Tested: {sc.total} Wafer Lots</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {sc.acc}
                  </span>
                  <span className="text-[10px] text-slate-500">({sc.correct}/{sc.total})</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Training & Validation Loss Chart */}
        <GlassCard className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Training & Validation Loss Convergence
              </h3>
              <p className="text-[11px] text-slate-400">Mean Squared Error loss over 30 training epochs</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              OPTIMIZER: ADAMW
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MODEL_METRICS_HISTORY} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={11} label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="trainLoss" name="Training Loss" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="valLoss" name="Validation Loss" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Sub-Pixel MAE Curve */}
        <GlassCard className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Localization MAE & RMSE Reduction (nm)
              </h3>
              <p className="text-[11px] text-slate-400">Sub-nanometer spatial displacement error</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              TARGET: &lt; 1.0 nm
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MODEL_METRICS_HISTORY} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="nm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="maeNm" name="MAE (nm)" stroke="#38bdf8" strokeWidth={2.5} />
                <Line type="monotone" dataKey="rmseNm" name="RMSE (nm)" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latency Comparison */}
        <GlassCard className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Inference Speed vs Image Resolution (ms)
              </h3>
              <p className="text-[11px] text-slate-400">TensorRT C++ vs PyTorch Python vs Classical CPU</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="res" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="TensorRT" name="Drift-Sense TensorRT (GPU)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PyTorch" name="Drift-Sense PyTorch (GPU)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Classical" name="Classical NCC (CPU)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Error Distribution Bar Chart */}
        <GlassCard className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Residual Error Distribution
              </h3>
              <p className="text-[11px] text-slate-400">Frequency distribution over 1,428 test wafer fields</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDistData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" name="Wafer Fields" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* PRINTABLE FAB INSPECTION CERTIFICATE MODAL */}
      <InspectionCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        lot={WAFER_DATASET[18]}
      />
    </div>
  );
};
