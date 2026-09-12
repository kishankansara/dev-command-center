'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  generateSalt,
  deriveKey,
  encryptData,
  decryptData,
  verifyPassphrase,
  CANARY_PAYLOAD,
} from '@dev-command-center/crypto-core';
import { Account, Project, UserVaultSettings } from '@dev-command-center/shared-types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

interface CryptoContextType {
  isVaultSetup: boolean;
  isUnlocked: boolean;
  masterPassphrase: string | null;
  derivedKey: CryptoKey | null;
  activeSalt: string | null;
  setupVault: (newPassphrase: string) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<void>;
  lockVault: () => void;
  changePassphrase: (
    oldPassphrase: string,
    newPassphrase: string,
    currentRecords: {
      accounts: Account[];
      projects: Project[];
      onProgress?: (step: string) => void;
    }
  ) => Promise<void>;
  encrypt: (plaintext: string) => Promise<string>;
  decrypt: (ciphertext: string) => Promise<string>;
  refreshVaultSettings: () => Promise<void>;
}

const CryptoContext = createContext<CryptoContextType | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [isVaultSetup, setIsVaultSetup] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [activeSalt, setActiveSalt] = useState<string | null>(null);
  const [vaultCanary, setVaultCanary] = useState<string | null>(null);
  const [masterPassphrase, setMasterPassphrase] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dev_command_center_passphrase');
    }
    return null;
  });

  const tenantId = user?.id || 'user-primary-dev';

  // Fetch user vault settings from Supabase or dev-store
  const fetchVaultSettings = useCallback(async () => {
    if (!user) {
      setIsVaultSetup(false);
      setIsUnlocked(false);
      setDerivedKey(null);
      setActiveSalt(null);
      setVaultCanary(null);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('user_vault_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error querying user_vault_settings:', error.message);
        }

        if (data && data.vault_salt && data.vault_canary) {
          setIsVaultSetup(true);
          setActiveSalt(data.vault_salt);
          setVaultCanary(data.vault_canary);
        } else {
          setIsVaultSetup(false);
          setActiveSalt(null);
          setVaultCanary(null);
        }
      } else {
        // Dev / Local Store Mode
        const res = await fetch(`/api/dev-store?entity=vault_settings&tenantId=${tenantId}`)
          .then((r) => r.json())
          .catch(() => null);

        if (res?.data && res.data.vault_salt && res.data.vault_canary) {
          setIsVaultSetup(true);
          setActiveSalt(res.data.vault_salt);
          setVaultCanary(res.data.vault_canary);
        } else {
          setIsVaultSetup(false);
          setActiveSalt(null);
          setVaultCanary(null);
        }
      }
    } catch (err) {
      console.error('Failed to load user vault settings:', err);
      setIsVaultSetup(false);
    }
  }, [user, tenantId]);

  useEffect(() => {
    fetchVaultSettings();
  }, [fetchVaultSettings]);

  // Attempt auto-unlock if passphrase cached in sessionStorage and settings loaded
  useEffect(() => {
    if (isVaultSetup && activeSalt && vaultCanary && masterPassphrase && !isUnlocked && !derivedKey) {
      verifyPassphrase(masterPassphrase, activeSalt, vaultCanary).then((res) => {
        if (res.valid && res.key) {
          setDerivedKey(res.key);
          setIsUnlocked(true);
        } else {
          // If cached passphrase is no longer valid, purge it
          setMasterPassphrase(null);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('dev_command_center_passphrase');
          }
        }
      }).catch(() => {});
    }
  }, [isVaultSetup, activeSalt, vaultCanary, masterPassphrase, isUnlocked, derivedKey]);

  // Setup Vault for first-time user
  const setupVault = useCallback(async (newPassphrase: string) => {
    if (!user) {
      throw new Error('Authenticated user session required to set up vault.');
    }
    if (!newPassphrase || newPassphrase.length < 8) {
      throw new Error('Master passphrase must be at least 8 characters.');
    }

    const salt = generateSalt();
    const key = await deriveKey(newPassphrase, salt);
    const canary = await encryptData(CANARY_PAYLOAD, key);

    const vaultSettings: UserVaultSettings = {
      user_id: user.id,
      vault_salt: salt,
      vault_canary: canary,
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('user_vault_settings')
        .upsert(vaultSettings, { onConflict: 'user_id' });

      if (error) {
        console.error('Failed to insert user_vault_settings:', error.message);
        throw new Error(`Failed to save vault settings: ${error.message}`);
      }
    } else {
      await fetch('/api/dev-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'vault_settings', tenantId, data: vaultSettings }),
      });
    }

    setActiveSalt(salt);
    setVaultCanary(canary);
    setDerivedKey(key);
    setMasterPassphrase(newPassphrase);
    setIsVaultSetup(true);
    setIsUnlocked(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dev_command_center_passphrase', newPassphrase);
    }
  }, [user, tenantId]);

  // Unlock Vault with client-side canary verification
  const unlockVault = useCallback(async (passphrase: string) => {
    if (!activeSalt || !vaultCanary) {
      throw new Error('Vault settings not initialized.');
    }

    const result = await verifyPassphrase(passphrase, activeSalt, vaultCanary);
    if (!result.valid || !result.key) {
      throw new Error('Invalid master passphrase');
    }

    setDerivedKey(result.key);
    setMasterPassphrase(passphrase);
    setIsUnlocked(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dev_command_center_passphrase', passphrase);
    }
  }, [activeSalt, vaultCanary]);

  // Lock Vault: securely wipes derived key and passphrase from volatile memory
  const lockVault = useCallback(() => {
    setDerivedKey(null);
    setMasterPassphrase(null);
    setIsUnlocked(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dev_command_center_passphrase');
    }
  }, []);

  // Auto-lock vault after 15 minutes of inactivity
  useEffect(() => {
    if (!isUnlocked) return;

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lockVault();
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [isUnlocked, lockVault]);

  // Change master passphrase & re-encrypt all stored secrets
  const changePassphrase = useCallback(async (
    oldPassphrase: string,
    newPassphrase: string,
    currentRecords: {
      accounts: Account[];
      projects: Project[];
      onProgress?: (step: string) => void;
    }
  ) => {
    if (!user) throw new Error('Authenticated user session required.');
    if (!newPassphrase || newPassphrase.length < 8) {
      throw new Error('New master passphrase must be at least 8 characters.');
    }

    const progress = currentRecords.onProgress || (() => {});

    // If vault settings were never saved for this user, check if we can migrate/initialize
    let currentSalt = activeSalt;
    let currentCanary = vaultCanary;
    let oldKey: CryptoKey;

    if (!currentSalt || !currentCanary) {
      // Legacy or fresh vault: derive key directly from oldPassphrase with a temporary salt or test decrypt
      progress('Initializing zero-knowledge vault verification parameters...');
      currentSalt = generateSalt();
      oldKey = await deriveKey(oldPassphrase, currentSalt);
    } else {
      // Step 1: Verify old passphrase against existing canary
      progress('Verifying current master passphrase...');
      const verification = await verifyPassphrase(oldPassphrase, currentSalt, currentCanary);
      if (!verification.valid || !verification.key) {
        throw new Error('Current master passphrase is incorrect.');
      }
      oldKey = verification.key;
    }

    // Step 2: Decrypt existing secrets with old key
    progress('Decrypting stored secrets in memory...');
    const decryptedAccounts: { id: string; password: string | null; notes: string | null }[] = [];
    for (const acc of currentRecords.accounts) {
      let pwd: string | null = null;
      let notes: string | null = null;
      if (acc.encrypted_password) {
        try {
          pwd = await decryptData(acc.encrypted_password, oldKey);
        } catch {
          console.warn(`Could not decrypt password for account ${acc.id}`);
        }
      }
      if (acc.encrypted_notes) {
        try {
          notes = await decryptData(acc.encrypted_notes, oldKey);
        } catch {
          console.warn(`Could not decrypt notes for account ${acc.id}`);
        }
      }
      decryptedAccounts.push({ id: acc.id, password: pwd, notes });
    }

    const decryptedProjects: { id: string; credentialsPlaintext: string | null }[] = [];
    for (const proj of currentRecords.projects) {
      let creds: string | null = null;
      if (proj.encrypted_test_credentials) {
        try {
          creds = await decryptData(proj.encrypted_test_credentials, oldKey);
        } catch {
          console.warn(`Could not decrypt credentials for project ${proj.id}`);
        }
      }
      decryptedProjects.push({ id: proj.id, credentialsPlaintext: creds });
    }

    // Step 3: Derive new key, generate new salt & new canary
    progress('Deriving new zero-knowledge cryptographic key...');
    const newSalt = generateSalt();
    const newKey = await deriveKey(newPassphrase, newSalt);
    const newCanary = await encryptData(CANARY_PAYLOAD, newKey);

    // Step 4: Re-encrypt all records with new key
    progress('Re-encrypting records with AES-256-GCM...');
    const updatedAccountsPayload: { id: string; encrypted_password: string | null; encrypted_notes: string | null }[] = [];
    for (const item of decryptedAccounts) {
      const newEncPwd = item.password ? await encryptData(item.password, newKey) : null;
      const newEncNotes = item.notes ? await encryptData(item.notes, newKey) : null;
      updatedAccountsPayload.push({
        id: item.id,
        encrypted_password: newEncPwd,
        encrypted_notes: newEncNotes,
      });
    }

    const updatedProjectsPayload: { id: string; encrypted_test_credentials: string | null }[] = [];
    for (const item of decryptedProjects) {
      const newEncCreds = item.credentialsPlaintext ? await encryptData(item.credentialsPlaintext, newKey) : null;
      updatedProjectsPayload.push({
        id: item.id,
        encrypted_test_credentials: newEncCreds,
      });
    }

    // Step 5: Commit updates to Supabase / dev-store
    progress('Committing re-encrypted vault data to cloud...');
    const updatedVaultSettings: UserVaultSettings = {
      user_id: user.id,
      vault_salt: newSalt,
      vault_canary: newCanary,
    };

    if (isSupabaseConfigured) {
      // Update user_vault_settings
      const { error: vaultErr } = await supabase
        .from('user_vault_settings')
        .upsert(updatedVaultSettings, { onConflict: 'user_id' });
      if (vaultErr) throw new Error(`Failed to update vault settings: ${vaultErr.message}`);

      // Update accounts
      for (const acc of updatedAccountsPayload) {
        const { error } = await supabase
          .from('accounts')
          .update({
            encrypted_password: acc.encrypted_password,
            encrypted_notes: acc.encrypted_notes,
          })
          .eq('id', acc.id);
        if (error) console.error(`Error updating account ${acc.id}:`, error.message);
      }

      // Update projects
      for (const proj of updatedProjectsPayload) {
        const { error } = await supabase
          .from('projects')
          .update({
            encrypted_test_credentials: proj.encrypted_test_credentials,
          })
          .eq('id', proj.id);
        if (error) console.error(`Error updating project ${proj.id}:`, error.message);
      }
    } else {
      // Dev store update
      await fetch('/api/dev-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'vault_settings', tenantId, data: updatedVaultSettings }),
      });

      // Update dev store accounts & projects
      const updatedAccountsList = currentRecords.accounts.map((acc) => {
        const updated = updatedAccountsPayload.find((u) => u.id === acc.id);
        return updated ? { ...acc, ...updated } : acc;
      });
      await fetch('/api/dev-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'accounts', tenantId, data: updatedAccountsList }),
      });

      const updatedProjectsList = currentRecords.projects.map((proj) => {
        const updated = updatedProjectsPayload.find((u) => u.id === proj.id);
        return updated ? { ...proj, ...updated } : proj;
      });
      await fetch('/api/dev-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'projects', tenantId, data: updatedProjectsList }),
      });
    }

    // Step 6: Update in-memory state
    setActiveSalt(newSalt);
    setVaultCanary(newCanary);
    setDerivedKey(newKey);
    setMasterPassphrase(newPassphrase);
    setIsUnlocked(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dev_command_center_passphrase', newPassphrase);
    }
  }, [user, activeSalt, vaultCanary, tenantId]);

  // High-level encrypt helper
  const encrypt = useCallback(async (plaintext: string): Promise<string> => {
    if (derivedKey) {
      return encryptData(plaintext, derivedKey);
    }
    if (masterPassphrase) {
      return encryptData(plaintext, await deriveKey(masterPassphrase, activeSalt || generateSalt()));
    }
    throw new Error('Zero-Knowledge Vault is locked. Please enter your master passphrase.');
  }, [derivedKey, masterPassphrase, activeSalt]);

  // High-level decrypt helper
  const decrypt = useCallback(async (ciphertext: string): Promise<string> => {
    if (derivedKey) {
      return decryptData(ciphertext, derivedKey);
    }
    if (masterPassphrase && activeSalt) {
      const key = await deriveKey(masterPassphrase, activeSalt);
      return decryptData(ciphertext, key);
    }
    throw new Error('Zero-Knowledge Vault is locked. Please enter your master passphrase.');
  }, [derivedKey, masterPassphrase, activeSalt]);

  return (
    <CryptoContext.Provider
      value={{
        isVaultSetup,
        isUnlocked,
        masterPassphrase,
        derivedKey,
        activeSalt,
        setupVault,
        unlockVault,
        lockVault,
        changePassphrase,
        encrypt,
        decrypt,
        refreshVaultSettings: fetchVaultSettings,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
}
