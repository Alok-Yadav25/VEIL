import React from 'react';

export interface VeilLogoProps {
  variant?: 'full' | 'emblem' | 'banner' | 'vector';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const VeilVectorSymbol: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5',
  size = 20,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Concealed overlapping planes with central signal */}
    <path
      d="M12 2.5L3.5 7.5L12 12.5L20.5 7.5L12 2.5Z"
      stroke="#F4F5F7"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 12L12 17L20.5 12"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 16.5L12 21.5L20.5 16.5"
      stroke="#67E8F9"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.75"
    />
    <circle cx="12" cy="12" r="1.5" fill="#67E8F9" />
  </svg>
);

export const VeilLogo: React.FC<VeilLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  glow = false,
}) => {
  const sizeClasses = {
    xs: variant === 'emblem' ? 'h-5 w-auto' : 'h-4 w-auto',
    sm: variant === 'emblem' ? 'h-7 w-auto' : 'h-6 w-auto',
    md: variant === 'emblem' ? 'h-9 w-auto' : 'h-8 w-auto',
    lg: variant === 'emblem' ? 'h-12 w-auto' : 'h-10 w-auto',
    xl: variant === 'emblem' ? 'h-16 w-auto' : 'h-14 w-auto',
  };

  if (variant === 'vector') {
    const vectorSizes = { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 };
    return <VeilVectorSymbol size={vectorSizes[size]} className={className} />;
  }

  const imageSrc =
    variant === 'emblem'
      ? '/veil-emblem.png'
      : variant === 'banner'
      ? '/veil-brand-banner.jpg'
      : '/veil-logo.png';

  const altText = variant === 'emblem' ? 'VEIL Emblem' : 'VEIL — Private Steganography';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 via-cyan-500/20 to-amber-500/20 blur-xl rounded-full pointer-events-none transform scale-125" />
      )}
      <img
        src={imageSrc}
        alt={altText}
        className={`${sizeClasses[size]} object-contain relative z-10 transition-transform duration-200`}
        draggable={false}
      />
    </div>
  );
};

export const VeilEmblem: React.FC<Omit<VeilLogoProps, 'variant'>> = (props) => {
  return <VeilLogo {...props} variant="emblem" />;
};
