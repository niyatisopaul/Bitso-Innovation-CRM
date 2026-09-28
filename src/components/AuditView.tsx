import React, { useState } from 'react';
import { 
  History, 
  Plus, 
  Filter, 
  Activity as ActivityIcon, 
  Users, 
  ShieldCheck, 
  Phone, 
  Mail, 
  ArrowUpRight,
  FileText,
  Building2
} from 'lucide-react';
import { Activity, Department, ActivityType } from '../types';

interface AuditViewProps {
  activities: Activity[];
  currentDepartment: Department | 'all';
  onLogActivity: (act: Partial<Activity>) => Promise<void>;
}

export const AuditView: React.FC<AuditViewProps> = ({
  activities,
  currentDepartment,
  onLogActivity,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Activity>>({
    title: '',
    clientName: 'General Inter-Department',
    department: currentDepartment === 'all' ? 'sales' : currentDepartment,
    type: 'meeting',
    description: '',
    performedBy: 'Account Executive',
  });

  const filtered = activities.filter((act) => {
    if (currentDepartment !== 'all' && act.department !== currentDepartment && act.department !== 'system') {
      return false;
    }
    if (typeFilter !== 'all' && act.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    await onLogActivity(formData);
    setIsModalOpen(false);
    setFormData({
      title: '',
      clientName: 'General Inter-Department',
      department: currentDepartment === 'all' ? 'sales' : currentDepartment,
      type: 'meeting',
      description: '',
      performedBy: 'Account Executive',
    });
  };

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case 'backup':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'meeting':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'call':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'handoff':
        return <ArrowUpRight className="w-4 h-4 text-amber-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Cross-Department Intercom & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent inter-departmental communications, handoffs, client notes, and security logs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Communication
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter Event Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">All Events</option>
            <option value="meeting">Meetings</option>
            <option value="call">Calls</option>
            <option value="handoff">Handoffs</option>
            <option value="note">Notes</option>
            <option value="backup">Backup Snapshots</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filtered.length} entries
        </span>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
          {filtered.map((act) => (
            <div key={act.id} className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 z-10 shadow-2xs">
                {getIcon(act.type)}
              </div>

              <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-xs text-slate-900">
                    {act.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {act.description}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-200/50 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Performed by: <strong className="text-slate-800 font-semibold">{act.performedBy}</strong></span>
                    {act.clientName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {act.clientName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 rounded text-slate-700 uppercase">
                    {act.department === 'it_tech' || (act.department as string) === 'engineering' ? 'IT & Tech' : act.department}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              No activity matching criteria.
            </div>
          )}
        </div>
      </div>

      {/* Log Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <h3 className="font-bold text-slate-900 text-base mb-1">Log Department Interaction</h3>
            <p className="text-xs text-slate-500 mb-4">
              Record a client touchpoint, cross-team handoff, or meeting note.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Q4 Executive Strategy Sync"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="handoff">Handoff</option>
                    <option value="note">Internal Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                  >
                    <option value="it_tech">IT & Tech</option>
                    {(formData.department as string) === 'engineering' && <option value="engineering">IT & Tech</option>}
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="operations">Operations</option>
                    <option value="finance">Finance</option>
                    <option value="marketing">Marketing</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Client / Project Reference</label>
                <input
                  type="text"
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes & Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Key decisions, commitments, action items..."
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
