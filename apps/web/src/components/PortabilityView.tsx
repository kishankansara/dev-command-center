'use client';

import React, { useState } from 'react';
import { Download, Upload, Shield, FileJson, Check, Copy, RefreshCw } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export function PortabilityView() {
  const { exportData, accounts, projects } = useData();
  const { toast, copyToClipboard } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<string>('');

  const handleGenerateExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const formatted = JSON.stringify(data, null, 2);
      setJsonPreview(formatted);

      // Trigger automatic browser file download
      const blob = new Blob([formatted], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devcommandcenter-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('JSON backup generated and downloaded successfully!', 'success');
    } catch {
      toast('Failed to generate export package', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-command-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">One-Click Data Portability</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Compliant with IEEE 830 FR-SYN-02. Export full client-side JSON backups of all projects,
            dual-tier deployment topologies, runbooks, and zero-knowledge encrypted vaults without vendor lock-in.
          </p>
        </div>

        <button
          onClick={handleGenerateExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating JSON...' : 'Export Complete Backup'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Tracked Projects</span>
          <div className="text-2xl font-bold font-mono text-slate-100">{projects.length}</div>
          <span className="text-[10px] text-slate-500">Includes Dual-Tier Mappings</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Identity Accounts</span>
          <div className="text-2xl font-bold font-mono text-slate-100">{accounts.length}</div>
          <span className="text-[10px] text-slate-500">With Recovery Associations</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-command-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Cryptographic Standard</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">AES-256-GCM</div>
          <span className="text-[10px] text-slate-500">PBKDF2 100k+ Iterations</span>
        </div>
      </div>

      {/* JSON Preview Box */}
      <div className="glass-panel rounded-2xl border border-command-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-command-900 border-b border-command-border">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-slate-300">
              PORTABLE BACKUP PAYLOAD (JSON)
            </span>
          </div>
          {jsonPreview && (
            <button
              onClick={() => copyToClipboard(jsonPreview, 'Backup JSON')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-command-800 hover:bg-command-700 text-xs text-slate-300 font-mono transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>
          )}
        </div>

        <div className="p-4 bg-command-950">
          {jsonPreview ? (
            <pre className="max-h-96 overflow-y-auto p-3 text-xs font-mono text-emerald-300/90 leading-relaxed rounded-lg bg-command-900 border border-command-border whitespace-pre">
              {jsonPreview}
            </pre>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs space-y-2">
              <p>Click "Export Complete Backup" above to preview and download the JSON bundle.</p>
              <p className="text-[11px] text-slate-600">
                Encrypted ciphertext fields remain tamper-evident and protected under your master passphrase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
