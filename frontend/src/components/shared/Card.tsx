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
      className={`rounded-xl border dark:border-slate-800/80 border-slate-200 dark:bg-slate-900/60 bg-white backdrop-blur-sm p-5 shadow-sm transition-all duration-200 ${
        hoverable ? 'dark:hover:border-slate-700 hover:border-slate-300 dark:hover:bg-slate-900/80 hover:bg-slate-50/80 cursor-pointer hover:shadow-md' : ''
      } ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b dark:border-slate-800/60 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              {title && <h3 className="font-semibold dark:text-slate-100 text-slate-900 text-base">{title}</h3>}
              {badge && <span>{badge}</span>}
            </div>
            {subtitle && <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
