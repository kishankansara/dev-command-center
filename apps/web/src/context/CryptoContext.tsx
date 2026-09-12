'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { encryptText, decryptText } from '@dev-command-center/crypto-core';

interface CryptoContextType {
  isUnlocked: boolean;
  masterPassphrase: string | null;
  unlockVault: (passphrase: string) => void;
  lockVault: () => void;
  encrypt: (plaintext: string) => Promise<string>;
  decrypt: (ciphertext: string) => Promise<string>;
}

const CryptoContext = createContext<CryptoContextType | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [masterPassphrase, setMasterPassphrase] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dev_command_center_passphrase');
    }
    return null;
  });

  const unlockVault = useCallback((passphrase: string) => {
    setMasterPassphrase(passphrase);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dev_command_center_passphrase', passphrase);
    }
  }, []);

  const lockVault = useCallback(() => {
    setMasterPassphrase(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dev_command_center_passphrase');
    }
  }, []);

  // Auto-lock vault after 15 minutes of inactivity on web
  useEffect(() => {
    if (!masterPassphrase) return;

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
  }, [masterPassphrase, lockVault]);

  const encrypt = useCallback(async (plaintext: string): Promise<string> => {
    if (!masterPassphrase) {
      throw new Error('Zero-Knowledge Vault is locked. Please enter your master passphrase.');
    }
    return encryptText(plaintext, masterPassphrase);
  }, [masterPassphrase]);

  const decrypt = useCallback(async (ciphertext: string): Promise<string> => {
    if (!masterPassphrase) {
      throw new Error('Zero-Knowledge Vault is locked. Please enter your master passphrase.');
    }
    return decryptText(ciphertext, masterPassphrase);
  }, [masterPassphrase]);

  return (
    <CryptoContext.Provider
      value={{
        isUnlocked: Boolean(masterPassphrase),
        masterPassphrase,
        unlockVault,
        lockVault,
        encrypt,
        decrypt,
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
