import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'purple';
  onClick?: () => void;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = false,
  glowColor = 'cyan',
  onClick,
  id,
}) => {
  const glowStyles = {
    blue: 'hover:border-cyan-500/60 hover:shadow-[0_0_24px_rgba(0,229,255,0.2)]',
    cyan: 'hover:border-cyan-400/70 hover:shadow-[0_0_24px_rgba(0,229,255,0.25)]',
    emerald: 'hover:border-emerald-500/60 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
    amber: 'hover:border-amber-400/70 hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]',
    purple: 'hover:border-indigo-400/60 hover:shadow-[0_0_24px_rgba(99,102,241,0.25)]',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative bg-[#0d1424]/90 backdrop-blur-md border border-[#20304f] rounded-lg p-5 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.35)] ${
        glow ? glowStyles[glowColor] : ''
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#38517e]' : ''} ${className}`}
    >
      {/* Precision corner accent dots */}
      <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-cyan-400/30 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-cyan-400/30 pointer-events-none" />
      {children}
    </div>
  );
};
