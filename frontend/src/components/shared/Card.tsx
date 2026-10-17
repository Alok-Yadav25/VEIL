import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  badge,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm p-5 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer hover:shadow-md' : ''
      } ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              {title && <h3 className="font-semibold text-slate-100 text-base">{title}</h3>}
              {badge && <span>{badge}</span>}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
