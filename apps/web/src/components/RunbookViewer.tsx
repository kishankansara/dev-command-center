'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Edit3, Eye, Play } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface RunbookViewerProps {
  runbookMarkdown: string | null;
  projectName: string;
  onSave?: (updatedMarkdown: string) => Promise<void>;
  isEditable?: boolean;
}

export function RunbookViewer({
  runbookMarkdown,
  projectName,
  onSave,
  isEditable = true,
}: RunbookViewerProps) {
  const { copyToClipboard } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(runbookMarkdown || '');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCommand = async (commandText: string, index: number) => {
    await copyToClipboard(commandText.trim(), 'command');
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(content);
    }
    setIsEditing(false);
  };

  // Parse code blocks from markdown
  const parseMarkdownSections = (text: string) => {
    const lines = text.split('\n');
    const sections: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let inCodeBlock = false;
    let currentBlock: string[] = [];
    let currentLanguage = '';

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          currentLanguage = line.trim().replace('```', '') || 'bash';
          currentBlock = [];
        } else {
          inCodeBlock = false;
          sections.push({
            type: 'code',
            content: currentBlock.join('\n'),
            language: currentLanguage,
          });
          currentBlock = [];
        }
      } else if (inCodeBlock) {
        currentBlock.push(line);
      } else {
        sections.push({
          type: 'text',
          content: line,
        });
      }
    }

    return sections;
  };

  const sections = parseMarkdownSections(content);

  return (
    <div className="bg-command-950 border border-command-border rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-command-900 border-b border-command-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
            Execution Runbook & Startup Commands
          </h4>
        </div>
        {isEditable && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-command-800 hover:bg-command-700 text-slate-300 text-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Runbook</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full p-3 bg-command-900 border border-command-border rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500 transition-all resize-y"
            placeholder="Document runtime prerequisites and CLI commands in Markdown..."
          />
        ) : content.trim().length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm font-mono">
            No local runbook documented yet. Click Edit Runbook to add environment prerequisites and startup commands.
          </div>
        ) : (
          <div className="space-y-3 font-sans text-sm text-slate-300">
            {sections.map((section, idx) => {
              if (section.type === 'code') {
                const isCopied = copiedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-command-border bg-command-900 shadow-inner"
                  >
                    {/* Code language bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-command-850/80 border-b border-command-border text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-cyan-400" />
                        {section.language || 'cli'}
                      </span>
                      {/* One-Tap Copy Button */}
                      <button
                        onClick={() => handleCopyCommand(section.content, idx)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                          isCopied
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-command-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-slate-300'
                        }`}
                        title="Copy command to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3.5 overflow-x-auto text-xs font-mono text-emerald-300/90 leading-relaxed whitespace-pre">
                      <code>{section.content}</code>
                    </pre>
                  </div>
                );
              }

              // Text / Heading rendering
              const line = section.content;
              if (line.startsWith('### ')) {
                return (
                  <h5 key={idx} className="font-semibold text-slate-100 text-sm pt-2 pb-0.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {line.replace('### ', '')}
                  </h5>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h4 key={idx} className="font-bold text-slate-100 text-base pt-3 pb-1">
                    {line.replace('## ', '')}
                  </h4>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <div key={idx} className="flex items-start gap-2 pl-2 text-slate-300 text-xs">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{line.replace('- ', '')}</span>
                  </div>
                );
              }
              if (!line.trim()) {
                return <div key={idx} className="h-1" />;
              }

              return (
                <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
