import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Layers,
  Upload,
  Info,
  Table,
  Cpu,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { GlassCard } from './GlassCard';
import { LoadedDatasetFile } from '../../DatasetUploader';
import {
  runSelfTest,
  TestReport,
  CANONICAL_CLASSES,
  parseCsvText,
} from '../../localization/selfTest';
import { generateSyntheticBenchmarkDataset } from '../../localization/syntheticBenchmark';

interface Props {
  externalDatasetFiles?: LoadedDatasetFile[];
  externalMetadata?: Record<string, string>[];
}

export const AccuracySelfTestPanel: React.FC<Props> = ({
  externalDatasetFiles,
  externalMetadata,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to execute accuracy self-test');
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [datasetSource, setDatasetSource] = useState<'synthetic' | 'custom'>('synthetic');
  const [customFiles, setCustomFiles] = useState<LoadedDatasetFile[]>([]);
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'perclass' | 'samples'>('matrix');

  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Handle ZIP upload for custom dataset
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(`Reading ZIP archive: ${file.name}...`);
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((f) => !f.dir);

      const loaded: LoadedDatasetFile[] = [];
      let parsedMeta: Record<string, string>[] = [];

      for (const entry of entries) {
        const lower = entry.name.toLowerCase();
        const blob = await entry.async('blob');

        if (lower.endsWith('.csv')) {
          const csvText = await blob.text();
          parsedMeta = parseCsvText(csvText);
        }

        const url = URL.createObjectURL(blob);
        loaded.push({
          path: entry.name,
          blob,
          url,
        });
      }

      setCustomFiles(loaded);
      setCustomMetadata(parsedMeta);
      setDatasetSource('custom');
      setStatusMessage(`Loaded custom dataset: ${loaded.length} files (${parsedMeta.length} metadata entries).`);
    } catch (err) {
      console.error('Error loading ZIP for self-test:', err);
      setStatusMessage('Error parsing custom ZIP dataset.');
    }
  };

  // Run Self-Test
  const handleExecuteSelfTest = async () => {
    setIsRunning(true);
    setProgressPct(10);
    setStatusMessage('Preparing test dataset and ground-truth metadata...');

    try {
      let filesToTest = customFiles.length > 0 ? customFiles : externalDatasetFiles || [];
      let metaToTest = customMetadata.length > 0 ? customMetadata : externalMetadata || [];

      if (datasetSource === 'synthetic' || filesToTest.length === 0) {
        setStatusMessage('Generating multi-class benchmark dataset in-memory...');
        const syn = await generateSyntheticBenchmarkDataset();
        filesToTest = syn.files;
        metaToTest = syn.metadata;
        setProgressPct(30);
      }

      setStatusMessage(`Executing detection pipeline on ${metaToTest.length} inspection wafers...`);
      setProgressPct(50);

      // Run the official self-test pipeline
      const report = await runSelfTest(filesToTest, metaToTest);

      setProgressPct(100);
      setTestReport(report);
      setStatusMessage(`Self-test complete! Overall Accuracy: ${report.overallAccuracyPct}% (${report.totalCorrect}/${report.totalTested} correct).`);
    } catch (err) {
      console.error('Self-test execution failed:', err);
      setStatusMessage('Self-test failed due to an execution error.');
    } finally {
      setIsRunning(false);
    }
  };

  // Export Confusion Matrix & Test Report as CSV
  const handleExportCsv = () => {
    if (!testReport) return;
    const header = ['Actual / Ground Truth', ...testReport.classes.map((c) => `Pred: ${c}`), 'Total Actual', 'Per-Class Accuracy %'];
    const rows = testReport.classes.map((cls, actualIdx) => {
      const rowCounts = testReport.confusionMatrix[actualIdx];
      const totalActual = rowCounts.reduce((a, b) => a + b, 0);
      const acc = testReport.perClassAccuracy[cls] || 0;
      return [cls, ...rowCounts, totalActual, `${acc}%`];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Accuracy_SelfTest_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const classes = testReport ? testReport.classes : CANONICAL_CLASSES;

  return (
    <GlassCard glow glowColor="cyan" className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                AUTOMATED ACCURACY SELF-TEST & CONFUSION MATRIX
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                  GROUND-TRUTH VALIDATOR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Runs the full reference localization + defect classification pipeline against ground-truth metadata.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={zipInputRef}
            onChange={handleZipUpload}
            accept=".zip"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Upload custom ZIP dataset with metadata.csv"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Load Custom ZIP Dataset
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleExecuteSelfTest}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <PlayCircle className="w-4 h-4 text-slate-950" />
            )}
            {isRunning ? 'RUNNING SELF-TEST...' : 'RUN ACCURACY SELF-TEST'}
          </button>
        </div>
      </div>

      {/* Progress / Status Banner */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span className="text-slate-300 font-bold">STATUS:</span>
          <span className="text-cyan-300">{statusMessage}</span>
        </div>
        {testReport && (
          <div className="flex items-center gap-3 text-slate-400">
            <span>Evaluated: <strong className="text-white">{testReport.totalTested} Wafers</strong></span>
            <span>Unrelated Skipped: <strong className="text-amber-400">{testReport.unrelatedSkippedCount}</strong></span>
          </div>
        )}
      </div>

      {/* SYSTEMATIC SWAP WARNING OR PASS BANNER (Requirement 7) */}
      {testReport && (
        <>
          {testReport.swapWarnings.length > 0 ? (
            <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-xl space-y-2 text-rose-200 font-mono text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                SYSTEMATIC SIGN INVERSION DETECTED ({testReport.swapWarnings.length} Anomalies)
              </div>
              <p className="text-rose-300/90 text-xs">
                The evaluation pipeline identified a systematic directional or rotational axis inversion (&gt;50% swap rate). Check coordinate conventions:
              </p>
              <div className="space-y-1.5 pt-1">
                {testReport.swapWarnings.map((w, idx) => (
                  <div key={idx} className="p-2 bg-rose-900/40 rounded border border-rose-700/60 text-rose-100 flex items-center justify-between">
                    <span>⚠️ <strong>{w.pair}:</strong> {w.message}</span>
                    <span className="text-rose-300 font-bold font-mono">{(Math.max(w.rateAtoB, w.rateBtoA) * 100).toFixed(1)}% Swap Rate</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-300 font-mono text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>NO SYSTEMATIC SIGN INVERSIONS DETECTED:</strong> Axes (Left/Right, Up/Down, Left/Right Rotation) are strictly congruent.
                </span>
              </div>
              <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                100% DIRECTIONAL INTEGRITY
              </span>
            </div>
          )}
        </>
      )}

      {/* KPI METRICS ROW */}
      {testReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">OVERALL ACCURACY</div>
            <div className={`text-2xl font-black mt-1 ${testReport.overallAccuracyPct >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {testReport.overallAccuracyPct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {testReport.totalCorrect} / {testReport.totalTested} Wafers Correct
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">CANONICAL CLASSES</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">9 Classes</div>
            <div className="text-[10px] text-slate-500 mt-0.5">9x9 Metrology Grid</div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">FILTERED UNRELATED</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{testReport.unrelatedSkippedCount} Skipped</div>
            <div className="text-[10px] text-slate-500 mt-0.5">"unrelated/" Folder Filter</div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400">EXPORT REPORT</div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="mt-1 w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {testReport && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'matrix'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            9x9 Confusion Matrix Grid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perclass')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'perclass'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Per-Class Accuracy Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'samples'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sample Log ({testReport.sampleResults.length})
          </button>
        </div>
      )}

      {/* TAB 1: 9x9 CONFUSION MATRIX (Requirement 4 & 5) */}
      {testReport && activeTab === 'matrix' && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              <strong>CONFUSION MATRIX:</strong> Rows = <span className="text-amber-400 font-bold">Ground Truth (Actual)</span>, Columns = <span className="text-cyan-400 font-bold">Model Predicted</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500" />
                <span className="text-emerald-400 text-[11px]">Diagonal (Correct)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500" />
                <span className="text-rose-400 text-[11px]">Off-Diagonal (Errors)</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
            <table className="w-full text-center text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th className="p-2 text-left text-amber-300 font-bold min-w-[130px]">
                    ACTUAL \ PRED →
                  </th>
                  {classes.map((cls, i) => (
                    <th key={i} className="p-2 text-cyan-300 font-bold min-w-[90px]">
                      {cls}
                    </th>
                  ))}
                  <th className="p-2 text-right text-slate-300 font-bold min-w-[80px]">Total</th>
                  <th className="p-2 text-right text-emerald-400 font-bold min-w-[90px]">Class Acc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {classes.map((actualClass, actualIdx) => {
                  const rowCounts = testReport.confusionMatrix[actualIdx];
                  const totalActual = rowCounts.reduce((a, b) => a + b, 0);
                  const classAcc = testReport.perClassAccuracy[actualClass] || 0;

                  return (
                    <tr key={actualIdx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2 text-left font-bold text-amber-300/90 whitespace-nowrap">
                        {actualClass}
                      </td>

                      {classes.map((predClass, predIdx) => {
                        const count = testReport.confusionMatrix[actualIdx][predIdx];
                        const isDiagonal = actualIdx === predIdx;

                        let cellStyle = 'text-slate-600 bg-slate-900/20';
                        if (isDiagonal) {
                          cellStyle = count > 0
                            ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold shadow-sm'
                            : 'bg-slate-900/30 text-slate-500';
                        } else if (count > 0) {
                          cellStyle = 'bg-rose-950/70 border border-rose-500/60 text-rose-300 font-bold';
                        }

                        return (
                          <td key={predIdx} className="p-1">
                            <div className={`p-2 rounded-lg ${cellStyle} transition-all`}>
                              {count}
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-2 text-right font-bold text-slate-300">
                        {totalActual}
                      </td>
                      <td className="p-2 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          classAcc >= 90
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : classAcc >= 70
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {classAcc.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PER-CLASS ACCURACY METRICS (Requirement 6) */}
      {testReport && activeTab === 'perclass' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {testReport.perClassMetrics.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white uppercase text-xs">{m.className}</span>
                <span className="text-emerald-400 font-black">{m.accuracyPct.toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>Ground Truth: <strong className="text-slate-200">{m.totalGroundTruth}</strong></div>
                <div>True Pos (TP): <strong className="text-emerald-400">{m.truePositives}</strong></div>
                <div>Precision: <strong className="text-cyan-400">{m.precisionPct.toFixed(1)}%</strong></div>
                <div>Recall: <strong className="text-blue-400">{m.recallPct.toFixed(1)}%</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DETAILED SAMPLE-BY-SAMPLE LOG */}
      {testReport && activeTab === 'samples' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Wafer Filename</th>
                <th className="p-2.5">Ground Truth</th>
                <th className="p-2.5">Model Predicted</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Displacement (dx, dy)</th>
                <th className="p-2.5 text-right">Rotation</th>
                <th className="p-2.5 text-right">Conf %</th>
                <th className="p-2.5 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {testReport.sampleResults.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-2 text-cyan-300 font-bold">{s.filename}</td>
                  <td className="p-2 text-amber-300">{s.groundTruthClass}</td>
                  <td className="p-2 text-slate-200">{s.predictedClass}</td>
                  <td className="p-2 text-center">
                    {s.isCorrect ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-bold text-[10px]">
                        CORRECT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded font-bold text-[10px]">
                        MISMATCH
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right text-slate-400">
                    {s.displacementX.toFixed(1)}, {s.displacementY.toFixed(1)} px
                  </td>
                  <td className="p-2 text-right text-slate-400">{s.rotationDeg.toFixed(1)}°</td>
                  <td className="p-2 text-right text-emerald-400 font-bold">{s.confidence.toFixed(1)}%</td>
                  <td className="p-2 text-right text-slate-400">{s.executionTimeMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
};
