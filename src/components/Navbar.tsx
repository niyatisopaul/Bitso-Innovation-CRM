import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Download, 
  RefreshCw, 
  Sparkles,
  Layers,
  ArrowUpDown,
  LogOut,
  User,
  KeyRound,
  Check
} from 'lucide-react';
import { Department, BackupSnapshot, AuthUser } from '../types';
import { api } from '../lib/api';

interface NavbarProps {
  currentDepartment: Department | 'all';
  onSelectDepartment: (dep: Department | 'all') => void;
  latestBackup: BackupSnapshot | null;
  onQuickBackup: () => void;
  onRefresh: () => void;
  onOpenAiInsights: () => void;
  isBackingUp: boolean;
  adminUser: AuthUser | null;
  onLogout: () => void;
  onResetToBlank?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDepartment,
  onSelectDepartment,
  latestBackup,
  onQuickBackup,
  onRefresh,
  onOpenAiInsights,
  isBackingUp,
  adminUser,
  onLogout,
  onResetToBlank,
  onNavigateHome,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);
    setIsChangingPass(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPassSuccess('Password updated successfully!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setPassSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password');
    } finally {
      setIsChangingPass(false);
    }
  };
  const departments: { id: Department | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'All Depts', color: 'bg-slate-800 text-white' },
    { id: 'it_tech', label: 'IT & Tech', color: 'bg-blue-600 text-white' },
    { id: 'sales', label: 'Sales', color: 'bg-emerald-600 text-white' },
    { id: 'support', label: 'Support', color: 'bg-purple-600 text-white' },
    { id: 'operations', label: 'Operations', color: 'bg-amber-600 text-white' },
    { id: 'finance', label: 'Finance', color: 'bg-cyan-600 text-white' },
    { id: 'marketing', label: 'Marketing', color: 'bg-rose-600 text-white' },
    { id: 'hr', label: 'HR', color: 'bg-teal-600 text-white' },
  ];

  const formatTime = (ts?: string) => {
    if (!ts) return 'Baseline active';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Active';
    }
  };

  return (
    <header id="crm-top-navbar" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-tight">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Bitso Innovation CRM</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Unified Cross-Department Pipeline & Workforce Management</p>
            </div>
          </div>

          {/* Department selector pill bar */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <span className="px-2 py-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Layers className="w-3 h-3" /> Dept:
            </span>
            {departments.map((dept) => {
              const isSelected = currentDepartment === dept.id || (dept.id === 'it_tech' && (currentDepartment as string) === 'engineering');
              return (
                <button
                  key={dept.id}
                  id={`nav-dept-${dept.id}`}
                  onClick={() => onSelectDepartment(dept.id)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {dept.label}
                </button>
              );
            })}
          </div>

          {/* Right Action Tools: Backup Status, Quick Snapshot, Refresh, AI Assistant */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live backup health pill */}
            <div 
              title={`Latest Backup: ${latestBackup?.timestamp || 'Just now'}`}
              className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <div className="text-left">
                <div className="font-semibold text-slate-800 text-[11px] leading-tight">
                  Backup Engine
                </div>
                <div className="text-[10px] text-slate-500">
                  {latestBackup ? `Synced ${formatTime(latestBackup.timestamp)}` : 'Baseline saved'}
                </div>
              </div>
            </div>

            {/* AI Department Briefing button */}
            <button
              id="nav-ai-briefing-btn"
              onClick={onOpenAiInsights}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">AI Briefing</span>
            </button>

            {/* Quick backup trigger */}
            <button
              id="nav-quick-backup-btn"
              onClick={onQuickBackup}
              disabled={isBackingUp}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : 'text-emerald-400'}`} />
              <span>{isBackingUp ? 'Backing up...' : 'Snapshot'}</span>
            </button>

            {/* Download File Package button */}
            <a
              id="nav-download-archive-btn"
              href="/api/download-archive"
              download="bitso_innovation_crm.tar.gz"
              title="Download entire application in file form (.tar.gz archive)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700/10 text-emerald-700 hover:bg-emerald-700/20 border border-emerald-600/30 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Download File</span>
            </a>

            {/* Home Navigation button */}
            {onNavigateHome && (
              <button
                id="nav-home-btn"
                onClick={onNavigateHome}
                title="Return to Public Home Page"
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer font-medium flex items-center gap-1"
              >
                <span>Home</span>
              </button>
            )}

            {/* Refresh */}
            <button
              id="nav-refresh-btn"
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Admin User Profile & Sign Out */}
            {adminUser && (
              <div className="flex items-center pl-2 border-l border-slate-200 gap-2">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {adminUser.name || 'Admin'}
                  </span>
                  <span className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">
                    {adminUser.role || 'Admin'}
                  </span>
                </div>

                <button
                  id="nav-change-password-btn"
                  onClick={() => setIsPasswordModalOpen(true)}
                  title="Change Password"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-600" />
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  title="Sign Out of CRM"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition-colors border border-rose-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}

            {/* RIGHT ABOVE CORNER: BITSO INNOVATION NAME */}
            <div 
              id="navbar-bitso-innovation-corner-badge"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-indigo-500/40 text-white shadow-xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30" />
              <span className="font-extrabold text-xs tracking-wider uppercase font-mono text-white whitespace-nowrap">
                Bitso Innovation
              </span>
            </div>
          </div>

        </div>

        {/* Mobile department selector */}
        <div className="md:hidden py-2 border-t border-slate-100 overflow-x-auto flex gap-1 scrollbar-none">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => onSelectDepartment(dept.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                currentDepartment === dept.id || (dept.id === 'it_tech' && (currentDepartment as string) === 'engineering')
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              Change Admin Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update password credentials for <span className="font-semibold text-slate-700">{adminUser?.email}</span>
            </p>

            {passError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {passSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isChangingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
