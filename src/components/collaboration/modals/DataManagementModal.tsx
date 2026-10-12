import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Download,
  Upload,
  Check,
  AlertTriangle,
  HardDrive,
} from 'lucide-react';
import { storageService } from '@/services/storageService';

interface DataManagementModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  onClose,
  onRefresh,
}) => {
  const [importText, setImportText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleReset = () => {
    storageService.resetAllToSeed();
    setStatusMessage('Database reset to initial sample demo data successfully!');
    setIsError(false);
    setTimeout(() => {
      onRefresh();
      onClose();
    }, 1000);
  };

  const handleExport = () => {
    const jsonStr = storageService.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genaura_collaboration_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Collaboration workflows exported to JSON!');
    setIsError(false);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setStatusMessage('Please paste valid JSON data to import.');
      setIsError(true);
      return;
    }

    const ok = storageService.importDataJSON(importText);
    if (ok) {
      setStatusMessage('Data imported and synchronized successfully!');
      setIsError(false);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } else {
      setStatusMessage('Import failed: invalid JSON format or corrupted schema.');
      setIsError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              Persistence & Demo Data Hub
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
              isError
                ? 'border border-rose-800 bg-rose-950/60 text-rose-300'
                : 'border border-emerald-800 bg-emerald-950/60 text-emerald-300'
            }`}
          >
            {isError ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-4 text-xs text-slate-300">
          {/* Reset Demo Data */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Reset Sample Demo Data</span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg bg-rose-950/70 border border-rose-800 px-3 py-1.5 font-semibold text-rose-300 hover:bg-rose-900 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Database
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Restores standard pre-seeded shortlists, briefs, and collaborations across all 8 lifecycle statuses.
            </p>
          </div>

          {/* Export JSON */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Export Local Database</span>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg bg-purple-950/70 border border-purple-800 px-3 py-1.5 font-semibold text-purple-300 hover:bg-purple-900 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download JSON
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Exports your entire active state (projects, history, audit logs) as an immutable JSON file.
            </p>
          </div>

          {/* Import JSON */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
            <span className="font-bold text-white block">Import State Backup</span>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported JSON payload here..."
              rows={3}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Restore from JSON
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


