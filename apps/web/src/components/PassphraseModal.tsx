'use client';

import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Eye, EyeOff, X, AlertTriangle } from 'lucide-react';
import { useCrypto } from '@/context/CryptoContext';
import { useToast } from '@/context/ToastContext';

interface PassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PassphraseModal({ isOpen, onClose }: PassphraseModalProps) {
  const { unlockVault, isUnlocked } = useCrypto();
  const { toast } = useToast();
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      toast('Please enter your master passphrase', 'error');
      return;
    }
    if (passphrase.length < 8) {
      toast('Master passphrase should be at least 8 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      unlockVault(passphrase.trim());
      toast('Zero-Knowledge Vault unlocked in memory', 'success');
      setPassphrase('');
      onClose();
    } catch {
      toast('Failed to initialize cryptographic vault', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-command-900 border border-command-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {isUnlocked ? 'Update Master Passphrase' : 'Unlock Zero-Knowledge Vault'}
                </h3>
                <p className="text-xs text-slate-400">Client-Side PBKDF2 & AES-GCM-256</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-command-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-command-950/60 border border-command-border text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Security Invariant</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Your master passphrase is never transmitted over the network or saved to disk. It is stored exclusively in transient volatile heap memory.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                MASTER ENCRYPTION PASSPHRASE
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your master secret passphrase..."
                  autoFocus
                  className="w-full pl-3 pr-10 py-2.5 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-command-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isUnlocked ? 'Update Passphrase' : 'Unlock Vault'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
