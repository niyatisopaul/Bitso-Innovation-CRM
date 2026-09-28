import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  LifeBuoy, 
  ContactRound, 
  HardDriveDownload, 
  History,
  ShieldCheck,
  Server,
  Building2,
  Briefcase,
  Database
} from 'lucide-react';
import { CRMStats } from '../types';

export type ViewTab = 'overview' | 'employees' | 'clients' | 'deals' | 'tickets' | 'contacts' | 'database' | 'backup' | 'audit';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  stats: CRMStats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
}) => {
  const menuItems = [
    {
      id: 'overview' as ViewTab,
      label: 'Department Command',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'employees' as ViewTab,
      label: 'Department Employees',
      icon: Users,
      badge: stats?.totalEmployees ?? 0,
      badgeColor: 'bg-indigo-900 text-indigo-200 border border-indigo-700/50',
    },
    {
      id: 'clients' as ViewTab,
      label: 'Accounts & Clients',
      icon: Building2,
      badge: stats?.totalClients || 0,
    },
    {
      id: 'deals' as ViewTab,
      label: 'Pipeline & Deals',
      icon: TrendingUp,
      badge: stats && stats.totalPipelineValue > 0 ? `$${Math.round(stats.totalPipelineValue / 1000)}k` : null,
    },
    {
      id: 'tickets' as ViewTab,
      label: 'Tickets & Service',
      icon: LifeBuoy,
      badge: stats?.openTickets ? `${stats.openTickets} open` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'contacts' as ViewTab,
      label: 'Stakeholder Directory',
      icon: ContactRound,
      badge: stats?.totalContacts || 0,
    },
    {
      id: 'database' as ViewTab,
      label: 'Database Studio',
      icon: Database,
      badge: 'SQLite',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-600/50',
      highlight: true,
    },
    {
      id: 'backup' as ViewTab,
      label: 'Backup & Recovery Hub',
      icon: HardDriveDownload,
      badge: stats?.backupCount ? `${stats.backupCount} saved` : 'Active',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-semibold',
    },
    {
      id: 'audit' as ViewTab,
      label: 'Cross-Dept Activity',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside id="crm-sidebar" className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-4rem)]">
      {/* Navigation list */}
      <div className="p-4 flex-1 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Workspace Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : item.highlight
                  ? 'text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-indigo-500/50 text-white'
                      : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistent Backup System Status Widget in Sidebar footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="rounded-lg p-3 bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Stack Backup</span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
              Operational
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Persistent storage with automated checkpoints and instant restoration.
          </p>
          <button
            id="sidebar-quick-go-backup"
            onClick={() => onSelectTab('backup')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded hover:bg-emerald-900/40 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Manage Backups
          </button>
        </div>
      </div>
    </aside>
  );
};
