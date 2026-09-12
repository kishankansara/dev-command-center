'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Key, Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock, X } from 'lucide-react';
import { TestCredentialItem } from '@dev-command-center/shared-types';
import { useCrypto } from '@/context/CryptoContext';
import { useToast } from '@/context/ToastContext';

interface CredentialVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  encryptedCredentials: string | null;
  onSave: (newCiphertext: string | null) => Promise<void>;
  onOpenPassphraseModal: () => void;
}

export function CredentialVaultModal({
  isOpen,
  onClose,
  projectName,
  encryptedCredentials,
  onSave,
  onOpenPassphraseModal,
}: CredentialVaultModalProps) {
  const { isUnlocked, encrypt, decrypt } = useCrypto();
  const { toast, copyToClipboard } = useToast();

  const [items, setItems] = useState<TestCredentialItem[]>([]);
  const [decryptedRaw, setDecryptedRaw] = useState<string>('');
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  // New credential input state
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDecryptionError(null);
      return;
    }

    const loadCredentials = async () => {
      if (!encryptedCredentials) {
        setItems([]);
        setDecryptionError(null);
        return;
      }
      if (!isUnlocked) {
        setDecryptionError(null);
        return;
      }

      setIsDecrypting(true);
      setDecryptionError(null);
      try {
        const plaintext = await decrypt(encryptedCredentials);
        setDecryptedRaw(plaintext);
        try {
          const parsed = JSON.parse(plaintext);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          } else {
            setItems([{ id: '1', label: 'Secret Credential', value: plaintext }]);
          }
        } catch {
          setItems([{ id: '1', label: 'Legacy Secret', value: plaintext }]);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown decryption error';
        console.error('CredentialVaultModal decryption error:', err);
        setDecryptionError(errMsg);
        toast('Failed to decrypt credentials. Verify your master passphrase.', 'error');
      } finally {
        setIsDecrypting(false);
      }
    };

    loadCredentials();
  }, [isOpen, encryptedCredentials, isUnlocked, decrypt, toast]);

  if (!isOpen) return null;

  const toggleVisibility = (id: string) => {
    setVisibleValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCredential = () => {
    if (!newLabel.trim() || !newValue.trim()) {
      toast('Please provide both label and value', 'error');
      return;
    }

    const newItem: TestCredentialItem = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      value: newValue.trim(),
      notes: newNotes.trim() || undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setNewLabel('');
    setNewValue('');
    setNewNotes('');
  };

  const handleDeleteCredential = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveToVault = async () => {
    if (!isUnlocked) {
      onOpenPassphraseModal();
      return;
    }

    setIsSaving(true);
    try {
      if (items.length === 0) {
        await onSave(null);
        toast('Test credentials cleared from vault', 'info');
      } else {
        const jsonString = JSON.stringify(items);
        const ciphertext = await encrypt(jsonString);
        await onSave(ciphertext);
        toast('Encrypted with AES-256-GCM and saved to cloud!', 'success');
      }
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to encrypt or save credentials';
      console.error('Save credentials error:', err);
      toast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-command-900 border border-command-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-command-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Encrypted Test Credentials Vault
              </h3>
              <p className="text-xs text-slate-400">
                Target: <span className="text-emerald-400 font-mono">{projectName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-command-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Lock/Unlock Banner */}
          {!isUnlocked ? (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-200">Vault Currently Locked</h4>
                  <p className="text-xs text-amber-400/80">
                    Master passphrase is required to decrypt or store AES-256-GCM credentials.
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenPassphraseModal}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all"
              >
                Unlock Now
              </button>
            </div>
          ) : isDecrypting ? (
            <div className="py-8 text-center text-slate-400 font-mono text-sm animate-pulse">
              Decrypting zero-knowledge payload with AES-256-GCM...
            </div>
          ) : decryptionError ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-semibold text-rose-200">
                    {decryptionError.toLowerCase().includes('importkey') || decryptionError.toLowerCase().includes('subtle')
                      ? 'Mobile Browser Security Restriction (Insecure Context)'
                      : 'Decryption Failed'}
                  </h4>
                  {decryptionError.toLowerCase().includes('importkey') || decryptionError.toLowerCase().includes('subtle') ? (
                    <div className="text-xs text-rose-200/90 leading-relaxed space-y-2">
                      <p>
                        Your phone browser disables the <strong>Web Cryptography API (<code className="text-rose-300 font-mono">crypto.subtle</code>)</strong> over plain HTTP LAN addresses (<code className="text-rose-300 font-mono">http://10.67.176.177:3000</code>).
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-rose-500/30 text-[11px] font-mono text-slate-300 space-y-1">
                        <div className="text-amber-300 font-semibold">How to enable on Android Chrome:</div>
                        <div>1. Open <span className="text-cyan-300">chrome://flags/#unsafely-treat-insecure-origin-as-secure</span></div>
                        <div>2. Add <span className="text-emerald-300">http://10.67.176.177:3000</span></div>
                        <div>3. Set dropdown to <strong>Enabled</strong> and tap <strong>Relaunch</strong>.</div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Or test on your laptop at <code className="text-emerald-400 font-mono">http://localhost:3000</code> where browsers automatically permit Web Crypto.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-300/80 leading-relaxed">
                      This project has encrypted credentials stored, but they could not be decrypted.
                      This usually means the entered Master Passphrase does not match the one used to encrypt them.
                    </p>
                  )}
                  <p className="text-[11px] font-mono text-rose-400/70 pt-1">
                    Error detail: {decryptionError}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={onOpenPassphraseModal}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                >
                  Change / Re-enter Passphrase
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Credential List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>ACTIVE CREDENTIALS ({items.length})</span>
                  <span className="text-emerald-400">AES-GCM Authenticated</span>
                </div>

                {items.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs font-mono border border-dashed border-command-border rounded-xl">
                    {encryptedCredentials ? 'Decrypting credentials...' : 'No credentials stored in this project vault yet.'}
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-command-950 border border-command-border rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200">{item.label}</span>
                          {item.notes && (
                            <span className="text-[10px] text-slate-400 bg-command-900 px-1.5 py-0.5 rounded border border-command-border">
                              {item.notes}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-emerald-400 truncate">
                          {visibleValues[item.id] ? item.value : '••••••••••••••••••••••••'}
                        </div>
                      </div>

                      {/* Action buttons with single-touch copy */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleVisibility(item.id)}
                          className="p-1.5 rounded-lg bg-command-900 hover:bg-command-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title={visibleValues[item.id] ? 'Hide' : 'Reveal'}
                        >
                          {visibleValues[item.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.value, item.label)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-command-900 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-300 text-xs font-medium border border-command-border transition-all"
                          title="Copy credential value to clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(item.id)}
                          className="p-1.5 rounded-lg bg-command-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition-colors"
                          title="Remove credential"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Credential Form */}
              <div className="p-4 bg-command-950 border border-command-border rounded-xl space-y-3">
                <h5 className="text-xs font-mono font-medium text-slate-300">
                  ADD NEW CREDENTIAL ITEM
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. Stripe Dev Key, Admin API)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="px-3 py-2 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Credential Secret Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="px-3 py-2 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional Notes / Environment (e.g. Sandbox only)"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="flex-1 px-3 py-2 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCredential}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-command-800 hover:bg-command-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-command-border bg-command-950 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            Ciphertext is committed directly to Supabase with zero server access
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToVault}
              disabled={isSaving || !isUnlocked}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>{isSaving ? 'Encrypting...' : 'Save & Encrypt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
