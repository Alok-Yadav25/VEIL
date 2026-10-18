import React from 'react';
import { CheckCircle2, Loader2, CircleDot } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface ExecutionStepperProps {
  currentStep: number; // 1 to 4
  operationType?: 'ENCODE' | 'EXTRACT';
  className?: string;
}

export const ExecutionStepper: React.FC<ExecutionStepperProps> = ({
  currentStep,
  operationType = 'ENCODE',
  className,
}) => {
  const encodeSteps = [
    { num: '01', title: 'Validating carrier geometry & lossless integrity' },
    { num: '02', title: 'Deriving key via Argon2id & sealing AES-GCM envelope' },
    { num: '03', title: 'Scattering ciphertext across carrier LSB planes' },
    { num: '04', title: 'Verifying recoverability & computing PSNR metrics' },
  ];

  const extractSteps = [
    { num: '01', title: 'Inspecting carrier bitplanes & bootstrap header' },
    { num: '02', title: 'Deriving cryptographic keys via Argon2id' },
    { num: '03', title: 'Extracting scattered ciphertext & verifying AAD framing' },
    { num: '04', title: 'Decrypting payload & deserializing file structure' },
  ];

  const steps = operationType === 'ENCODE' ? encodeSteps : extractSteps;

  return (
    <div
      className={clsx(
        'w-full bg-[#0C0E14]/95 backdrop-blur-xl border border-[#1E2330] rounded-2xl p-5 shadow-2xl relative overflow-hidden',
        className
      )}
    >
      {/* Top Shimmer Loading Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-violet-500 w-1/3"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2330]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono font-medium text-slate-200 uppercase tracking-wider">
            Cryptographic Pipeline In Progress
          </span>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          Step {Math.min(currentStep, 4)} of 4
        </span>
      </div>

      <div className="space-y-3 font-mono">
        {steps.map((step, idx) => {
          const stepIndex = idx + 1;
          const isDone = currentStep > stepIndex;
          const isCurrent = currentStep === stepIndex;
          const isPending = currentStep < stepIndex;

          return (
            <div
              key={step.num}
              className={clsx(
                'flex items-center gap-3 p-2.5 rounded-xl border transition-colors text-xs',
                isDone
                  ? 'bg-emerald-950/15 border-emerald-500/25 text-emerald-300'
                  : isCurrent
                  ? 'bg-cyan-950/20 border-cyan-500/35 text-cyan-200'
                  : 'bg-white/[0.02] border-transparent text-slate-500'
              )}
            >
              <div className="shrink-0 flex items-center justify-center w-5 h-5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <CircleDot className="w-4 h-4 text-cyan-400 animate-pulse" />
                ) : (
                  <span className="text-[11px] text-slate-600 font-bold">{step.num}</span>
                )}
              </div>

              <div className="flex-1 truncate">
                <span className={clsx(isCurrent && 'font-semibold text-slate-100')}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
