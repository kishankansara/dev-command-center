'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Account, Project, ExportBackupData } from '@dev-command-center/shared-types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useCrypto } from './CryptoContext';
import { useAuth } from './AuthContext';

interface DataContextType {
  accounts: Account[];
  projects: Project[];
  isLoading: boolean;
  isRealtimeActive: boolean;
  addAccount: (account: Partial<Account>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addProject: (project: Partial<Project>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  exportData: () => Promise<ExportBackupData>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

// Initial fallback mock data demonstrating full capabilities when Supabase is in local/mock mode
const INITIAL_DEMO_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    user_id: 'user-primary-dev',
    email: 'dev.lead@gmail.com',
    provider: 'Gmail',
    purpose: 'Primary Production Cloud Root (AWS, GCP, Supabase)',
    recovery_email: 'recovery.vault@protonmail.com',
    encrypted_password: null, // Populated upon unlock
    encrypted_notes: null,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'acc-2',
    user_id: 'user-primary-dev',
    email: 'deployments@outlook.com',
    provider: 'Outlook',
    purpose: 'Vercel, Render & Railway CI/CD Service Account',
    recovery_email: 'dev.lead@gmail.com',
    encrypted_password: null,
    encrypted_notes: null,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  }
];

const INITIAL_DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    user_id: 'user-primary-dev',
    name: 'DevCommandCenter Platform',
    description: 'Unified Developer Context, Deployment & Identity Manager with Zero-Knowledge Encryption',
    tags: ['Next.js', 'Supabase', 'TypeScript', 'AES-256-GCM', 'PostgreSQL'],
    git_repo_url: 'https://github.com/organization/dev-command-center',
    git_account_email: 'dev.lead@gmail.com',
    frontend_platform: 'Vercel Hobby',
    frontend_account_email: 'deployments@outlook.com',
    frontend_url: 'https://devcommandcenter.vercel.app',
    backend_platform: 'Supabase Managed Cloud',
    backend_account_email: 'dev.lead@gmail.com',
    backend_url: 'https://api.devcommandcenter.io',
    services: [
      {
        id: 'srv-1',
        category: 'Frontend',
        provider: 'Vercel Hobby',
        accountEmail: 'deployments@outlook.com',
        liveUrl: 'https://devcommandcenter.vercel.app',
        consoleUrl: 'https://vercel.com/dashboard'
      },
      {
        id: 'srv-2',
        category: 'Database',
        provider: 'Supabase Managed Cloud',
        accountEmail: 'dev.lead@gmail.com',
        liveUrl: 'https://api.devcommandcenter.io',
        consoleUrl: 'https://supabase.com/dashboard'
      }
    ],
    local_runbook: `### Runtime Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0 or pnpm >= 9.0.0
- Docker Desktop (optional for local Supabase emulator)

### Environment Setup
\`\`\`bash
cp .env.example .env.local
npm install
\`\`\`

### Local Execution Sequence
\`\`\`bash
npm run dev:web
\`\`\`

### Verification
Visit \`http://localhost:3000\` to access the dashboard.
`,
    encrypted_test_credentials: null,
    linked_account_id: 'acc-1',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    user_id: 'user-primary-dev',
    name: 'Realtime Edge Gateway',
    description: 'Ultra-low latency WebSocket broker for IoT event streaming',
    tags: ['Go', 'Docker', 'Railway', 'Redis'],
    git_repo_url: 'https://github.com/organization/edge-gateway',
    git_account_email: 'dev.lead@gmail.com',
    frontend_platform: 'Cloudflare Pages',
    frontend_account_email: 'deployments@outlook.com',
    frontend_url: 'https://edge-gateway.pages.dev',
    backend_platform: 'Railway',
    backend_account_email: 'deployments@outlook.com',
    backend_url: 'https://gateway.railway.app',
    services: [
      {
        id: 'srv-3',
        category: 'Frontend',
        provider: 'Cloudflare Pages',
        accountEmail: 'deployments@outlook.com',
        liveUrl: 'https://edge-gateway.pages.dev',
        consoleUrl: 'https://dash.cloudflare.com'
      },
      {
        id: 'srv-4',
        category: 'Backend',
        provider: 'Railway',
        accountEmail: 'deployments@outlook.com',
        liveUrl: 'https://gateway.railway.app',
        consoleUrl: 'https://railway.app/dashboard'
      }
    ],
    local_runbook: `### Runtime Prerequisites
- Go 1.22+
- Redis running on port 6379

### Local Start Sequence
\`\`\`bash
docker compose up -d redis
go run ./cmd/server
\`\`\`
`,
    encrypted_test_credentials: null,
    linked_account_id: 'acc-2',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isLeadDev =
    !user ||
    user.email?.toLowerCase() === 'developer@devcommandcenter.local' ||
    user.email?.toLowerCase() === 'developer@commandcenter.io' ||
    user.id === 'user-primary-dev' ||
    user.id === 'user-google-dev';

