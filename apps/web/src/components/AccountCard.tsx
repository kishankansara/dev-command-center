'use client';

import React, { useState } from 'react';
import { Account } from '@dev-command-center/shared-types';
import {
  Mail,
  Shield,
  Key,
  Copy,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CornerDownRight,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useCrypto } from '@/context/CryptoContext';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onOpenPassphraseModal: () => void;
}

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onOpenPassphraseModal,
}: AccountCardProps) {
  const { copyToClipboard, toast } = useToast();
  const { isUnlocked, decrypt } = useCrypto();

  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleRevealPassword = async () => {
    if (!account.encrypted_password) return;
    if (!isUnlocked) {
      toast('Unlock vault to decrypt password with master passphrase', 'info');
      onOpenPassphraseModal();
      return;
    }

    if (decryptedPassword) {
      setShowPassword(!showPassword);
      return;
    }

    setIsDecrypting(true);
    try {
      const plaintext = await decrypt(account.encrypted_password);
      setDecryptedPassword(plaintext);
      setShowPassword(true);
    } catch {
      toast('Decryption failed: check your master passphrase', 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleRevealNotes = async () => {
    if (!account.encrypted_notes) return;
    if (!isUnlocked) {
      toast('Unlock vault to decrypt notes/tokens with master passphrase', 'info');
      onOpenPassphraseModal();
      return;
    }

    if (decryptedNotes) {
      setShowNotes(!showNotes);
      return;
    }

    setIsDecrypting(true);
    try {
      const plaintext = await decrypt(account.encrypted_notes);
      setDecryptedNotes(plaintext);
      setShowNotes(true);
    } catch {
      toast('Decryption failed: check your master passphrase', 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopySecret = async (ciphertext: string | null, cachedPlaintext: string | null, label: string) => {
    if (!ciphertext) return;
    if (!isUnlocked) {
      onOpenPassphraseModal();
      return;
    }

    try {
      const textToCopy = cachedPlaintext || (await decrypt(ciphertext));
      await copyToClipboard(textToCopy, label);
    } catch {
      toast(`Failed to decrypt and copy ${label}`, 'error');
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-command-border transition-all duration-200 hover:border-command-border-active flex flex-col">
      {/* Top Header */}
      <div className="p-5 pb-4 border-b border-command-border flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-slate-100 truncate">{account.email}</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-command-900 border border-command-border text-slate-300">
              {account.provider}
            </span>
          </div>
          {account.purpose && (
            <p className="text-xs text-slate-400 leading-relaxed">{account.purpose}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => copyToClipboard(account.email, 'Email address')}
            className="p-1.5 rounded-lg bg-command-900 hover:bg-command-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy email address"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg bg-command-900 hover:bg-command-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Edit account"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="p-1.5 rounded-lg bg-command-900 hover:bg-rose-950/70 hover:text-rose-400 text-slate-400 transition-colors"
            title="Delete account"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-5 space-y-4 flex-1">
        {/* Recovery Linkage (FR-ACC-03) */}
        {account.recovery_email && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-command-950 border border-command-border text-xs">
            <CornerDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5 text-slate-400 truncate flex-1">
              <span>Parent Recovery Email:</span>
              <span className="font-mono text-slate-200 truncate">{account.recovery_email}</span>
            </div>
            <button
              onClick={() => copyToClipboard(account.recovery_email || '', 'Recovery Email')}
              className="p-1 rounded text-slate-400 hover:text-slate-200 shrink-0"
              title="Copy recovery email"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Zero-Knowledge Credential Vault Details (FR-ACC-02) */}
        <div className="p-3.5 rounded-xl bg-command-950/80 border border-command-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span>ZERO-KNOWLEDGE VAULT</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              AES-GCM-256
            </span>
          </div>

          {/* Password field */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Vault Password:</span>
            {account.encrypted_password ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-300">
                  {showPassword && decryptedPassword
                    ? decryptedPassword
                    : '••••••••••••'}
                </span>
                <button
                  onClick={handleRevealPassword}
                  className="p-1 rounded hover:bg-command-900 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Hide password' : 'Reveal password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleCopySecret(account.encrypted_password, decryptedPassword, 'Password')}
                  className="p-1 rounded hover:bg-command-900 text-slate-400 hover:text-slate-200"
                  title="Copy decrypted password to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-slate-500 italic text-[11px]">Not set</span>
            )}
          </div>

          {/* SMTP / 2FA Notes field */}
          <div className="flex items-start justify-between text-xs font-mono pt-1 border-t border-command-border/40">
            <span className="text-slate-400 text-[11px] pt-1">Tokens / 2FA:</span>
            {account.encrypted_notes ? (
              <div className="flex flex-col items-end gap-1 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Encrypted Payload</span>
                  <button
                    onClick={handleRevealNotes}
                    className="p-1 rounded hover:bg-command-900 text-slate-400 hover:text-slate-200"
                    title={showNotes ? 'Hide tokens' : 'Reveal tokens'}
                  >
                    {showNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleCopySecret(account.encrypted_notes, decryptedNotes, 'SMTP Tokens')}
                    className="p-1 rounded hover:bg-command-900 text-slate-400 hover:text-slate-200"
                    title="Copy decrypted tokens"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {showNotes && decryptedNotes && (
                  <pre className="p-2 bg-command-900 rounded-lg text-[11px] text-emerald-300 overflow-x-auto w-full max-h-24 whitespace-pre">
                    {decryptedNotes}
                  </pre>
                )}
              </div>
            ) : (
              <span className="text-slate-500 italic text-[11px] pt-1">None stored</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
