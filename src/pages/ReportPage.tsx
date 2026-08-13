import React from 'react';
import { FileText, Download, Printer, ShieldCheck, CheckCircle2, Cpu, Activity, BarChart2 } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { RECENT_INSPECTIONS, SAMPLE_WAFERS } from '../data/mockData';
import { WaferCanvas } from '../components/common/WaferCanvas';

export const ReportPage: React.FC = () => {

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'SampleID', 'PredictedDx_nm', 'PredictedDy_nm', 'Rotation_deg', 'ErrorDistance_nm', 'Confidence_pct', 'InferenceTime_ms', 'Status'];
    const rows = RECENT_INSPECTIONS.map(r => [
      r.timestamp,
      r.sampleId,
      r.predictedDx,
      r.predictedDy,
      r.predictedRotation,
      r.errorDistanceNm,
      r.confidenceScore,
      r.inferenceTimeMs,
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wafer_drift_inspection_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <FileText className="w-6 h-6 text-cyan-400" />
            Wafer Inspection & Stage Telemetry Compliance Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable metrology certification reports & export raw sub-pixel drift telemetry to CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono px-3.5 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV Data
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* PRINTABLE FORMAL METROLOGY CERTIFICATE CARD */}
      <div id="printable-report" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
        {/* Certificate Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-wide">DRIFT-SENSE METROLOGY CERTIFICATE</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  PASSED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SEMI E187/E188 Compliant Sub-Nanometer Alignment Audit
              </p>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-400 space-y-1">
            <div>REPORT ID: <span className="text-slate-200">DS-2026-0806-009</span></div>
            <div>DATE: <span className="text-slate-200">{new Date().toISOString().substring(0, 10)}</span></div>
            <div>INSPECTOR ENGINE: <span className="text-cyan-400 font-bold">DriftNet-v2.4 (ResNet50-Tr)</span></div>
          </div>
        </div>

        {/* Wafer Lot Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">LOT NUMBER:</span>
            <span className="text-slate-200 font-bold">LOT-300-GAA-94B</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">WAFER DIAMETER:</span>
            <span className="text-slate-200 font-bold">300 mm Silicon</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">TECHNOLOGY NODE:</span>
            <span className="text-cyan-400 font-bold">GAAFET 2nm Logic</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">FIELD OF VIEW:</span>
            <span className="text-slate-200 font-bold">150 µm x 150 µm</span>
          </div>
        </div>

        {/* Executive Inspection Metrics Summary */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
            1. Spatial Drift Recovery Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400">MEAN ALIGNMENT RMSE</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">0.42 nm</div>
              <p className="text-[10px] text-slate-500">Sub-nanometer precision threshold met.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400">MEAN INFERENCE TIME</span>
              <div className="text-2xl font-bold font-mono text-cyan-400">11.4 ms</div>
              <p className="text-[10px] text-slate-500">FastAPI TensorRT pipeline active.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400">STAGE RECOVERY RATE</span>
              <div className="text-2xl font-bold font-mono text-purple-400">99.87%</div>
              <p className="text-[10px] text-slate-500">1,426 of 1,428 fields fully aligned.</p>
            </div>
          </div>
        </div>

        {/* Heatmap & Die View Pair */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
            2. Representative Die Spatial Deformation & Aligned Field
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-mono text-amber-400 block mb-1">
                RESIDUAL DRIFT HEATMAP OVERLAY
              </span>
              <WaferCanvas
                type="heatmap"
                driftXNm={42.8}
                driftYNm={-18.3}
                showControls={false}
                height={260}
              />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 block mb-1">
                AI ALIGNED FIELD (0.02nm RESIDUAL)
              </span>
              <WaferCanvas
                type="aligned"
                driftXNm={0}
                driftYNm={0}
                showControls={false}
                height={260}
              />
            </div>
          </div>
        </div>

        {/* Detailed Inspection Audit Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
            3. Field-Level Metrology Log Table
          </h3>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">FIELD ID</th>
                  <th className="py-2.5 px-3">PREDICTED ΔX</th>
                  <th className="py-2.5 px-3">PREDICTED ΔY</th>
                  <th className="py-2.5 px-3">ROTATION θ</th>
                  <th className="py-2.5 px-3">RMSE (nm)</th>
                  <th className="py-2.5 px-3">CONFIDENCE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {RECENT_INSPECTIONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400">{row.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{row.sampleId}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{row.predictedDx} nm</td>
                    <td className="py-2.5 px-3 text-cyan-400">{row.predictedDy} nm</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.predictedRotation}°</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.errorDistanceNm} nm</td>
                    <td className="py-2.5 px-3 text-slate-200">{row.confidenceScore}%</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certification Sign-Off Footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            AUTOMATED AUDIT SIGNATURE: <span className="text-slate-200 font-bold">SEMI-WAFER-AI-V2.4</span>
          </div>
          <div>STATUS: <span className="text-emerald-400 font-bold">APPROVED FOR LITHOGRAPHY STAGE</span></div>
        </div>
      </div>
    </div>
  );
};
