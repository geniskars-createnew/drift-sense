import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlayCircle, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Upload Images', path: '/upload' },
    { name: 'Drift Simulator', path: '/simulator' },
    { name: 'AI Prediction', path: '/prediction' },
    { name: 'Performance', path: '/performance' },
    { name: 'Classical Matrix', path: '/comparison' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-[#1b2844] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Custom Wafer Reticle SVG */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[#10192d] border border-cyan-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.25)] group-hover:border-cyan-400 transition-all duration-300">
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                {/* 300mm Wafer with Notch */}
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeDasharray="50 4" />
                {/* Crosshair / Reticle */}
                <line x1="12" y1="5" x2="12" y2="8" stroke="#00e5ff" strokeWidth="1.5" />
                <line x1="12" y1="16" x2="12" y2="19" stroke="#00e5ff" strokeWidth="1.5" />
                <line x1="5" y1="12" x2="8" y2="12" stroke="#00e5ff" strokeWidth="1.5" />
                <line x1="16" y1="12" x2="19" y2="12" stroke="#00e5ff" strokeWidth="1.5" />
                {/* Center Die Focus */}
                <rect x="10" y="10" width="4" height="4" fill="#00e5ff" fillOpacity="0.4" stroke="#00e5ff" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-slate-100 font-heading">
                DRIFT-SENSE
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded tracking-normal">
                  v2.4
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium">
            {navLinks.slice(0, 7).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-all duration-150 py-1 px-2 rounded ${
                  isActive(link.path)
                    ? 'text-cyan-300 font-semibold bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Status & Profile Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cleanroom Fab Interlock Status Indicator */}
            <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono rounded flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span>System Online</span>
            </div>

            <Link
              to="/prediction"
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded shadow-[0_0_12px_rgba(0,229,255,0.3)] transition-all duration-200"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Live AI Demo
            </Link>

            <div className="w-7 h-7 rounded bg-[#131c33] border border-[#2b3d63] flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300 shadow-inner">
              JD
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0c1222] border-b border-[#1b2844] px-4 pt-2 pb-4 space-y-1 font-mono">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded text-xs font-medium ${
                isActive(link.path)
                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <Link
              to="/prediction"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-cyan-500 text-slate-950 py-2 rounded font-bold text-xs"
            >
              Launch Prediction Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
