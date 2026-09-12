'use client';

import React, { useState, useMemo } from 'react';
import { Project, Account } from '@dev-command-center/shared-types';
import {
  Search,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Layers,
  Mail,
  Download,
  Filter,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useCrypto } from '@/context/CryptoContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { ProjectCard } from '@/components/ProjectCard';
import { AccountCard } from '@/components/AccountCard';
import { PortabilityView } from '@/components/PortabilityView';
import { PassphraseModal } from '@/components/PassphraseModal';
import { ProjectModal } from '@/components/ProjectModal';
import { AccountModal } from '@/components/AccountModal';
import { CredentialVaultModal } from '@/components/CredentialVaultModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    projects,
    accounts,
    addProject,
    updateProject,
    deleteProject,
    addAccount,
    updateAccount,
    deleteAccount,
    isRealtimeActive,
  } = useData();

  const { isUnlocked } = useCrypto();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'projects' | 'accounts' | 'export'>('projects');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modal states
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Credentials Vault modal state
  const [activeCredProject, setActiveCredProject] = useState<Project | null>(null);

  // Map accounts by ID for fast lookup in project cards
  const accountsById = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  // Extract all unique project tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.tags) p.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.git_repo_url && p.git_repo_url.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.frontend_platform && p.frontend_platform.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.backend_platform && p.backend_platform.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [projects, searchQuery, selectedTag]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      return (
        searchQuery === '' ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.purpose && a.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.recovery_email && a.recovery_email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [accounts, searchQuery]);

  // Auth Guard: redirect to /login if no active user session
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Prevent flash of protected dashboard content while redirecting
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-command-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-400">Verifying security context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-command-950">
      {/* Top Header & Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPassphraseModal={() => setIsPassphraseModalOpen(true)}
        onOpenNewProjectModal={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onOpenNewAccountModal={() => {
          setEditingAccount(null);
          setIsAccountModalOpen(true);
        }}
      />

      {/* Main Command Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Status & Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Tracked Workspaces */}
          <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">TRACKED WORKSPACES</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-100">{projects.length}</div>
            <p className="text-[11px] text-slate-500">Frontend & Backend Context</p>
          </div>

          {/* Metric 2: Identity Vault */}
          <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">DEDICATED ACCOUNTS</span>
              <Mail className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-100">{accounts.length}</div>
            <p className="text-[11px] text-slate-500">Parent Recovery Linked</p>
          </div>

          {/* Metric 3: Zero-Knowledge Security */}
          <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">SECURITY PROTOCOL</span>
              {isUnlocked ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <span>AES-256-GCM</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isUnlocked ? 'Vault Key Cached in Memory' : 'Vault Locked (Click to Unlock)'}
            </p>
          </div>

          {/* Metric 4: Tenant Isolation & Realtime */}
          <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">TENANT ISOLATION</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 flex items-center gap-1.5">
              <span className="text-emerald-400">Strict RLS</span>
              <span className="text-xs font-normal text-slate-400">(&lt;1s sync)</span>
            </div>
            <p className="text-[11px] text-slate-500">auth.uid() = user_id Enforced</p>
          </div>
        </section>

        {/* Tab 1: Projects View */}
        {activeTab === 'projects' && (
          <section className="space-y-6">
            {/* Search, Tag Filtering & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search projects, repo URLs, platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-command-900 border border-command-border rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Tag filters */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      selectedTag === null
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'bg-command-900 text-slate-400 border border-command-border hover:text-slate-200'
                    }`}
                  >
                    All Tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                        selectedTag === tag
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'bg-command-900 text-slate-400 border border-command-border hover:text-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Cards Grid */}
            {filteredProjects.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-command-border text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No Projects Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || selectedTag
                    ? 'No project matches your active filter criteria.'
                    : 'Get started by registering your first project deployment and local execution runbook.'}
                </p>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setIsProjectModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    linkedAccount={project.linked_account_id ? accountsById.get(project.linked_account_id) : null}
                    onEdit={(proj) => {
                      setEditingProject(proj);
                      setIsProjectModalOpen(true);
                    }}
                    onDelete={(id) => deleteProject(id)}
                    onOpenCredentials={(proj) => setActiveCredProject(proj)}
                    onUpdateRunbook={async (id, runbook) => {
                      await updateProject(id, { local_runbook: runbook });
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Dedicated Email Accounts View */}
        {activeTab === 'accounts' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search email accounts, providers, recovery emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-command-900 border border-command-border rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                onClick={() => {
                  setEditingAccount(null);
                  setIsAccountModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dedicated Account</span>
              </button>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-command-border text-center space-y-3">
                <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No Email Accounts Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Track dedicated Gmail, Outlook, or custom provider accounts with parent recovery association.
                </p>
                <button
                  onClick={() => {
                    setEditingAccount(null);
                    setIsAccountModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onEdit={(account) => {
                      setEditingAccount(account);
                      setIsAccountModalOpen(true);
                    }}
                    onDelete={(id) => deleteAccount(id)}
                    onOpenPassphraseModal={() => setIsPassphraseModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: One-Click Data Portability View */}
        {activeTab === 'export' && <PortabilityView />}
      </main>

      {/* Interactive Modals */}
      <PassphraseModal
        isOpen={isPassphraseModalOpen}
        onClose={() => setIsPassphraseModalOpen(false)}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        existingProject={editingProject}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={async (projData) => {
          if (editingProject) {
            await updateProject(editingProject.id, projData);
          } else {
            await addProject(projData);
          }
        }}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        existingAccount={editingAccount}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onOpenPassphraseModal={() => setIsPassphraseModalOpen(true)}
        onSave={async (accData) => {
          if (editingAccount) {
            await updateAccount(editingAccount.id, accData);
          } else {
            await addAccount(accData);
          }
        }}
      />

      {activeCredProject && (
        <CredentialVaultModal
          isOpen={Boolean(activeCredProject)}
          onClose={() => setActiveCredProject(null)}
          projectName={activeCredProject.name}
          encryptedCredentials={
            projects.find((p) => p.id === activeCredProject.id)?.encrypted_test_credentials ??
            activeCredProject.encrypted_test_credentials
          }
          onOpenPassphraseModal={() => setIsPassphraseModalOpen(true)}
          onSave={async (newCiphertext) => {
            await updateProject(activeCredProject.id, {
              encrypted_test_credentials: newCiphertext,
            });
          }}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-command-border bg-command-950 py-4 text-center text-xs font-mono text-slate-500">
        DevCommandCenter • IEEE 830 Specification • Zero-Knowledge AES-256-GCM • Supabase Managed Cloud
      </footer>
    </div>
  );
}
