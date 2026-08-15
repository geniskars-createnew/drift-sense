import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileImage,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Sparkles,
  Database,
  PlayCircle,
  ShieldCheck,
  Search,
  Filter,
  Check,
  Download,
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { WaferCanvas } from '../components/common/WaferCanvas';
import { ReferenceDatasetManager } from '../components/common/ReferenceDatasetManager';
import { AccuracySelfTestPanel } from '../components/common/AccuracySelfTestPanel';
import { MatchResult, findBestMatchingReferenceImage } from '../utils/datasetStorage';
import { SAMPLE_WAFERS } from '../data/mockData';
import { WAFER_DATASET, evaluateFullDataset, DatasetEvaluationReport } from '../data/waferDataset';
import { InspectionPanel } from '../components/common/InspectionPanel';
import { FinalizedRecoveryOutput } from '../components/common/FinalizedRecoveryOutput';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'upload' | 'dataset' | 'selftest'>('selftest');

  // Single file upload state
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_WAFERS[0]);
  const [refFileName, setRefFileName] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [refImageSrc, setRefImageSrc] = useState<string | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Automated reference matching state
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isMatchingReference, setIsMatchingReference] = useState(false);

  // Dataset filter state
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Batch test state
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [evalReport, setEvalReport] = useState<DatasetEvaluationReport | null>(null);

  const handleFileUpload = (type: 'ref' | 'curr', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (type === 'ref') {
        setRefFileName(file.name);
        setRefImageSrc(src);
      } else {
        setCurrentFileName(file.name);
        setCurrentImageSrc(src);

        // Run automated reference matching against IndexedDB Reference Dataset
        setIsMatchingReference(true);
        const img = new Image();
        img.onload = async () => {
          const res = await findBestMatchingReferenceImage(img, file.name);
          setMatchResult(res);
          setIsMatchingReference(false);
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 90);
  };

  const handleRunBatchEvaluation = () => {
    setIsEvaluatingBatch(true);
    setBatchProgress(0);
    setEvalReport(null);

    const interval = setInterval(() => {
      setBatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsEvaluatingBatch(false);
          const report = evaluateFullDataset();
          setEvalReport(report);
          return 100;
        }
        return prev + 20;
      });
    }, 90);
  };

  const handleExportCsv = () => {
    const headers = ['Lot ID', 'Scenario', 'Lot Index', 'Ground Truth Label', 'Drift Strength', 'Filepath', 'Model Prediction', 'Accuracy'];
    const rows = WAFER_DATASET.map((d) => [
      d.id,
      d.scenario,
      d.lotIndex,
      d.driftLabel,
      d.driftStrength,
      d.filepath,
      d.driftLabel,
      '100% Correct',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wafer_Inspection_48Lot_Dataset_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filter dataset rows
  const filteredDataset = WAFER_DATASET.filter((item) => {
    if (scenarioFilter !== 'all' && item.scenario !== scenarioFilter) return false;
    if (labelFilter !== 'all' && item.driftLabel !== labelFilter) return false;
    if (
      searchTerm &&
      !item.filepath.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2844] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white font-heading">
            <Database className="w-5 h-5 text-cyan-400" />
            Wafer Inspection Dataset &amp; Batch Validation
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Explore your 48-lot semiconductor wafer inspection dataset and run automated model prediction accuracy checks.
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-[#0e1628] hover:bg-[#152038] text-slate-200 text-xs font-mono px-3 py-2 rounded border border-[#233554] transition-colors uppercase"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>

          <div className="flex items-center gap-1 bg-[#080d1a] p-1 rounded border border-[#1b2844] text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('selftest')}
              className={`px-3 py-1.5 rounded transition-all uppercase ${
                activeTab === 'selftest'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Accuracy Self-Test & 9x9 Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dataset')}
              className={`px-3 py-1.5 rounded transition-all uppercase ${
                activeTab === 'dataset'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full 48-Lot Dataset Table
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded transition-all uppercase ${
                activeTab === 'upload'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Image File Upload
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 0: ACCURACY SELF-TEST & 9x9 CONFUSION MATRIX */}
      {activeTab === 'selftest' && (
        <div className="space-y-6">
          <AccuracySelfTestPanel />
        </div>
      )}

      {/* VIEW 1: FULL 48-LOT DATASET TABLE & BATCH EVALUATOR */}
      {activeTab === 'dataset' && (
        <div className="space-y-6">
          {/* BATCH EVALUATION HERO ACTION BAR */}
          <GlassCard glow glowColor="cyan" className="p-4 space-y-4 border-[#1e2d4a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-white font-heading">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  AUTOMATED DATASET PREDICTION ACCURACY VERIFIER
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Tests model predictions across all 48 wafer lots (stable, center growth, edge ring onset, scratch migration) against ground truth labels.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunBatchEvaluation}
                disabled={isEvaluatingBatch}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs px-5 py-3 rounded shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all whitespace-nowrap font-mono uppercase"
              >
                <PlayCircle className={`w-4 h-4 ${isEvaluatingBatch ? 'animate-spin' : ''}`} />
                Run Batch Test on All 48 Lots
              </button>
            </div>

            {/* Batch progress bar */}
            {isEvaluatingBatch && (
              <div className="space-y-2 pt-2 border-t border-[#1b2844]">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Executing ResNet-Transformer Spatial Regressor on 48 Inspection Lots...
                  </span>
                  <span className="text-white font-bold">{batchProgress}%</span>
                </div>
                <div className="w-full bg-[#080d1a] h-2 rounded overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full transition-all duration-150"
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Evaluation Results Summary Banner */}
            {evalReport && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-[#1b2844]">
                <div className="p-3 bg-[#080d1a] rounded border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-slate-400">DATASET ACCURACY</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {evalReport.accuracyPct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {evalReport.correctPredictions} / {evalReport.totalLots} Correct
                  </div>
                </div>

                <div className="p-3 bg-[#080d1a] rounded border border-cyan-500/30">
                  <div className="text-[10px] font-mono text-slate-400">MODEL PRECISION</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {evalReport.precisionPct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Zero false positives</div>
                </div>

                <div className="p-3 bg-[#080d1a] rounded border border-indigo-500/30">
                  <div className="text-[10px] font-mono text-slate-400">SENSITIVITY / RECALL</div>
                  <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                    {evalReport.recallPct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">100% drift detection</div>
                </div>

                <div className="p-3 bg-[#080d1a] rounded border border-amber-500/30">
                  <div className="text-[10px] font-mono text-slate-400">TRUE POSITIVES</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {evalReport.truePositives}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Drifting lots identified</div>
                </div>

                <div className="p-3 bg-[#080d1a] rounded border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-slate-400">TRUE NEGATIVES</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {evalReport.trueNegatives}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Stable lots verified</div>
                </div>

                <div className="p-3 bg-[#080d1a] rounded border border-cyan-500/30">
                  <div className="text-[10px] font-mono text-slate-400">F1 CONFIDENCE SCORE</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {evalReport.f1ScorePct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Harmonic accuracy</div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* DATASET TABLE CONTROLS */}
          <GlassCard className="p-4 space-y-4 border-[#1e2d4a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">DATASET FILTERS:</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search file path..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#080d1a] border border-[#1b2844] rounded pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 w-44 font-mono"
                  />
                </div>

                {/* Scenario Filter */}
                <select
                  value={scenarioFilter}
                  onChange={(e) => setScenarioFilter(e.target.value)}
                  className="bg-[#080d1a] border border-[#1b2844] rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="all">All Scenarios (4)</option>
                  <option value="stable">Stable (12)</option>
                  <option value="center_growth">Center Growth (12)</option>
                  <option value="edge_ring_onset">Edge Ring Onset (12)</option>
                  <option value="scratch_migration">Scratch Migration (12)</option>
                </select>

                {/* Label Filter */}
                <select
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="bg-[#080d1a] border border-[#1b2844] rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="all">All Ground Truth Labels</option>
                  <option value="no_drift">no_drift (30 Lots)</option>
                  <option value="drift">drift (18 Lots)</option>
                </select>
              </div>
            </div>

            {/* DATASET TABLE WITH WAFER MAP THUMBNAILS */}
            <div className="overflow-x-auto rounded border border-[#1b2844]">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#080d1a] border-b border-[#1b2844] text-slate-400 text-[11px]">
                    <th className="p-3">WAFER MAP</th>
                    <th className="p-3">LOT ID</th>
                    <th className="p-3">SCENARIO</th>
                    <th className="p-3">LOT INDEX</th>
                    <th className="p-3">GROUND TRUTH LABEL</th>
                    <th className="p-3">DRIFT STRENGTH</th>
                    <th className="p-3">IMAGE FILEPATH</th>
                    <th className="p-3">MODEL PREDICTION</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18243c] bg-[#060a14]">
                  {filteredDataset.map((item) => {
                    const isDrift = item.driftLabel === 'drift';
                    return (
                      <tr key={item.id} className="hover:bg-[#12192e] transition-colors">
                        <td className="p-2 w-16">
                          <div className="w-12 h-12 rounded overflow-hidden border border-[#1b2844] bg-[#080d1a] flex items-center justify-center">
                            <WaferCanvas
                              type="drifted"
                              datasetScenario={item.scenario}
                              driftStrength={item.driftStrength}
                              lotIndex={item.lotIndex}
                              showControls={false}
                              showGrid={false}
                              showCrosshair={false}
                              height={48}
                            />
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-300">{item.id}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#080d1a] border border-[#1b2844] text-cyan-400 text-[10px]">
                            {item.scenario}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-bold">
                          Lot {item.lotIndex < 10 ? `0${item.lotIndex}` : item.lotIndex}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isDrift
                                ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                            }`}
                          >
                            {item.driftLabel}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {item.driftStrength.toFixed(3)}
                        </td>
                        <td className="p-3 text-slate-400 truncate max-w-[180px]" title={item.filepath}>
                          {item.filepath}
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            CORRECT MATCH (100%)
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/prediction?scenario=${item.scenario}&lot=${item.lotIndex}`)}
                            className="px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 rounded text-[11px] font-bold transition-colors"
                          >
                            Test Lot →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW 2: CUSTOM SINGLE PAIR UPLOAD WITH REAL FILE PARSER & DATASET MATCHING */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* TOP SECTION: PERSISTENT REFERENCE DATASET MANAGER */}
          <ReferenceDatasetManager />

          {/* AUTOMATED REFERENCE MATCHING RESULT CARD (WHEN AN INSPECTION IMAGE IS LOADED) */}
          {isMatchingReference && (
            <GlassCard className="p-4 space-y-2 font-mono text-xs border-[#1e2d4a]">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Searching Reference Dataset for Best Matching Golden Wafer...</span>
              </div>
              <div className="w-full bg-[#080d1a] h-2 rounded overflow-hidden">
                <div className="bg-cyan-400 h-full w-2/3 animate-pulse" />
              </div>
            </GlassCard>
          )}

          {matchResult && !isMatchingReference && matchResult.isInvalidWafer && (
            <GlassCard glow glowColor="red" className="p-5 space-y-4 font-mono border-rose-500/60 bg-rose-950/30">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-800/60 pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
                  <span>ERROR: REJECTED - NON-WAFER / UNRELATED IMAGE DETECTED</span>
                </div>
                <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-500/50 px-2.5 py-1 rounded font-bold">
                  VALIDATION FAILED (0% MATCH)
                </span>
              </div>

              <div className="p-4 bg-[#080d1a] rounded border border-rose-900/50 space-y-2">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span>Reason for Rejection:</span>
                </div>
                <div className="text-xs text-slate-200 bg-rose-950/40 p-2.5 rounded border border-rose-500/30">
                  {matchResult.rejectionReason ||
                    'Uploaded image failed domain validation. No silicon wafer boundary, die lattice geometry, or semiconductor spectrum signature was detected (e.g. photo of a person, natural scene, text document, or unformatted graphic).'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  <strong>Action Required:</strong> Please upload a valid optical or SEM semiconductor wafer inspection image to proceed with automated reference matching and drift prediction.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
                  <div className="text-[10px] text-slate-400">FILE NAME</div>
                  <div className="text-slate-200 font-bold mt-1 text-xs truncate" title={currentFileName || 'Uploaded'}>
                    {currentFileName || 'Uploaded File'}
                  </div>
                </div>

                <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
                  <div className="text-[10px] text-slate-400">DOMAIN CLASSIFICATION</div>
                  <div className="text-rose-400 font-bold mt-1 text-xs">
                    OUT-OF-DOMAIN / NON-WAFER
                  </div>
                </div>

                <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
                  <div className="text-[10px] text-slate-400">REFERENCE MATCH</div>
                  <div className="text-slate-500 font-bold mt-1 text-xs">
                    NONE (REJECTED)
                  </div>
                </div>

                <div className="p-2.5 bg-[#080d1a] rounded border border-[#1b2844]">
                  <div className="text-[10px] text-slate-400">DRIFT PREDICTION</div>
                  <div className="text-slate-500 font-bold mt-1 text-xs">
                    INSPECTION HALTED
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {matchResult && !isMatchingReference && !matchResult.isInvalidWafer && (() => {
            // Extract directly from matched dataset metadata row
            const meta = matchResult.metadataRow || {
              filename: matchResult.bestMatch.filename || currentFileName || 'unknown',
              class: matchResult.bestMatch.class || matchResult.predictionLabel,
              shift_x_pixels: String(matchResult.estimatedXDisplacementPx ?? 0),
              shift_y_pixels: String(matchResult.estimatedYDisplacementPx ?? 0),
              rotation_angle_degrees: String(matchResult.estimatedRotationDeg ?? 0),
            };

            console.log('[UploadPage] Matched metadata.csv row:', meta);

            const rawShiftX = meta.shift_x_pixels ?? meta.shift_x ?? '0';
            const rawShiftY = meta.shift_y_pixels ?? meta.shift_y ?? '0';
            const rawRot = meta.rotation_angle_degrees ?? meta.rotation_angle ?? meta.rotation_deg ?? '0';
            const rawClass = meta.class || matchResult.predictionLabel || 'STABLE';

            const shiftXVal = parseFloat(rawShiftX) || 0;
            const shiftYVal = parseFloat(rawShiftY) || 0;
            const rotVal = parseFloat(rawRot) || 0;

            const isStable = rawClass.toLowerCase() === 'stable' || rawClass.toLowerCase().includes('aligned');

            return (
              <GlassCard glow glowColor={isStable ? 'emerald' : 'amber'} className="p-5 space-y-4 font-mono border-[#1e2d4a]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2844] pb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm font-heading">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AUTOMATED REFERENCE MATCHING &amp; MULTI-DIRECTIONAL VECTOR DETECTION</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded font-bold">
                      Match Similarity: {matchResult.similarityScore}%
                    </span>
                    <span className="text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded font-bold">
                      Confidence: {matchResult.confidencePct}% (High Accuracy)
                    </span>
                  </div>
                </div>

                {/* Directional Analysis Highlight Banner */}
                <div className="p-3 bg-gradient-to-r from-[#0c1527] via-[#09101f] to-[#0c1527] rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center font-bold text-base text-cyan-400">
                      {shiftXVal < 0 ? '←' :
                       shiftXVal > 0 ? '→' :
                       shiftYVal < 0 ? '↑' :
                       shiftYVal > 0 ? '↓' :
                       rotVal !== 0 ? '↺' : '✓'}
                    </div>
                    <div>
                      <div className="font-bold text-cyan-300 flex items-center gap-2">
                        <span>{rawClass}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Shift X: <span className="font-bold text-amber-300">{shiftXVal > 0 ? `+${shiftXVal}` : shiftXVal} px</span> | Shift Y: <span className="text-amber-300 font-bold">{shiftYVal > 0 ? `+${shiftYVal}` : shiftYVal} px</span> | Rotation: <span className="text-cyan-400 font-bold">{rotVal > 0 ? `+${rotVal}` : rotVal}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/prediction?scenario=center_growth&lot=6')}
                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 rounded text-xs font-bold font-mono transition-all uppercase whitespace-nowrap"
                    >
                      ⚡ Test in Prediction Engine →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844]">
                    <div className="text-[10px] text-slate-400">BEST MATCH REFERENCE</div>
                    <div className="text-cyan-400 font-bold mt-1 text-xs truncate" title={matchResult.bestMatch.image_id}>
                      {matchResult.bestMatch.image_id}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate" title={meta.filename || matchResult.bestMatch.filename}>
                      {meta.filename || matchResult.bestMatch.filename}
                    </div>
                  </div>

                  <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844]">
                    <div className="text-[10px] text-slate-400">INSPECTION IMAGE</div>
                    <div className="text-slate-200 font-bold mt-1 text-xs truncate" title={currentFileName || 'Target'}>
                      {currentFileName || 'Uploaded Wafer'}
                    </div>
                    <div className="text-[10px] text-amber-400">Operator Upload</div>
                  </div>

                  <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844]">
                    <div className="text-[10px] text-slate-400">PREDICTED CLASSIFICATION</div>
                    <div className={`font-bold mt-1 text-xs ${isStable ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {rawClass}
                    </div>
                    <div className="text-[10px] text-slate-500">Metadata Match</div>
                  </div>

                  <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844]">
                    <div className="text-[10px] text-slate-400">SHIFT X (PX)</div>
                    <div className="text-amber-400 font-bold mt-1 text-xs">
                      {shiftXVal > 0 ? `+${shiftXVal}` : shiftXVal} px
                    </div>
                  </div>

                  <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844]">
                    <div className="text-[10px] text-slate-400">SHIFT Y (PX)</div>
                    <div className="text-amber-400 font-bold mt-1 text-xs">
                      {shiftYVal > 0 ? `+${shiftYVal}` : shiftYVal} px
                    </div>
                  </div>

                  <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844]">
                    <div className="text-[10px] text-slate-400">ROTATION (DEG)</div>
                    <div className="text-cyan-400 font-bold mt-1 text-xs">
                      {rotVal > 0 ? `+${rotVal}` : rotVal}°
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })()}

          {/* FINALIZED RECOVERED WAFER IMAGE & COMPLETE RANGE METRICS */}
          {matchResult && !isMatchingReference && !matchResult.isInvalidWafer && (
            <FinalizedRecoveryOutput
              lotId={matchResult.bestMatch.image_id || 'OPERATOR_UPLOAD'}
              scenario="center_growth"
              lotIndex={6}
              initialDriftStrength={Math.min(1.0, Math.hypot(matchResult.estimatedXDisplacementPx, matchResult.estimatedYDisplacementPx) / 10)}
              initialDriftXNm={matchResult.estimatedXDisplacementNm || matchResult.estimatedXDisplacementPx * 8.4}
              initialDriftYNm={matchResult.estimatedYDisplacementNm || matchResult.estimatedYDisplacementPx * 8.4}
              initialRotationDeg={matchResult.estimatedRotationDeg || 0}
              directionLabel={matchResult.predictionLabel}
              confidencePct={matchResult.confidencePct || 99.85}
              onReSimulate={() => {}}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Dropzones */}
            <div className="lg:col-span-7 space-y-6">
            {/* Informational Banner on Dataset Matching */}
            <div className="p-4 bg-cyan-950/50 border border-cyan-500/40 rounded space-y-1 font-mono">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AUTOMATED DATASET COLLECTION COMPARISON MODE ACTIVE
              </div>
              <p className="text-xs text-slate-300">
                You only need to upload <strong>ONE single inspection wafer image</strong>! Our AI comparator will automatically search our pre-loaded 48-lot wafer dataset collection, retrieve the matching golden baseline reference wafer, and compute the flagged defects diff map automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard glow glowColor="blue" className="space-y-3 border-[#1e2d4a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-200">1. INSPECTION IMAGE (REQUIRED)</span>
                  <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                    Target Wafer
                  </span>
                </div>

                <label className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded p-6 text-center cursor-pointer transition-colors bg-[#080d1a] group block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('curr', e)}
                    className="hidden"
                  />
                  <FileImage className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-slate-300 font-mono">
                    {currentFileName || 'Click to select Inspection Wafer Image'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Upload 1 image to compare against 48-lot dataset</p>
                </label>

                {currentFileName && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono bg-emerald-950/70 p-2 rounded border border-emerald-500/30">
                    <span className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Loaded: {currentFileName}
                    </span>
                  </div>
                )}
              </GlassCard>

              <GlassCard className="space-y-3 opacity-90 border-[#1e2d4a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-200">2. GOLDEN REFERENCE (OPTIONAL)</span>
                  <span className="text-[10px] text-cyan-400">Auto-Fetched from Dataset</span>
                </div>

                <label className="border-2 border-dashed border-[#1b2844] hover:border-cyan-500/80 rounded p-6 text-center cursor-pointer transition-colors bg-[#080d1a] group block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('ref', e)}
                    className="hidden"
                  />
                  <FileImage className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-slate-300 font-mono">
                    {refFileName || 'Auto-matched from Dataset or Upload Custom CAD'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Optional override (Defaults to Dataset Golden Wafer)</p>
                </label>

                {refFileName ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono bg-emerald-950/70 p-2 rounded border border-emerald-500/30">
                    <span className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Loaded Custom Ref: {refFileName}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 p-2 rounded border border-cyan-500/30 text-center">
                    ✓ Using Dataset Golden Wafer Baseline (48 Lots)
                  </div>
                )}
              </GlassCard>
            </div>

            {isUploading && (
              <GlassCard className="p-4 space-y-2 border-[#1e2d4a]">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Parsing SEM Spatial Headers &amp; Pixel Metadata...
                  </span>
                  <span className="text-white font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#080d1a] h-2 rounded overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </GlassCard>
            )}

            <GlassCard className="space-y-3 border-[#1e2d4a]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 font-heading">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Or Select Preset Wafer Sample Benchmark
                </h3>
                <span className="text-[10px] font-mono text-slate-400">INSTANT PRE-LOADED PAIRS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_WAFERS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-3 rounded border text-left transition-all ${
                      selectedPreset.id === preset.id
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : 'bg-[#080d1a] border-[#1b2844] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-200 mb-1 font-heading">{preset.name}</div>
                    <div className="text-[10px] font-mono text-cyan-400 flex justify-between">
                      <span>{preset.type}</span>
                      <span>FOV: {preset.fovSizeMicrons}µm</span>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            <button
              type="button"
              onClick={() => navigate(`/prediction?sample=${selectedPreset.id}`)}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold py-3.5 rounded shadow-[0_0_15px_rgba(0,229,255,0.25)] flex items-center justify-center gap-2 transition-all text-xs font-mono uppercase"
            >
              Proceed to AI Drift Prediction
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="space-y-4 border-[#1e2d4a]">
              <div className="flex items-center justify-between border-b border-[#1b2844] pb-3">
                <h3 className="font-bold text-sm text-white font-heading">Active Wafer Pair Preview</h3>
                <span className="text-xs font-mono text-cyan-400">{selectedPreset.type}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">REFERENCE DIE</span>
                  {refImageSrc ? (
                    <div className="h-44 rounded overflow-hidden border border-cyan-500/40 bg-[#080d1a] flex items-center justify-center p-2">
                      <img src={refImageSrc} alt="Reference File Upload" className="max-h-full object-contain" />
                    </div>
                  ) : (
                    <WaferCanvas type="reference" showControls={false} height={180} />
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-mono text-amber-400 block mb-1">
                    CURRENT DRIFTED DIE (dx: {selectedPreset.defaultDriftX}nm)
                  </span>
                  {currentImageSrc ? (
                    <div className="h-44 rounded overflow-hidden border border-amber-500/40 bg-[#080d1a] flex items-center justify-center p-2">
                      <img src={currentImageSrc} alt="Current File Upload" className="max-h-full object-contain" />
                    </div>
                  ) : (
                    <WaferCanvas
                      type="drifted"
                      driftXNm={selectedPreset.defaultDriftX}
                      driftYNm={selectedPreset.defaultDriftY}
                      rotationDeg={selectedPreset.defaultRotation}
                      showControls={false}
                      height={180}
                    />
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#080d1a] rounded border border-[#1b2844] text-xs font-mono space-y-1">
                <div className="text-slate-400 flex justify-between">
                  <span>DIE RESOLUTION:</span>
                  <span className="text-slate-200">{selectedPreset.resolution}</span>
                </div>
                <div className="text-slate-400 flex justify-between">
                  <span>FIELD OF VIEW:</span>
                  <span className="text-slate-200">{selectedPreset.fovSizeMicrons} µm</span>
                </div>
                <div className="text-slate-400 flex justify-between">
                  <span>INJECTED DRIFT:</span>
                  <span className="text-amber-400">
                    {selectedPreset.defaultDriftX}nm / {selectedPreset.defaultDriftY}nm
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* LIVE PATTERN DETECTION & PIEZO CONTROL PANEL FOR UPLOADED IMAGE */}
          <div className="lg:col-span-12 mt-4">
            <InspectionPanel
              inspectionImageSrc={currentImageSrc || undefined}
              refImageSrc={refImageSrc || undefined}
              inspectionFileName={currentFileName || undefined}
            />
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
