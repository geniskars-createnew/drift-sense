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
    blue: 'hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]',
    cyan: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    emerald: 'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    amber: 'hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    purple: 'hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative bg-[#1E293B]/80 backdrop-blur-md border border-white/10 rounded-xl p-5 transition-all duration-300 ${
        glow ? glowStyles[glowColor] : ''
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
