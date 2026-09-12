'use client';

import React, { useState } from 'react';
import { Project, Account } from '@dev-command-center/shared-types';
import {
  Layers,
  GitBranch,
  Globe,
  Server,
  Terminal,
  Key,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useCrypto } from '@/context/CryptoContext';
import { RunbookViewer } from './RunbookViewer';

interface ProjectCardProps {
  project: Project;
  linkedAccount?: Account | null;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onOpenCredentials: (project: Project) => void;
  onUpdateRunbook: (id: string, runbook: string) => Promise<void>;
}

export function ProjectCard({
  project,
  linkedAccount,
  onEdit,
  onDelete,
  onOpenCredentials,
  onUpdateRunbook,
}: ProjectCardProps) {
  const { copyToClipboard } = useToast();
  const { isUnlocked } = useCrypto();
  const [isRunbookExpanded, setIsRunbookExpanded] = useState(false);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-command-border transition-all duration-200 hover:border-command-border-active flex flex-col">
      {/* Top Card Bar */}
      <div className="p-5 pb-4 border-b border-command-border flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold text-slate-100 truncate">{project.name}</h3>
            {linkedAccount && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {linkedAccount.email}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-command-900 text-slate-300 border border-command-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Top Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-lg bg-command-900 hover:bg-command-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Edit Project Configuration"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-1.5 rounded-lg bg-command-900 hover:bg-rose-950/70 hover:text-rose-400 text-slate-400 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Details: Source Control & Dual-Tier Deployments */}
      <div className="p-5 space-y-4 flex-1">
        {/* Source Control Bar */}
        {project.git_repo_url && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-command-950 border border-command-border text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-slate-300 truncate">{project.git_repo_url}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <button
                onClick={() => copyToClipboard(project.git_repo_url || '', 'Git URL')}
                className="p-1.5 rounded hover:bg-command-900 text-slate-400 hover:text-slate-200"
                title="Copy repository link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={project.git_repo_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded hover:bg-command-900 text-slate-400 hover:text-slate-200"
                title="Open in GitHub/GitLab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Dynamic Deployment Services & Infrastructure */}
        {((project.services && project.services.length > 0) || project.frontend_platform || project.backend_platform) && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Infrastructure & Services
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-command-900 text-slate-400 border border-command-border">
                {(project.services && project.services.length > 0) ? `${project.services.length} Tiers` : 'Legacy Dual-Tier'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.services && project.services.length > 0 ? (
                project.services.map((service) => {
                  // Badge styling based on category
                  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
                    Frontend: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-700/50' },
                    Backend: { bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-700/50' },
                    Database: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/50' },
                    'AI Provider': { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-700/50' },
                    Storage: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/50' },
                    Auth: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/50' },
                    Custom: { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700/50' },
                  };
                  const color = categoryColors[service.category] || categoryColors.Custom;
                  const displayCategory = service.category === 'Custom' && service.customCategoryName
                    ? service.customCategoryName
                    : service.category;

                  return (
                    <div
                      key={service.id}
                      className="p-3 rounded-xl bg-command-950/80 border border-command-border space-y-2 transition-all hover:border-command-border-active flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {service.provider}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${color.bg} ${color.text} ${color.border}`}>
                          {displayCategory}
                        </span>
                      </div>

                      {/* Account Email with One-Click Copy */}
                      {service.accountEmail && (
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-command-900/70 px-2 py-1 rounded-lg border border-command-border/50">
                          <span className="truncate mr-1.5">{service.accountEmail}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(service.accountEmail, `${service.provider} Account Email`)}
                            className="p-1 rounded hover:bg-command-800 text-slate-400 hover:text-slate-200 shrink-0 transition-colors"
                            title={`Copy ${service.accountEmail}`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Endpoints & Console Links */}
                      {(service.liveUrl || service.consoleUrl) && (
                        <div className="flex items-center gap-2 pt-1 border-t border-command-border/40 text-[11px]">
                          {service.liveUrl && (
                            <a
                              href={service.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 transition-colors truncate"
                              title={service.liveUrl}
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">Live URL</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                            </a>
                          )}
                          {service.consoleUrl && (
                            <a
                              href={service.consoleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-mono text-indigo-400 hover:text-indigo-300 transition-colors ml-auto truncate"
                              title={service.consoleUrl}
                            >
                              <Server className="w-3 h-3 shrink-0" />
                              <span className="truncate">Console</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Backward Compatibility Fallback for Legacy Projects */
                <>
                  {/* Frontend Tier */}
                  <div className="p-3 rounded-xl bg-command-950/80 border border-command-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                        <Globe className="w-3 h-3" /> FRONTEND
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-command-900 text-slate-300 border border-command-border">
                        {project.frontend_platform || 'Vercel'}
                      </span>
                    </div>
                    {project.frontend_url ? (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={project.frontend_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-slate-200 hover:text-cyan-300 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{project.frontend_url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(project.frontend_url || '', 'Frontend URL')}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 shrink-0 ml-1"
                          title="Copy Live URL"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No live URL registered</p>
                    )}
                    {project.frontend_account_email && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate">Deploy: {project.frontend_account_email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(project.frontend_account_email || '', 'Frontend Account Email')}
                          className="p-0.5 rounded text-slate-400 hover:text-slate-200"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Backend Tier */}
                  <div className="p-3 rounded-xl bg-command-950/80 border border-command-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-indigo-400 font-semibold flex items-center gap-1">
                        <Server className="w-3 h-3" /> BACKEND
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-command-900 text-slate-300 border border-command-border">
                        {project.backend_platform || 'Railway'}
                      </span>
                    </div>
                    {project.backend_url ? (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={project.backend_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-slate-200 hover:text-indigo-300 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{project.backend_url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(project.backend_url || '', 'Backend URL')}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 shrink-0 ml-1"
                          title="Copy API URL"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No API URL registered</p>
                    )}
                    {project.backend_account_email && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate">Deploy: {project.backend_account_email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(project.backend_account_email || '', 'Backend Account Email')}
                          className="p-0.5 rounded text-slate-400 hover:text-slate-200"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons: Test Credential Vault & Runbook Toggle */}
        <div className="flex items-center gap-2 pt-1">
          {/* Credentials Vault Button */}
          <button
            onClick={() => onOpenCredentials(project)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-command-950 hover:bg-command-900 border border-command-border text-xs font-semibold text-slate-200 transition-all group"
          >
            <Key className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Test Credentials</span>
            {project.encrypted_test_credentials ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                AES-256
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Empty</span>
            )}
          </button>

          {/* Runbook Expander Button */}
          <button
            onClick={() => setIsRunbookExpanded(!isRunbookExpanded)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-command-950 hover:bg-command-900 border border-command-border text-xs font-medium text-slate-300 transition-colors"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Runbook</span>
            {isRunbookExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsible Local Runbook Viewer (FR-PRJ-04) */}
        {isRunbookExpanded && (
          <div className="pt-2 animate-fade-in">
            <RunbookViewer
              runbookMarkdown={project.local_runbook}
              projectName={project.name}
              onSave={async (newMarkdown) => {
                await onUpdateRunbook(project.id, newMarkdown);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
