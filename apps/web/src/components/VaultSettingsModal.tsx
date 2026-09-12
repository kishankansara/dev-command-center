'use client';

import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Eye, EyeOff, X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useCrypto } from '@/context/CryptoContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

interface VaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VaultSettingsModal({ isOpen, onClose }: VaultSettingsModalProps) {
  const { changePassphrase, isVaultSetup, setupVault } = useCrypto();
  const { accounts, projects } = useData();
  const { toast } = useToast();

  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const oldTrimmed = currentPassphrase.trim();
    const newTrimmed = newPassphrase.trim();
    const confirmTrimmed = confirmNewPassphrase.trim();

    if (isVaultSetup && !oldTrimmed) {
      setErrorMessage('Please enter your current master passphrase');
      return;
    }

    if (!newTrimmed) {
      setErrorMessage('Please enter a new master passphrase');
      return;
    }

    if (newTrimmed.length < 8) {
      setErrorMessage('New master passphrase must be at least 8 characters');
      return;
    }

    if (newTrimmed !== confirmTrimmed) {
      setErrorMessage('New passphrases do not match. Please re-confirm.');
      return;
    }

    if (isVaultSetup && oldTrimmed === newTrimmed) {
      setErrorMessage('New passphrase must be different from current passphrase.');
      return;
    }

    setIsSubmitting(true);
    setProgressStatus('Initiating cryptographic re-encryption...');

    try {
      if (!isVaultSetup && !oldTrimmed) {
        // Direct initial setup
        await setupVault(newTrimmed);
      } else {
        await changePassphrase(oldTrimmed || newTrimmed, newTrimmed, {
          accounts,
          projects,
          onProgress: (step) => {
            setProgressStatus(step);
          },
        });
      }

      toast('Master passphrase updated & zero-knowledge vault secured!', 'success');
      setCurrentPassphrase('');
      setNewPassphrase('');
      setConfirmNewPassphrase('');
      setProgressStatus(null);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change master passphrase';
      setErrorMessage(msg);
      setProgressStatus(null);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-command-900 border border-command-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Vault Security Settings
                </h3>
                <p className="text-xs text-slate-400">Change Master Passphrase & Re-Encrypt</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-command-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-command-950/60 border border-command-border text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Multi-Tenant Zero-Knowledge Re-Encryption</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Changing your master passphrase will decrypt all existing accounts and test credentials in client memory, derive a new PBKDF2 key with a fresh salt, and re-encrypt every secret before committing to Supabase.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Status */}
          {progressStatus && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 animate-pulse">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <span>{progressStatus}</span>
            </div>
          )}

          {!isVaultSetup && (
            <div className="mt-4 p-3 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200">
              Your vault has not been initialized yet. You can set up your Master Passphrase below. If you previously had encrypted data, entering your old passphrase will decrypt and re-encrypt it under your new canary.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                {isVaultSetup ? 'CURRENT MASTER PASSPHRASE' : 'EXISTING PASSPHRASE (OPTIONAL IF INITIALIZING)'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassphrase}
                  onChange={(e) => {
                    setCurrentPassphrase(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  placeholder={isVaultSetup ? 'Enter current master passphrase...' : 'Enter existing passphrase if migrating data, or leave blank'}
                  autoFocus={isVaultSetup}
                  className="w-full pl-3 pr-10 py-2.5 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 font-mono transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                NEW MASTER PASSPHRASE
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassphrase}
                  onChange={(e) => {
                    setNewPassphrase(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="New strong passphrase (min 8 chars)..."
                  className="w-full pl-3 pr-10 py-2.5 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 font-mono transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                CONFIRM NEW MASTER PASSPHRASE
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmNewPassphrase}
                  onChange={(e) => {
                    setConfirmNewPassphrase(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Confirm new master passphrase..."
                  className="w-full pl-3 pr-10 py-2.5 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 font-mono transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-command-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'Re-Encrypting...' : 'Update & Re-Encrypt'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
