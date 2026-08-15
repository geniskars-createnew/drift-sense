import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Sliders,
  Cpu,
  Eye,
  BarChart3,
  GitCompare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const location = useLocation();

  const menuItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload Images', path: '/upload', icon: UploadCloud },
    { label: 'Generate Drift', path: '/simulator', icon: Sliders },
    { label: 'AI Prediction', path: '/prediction', icon: Cpu },
    { label: 'Visualization', path: '/visualization', icon: Eye },
    { label: 'Model Metrics', path: '/performance', icon: BarChart3 },
    { label: 'Classical Matrix', path: '/comparison', icon: GitCompare },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`relative bg-[#090e1b] border-r border-[#1a2640] transition-all duration-300 flex flex-col gap-5 p-4 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Button */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 bg-[#131c33] border border-[#2b3d63] text-cyan-400 hover:text-white p-1 rounded-full shadow-lg z-20 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Inspection Session Section */}
      {!collapsed && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">
              Inspection Session
            </label>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div className="space-y-2">
            <div className="bg-[#0f172a] border border-cyan-500/30 p-2.5 rounded shadow-[inset_0_1px_0_rgba(0,229,255,0.1)]">
              <div className="text-xs text-cyan-300 font-semibold font-mono flex items-center justify-between">
                <span>Lot ID: ASML-7729-QX</span>
                <span className="text-[9px] text-cyan-400/80 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-500/30">ACT</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">Recipe: SEMI-8X-HIGH-RES</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="space-y-1 overflow-y-auto max-h-[220px]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all duration-150 ${
                active
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_14px_rgba(0,229,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121a2e]'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* AI Parameters Sliders */}
      {!collapsed && (
        <div className="pt-2 border-t border-[#1a2640]">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold mb-2.5 block">
            AI Parameters
          </label>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 text-[11px]">Confidence Threshold</span>
                <span className="text-cyan-400 font-mono text-[11px]">98%</span>
              </div>
              <div className="w-full h-1 bg-[#151f38] rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 text-[11px]">Drift Sensitivity</span>
                <span className="text-amber-400 font-mono text-[11px]">Auto</span>
              </div>
              <div className="w-full h-1 bg-[#151f38] rounded-full overflow-hidden flex">
                <div className="w-1/3 h-full bg-slate-700"></div>
                <div className="w-1/3 h-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                <div className="w-1/3 h-full bg-slate-700"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPU Utilization Footer Card */}
      {!collapsed ? (
        <div className="mt-auto p-3 bg-[#0d1424] rounded border border-[#1e2d4a]">
          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">GPU Utilization</div>
          <div className="text-lg font-mono text-emerald-400 font-bold flex items-baseline justify-between">
            <span>42%</span>
            <span className="text-xs text-slate-400 font-normal">@ 64°C</span>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex justify-center">
          <Cpu className="w-5 h-5 text-cyan-400" />
        </div>
      )}
    </aside>
  );
};
