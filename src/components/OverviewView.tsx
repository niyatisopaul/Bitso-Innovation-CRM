import React from 'react';
import { 
  Users, 
  TrendingUp, 
  LifeBuoy, 
  Activity as ActivityIcon, 
  HardDriveDownload, 
  ArrowUpRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { CRMStats, Department, Activity, Deal } from '../types';

interface OverviewViewProps {
  stats: CRMStats | null;
  activities: Activity[];
  deals: Deal[];
  currentDepartment: Department | 'all';
  onNavigate: (tab: any) => void;
  onQuickBackup: () => void;
  onOpenAiInsights: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  activities,
  deals,
  currentDepartment,
  onNavigate,
  onQuickBackup,
  onOpenAiInsights,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const departmentMeta: Record<Department, { label: string; iconColor: string; bg: string }> = {
    it_tech: { label: 'IT & Tech', iconColor: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    engineering: { label: 'IT & Tech', iconColor: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    sales: { label: 'Sales & Commercial', iconColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    support: { label: 'Customer Support', iconColor: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    operations: { label: 'Operations & Infra', iconColor: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    finance: { label: 'Finance & Accounts', iconColor: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
    marketing: { label: 'Growth Marketing', iconColor: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    hr: { label: 'HR & Talent Ops', iconColor: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & KPI Summary Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Department Operations Command
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentDepartment === 'all' ? 'All Units' : departmentMeta[currentDepartment]?.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-department pipeline metrics, ticket SLA monitoring, and integrated database backup resilience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="overview-ai-brief-btn"
            onClick={onOpenAiInsights}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
          >
            Generate Department Briefing
          </button>
          <button
            id="overview-quick-backup-btn"
            onClick={onQuickBackup}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Snapshot Database
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Department Workforce / Employees */}
        <div 
          onClick={() => onNavigate('employees')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bitso Workforce</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.totalEmployees || 0}
            </span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Directory
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>7 Departments active</span>
          </p>
        </div>

        {/* Total Accounts */}
        <div 
          onClick={() => onNavigate('clients')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.totalClients || 0}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {stats?.activeClients || 0} Good Standing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Avg Health:</span>
            <span className="font-semibold text-slate-700">{stats?.averageHealthScore || 0}%</span>
          </p>
        </div>

        {/* Pipeline Value */}
        <div 
          onClick={() => onNavigate('deals')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pipeline Momentum</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats?.totalPipelineValue || 0)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Won: {formatCurrency(stats?.wonRevenue || 0)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Cross-department deals in cycle</p>
        </div>

        {/* Service Tickets */}
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Service Tickets</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.openTickets || 0}
            </span>
            {Number(stats?.urgentTickets || 0) > 0 ? (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {stats?.urgentTickets} Urgent
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                SLAs Healthy
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">Support & operations resolutions</p>
        </div>

        {/* Backup Resilience */}
        <div 
          onClick={() => onNavigate('backup')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Backup Resilience</span>
            <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <HardDriveDownload className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.backupCount || 0} <span className="text-xs font-normal text-slate-500">snapshots</span>
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {stats?.latestBackup ? `Last: ${new Date(stats.latestBackup.timestamp).toLocaleTimeString()}` : 'Automated baseline'}
          </p>
        </div>

      </div>

      {/* Department Breakdown Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bitso Innovation Department Matrix</h2>
            <p className="text-xs text-slate-500">Personnel count, client accounts, pipeline value, and tickets across each operating division.</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md">7 Functional Divisions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {(['it_tech', 'sales', 'support', 'operations', 'finance', 'marketing', 'hr'] as Department[]).map((dep) => {
            const data = stats?.departmentBreakdown?.[dep] || (dep === 'it_tech' ? stats?.departmentBreakdown?.['engineering'] : null) || { clientCount: 0, dealCount: 0, pipelineValue: 0, openTickets: 0, employeeCount: 0 };
            const meta = departmentMeta[dep];
            return (
              <div 
                key={dep}
                className={`p-3.5 rounded-lg border ${meta.bg} flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{meta.label}</span>
                  </div>
                  <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Team:</span>
                      <span className="font-bold text-indigo-700">{data.employeeCount || 0} emp</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Clients:</span>
                      <span className="font-semibold text-slate-800">{data.clientCount}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Deals:</span>
                      <span className="font-semibold text-slate-800">{data.dealCount}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Pipeline:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(data.pipelineValue)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Tickets:</span>
                      <span className={`font-semibold ${data.openTickets > 0 ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>{data.openTickets}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                  <button 
                    onClick={() => onNavigate('employees')}
                    className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5 cursor-pointer"
                  >
                    View Roster <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Pipeline Highlights + Cross-Department Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Pipeline Deals */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">High-Priority Opportunities</h2>
              <p className="text-xs text-slate-500">Key deals currently navigating through departmental review cycles.</p>
            </div>
            <button
              onClick={() => onNavigate('deals')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Open Pipeline Board <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {deals.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-500 text-xs">
                <p className="font-semibold text-slate-700">No active opportunities in pipeline</p>
                <p className="text-slate-400 mt-1">Navigate to Pipeline to register deals and track departmental revenue.</p>
                <button
                  onClick={() => onNavigate('deals')}
                  className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Create Opportunity
                </button>
              </div>
            ) : (
              deals.slice(0, 4).map((deal) => (
                <div 
                  key={deal.id}
                  className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{deal.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-200 text-slate-700 uppercase">
                        {deal.stage}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>{deal.clientName}</span>
                      <span>•</span>
                      <span className="capitalize">{deal.department} Dept</span>
                      <span>•</span>
                      <span>Lead: {deal.owner}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-slate-900">{formatCurrency(deal.value)}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{deal.probability}% win probability</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cross-Department Activity Stream */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Intercom</h2>
              <p className="text-xs text-slate-500">Live handoffs, escalations, meetings, and backup logs.</p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex gap-3 text-xs">
                <div className="mt-0.5">
                  {act.type === 'backup' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  ) : act.type === 'meeting' ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  ) : act.type === 'handoff' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                      <ActivityIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate">{act.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-2 mt-0.5">{act.description}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>by {act.performedBy}</span>
                    {act.department && (
                      <span className="uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                        {act.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
