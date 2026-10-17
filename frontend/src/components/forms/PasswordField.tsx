import React, { useState, useId } from 'react';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChange,
  label = 'Encryption Password',
  placeholder = 'Enter strong password (used to derive AES-256 key)',
  showStrength = true,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();

  // Evaluate password strength
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {value && showStrength && (
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            {strength.score >= 3 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            Strength: <span className={strength.score >= 3 ? 'text-emerald-400' : 'text-amber-400'}>{strength.label}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="new-password"
          className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-950/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-brand-violet transition-colors disabled:opacity-50"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {showStrength && value && (
        <div className="space-y-2 pt-1">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                strength.score >= 1 ? strength.color : 'bg-transparent'
              }`}
              style={{ width: '33.3%' }}
            />
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                strength.score >= 2 ? strength.color : 'bg-transparent'
              }`}
              style={{ width: '33.3%' }}
            />
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                strength.score >= 3 ? strength.color : 'bg-transparent'
              }`}
              style={{ width: '33.3%' }}
            />
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-tight">
              VEIL derives a 256-bit AES key using PBKDF2 with 100,000 iterations. If forgotten, your password cannot be recovered or reset by anyone.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
