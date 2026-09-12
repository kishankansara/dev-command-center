'use client';

import React from 'react';
import { Terminal, Shield, ShieldCheck, ShieldAlert, KeyRound, Wifi, Database, Plus, Download, Mail, Layers, LogOut } from 'lucide-react';
import { useCrypto } from '@/context/CryptoContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

interface NavigationProps {
  activeTab: 'projects' | 'accounts' | 'export';
  setActiveTab: (tab: 'projects' | 'accounts' | 'export') => void;
  onOpenPassphraseModal: () => void;
  onOpenNewProjectModal: () => void;
  onOpenNewAccountModal: () => void;
}

export function Navigation({
  activeTab,
  setActiveTab,
  onOpenPassphraseModal,
  onOpenNewProjectModal,
  onOpenNewAccountModal,
}: NavigationProps) {
  const { isUnlocked, lockVault } = useCrypto();
  const { isRealtimeActive, projects, accounts } = useData();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-command-border bg-command-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex flex-nowrap items-center justify-between h-14 gap-2 overflow-x-auto no-scrollbar">
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono font-bold text-sm sm:text-base tracking-tight text-slate-100 whitespace-nowrap">
                DevCommand<span className="text-emerald-400">Center</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 shrink-0">
                AES-256
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-command-900/90 p-0.5 rounded-lg border border-command-border shrink-0">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'bg-command-800 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Projects</span>
              <span className="text-[10px] bg-command-950 px-1.5 py-0.2 rounded-full text-slate-400 font-mono">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'bg-command-800 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>Accounts</span>
              <span className="text-[10px] bg-command-950 px-1.5 py-0.2 rounded-full text-slate-400 font-mono">
                {accounts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'export'
                  ? 'bg-command-800 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Portability</span>
            </button>
          </nav>

          {/* Right Status Indicators & Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zero-Knowledge Vault Status */}
            {isUnlocked ? (
              <button
                onClick={lockVault}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-mono font-medium transition-all whitespace-nowrap shrink-0"
                title="Click to lock zero-knowledge vault and wipe passphrase from heap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Unlocked</span>
              </button>
            ) : (
              <button
                onClick={onOpenPassphraseModal}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/60 border border-amber-600/40 text-amber-300 hover:bg-amber-900/50 text-xs font-mono font-medium transition-all whitespace-nowrap shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">Unlock Vault</span>
              </button>
            )}

            {/* Contextual Action Button */}
            {activeTab === 'projects' ? (
              <button
                onClick={onOpenNewProjectModal}
                className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>New Project</span>
              </button>
            ) : activeTab === 'accounts' ? (
              <button
                onClick={onOpenNewAccountModal}
                className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Add Account</span>
              </button>
            ) : null}

            {/* Authenticated User Session & Sign Out */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-command-border/60 shrink-0">
                <span className="hidden lg:inline text-[11px] font-mono text-slate-300 truncate max-w-[130px] whitespace-nowrap">
                  {user.email}
                </span>
                <button
                  onClick={async () => {
                    await signOut();
                    window.location.href = '/login';
                  }}
                  className="p-1 rounded-md bg-command-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition-colors border border-command-border shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
