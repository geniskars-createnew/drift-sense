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
      className={`relative bg-[#0F172A] border-r border-white/10 transition-all duration-300 flex flex-col gap-6 p-4 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Button */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 bg-slate-800 border border-white/10 text-slate-300 hover:text-white p-1 rounded-full shadow-lg z-20"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Inspection Session Section */}
      {!collapsed && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2.5 block">
            Inspection Session
          </label>
          <div className="space-y-2">
            <div className="bg-blue-600/10 border border-blue-500/30 p-3 rounded-lg">
              <div className="text-xs text-blue-400 font-semibold font-mono">Lot ID: ASML-7729-QX</div>
              <div className="text-[10px] text-blue-400/70 mt-1 font-mono">Recipe: SEMI-8X-HIGH-RES</div>
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                active
                  ? 'bg-blue-600/20 text-cyan-400 border border-blue-500/30 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2.5 block">
            AI Parameters
          </label>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 text-[11px]">Confidence Threshold</span>
                <span className="text-cyan-400 font-mono text-[11px]">98%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full">
                <div className="w-[98%] h-full bg-cyan-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 text-[11px]">Drift Sensitivity</span>
                <span className="text-cyan-400 font-mono text-[11px]">Auto</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="w-1/3 h-full bg-slate-600"></div>
                <div className="w-1/3 h-full bg-cyan-500"></div>
                <div className="w-1/3 h-full bg-slate-600"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPU Utilization Footer Card */}
      {!collapsed ? (
        <div className="mt-auto p-3 bg-[#1E293B] rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">GPU Utilization</div>
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
