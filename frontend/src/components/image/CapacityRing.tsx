import React from 'react';

interface CapacityRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const CapacityRing: React.FC<CapacityRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  let colorClass = 'stroke-emerald-500 text-emerald-400';
  let badgeText = 'Sufficient';

  if (percentage > 100) {
    colorClass = 'stroke-red-500 text-red-400';
    badgeText = 'Exceeded';
  } else if (percentage >= 80) {
    colorClass = 'stroke-amber-500 text-amber-400';
    badgeText = 'Near Limit';
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] transition-all duration-500 ease-out"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`${colorClass} transition-all duration-700 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-xl font-bold font-mono text-slate-100">
            {percentage.toFixed(1)}%
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 text-slate-400">
            {badgeText}
          </span>
        </div>
      </div>

      {(label || sublabel) && (
        <div className="text-center mt-3">
          {label && <p className="text-xs font-semibold text-slate-200">{label}</p>}
          {sublabel && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{sublabel}</p>}
        </div>
      )}
    </div>
  );
};
