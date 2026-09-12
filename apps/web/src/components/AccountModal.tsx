'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Shield, Key, X, Lock, Eye, EyeOff } from 'lucide-react';
import { Account, ServiceProvider } from '@dev-command-center/shared-types';
import { useCrypto } from '@/context/CryptoContext';
import { useToast } from '@/context/ToastContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAccount?: Account | null;
  onSave: (accountData: Partial<Account>) => Promise<void>;
  onOpenPassphraseModal: () => void;
}

const PROVIDERS: ServiceProvider[] = ['Gmail', 'Outlook', 'ProtonMail', 'Zoho', 'Custom'];

export function AccountModal({
  isOpen,
  onClose,
  existingAccount,
  onSave,
  onOpenPassphraseModal,
}: AccountModalProps) {
  const { isUnlocked, encrypt, decrypt } = useCrypto();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState<ServiceProvider>('Gmail');
  const [purpose, setPurpose] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [password, setPassword] = useState('');
  const [smtpNotes, setSmtpNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (existingAccount) {
      setEmail(existingAccount.email);
      setProvider(existingAccount.provider);
      setPurpose(existingAccount.purpose || '');
      setRecoveryEmail(existingAccount.recovery_email || '');

      // Decrypt if password ciphertext exists and vault is unlocked
      if (existingAccount.encrypted_password && isUnlocked) {
        decrypt(existingAccount.encrypted_password)
          .then((plain) => setPassword(plain))
          .catch(() => setPassword(''));
      } else {
        setPassword('');
      }

      if (existingAccount.encrypted_notes && isUnlocked) {
        decrypt(existingAccount.encrypted_notes)
          .then((plain) => setSmtpNotes(plain))
          .catch(() => setSmtpNotes(''));
      } else {
        setSmtpNotes('');
      }
    } else {
      setEmail('');
      setProvider('Gmail');
      setPurpose('');
      setRecoveryEmail('');
      setPassword('');
      setSmtpNotes('');
    }
  }, [isOpen, existingAccount, isUnlocked, decrypt]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast('Please enter an email address', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let encrypted_password: string | null = existingAccount?.encrypted_password || null;
      let encrypted_notes: string | null = existingAccount?.encrypted_notes || null;

      // Encrypt sensitive secrets if provided and vault is open
      if (password.trim()) {
        if (!isUnlocked) {
          toast('Unlock your vault to encrypt passwords with AES-256-GCM', 'error');
          onOpenPassphraseModal();
          setIsSubmitting(false);
          return;
        }
        encrypted_password = await encrypt(password.trim());
      }

      if (smtpNotes.trim()) {
        if (!isUnlocked) {
          toast('Unlock your vault to encrypt notes/tokens with AES-256-GCM', 'error');
          onOpenPassphraseModal();
          setIsSubmitting(false);
          return;
        }
        encrypted_notes = await encrypt(smtpNotes.trim());
      }

      await onSave({
        email: email.trim(),
        provider,
        purpose: purpose.trim() || null,
        recovery_email: recoveryEmail.trim() || null,
        encrypted_password,
        encrypted_notes,
      });

      toast(existingAccount ? 'Account updated!' : 'Account registered in vault!', 'success');
      onClose();
    } catch (err) {
      toast('Failed to save account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-command-900 border border-command-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-command-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {existingAccount ? 'Edit Identity Account' : 'Register Dedicated Email Account'}
              </h3>
              <p className="text-xs text-slate-400">IEEE 830 FR-ACC-01 / FR-ACC-02</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-command-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Email & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                EMAIL ADDRESS *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev.project@example.com"
                className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                PROVIDER
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ServiceProvider)}
                className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Purpose */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
              TARGET PURPOSE & CLOUD ROLES
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Dedicated Vercel + Railway Deployment Owner"
              className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Recovery Email (FR-ACC-03) */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
              PARENT RECOVERY EMAIL (LOCKOUT PREVENTION)
            </label>
            <input
              type="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="primary.secure.recovery@domain.com"
              className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Zero-Knowledge Encrypted Password & 2FA/SMTP Tokens (FR-ACC-02) */}
          <div className="p-4 bg-command-950 border border-command-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>ZERO-KNOWLEDGE ENCRYPTED VAULT FIELDS</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">AES-256-GCM</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                APP-SPECIFIC PASSWORD OR MASTER CREDENTIAL
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isUnlocked
                      ? 'Enter sensitive password or token...'
                      : 'Unlock vault to edit or view plaintext'
                  }
                  disabled={!isUnlocked && Boolean(existingAccount?.encrypted_password)}
                  className="w-full pl-3 pr-10 py-2 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                SMTP TOKENS / 2FA RECOVERY BACKUP CODES
              </label>
              <textarea
                value={smtpNotes}
                onChange={(e) => setSmtpNotes(e.target.value)}
                rows={3}
                placeholder={
                  isUnlocked
                    ? 'Paste app-specific SMTP credentials or 2FA backup codes...'
                    : 'Unlock vault to view/edit'
                }
                disabled={!isUnlocked && Boolean(existingAccount?.encrypted_notes)}
                className="w-full p-2.5 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 resize-none"
              />
            </div>

            {!isUnlocked && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Vault is locked
                </span>
                <button
                  type="button"
                  onClick={onOpenPassphraseModal}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Unlock Vault
                </button>
              </div>
            )}
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving...' : existingAccount ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
