import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Target,
  Activity,
  Zap,
  TrendingUp,
  UploadCloud,
  Sliders,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { RECENT_INSPECTIONS, SAMPLE_WAFERS } from '../data/mockData';
import { DriftPredictionResult } from '../types';
import { InspectionPanel } from '../components/common/InspectionPanel';
import { LoadedDataset } from '../DatasetUploader';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DashboardPageProps {
  loadedDataset?: LoadedDataset | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ loadedDataset }) => {
  const [inspections, setInspections] = useState<DriftPredictionResult[]>(RECENT_INSPECTIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Scatter plot data for dx vs dy stage drift distribution
  const scatterData = inspections.map((item) => ({
    x: item.actualDx,
    y: item.actualDy,
    name: item.sampleId,
    err: item.errorDistanceNm,
  }));

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Add a new synthetic inspection item
      const newInspection: DriftPredictionResult = {
        sampleId: `waf-00${Math.floor(Math.random() * 4) + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        predictedDx: Number((Math.random() * 100 - 50).toFixed(2)),
        predictedDy: Number((Math.random() * 100 - 50).toFixed(2)),
        predictedRotation: Number((Math.random() * 0.4 - 0.2).toFixed(3)),
        actualDx: 0,
        actualDy: 0,
        actualRotation: 0,
        errorDistanceNm: Number((Math.random() * 0.08 + 0.01).toFixed(3)),
        confidenceScore: Number((99.5 + Math.random() * 0.49).toFixed(2)),
        inferenceTimeMs: Number((10.8 + Math.random() * 1.5).toFixed(1)),
        status: 'RECOVERED',
        alignmentQualityScore: Number((98.5 + Math.random() * 1.4).toFixed(1)),
      };
      setInspections([newInspection, ...inspections.slice(0, 5)]);
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6 text-slate-100 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <LayoutDashboard className="w-6 h-6 text-cyan-400" />
            Inspection Overview & Stage Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stage drift tracking, sub-pixel neural alignment, and metrology yield metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefreshFeed}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>

          <Link
            to="/prediction"
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-cyan-500/20"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Run Prediction
          </Link>
        </div>
      </div>

      {/* REFERENCE PATTERN DETECTION & PIEZO SIMULATION PANEL */}
      <InspectionPanel loadedDataset={loadedDataset} />

      {/* KPI STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard glow glowColor="blue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Inspected Wafers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-2">1,428</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +14.2% vs previous lot
          </div>
        </GlassCard>

        <GlassCard glow glowColor="emerald">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Localization RMSE</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-2">0.42 nm</div>
          <div className="text-[11px] text-slate-400 mt-1">Sub-nanometer precision threshold</div>
        </GlassCard>

        <GlassCard glow glowColor="cyan">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Inference Latency</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-2">11.4 ms</div>
          <div className="text-[11px] text-slate-400 mt-1">TensorRT C++ GPU pipeline</div>
        </GlassCard>

        <GlassCard glow glowColor="purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Yield Recovery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-400 mt-2">99.87%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Zero unrecoverable drifts</div>
        </GlassCard>
      </div>

      {/* QUICK ACTIONS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          to="/upload"
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center gap-3 transition-all group"
        >
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white">Upload Images</div>
            <div className="text-[10px] text-slate-400">Pair wafer files</div>
          </div>
        </Link>

        <Link
          to="/simulator"
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center gap-3 transition-all group"
        >
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white">Generate Drift</div>
            <div className="text-[10px] text-slate-400">Simulate stage jitter</div>
          </div>
        </Link>

        <Link
          to="/visualization"
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center gap-3 transition-all group"
        >
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white">Interactive Viewer</div>
            <div className="text-[10px] text-slate-400">Zoom & diff slider</div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center gap-3 transition-all group"
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-white">Generate Reports</div>
            <div className="text-[10px] text-slate-400">Export PDF/CSV</div>
          </div>
        </Link>
      </div>

      {/* STAGE DRIFT DISTRIBUTION SCATTER CHART & SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GlassCard className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Physical Stage Positional Drift Distribution (dx vs dy)
              </h3>
              <p className="text-[11px] text-slate-400">
                Spatial distribution of stage placement error prior to AI correction (in nanometers).
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              FIELD OF VIEW: 150 µm
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="dx"
                  unit="nm"
                  stroke="#94a3b8"
                  fontSize={10}
                  domain={[-150, 150]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="dy"
                  unit="nm"
                  stroke="#94a3b8"
                  fontSize={10}
                  domain={[-150, 150]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <ReferenceLine x={0} stroke="#06b6d4" strokeDasharray="2 2" />
                <ReferenceLine y={0} stroke="#06b6d4" strokeDasharray="2 2" />
                <Scatter name="Wafer Field Drift" data={scatterData} fill="#38bdf8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* SAMPLE PRESET SELECTOR CARD */}
        <GlassCard className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Benchmark Wafer Library
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select pre-loaded wafer dies for immediate AI drift recovery testing.
            </p>

            <div className="space-y-2.5">
              {SAMPLE_WAFERS.map((waf) => (
                <Link
                  key={waf.id}
                  to={`/prediction?sample=${waf.id}`}
                  className="block p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200">{waf.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{waf.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>FOV: {waf.fovSizeMicrons} µm</span>
                    <span>RES: {waf.resolution}</span>
                    <span className="text-amber-400">dx: {waf.defaultDriftX}nm</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Link
            to="/prediction"
            className="w-full mt-4 text-center bg-blue-600/20 hover:bg-blue-600/30 text-cyan-400 border border-blue-500/30 py-2 rounded-lg font-mono text-xs transition-colors"
          >
            Launch Full Prediction Suite →
          </Link>
        </GlassCard>
      </div>

      {/* RECENT INSPECTION LOGS TABLE */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Recent Automated Wafer Alignment Logs
          </h3>
          <span className="text-xs font-mono text-slate-400">Live Production Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">SAMPLE ID</th>
                <th className="py-2.5 px-3">PREDICTED ΔX</th>
                <th className="py-2.5 px-3">PREDICTED ΔY</th>
                <th className="py-2.5 px-3">ROTATION θ</th>
                <th className="py-2.5 px-3">RESIDUAL ERR</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">LATENCY</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {inspections.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400">{row.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{row.sampleId}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{row.predictedDx > 0 ? `+${row.predictedDx}` : row.predictedDx} nm</td>
                  <td className="py-2.5 px-3 text-cyan-400">{row.predictedDy > 0 ? `+${row.predictedDy}` : row.predictedDy} nm</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.predictedRotation}°</td>
                  <td className="py-2.5 px-3 text-emerald-400">{row.errorDistanceNm} nm</td>
                  <td className="py-2.5 px-3 text-slate-200">{row.confidenceScore}%</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.inferenceTimeMs} ms</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
                        row.status === 'RECOVERED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
