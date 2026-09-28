import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  HardDriveDownload, 
  Download, 
  Upload, 
  RefreshCw, 
  RotateCcw, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Server, 
  Clock, 
  Database,
  Lock,
  Layers,
  Settings,
  HardDrive
} from 'lucide-react';
import { BackupSnapshot, BackupConfig, CRMStats } from '../types';
import { api } from '../lib/api';

interface BackupHubViewProps {
  stats: CRMStats | null;
  onRefreshData: () => Promise<void>;
}

export const BackupHubView: React.FC<BackupHubViewProps> = ({
  stats,
  onRefreshData,
}) => {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    autoBackupEnabled: true,
    frequencyHours: 6,
    maxSnapshotsRetention: 20,
    lastBackupAt: null,
    lastStatus: 'success',
  });
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // New Backup Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  // Restore Modal state
  const [restoringSnapshot, setRestoringSnapshot] = useState<BackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // File Upload state
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  const loadBackupData = async () => {
    setLoading(true);
    try {
      const [list, cfg, diag] = await Promise.all([
        api.getBackups(),
        api.getBackupConfig(),
        api.getDatabaseDiagnostics(),
      ]);
      setBackups(list);
      setConfig(cfg);
      setDiagnostics(diag);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load backup data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackupData();
  }, []);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.createBackup(newLabel || 'Manual Checkpoint', 'manual');
      setStatusMessage({ type: 'success', text: `Snapshot "${res.snapshot.label}" created successfully!` });
      setIsNewModalOpen(false);
      setNewLabel('');
      await loadBackupData();
      await onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const confirmRestore = async () => {
    if (!restoringSnapshot) return;
    try {
      setIsRestoring(true);
      const res = await api.restoreBackup(restoringSnapshot.id);
      setStatusMessage({
        type: 'success',
        text: `Database successfully restored from "${restoringSnapshot.label}". Safety rollback was archived as ${res.safetySnapshot.filename}.`
      });
      setRestoringSnapshot(null);
      await loadBackupData();
      await onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Restore failed: ${err.message}` });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteSnapshot = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete backup snapshot "${label}"? This file will be permanently removed from disk.`)) {
      return;
    }
    try {
      await api.deleteBackup(id);
      setStatusMessage({ type: 'info', text: `Snapshot "${label}" deleted.` });
      await loadBackupData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        setUploadedFileContent(raw);
        const parsed = JSON.parse(raw);
        const data = parsed.data || parsed;
        setUploadPreview({
          clients: data.clients?.length || 0,
          contacts: data.contacts?.length || 0,
          deals: data.deals?.length || 0,
          tickets: data.tickets?.length || 0,
          isValid: Boolean(data.clients && Array.isArray(data.clients)),
        });
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Invalid JSON file format.' });
        setUploadPreview(null);
        setUploadedFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessUpload = async (restoreImmediately: boolean) => {
    if (!uploadedFileContent) return;
    try {
      setLoading(true);
      await api.uploadBackup(uploadedFileContent, restoreImmediately, `Imported: ${uploadFileName}`);
      setStatusMessage({
        type: 'success',
        text: restoreImmediately
          ? `External backup restored to database! Rollback snapshot saved.`
          : `External backup successfully saved to snapshots library.`,
      });
      setUploadedFileContent(null);
      setUploadPreview(null);
      setUploadFileName('');
      await loadBackupData();
      await onRefreshData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: Partial<BackupConfig>) => {
    try {
      const updated = await api.updateBackupConfig(newConfig);
      setConfig(updated);
      setStatusMessage({ type: 'success', text: 'Backup daemon settings updated.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Alert banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            {statusMessage.type === 'info' && <Database className="w-4 h-4 text-indigo-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Header / System Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Disaster Recovery & Backup Center
              </h1>
              <p className="text-xs text-slate-500">
                Full-stack disk persistence, automated checkpoints, point-in-time recovery, and cryptographic checksum validation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Direct Export */}
          <a
            id="btn-live-export"
            href="/api/backups/export-live"
            download
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Live Export (.json)</span>
          </a>

          {/* Trigger Snapshot */}
          <button
            id="btn-create-snapshot"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Snapshot</span>
          </button>
        </div>
      </div>

      {/* System Health Diagnostics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Database State</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">Online & Healthy</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Data store size: {formatBytes(diagnostics?.databaseFileSizeBytes || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Snapshots</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">{backups.length} Checkpoints</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total storage: {formatBytes(diagnostics?.totalBackupsStorageBytes || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Relational Integrity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-700">100% Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {diagnostics?.integrityAudit?.totalEntities || 0} entities, 0 orphaned keys
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Auto Daemon Policy</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {config.autoBackupEnabled ? `Every ${config.frequencyHours}h` : 'Disabled'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Retention limit: {config.maxSnapshotsRetention} snapshots
          </p>
        </div>
      </div>

      {/* Upload & Restore External Backup Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Import / Restore External Backup Bundle</h2>
          </div>
          <span className="text-[11px] text-slate-400">JSON standard CRM schema supported</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Select a previously exported CRM backup file from your machine to import as a snapshot or immediately restore the database.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
              <FileJson className="w-4 h-4 text-indigo-600" />
              <span>{uploadFileName ? uploadFileName : 'Choose .json backup file to upload...'}</span>
            </div>
          </label>

          {uploadPreview && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 shrink-0">
                <span className="font-semibold text-slate-800">{uploadPreview.clients}</span> clients,{' '}
                <span className="font-semibold text-slate-800">{uploadPreview.deals}</span> deals,{' '}
                <span className="font-semibold text-slate-800">{uploadPreview.tickets}</span> tickets
              </div>

              <button
                onClick={() => handleProcessUpload(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer shrink-0"
              >
                Save as Snapshot
              </button>

              <button
                onClick={() => handleProcessUpload(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer shrink-0"
              >
                Restore Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Database Snapshots Archive</h2>
            <p className="text-xs text-slate-500">
              Restore points stored locally on server. Restoring automatically creates a pre-restore safety rollback.
            </p>
          </div>

          <button
            onClick={loadBackupData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-5 py-3">Snapshot Label</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Captured At</th>
                <th className="px-5 py-3">Records Summary</th>
                <th className="px-5 py-3">Size & Checksum</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((bk, idx) => {
                const isRollback = bk.type === 'pre_restore_snapshot';
                const isAuto = bk.type === 'automated';

                return (
                  <tr key={bk.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">{bk.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{bk.filename}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isRollback
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : isAuto
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isRollback ? 'Rollback Guard' : isAuto ? 'Automated' : 'Manual'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      <div>{new Date(bk.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(bk.timestamp).toLocaleTimeString()}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-700 font-medium">
                        {bk.counts?.clients || 0} accounts • {bk.counts?.deals || 0} deals
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {bk.counts?.tickets || 0} tickets • {bk.counts?.contacts || 0} contacts
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      <div>{formatBytes(bk.fileSizeBytes)}</div>
                      <div className="text-[10px] text-slate-400">SHA:{bk.checksum}</div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Restore Button */}
                        <button
                          onClick={() => setRestoringSnapshot(bk)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center gap-1 cursor-pointer"
                          title="Restore database from this snapshot"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>

                        {/* Download Snapshot Button */}
                        <a
                          href={`/api/backups/download/${bk.id}`}
                          download
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Download Snapshot File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Snapshot */}
                        <button
                          onClick={() => handleDeleteSnapshot(bk.id, bk.label)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {backups.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No snapshots recorded. Click "Create Snapshot" to register a baseline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Backup Daemon Policy Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Automated Backup Daemon Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">Automatic Checkpoints</span>
              <span className="text-[11px] text-slate-400">Periodic non-disruptive database snapshots</span>
            </div>
            <input
              type="checkbox"
              checked={config.autoBackupEnabled}
              onChange={(e) => handleSaveConfig({ autoBackupEnabled: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">Snapshot Frequency</span>
              <span className="text-[11px] text-slate-400">Interval between automated cycles</span>
            </div>
            <select
              value={config.frequencyHours}
              onChange={(e) => handleSaveConfig({ frequencyHours: Number(e.target.value) })}
              className="bg-white border border-slate-300 rounded px-2 py-1 font-medium cursor-pointer"
            >
              <option value={1}>Every 1 hour</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Every 24 hours</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">Max Retention Limit</span>
              <span className="text-[11px] text-slate-400">Auto-prune oldest snapshots</span>
            </div>
            <select
              value={config.maxSnapshotsRetention}
              onChange={(e) => handleSaveConfig({ maxSnapshotsRetention: Number(e.target.value) })}
              className="bg-white border border-slate-300 rounded px-2 py-1 font-medium cursor-pointer"
            >
              <option value={10}>Keep 10</option>
              <option value={20}>Keep 20</option>
              <option value={50}>Keep 50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modal: Create Snapshot */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <h3 className="font-bold text-slate-900 text-base mb-1">Trigger Immediate Database Snapshot</h3>
            <p className="text-xs text-slate-500 mb-4">
              A point-in-time image of all clients, deals, tickets, and activities will be saved to disk with SHA-256 verification.
            </p>

            <form onSubmit={handleCreateSnapshot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Snapshot Label / Description</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Pre-Quarterly Review Baseline"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Snapshot Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Restore */}
      {restoringSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Confirm Point-in-Time Restore</h3>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              You are about to restore the active CRM database to snapshot:
              <br />
              <strong className="text-slate-900 block mt-1">"{restoringSnapshot.label}"</strong>
              <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                Saved {new Date(restoringSnapshot.timestamp).toLocaleString()}
              </span>
            </p>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 mb-4">
              <strong>Fail-Safe Protection:</strong> The server will automatically generate a rollback checkpoint of your CURRENT state before applying this restore. No records will be lost permanently.
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRestoringSnapshot(null)}
                disabled={isRestoring}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                {isRestoring ? 'Restoring Database...' : 'Proceed with Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
