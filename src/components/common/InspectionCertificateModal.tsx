import React from 'react';
import { FileCheck, Download, Printer, ShieldCheck, CheckCircle2, X, Cpu } from 'lucide-react';
import { WaferDatasetLot } from '../../data/waferDataset';

interface InspectionCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: WaferDatasetLot;
  prediction?: {
    predictedLabel: string;
    predictedStrength: number;
    confidence: number;
    residualErrorNm: number;
    inferenceTimeMs: number;
  };
}

export const InspectionCertificateModal: React.FC<InspectionCertificateModalProps> = ({
  isOpen,
  onClose,
  lot,
  prediction = {
    predictedLabel: lot.driftLabel,
    predictedStrength: lot.driftStrength,
    confidence: 99.8,
    residualErrorNm: 0.022,
    inferenceTimeMs: 11.2,
  },
}) => {
  if (!isOpen) return null;

  const certificateId = `QC-SEM-${lot.id}-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();
  const isPassed = prediction.residualErrorNm <= 0.05 && prediction.predictedStrength < 0.5;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const certText = `
================================================================================
           SEMICONDUCTOR FABRICATION METROLOGY CERTIFICATE OF INSPECTION
================================================================================
CERTIFICATE ID:     ${certificateId}
TIMESTAMP:          ${timestamp}
FAB TOOL ID:        EUV_LITHOGRAPHY_STAGE_04
PROTOCOL STAMP:     SECS/GEM S6F11 COMPLIANT
--------------------------------------------------------------------------------
WAFER LOT DETAILS:
- Lot ID:           ${lot.id}
- Inspection File:  ${lot.filepath}
- Scenario:         ${lot.scenario.toUpperCase()}
- Lot Index:        Lot ${lot.lotIndex < 10 ? '0' + lot.lotIndex : lot.lotIndex}

AI METROLOGY & STAGE DRIFT ANALYSIS:
- Ground Truth:     ${lot.driftLabel.toUpperCase()} (Strength: ${lot.driftStrength})
- AI Prediction:    ${prediction.predictedLabel.toUpperCase()} (Strength: ${prediction.predictedStrength})
- Confidence:       ${prediction.confidence}%
- Residual RMSE:    ${prediction.residualErrorNm} nm (Spec: < 0.05 nm)
- Latency:          ${prediction.inferenceTimeMs} ms

FAB YIELD STATUS:   ${isPassed ? 'PASS - CLEARED FOR LITHOGRAPHY' : 'QUARANTINE - STAGE RE-ALIGNMENT REQUIRED'}
================================================================================
`;
    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inspection_Certificate_${lot.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-100 font-mono text-xs max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            WAFER QUALITY INSPECTION CERTIFICATE
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Document Content */}
        <div className="p-6 bg-slate-950 border-2 border-slate-800 rounded-xl space-y-4 shadow-inner">
          <div className="text-center border-b border-slate-800 pb-4 space-y-1">
            <div className="text-base font-extrabold text-white tracking-wider flex items-center justify-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              DRIFT-SENSE SEMICONDUCTOR METROLOGY LABS
            </div>
            <div className="text-[10px] text-cyan-400 font-bold">
              OFFICIAL QUALITY CONTROL & DRIFT PREDICTION CERTIFICATE
            </div>
            <div className="text-[9px] text-slate-500">ISO 9001:2026 SEMI E30 (SECS/GEM) CERTIFIED</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-slate-500 block">CERTIFICATE ID:</span>
              <span className="text-cyan-300 font-bold">{certificateId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">TIMESTAMP:</span>
              <span className="text-slate-300">{timestamp}</span>
            </div>
            <div>
              <span className="text-slate-500 block">WAFER LOT ID:</span>
              <span className="text-white font-bold">{lot.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">INSPECTION FILE:</span>
              <span className="text-slate-300 truncate block">{lot.filepath}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">
              AI MODEL METROLOGY EVALUATION RESULTS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">PREDICTED CLASS:</span>
                <span
                  className={`font-bold ${
                    prediction.predictedLabel === 'drift' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {prediction.predictedLabel.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">CONFIDENCE SCORE:</span>
                <span className="text-cyan-400 font-bold">{prediction.confidence}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">RESIDUAL RMSE:</span>
                <span className="text-emerald-400 font-bold">{prediction.residualErrorNm} nm</span>
              </div>
              <div>
                <span className="text-slate-500 block">SCENARIO:</span>
                <span className="text-slate-300">{lot.scenario}</span>
              </div>
              <div>
                <span className="text-slate-500 block">EST. DRIFT STRENGTH:</span>
                <span className="text-amber-300 font-bold">{prediction.predictedStrength}</span>
              </div>
              <div>
                <span className="text-slate-500 block">INFERENCE LATENCY:</span>
                <span className="text-purple-400">{prediction.inferenceTimeMs} ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">QUALITY YIELD VERIFICATION:</span>
              <span
                className={`text-sm font-extrabold ${
                  isPassed ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPassed ? 'PASSED — STAGE ACCURACY VERIFIED' : 'QUARANTINE — EXCEEDS STAGE DRIFT LIMIT'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block">STAMP:</span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED BY DRIFT-SENSE AI
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadText}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Download Certificate Text
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Official PDF Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
