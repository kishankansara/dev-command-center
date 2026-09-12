import React, { useState, useEffect } from 'react';
import { Layers, GitBranch, Globe, Server, Terminal, X, Plus, Trash2 } from 'lucide-react';
import { Project, Account, DeploymentService, ServiceCategory } from '@dev-command-center/shared-types';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Frontend',
  'Backend',
  'Database',
  'AI Provider',
  'Storage',
  'Auth',
  'Custom'
];

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProject?: Project | null;
  onSave: (projectData: Partial<Project>) => Promise<void>;
}

export function ProjectModal({
  isOpen,
  onClose,
  existingProject,
  onSave,
}: ProjectModalProps) {
  const { accounts } = useData();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitAccountEmail, setGitAccountEmail] = useState('');
  const [services, setServices] = useState<DeploymentService[]>([]);
  const [frontendPlatform, setFrontendPlatform] = useState('Vercel');
  const [frontendAccountEmail, setFrontendAccountEmail] = useState('');
  const [frontendUrl, setFrontendUrl] = useState('');
  const [backendPlatform, setBackendPlatform] = useState('Supabase');
  const [backendAccountEmail, setBackendAccountEmail] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [localRunbook, setLocalRunbook] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (existingProject) {
      setName(existingProject.name);
      setDescription(existingProject.description || '');
      setTagsInput((existingProject.tags || []).join(', '));
      setGitRepoUrl(existingProject.git_repo_url || '');
      setGitAccountEmail(existingProject.git_account_email || '');
      // Initialize services, fallback to legacy fields if services array is empty
      if (existingProject.services && existingProject.services.length > 0) {
        setServices(existingProject.services);
      } else {
        const legacyServices: DeploymentService[] = [];
        if (existingProject.frontend_platform || existingProject.frontend_url) {
          legacyServices.push({
            id: crypto.randomUUID(),
            category: 'Frontend',
            provider: existingProject.frontend_platform || 'Vercel',
            accountEmail: existingProject.frontend_account_email || '',
            liveUrl: existingProject.frontend_url || '',
          });
        }
        if (existingProject.backend_platform || existingProject.backend_url) {
          legacyServices.push({
            id: crypto.randomUUID(),
            category: 'Backend',
            provider: existingProject.backend_platform || 'Railway',
            accountEmail: existingProject.backend_account_email || '',
            liveUrl: existingProject.backend_url || '',
          });
        }
        setServices(legacyServices);
      }
      setFrontendPlatform(existingProject.frontend_platform || 'Vercel');
      setFrontendAccountEmail(existingProject.frontend_account_email || '');
      setFrontendUrl(existingProject.frontend_url || '');
      setBackendPlatform(existingProject.backend_platform || 'Supabase');
      setBackendAccountEmail(existingProject.backend_account_email || '');
      setBackendUrl(existingProject.backend_url || '');
      setLocalRunbook(existingProject.local_runbook || '');
      setLinkedAccountId(existingProject.linked_account_id || '');
    } else {
      setName('');
      setDescription('');
      setTagsInput('Next.js, TypeScript');
      setGitRepoUrl('');
      setGitAccountEmail('');
      setServices([
        {
          id: crypto.randomUUID(),
          category: 'Frontend',
          provider: 'Vercel',
          accountEmail: '',
          liveUrl: '',
          consoleUrl: '',
        },
        {
          id: crypto.randomUUID(),
          category: 'Database',
          provider: 'Supabase',
          accountEmail: '',
          liveUrl: '',
          consoleUrl: '',
        }
      ]);
      setFrontendPlatform('Vercel');
      setFrontendAccountEmail('');
      setFrontendUrl('');
      setBackendPlatform('Supabase');
      setBackendAccountEmail('');
      setBackendUrl('');
      setLocalRunbook(`### Runtime Prerequisites
- Node.js 20+

### Start Command
\`\`\`bash
npm run dev
\`\`\`
`);
      setLinkedAccountId(accounts.length > 0 ? accounts[0].id : '');
    }
  }, [isOpen, existingProject, accounts]);

  if (!isOpen) return null;

  const handleAddService = () => {
    const newService: DeploymentService = {
      id: crypto.randomUUID(),
      category: 'Database',
      provider: '',
      accountEmail: '',
      consoleUrl: '',
      liveUrl: '',
    };
    setServices((prev) => [...prev, newService]);
  };

  const handleUpdateService = (id: string, updates: Partial<DeploymentService>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleRemoveService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Please enter a project name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Clean services
      const cleanedServices = services.map((s) => ({
        ...s,
        provider: s.provider.trim(),
        accountEmail: s.accountEmail.trim(),
        consoleUrl: s.consoleUrl?.trim() || undefined,
        liveUrl: s.liveUrl?.trim() || undefined,
        customCategoryName: s.category === 'Custom' ? s.customCategoryName?.trim() : undefined,
      }));

      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        tags,
        git_repo_url: gitRepoUrl.trim() || null,
        git_account_email: gitAccountEmail.trim() || null,
        services: cleanedServices,
        frontend_platform: frontendPlatform.trim() || null,
        frontend_account_email: frontendAccountEmail.trim() || null,
        frontend_url: frontendUrl.trim() || null,
        backend_platform: backendPlatform.trim() || null,
        backend_account_email: backendAccountEmail.trim() || null,
        backend_url: backendUrl.trim() || null,
        local_runbook: localRunbook.trim() || null,
        linked_account_id: linkedAccountId || null,
      });

      toast(existingProject ? 'Project updated!' : 'Project registered!', 'success');
      onClose();
    } catch {
      toast('Failed to save project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-command-900 border border-command-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-command-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {existingProject ? 'Configure Project Context' : 'Register New Project Workspace'}
              </h3>
              <p className="text-xs text-slate-400">IEEE 830 FR-PRJ-01 & Dynamic Multi-Tier Infrastructure</p>
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
          {/* General Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                PROJECT NAME *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Workflow Engine"
                className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                LINKED IDENTITY ACCOUNT
              </label>
              <select
                value={linkedAccountId}
                onChange={(e) => setLinkedAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">None (Unlinked)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.email} ({acc.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
              SHORT DESCRIPTION
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of architecture, service layer, or client"
              className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
              STACK TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Next.js, Python 3.11, Docker, PostgreSQL"
              className="w-full px-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Section: Source Control (FR-PRJ-01) */}
          <div className="p-4 bg-command-950 border border-command-border rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-200">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>SOURCE CONTROL SPECIFICATION (FR-PRJ-01)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  REPOSITORY URL
                </label>
                <input
                  type="url"
                  value={gitRepoUrl}
                  onChange={(e) => setGitRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/repo"
                  className="w-full px-3 py-2 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  GIT AUTHOR / PROFILE EMAIL
                </label>
                <input
                  type="email"
                  value={gitAccountEmail}
                  onChange={(e) => setGitAccountEmail(e.target.value)}
                  placeholder="dev.github@domain.com"
                  className="w-full px-3 py-2 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Dynamic Deployment Services & Infrastructure */}
          <div className="p-4 bg-command-950 border border-command-border rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-200">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>DEPLOYMENT SERVICES & INFRASTRUCTURE</span>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service Tier</span>
              </button>
            </div>

            {services.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-mono border border-dashed border-command-border rounded-xl">
                No deployment services configured. Click &ldquo;+ Add Service Tier&rdquo; to define databases, AI providers, hosting, etc.
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((svc, idx) => (
                  <div
                    key={svc.id}
                    className="p-3.5 rounded-xl bg-command-900/90 border border-command-border space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold text-slate-400">
                        Tier #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(svc.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Remove service tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">
                          CATEGORY
                        </label>
                        <select
                          value={svc.category}
                          onChange={(e) =>
                            handleUpdateService(svc.id, {
                              category: e.target.value as ServiceCategory,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          {SERVICE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {svc.category === 'Custom' ? (
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">
                            CUSTOM CATEGORY NAME
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Analytics, Cache, Search"
                            value={svc.customCategoryName || ''}
                            onChange={(e) =>
                              handleUpdateService(svc.id, {
                                customCategoryName: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">
                            PROVIDER NAME *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Supabase, Google AI Studio, Neon, Vercel"
                            value={svc.provider}
                            onChange={(e) =>
                              handleUpdateService(svc.id, {
                                provider: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>

                    {svc.category === 'Custom' && (
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">
                          PROVIDER NAME *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Supabase, Google AI Studio, Neon, Vercel"
                          value={svc.provider}
                          onChange={(e) =>
                            handleUpdateService(svc.id, {
                              provider: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">
                          ACCOUNT EMAIL
                        </label>
                        <input
                          type="email"
                          placeholder="email used on platform"
                          value={svc.accountEmail}
                          onChange={(e) =>
                            handleUpdateService(svc.id, {
                              accountEmail: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">
                          LIVE / ENDPOINT URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://production.endpoint"
                          value={svc.liveUrl || ''}
                          onChange={(e) =>
                            handleUpdateService(svc.id, {
                              liveUrl: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">
                          CONSOLE URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://console.service.com"
                          value={svc.consoleUrl || ''}
                          onChange={(e) =>
                            handleUpdateService(svc.id, {
                              consoleUrl: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-command-950 border border-command-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Local Execution Runbook (FR-PRJ-04) */}
          <div className="p-4 bg-command-950 border border-command-border rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-200">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>LOCAL EXECUTION RUNBOOK (FR-PRJ-04)</span>
            </div>
            <textarea
              value={localRunbook}
              onChange={(e) => setLocalRunbook(e.target.value)}
              rows={4}
              placeholder="Prerequisites, environment setup, and CLI commands..."
              className="w-full p-2.5 bg-command-900 border border-command-border rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 resize-y"
            />
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
              {isSubmitting ? 'Saving...' : existingProject ? 'Save Changes' : 'Register Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
