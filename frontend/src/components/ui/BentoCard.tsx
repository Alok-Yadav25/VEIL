import React from 'react';
import clsx from 'clsx';

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  specularTop?: boolean;
  glow?: 'none' | 'violet' | 'cyan' | 'amber';
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  specularTop = true,
  glow = 'none',
  ...props
}) => {
  const glowClasses = {
    none: '',
    violet: 'shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]',
    cyan: 'shadow-[0_0_30px_-5px_rgba(34,211,238,0.12)]',
    amber: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.12)]',
  }[glow];

  return (
    <div
      className={clsx(
        'relative bg-[#11141C]/90 backdrop-blur-xl rounded-2xl border border-[#1E2330] p-5 transition-all duration-200',
        specularTop && 'specular-border-top',
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
