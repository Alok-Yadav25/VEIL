import React, { useState } from 'react';
import { PasswordField } from '../forms/PasswordField';
import { KeyRound, ShieldCheck, Cpu } from 'lucide-react';
import clsx from 'clsx';

export interface CryptoKeyPanelProps {
  password: string;
  onPasswordChange: (val: string) => void;
  confirmPassword?: string;
  onConfirmPasswordChange?: (val: string) => void;
  showConfirmation?: boolean;
  className?: string;
}

export const CryptoKeyPanel: React.FC<CryptoKeyPanelProps> = ({
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showConfirmation = false,
  className,
}) => {
  const isMatch = !showConfirmation || (password.length > 0 && password === confirmPassword);

  return (
    <div className={clsx('bg-[#0C0E14] border border-[#1E2330] rounded-xl p-4 space-y-3.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Passphrase & Key Derivation</span>
        </span>
        <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span>Argon2id · 19 MiB RAM</span>
        </span>
      </div>

      <PasswordField
        value={password}
        onChange={onPasswordChange}
        label="Encryption Passphrase"
        placeholder="Enter strong password (derives 256-bit AES-GCM key)"
        showStrength={true}
        required
      />

      {showConfirmation && onConfirmPasswordChange && (
        <div className="pt-1">
          <PasswordField
            value={confirmPassword || ''}
            onChange={onConfirmPasswordChange}
            label="Confirm Passphrase"
            placeholder="Re-enter password to verify"
            showStrength={false}
            required
          />
          {confirmPassword && !isMatch && (
            <p className="text-xs font-mono text-rose-400 mt-1">
              Passphrases do not match.
            </p>
          )}
          {confirmPassword && isMatch && (
            <p className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Passphrase confirmed</span>
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] font-mono text-slate-500 leading-relaxed pt-1 border-t border-white/5">
        Zero plaintext passwords stored. Keys are separated via RFC 5869 HKDF to protect cipher integrity.
      </p>
    </div>
  );
};
