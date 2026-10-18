import React from 'react';
import clsx from 'clsx';

export type PillVariant =
  | 'optimal'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'violet'
  | 'cyan'
  | 'amber';

interface PillBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: PillVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className,
  ...props
}) => {
  const variantStyles: Record<PillVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    optimal: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      dotColor: 'bg-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      dotColor: 'bg-amber-400',
    },
    error: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      dotColor: 'bg-rose-400',
    },
    neutral: {
      bg: 'bg-white/[0.04]',
      text: 'text-slate-300',
      border: 'border-white/[0.08]',
      dotColor: 'bg-slate-400',
    },
    violet: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-300',
      border: 'border-violet-500/25',
      dotColor: 'bg-violet-400',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-300',
      border: 'border-cyan-500/25',
      dotColor: 'bg-cyan-400',
    },
    amber: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/25',
      dotColor: 'bg-orange-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors',
        style.bg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      {...props}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', style.dotColor)} />
      )}
      {children}
    </span>
  );
};