  const [accounts, setAccounts] = useState<Account[]>(() =>
    isLeadDev ? INITIAL_DEMO_ACCOUNTS : []
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    isLeadDev ? INITIAL_DEMO_PROJECTS : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const { encrypt } = useCrypto();

  const currentUserId = user?.id || 'user-primary-dev';
  const tenantId = isLeadDev ? 'user-primary-dev' : currentUserId;

  // Local storage cache key per tenant in dev mode
  const getStorageKey = useCallback((entity: 'projects' | 'accounts') => {
    return `dev_command_center_${entity}_${currentUserId || 'anonymous'}`;
  }, [currentUserId]);

  // Load or isolate data when user changes
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setProjects([]);
      return;
    }

    if (!isSupabaseConfigured) {
      // Fetch shared data from server-side dev-store so Phone and PC share the exact same state
      const loadSharedDevData = async () => {
        try {
          const [projRes, accRes] = await Promise.all([
            fetch(`/api/dev-store?entity=projects&tenantId=${tenantId}`).then((r) => r.json()).catch(() => null),
            fetch(`/api/dev-store?entity=accounts&tenantId=${tenantId}`).then((r) => r.json()).catch(() => null),
          ]);

          let activeProjects: Project[] = [];
          let activeAccounts: Account[] = [];

          if (projRes?.data && Array.isArray(projRes.data) && projRes.data.length > 0) {
            activeProjects = projRes.data;
          } else if (isLeadDev) {
            activeProjects = INITIAL_DEMO_PROJECTS.map((p) => ({ ...p, user_id: tenantId }));
            fetch('/api/dev-store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entity: 'projects', tenantId, data: activeProjects }),
            }).catch(() => {});
          }

          if (accRes?.data && Array.isArray(accRes.data) && accRes.data.length > 0) {
            activeAccounts = accRes.data;
          } else if (isLeadDev) {
            activeAccounts = INITIAL_DEMO_ACCOUNTS.map((a) => ({ ...a, user_id: tenantId }));
            fetch('/api/dev-store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entity: 'accounts', tenantId, data: activeAccounts }),
            }).catch(() => {});
          }

          setProjects(activeProjects);
          setAccounts(activeAccounts);
        } catch (err) {
          console.error('Error loading shared dev data:', err);
          if (isLeadDev) {
            setProjects(INITIAL_DEMO_PROJECTS);
            setAccounts(INITIAL_DEMO_ACCOUNTS);
          }
        } finally {
          setIsLoading(false);
          setIsRealtimeActive(true);
        }
      };

      loadSharedDevData();
      const intervalId = setInterval(loadSharedDevData, 1500);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user, currentUserId, isLeadDev, tenantId]);

  const fetchRemoteData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    if (!user) {
      setAccounts([]);
      setProjects([]);
      return;
    }
    setIsLoading(true);
    try {
      const [accRes, projRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      ]);

      if (accRes.data) setAccounts(accRes.data as Account[]);
      if (projRes.data) setProjects(projRes.data as Project[]);
    } catch (err) {
      console.error('Error fetching remote Supabase data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Realtime WebSocket Subscription (FR-SYN-01) with optimistic updates
  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      if (!isSupabaseConfigured) {
        setIsRealtimeActive(true);
      }
      return;
    }

    fetchRemoteData();

    const channel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProject = payload.new as Project;
            setProjects((prev) => {
              if (prev.some((p) => p.id === newProject.id)) return prev;
              return [newProject, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProject = payload.new as Project;
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setProjects((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAccount = payload.new as Account;
            setAccounts((prev) => {
              if (prev.some((a) => a.id === newAccount.id)) return prev;
              return [newAccount, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedAccount = payload.new as Account;
            setAccounts((prev) =>
              prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setAccounts((prev) => prev.filter((a) => a.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRemoteData]);

  const syncDevStore = useCallback(async (entity: 'projects' | 'accounts', data: unknown) => {
    if (!isSupabaseConfigured) {
      try {
        await fetch('/api/dev-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity, tenantId, data }),
        });
      } catch (err) {
        console.error(`Error syncing dev-store ${entity}:`, err);
      }
    }
  }, [tenantId]);

  const addAccount = async (newAcc: Partial<Account>) => {
    const record: Account = {
      id: crypto.randomUUID(),
      user_id: currentUserId,
      email: newAcc.email || '',
      provider: newAcc.provider || 'Gmail',
      purpose: newAcc.purpose || null,
      recovery_email: newAcc.recovery_email || null,
      encrypted_password: newAcc.encrypted_password || null,
      encrypted_notes: newAcc.encrypted_notes || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('accounts').insert(record);
      if (error) throw error;
    }
    setAccounts((prev) => {
      const next = [record, ...prev];
      syncDevStore('accounts', next);
      return next;
    });
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('accounts').update(updates).eq('id', id);
      if (error) throw error;
    }
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      syncDevStore('accounts', next);
      return next;
    });
  };

  const deleteAccount = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    }
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      syncDevStore('accounts', next);
      return next;
    });
  };

  const addProject = async (newProj: Partial<Project>) => {
    const record: Project = {
      id: crypto.randomUUID(),
      user_id: currentUserId,
      name: newProj.name || 'Untitled Project',
      description: newProj.description || null,
      tags: newProj.tags || [],
      git_repo_url: newProj.git_repo_url || null,
      git_account_email: newProj.git_account_email || null,
      services: newProj.services || [],
      frontend_platform: newProj.frontend_platform || null,
      frontend_account_email: newProj.frontend_account_email || null,
      frontend_url: newProj.frontend_url || null,
      backend_platform: newProj.backend_platform || null,
      backend_account_email: newProj.backend_account_email || null,
      backend_url: newProj.backend_url || null,
      local_runbook: newProj.local_runbook || null,
      encrypted_test_credentials: newProj.encrypted_test_credentials || null,
      linked_account_id: newProj.linked_account_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('projects').insert(record);
      if (error) throw error;
    }
    setProjects((prev) => {
      const next = [record, ...prev];
      syncDevStore('projects', next);
      return next;
    });
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updatedRecord = { ...updates, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('projects').update(updatedRecord).eq('id', id);
      if (error) throw error;
    }
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updatedRecord } : p));
      syncDevStore('projects', next);
      return next;
    });
  };

  const deleteProject = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    }
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      syncDevStore('projects', next);
      return next;
    });
  };

  // FR-SYN-02: One-Click Data Portability
  const exportData = async (): Promise<ExportBackupData> => {
    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      app: 'DevCommandCenter',
      user_id: 'user-primary-dev',
      accounts,
      projects,
    };
  };

  return (
    <DataContext.Provider
      value={{
        accounts,
        projects,
        isLoading,
        isRealtimeActive,
        addAccount,
        updateAccount,
        deleteAccount,
        addProject,
        updateProject,
        deleteProject,
        exportData,
        refresh: fetchRemoteData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
