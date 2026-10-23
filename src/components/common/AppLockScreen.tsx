import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, ShieldCheck, Delete, ArrowRight } from 'lucide-react';

export const AppLockScreen: React.FC = () => {
  const { unlockApp } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleUnlock = async () => {
    if (!pin) {
      setError('Please enter your passcode');
      return;
    }
    setIsSubmitting(true);
    const success = await unlockApp(pin);
    setIsSubmitting(false);
    if (!success) {
      setError('Incorrect passcode. Try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950 p-4 text-white">
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/50">
          <Lock className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight">PocketLedger Locked</h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your security passcode to access your offline ledger
        </p>

        {/* PIN Dots */}
        <div className="my-6 flex items-center space-x-3">
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <div
              key={idx}
              className={`h-3 w-3 rounded-full transition-all ${
                idx < pin.length
                  ? 'bg-emerald-400 scale-125'
                  : 'bg-navy-800 border border-navy-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-xs font-semibold text-rose-400 animate-bounce">
            {error}
          </p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-navy-900 border border-navy-800 text-lg font-semibold text-white shadow-sm hover:bg-navy-800 active:scale-90 transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleDelete}
            aria-label="Delete"
            className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-navy-900/50 text-slate-400 hover:text-white active:scale-90 transition-all"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-navy-900 border border-navy-800 text-lg font-semibold text-white shadow-sm hover:bg-navy-800 active:scale-90 transition-all"
          >
            0
          </button>
          <button
            onClick={handleUnlock}
            disabled={isSubmitting || pin.length === 0}
            aria-label="Unlock"
            className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md hover:bg-emerald-500 disabled:opacity-40 active:scale-90 transition-all"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex items-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Local passcode check. Data never leaves your device.</span>
        </div>
      </div>
    </div>
  );
};
