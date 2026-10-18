import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedTabsProps<T extends string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={clsx(
        'inline-flex items-center bg-[#0C0E14] border border-[#1E2330] rounded-xl p-1 relative',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative z-10 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm',
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="segmentedTabActivePill"
                className="absolute inset-0 bg-[#1E2330] rounded-lg -z-10 shadow-sm border border-white/10"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
