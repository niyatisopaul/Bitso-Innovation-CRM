import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Terminal, 
  Table as TableIcon, 
  Download, 
  FileCode, 
  Zap, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Shield, 
  Cpu, 
  Play, 
  Trash2, 
  Plus, 
  Copy, 
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { api } from '../lib/api';
import { DatabaseInfo, DatabaseTable, SqlQueryResult } from '../types';

interface DatabaseViewProps {
  onRefreshAllData: () => Promise<void>;
  showNotification: (msg: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  onRefreshAllData,
  showNotification
}) => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('employees');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[]; totalRows: number; page: number } | null>(null);
  const [tableSearch, setTableSearch] = useState<string>('');
  
  // Active View Tab: 'terminal' | 'browser' | 'architecture'
  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'browser' | 'architecture'>('terminal');

  // SQL Terminal State
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM employees ORDER BY joined_date DESC LIMIT 25;');
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Optimization & Loading State
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Load database metadata
  const loadDbInfo = useCallback(async () => {
    try {
      const info = await api.getDatabaseInfo();
      setDbInfo(info);
      setTables(info.tables || []);
    } catch (err: any) {
      console.error('Failed to load database info:', err);
    }
  }, []);

  // Load table data
  const loadTableData = useCallback(async (tableName: string, search: string = '') => {
    setIsLoadingTable(true);
    try {
      const data = await api.getTableData(tableName, 50, 0, search);
      setTableData(data);
    } catch (err: any) {
      console.error(`Failed to load data for table ${tableName}:`, err);
    } finally {
      setIsLoadingTable(false);
    }
  }, []);

  useEffect(() => {
    loadDbInfo();
  }, [loadDbInfo]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, tableSearch);
    }
  }, [selectedTable, tableSearch, loadTableData]);

  // Execute SQL
  const handleExecuteSql = async (queryToRun?: string) => {
    const q = (queryToRun || sqlQuery).trim();
    if (!q) return;

    setIsExecuting(true);
    setQueryError(null);
    try {
      const res = await api.runSqlQuery(q);
      setQueryResult(res);
      showNotification(`Query executed in ${res.executionTimeMs}ms (${res.rowCount} rows)`);
      if (!res.isSelect) {
        // Refresh table info & app data
        await loadDbInfo();
        await onRefreshAllData();
      }
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSql();
    }
  };

  // Run Optimization
  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.optimizeDatabase();
      showNotification(`Database optimized in ${res.executionTimeMs}ms. Integrity: ${res.integrity}`);
      await loadDbInfo();
    } catch (err: any) {
      alert(`Optimization failed: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Seed Sample Records
  const handleSeedSample = async () => {
    if (!window.confirm('Seed database with multi-department sample employees, accounts, deals, and tickets?')) return;
    setIsSeeding(true);
    try {
      const res = await api.seedSampleDatabase();
      showNotification(res.message);
      await loadDbInfo();
      if (selectedTable) await loadTableData(selectedTable);
      await onRefreshAllData();
    } catch (err: any) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Reset to Blank
  const handleResetBlank = async () => {
    if (!window.confirm('Are you sure you want to reset the database to a blank workspace? All current records will be cleared.')) return;
    setIsResetting(true);
    try {
      const res = await api.resetBlankDatabase();
      showNotification(res.message);
      await loadDbInfo();
      if (selectedTable) await loadTableData(selectedTable);
      await onRefreshAllData();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Quick SQL Query Presets
  const quickQueries = [
    { label: 'All Employees', query: 'SELECT id, name, email, department, role, status FROM employees ORDER BY department ASC;' },
    { label: 'Dept Headcount', query: 'SELECT department, count(*) as total_staff FROM employees GROUP BY department ORDER BY total_staff DESC;' },
    { label: 'Active Clients', query: "SELECT id, name, company, industry, primary_department, health_score, contract_value FROM clients WHERE status = 'active';" },
    { label: 'Pipeline by Stage', query: 'SELECT stage, count(*) as deals_count, sum(value) as total_pipeline_value FROM deals GROUP BY stage;' },
    { label: 'Urgent Tickets', query: "SELECT ticket_number, title, department, priority, status, assigned_to_name FROM tickets WHERE priority = 'urgent';" },
    { label: 'Recent Activities', query: 'SELECT type, department, title, performed_by, timestamp FROM activities ORDER BY timestamp DESC LIMIT 20;' },
    { label: 'Users & Roles', query: 'SELECT id, email, name, role, department, created_at, last_login FROM users;' },
    { label: 'Table Schemas', query: "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" }
  ];

  const currentTableInfo = tables.find(t => t.name === selectedTable);

  return (
    <div className="space-y-6">
      {/* Engine Status Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight">Embedded Relational Database Studio</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    SQLite 3 Live
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  Native WebAssembly SQLite engine with full ACID compliance, ANSI SQL support, and persistent binary storage.
                </p>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>File: {dbInfo?.fileName || 'crm_database.sqlite'}</span>
                <span className="text-slate-400">({dbInfo ? `${Math.round(dbInfo.fileSizeBytes / 1024)} KB` : '...'})</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tables: {dbInfo?.tablesCount || tables.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Records: {dbInfo?.totalRecords || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Foreign Keys: ON</span>
              </div>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/api/database/download-sqlite"
              download="crm_database.sqlite"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition shadow-sm"
              title="Download raw SQLite .sqlite binary file"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Download .sqlite DB
            </a>

            <a
              href="/api/database/export-sql"
              download="crm_database_dump.sql"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition shadow-sm"
              title="Download ANSI SQL dump script with CREATE and INSERT statements"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              Export SQL Dump
            </a>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition shadow-sm disabled:opacity-50"
              title="Run VACUUM, REINDEX and PRAGMA integrity_check"
            >
              <Zap className={`w-4 h-4 text-amber-400 ${isOptimizing ? 'animate-spin' : ''}`} />
              {isOptimizing ? 'Optimizing...' : 'Optimize DB'}
            </button>

            <button
              onClick={handleSeedSample}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
              title="Seed representative enterprise records into the database"
            >
              <Plus className="w-4 h-4" />
              {isSeeding ? 'Seeding...' : 'Seed Sample Records'}
            </button>

            <button
              onClick={handleResetBlank}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium transition disabled:opacity-50"
              title="Wipe records and reset database to empty blank state"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              {isResetting ? 'Resetting...' : 'Reset Blank'}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mt-6 pt-2 gap-8 text-sm">
          <button
            onClick={() => setActiveSubTab('terminal')}
            className={`flex items-center gap-2 pb-3 font-medium transition border-b-2 ${
              activeSubTab === 'terminal'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            SQL Terminal & Query Runner
          </button>
          <button
            onClick={() => setActiveSubTab('browser')}
            className={`flex items-center gap-2 pb-3 font-medium transition border-b-2 ${
              activeSubTab === 'browser'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Visual Table Browser & Schema Explorer
          </button>
          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`flex items-center gap-2 pb-3 font-medium transition border-b-2 ${
              activeSubTab === 'architecture'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Architecture & Migrations
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SQL TERMINAL & QUERY RUNNER */}
      {activeSubTab === 'terminal' && (
        <div className="space-y-6">
          {/* SQL Editor Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-xs font-mono text-slate-400 ml-2">SQLite Query Console — ANSI SQL</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">Press Ctrl+Enter or Cmd+Enter to run</span>
                <button
                  onClick={() => handleExecuteSql()}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                  {isExecuting ? 'Executing...' : 'Run Query'}
                </button>
              </div>
            </div>

            {/* Query Presets */}
            <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-500 font-medium shrink-0 text-[11px] uppercase tracking-wider">Presets:</span>
              {quickQueries.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSqlQuery(preset.query);
                    handleExecuteSql(preset.query);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap transition text-xs font-mono"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* SQL Text Area */}
            <div className="p-4 bg-slate-950">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
                placeholder="Enter SQL statement (e.g. SELECT * FROM clients; INSERT INTO ...; CREATE TABLE ...)"
                className="w-full bg-transparent text-emerald-400 font-mono text-sm focus:outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Query Error Notice */}
          {queryError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Execution Error</p>
                <p className="font-mono text-xs mt-1 text-rose-300/90">{queryError}</p>
              </div>
            </div>
          )}

          {/* Query Results Table */}
          {queryResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Query Results</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {queryResult.rowCount} rows
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {queryResult.executionTimeMs} ms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!queryResult || queryResult.columns.length === 0) return;
                      const jsonStr = JSON.stringify(
                        queryResult.values.map(row => {
                          const obj: any = {};
                          queryResult.columns.forEach((col, i) => obj[col] = row[i]);
                          return obj;
                        }),
                        null,
                        2
                      );
                      navigator.clipboard.writeText(jsonStr);
                      showNotification('Results copied to clipboard as JSON');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy JSON
                  </button>
                </div>
              </div>

              {queryResult.columns.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Statement executed successfully. No tabular data returned.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 w-12 text-slate-400 text-center">#</th>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="p-3 font-semibold whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {queryResult.values.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3 text-slate-400 text-center">{rowIdx + 1}</td>
                          {row.map((val, cellIdx) => (
                            <td key={cellIdx} className="p-3 whitespace-nowrap text-slate-800 dark:text-slate-200 max-w-xs truncate">
                              {val === null || val === undefined ? (
                                <span className="text-slate-400 italic">NULL</span>
                              ) : typeof val === 'object' ? (
                                JSON.stringify(val)
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: VISUAL TABLE BROWSER & SCHEMA EXPLORER */}
      {activeSubTab === 'browser' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tables Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Database Tables ({tables.length})
              </h3>
              <div className="space-y-1">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => {
                      setSelectedTable(table.name);
                      setTableSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition ${
                      selectedTable === table.name
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TableIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{table.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans ${
                      selectedTable === table.name
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {table.rowCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Schema Definition Card */}
            {currentTableInfo && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Schema: {currentTableInfo.name} ({currentTableInfo.columns.length} columns)
                </h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {currentTableInfo.columns.map((col) => (
                    <div key={col.cid} className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-mono flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{col.name}</span>
                        {col.pk === 1 && (
                          <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold">PK</span>
                        )}
                      </div>
                      <span className="text-indigo-600 dark:text-indigo-400">{col.type || 'ANY'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Table Data View */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-bold text-slate-900 dark:text-white font-mono">{selectedTable}</h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({tableData?.totalRows || 0} total records)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search within table */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder={`Filter ${selectedTable}...`}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
                    />
                  </div>

                  <button
                    onClick={() => loadTableData(selectedTable, tableSearch)}
                    disabled={isLoadingTable}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    title="Refresh table data"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingTable ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT 50;`);
                      setActiveSubTab('terminal');
                      handleExecuteSql(`SELECT * FROM ${selectedTable} LIMIT 50;`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Query Table
                  </button>
                </div>
              </div>

              {/* Data Table */}
              {isLoadingTable ? (
                <div className="p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                  <span>Loading table records from SQLite...</span>
                </div>
              ) : !tableData || tableData.rows.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  <TableIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">No records found in table "{selectedTable}"</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {tableSearch ? 'Try clearing your search query' : 'Use the CRM modules or click "Seed Sample Records" to populate data'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[550px]">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 w-10 text-slate-400 text-center">#</th>
                        {tableData.columns.map((col) => (
                          <th key={col} className="p-3 font-semibold whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {tableData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 text-slate-400 text-center">{idx + 1}</td>
                          {tableData.columns.map((col) => (
                            <td key={col} className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300 max-w-xs truncate">
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-slate-400 italic">NULL</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ARCHITECTURE & MIGRATIONS */}
      {activeSubTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Database Engine Architecture</h3>
                <p className="text-xs text-slate-500">Embedded SQLite 3 via WebAssembly Engine</p>
              </div>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                The website is powered by a high-performance <strong>SQLite 3</strong> engine executing directly within the Node.js backend runtime.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white text-xs block">Full ACID Guarantees</strong>
                    <span className="text-xs text-slate-500">Atomic transactions, Consistency checks, Isolation, and Durable disk persistence.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white text-xs block">Zero Cloud Lock-In</strong>
                    <span className="text-xs text-slate-500">Entire database lives in <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">crm_database.sqlite</code> with zero external cloud accounts required.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white text-xs block">Bidirectional Disaster Recovery</strong>
                    <span className="text-xs text-slate-500">Automatic real-time sync with backup snapshots and exportable ANSI SQL scripts.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white text-xs block">Relational Performance Indexing</strong>
                    <span className="text-xs text-slate-500">B-tree indexes across departments, statuses, foreign keys, and audit timestamps.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Applied Schema Migrations</h3>
                <p className="text-xs text-slate-500">Tracked in <code className="font-mono text-emerald-600 dark:text-emerald-400">schema_migrations</code> table</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">v1.0.0_initial</span>
                  <span className="text-[10px] text-slate-400">ACTIVE</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-sans text-xs">
                  Base CRM schema: users, sessions, employees, clients, contacts, deals, tickets, activities, database_backups with foreign keys and performance indexes.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSqlQuery('SELECT * FROM schema_migrations;');
                    setActiveSubTab('terminal');
                    handleExecuteSql('SELECT * FROM schema_migrations;');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center justify-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  View Migrations in SQL Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
