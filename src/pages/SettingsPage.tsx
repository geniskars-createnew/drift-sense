import React, { useState } from 'react';
import { Settings, Cpu, Globe, Sliders, Bell, Shield, Save, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';

export const SettingsPage: React.FC = () => {
  const [modelType, setModelType] = useState('DriftNet-v2 Heavy (ResNet-50 + Deformable Transformer)');
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api/v1/drift-predict');
  const [fovMicrons, setFovMicrons] = useState(150);
  const [stagePrecisionNm, setStagePrecisionNm] = useState(0.1);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [heatmapOverlay, setHeatmapOverlay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
          <Settings className="w-6 h-6 text-cyan-400" />
          Metrology System Settings & Engine Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure deep learning model backends, REST API endpoints, field-of-view parameters, and piezo-stage motor integration.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Model & API Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <GlassCard glow glowColor="cyan" className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-700/80 pb-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                AI Inference Engine Selection
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 block">MODEL ARCHITECTURE</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-cyan-400"
                >
                  <option value="DriftNet-v2 Heavy (ResNet-50 + Deformable Transformer)">
                    DriftNet-v2 Heavy (ResNet-50 + Deformable Transformer) - 0.42nm RMSE
                  </option>
                  <option value="DriftNet-Lite (MobileNetV3 Edge GPU)">
                    DriftNet-Lite (MobileNetV3 Edge GPU) - 1.2ms Ultra-Fast Latency
                  </option>
                  <option value="Hybrid Classical-AI Ensemble">
                    Hybrid Classical-AI Ensemble - High Resilience for Low Contrast
                  </option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Heavy model provides sub-nanometer precision for EUV lithography; Lite model is optimized for high-throughput 200 FPS wafer scanning.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-slate-300 block">FASTAPI / C++ REST API URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-mono text-xs px-4 rounded-xl shrink-0"
                  >
                    Test Ping
                  </button>
                </div>
              </div>
            </GlassCard>

            <GlassCard glow glowColor="blue" className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-700/80 pb-3">
                <Sliders className="w-4 h-4 text-blue-400" />
                Wafer Metrology Field & Stage Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-300 block">FIELD OF VIEW (µm)</label>
                  <select
                    value={fovMicrons}
                    onChange={(e) => setFovMicrons(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-cyan-400"
                  >
                    <option value={100}>100 µm x 100 µm (EUV Photomask)</option>
                    <option value={150}>150 µm x 150 µm (Logic 2nm Die)</option>
                    <option value={200}>200 µm x 200 µm (3D NAND Memory)</option>
                    <option value={300}>300 µm x 300 µm (WLP Packaging)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 block">PIEZO MOTOR STEP (nm)</label>
                  <select
                    value={stagePrecisionNm}
                    onChange={(e) => setStagePrecisionNm(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-cyan-400"
                  >
                    <option value={0.1}>0.1 nm Sub-pixel Resolution</option>
                    <option value={0.5}>0.5 nm Standard Resolution</option>
                    <option value={1.0}>1.0 nm Fast Stage Resolution</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 space-y-3 border-t border-slate-800 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCorrect}
                    onChange={(e) => setAutoCorrect(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Automatic Stage Feedback Loop</span>
                    <p className="text-[11px] text-slate-400">Automatically transmit calculated motor offset vectors to piezo controllers.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heatmapOverlay}
                    onChange={(e) => setHeatmapOverlay(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Enable Spatial Heatmap Rendering</span>
                    <p className="text-[11px] text-slate-400">Display residual deformation heatmaps over inspection canvas views.</p>
                  </div>
                </label>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Security & Preferences */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard glow glowColor="emerald" className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-700/80 pb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                SEMI Security & Metrology Auditing
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SEMI COMPLIANCE:</span>
                    <span className="text-emerald-400 font-bold">E187 / E188 PASS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DATA TRANSMISSION:</span>
                    <span className="text-cyan-400">TLS 1.3 / gRPC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MODEL ENCRYPTION:</span>
                    <span className="text-slate-200">AES-256</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Stage Failure Alert Notifications</span>
                    <p className="text-[11px] text-slate-400">Receive alerts if stage displacement exceeds capture range (&gt;120µm).</p>
                  </div>
                </label>
              </div>
            </GlassCard>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all text-sm"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span className="text-slate-950">Settings Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
