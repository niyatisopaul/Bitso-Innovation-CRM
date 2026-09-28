import React, { useState } from 'react';
import { 
  Plus, 
  LifeBuoy, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X,
  User,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';
import { Ticket, TicketPriority, TicketStatus, Department, Client } from '../types';

interface TicketsViewProps {
  tickets: Ticket[];
  clients: Client[];
  currentDepartment: Department | 'all';
  onAddTicket: (ticket: Partial<Ticket>) => Promise<void>;
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  onUpdateStatus: (id: string, status: TicketStatus, resolutionSummary?: string) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  clients,
  currentDepartment,
  onAddTicket,
  onUpdateTicket,
  onUpdateStatus,
  onDeleteTicket,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const [formData, setFormData] = useState<Partial<Ticket>>({
    title: '',
    clientId: '',
    clientName: '',
    department: currentDepartment === 'all' ? 'support' : currentDepartment,
    priority: 'medium',
    status: 'open',
    assignedTo: 'Sarah Jenkins (Support)',
    dueDate: new Date(Date.now() + 48 * 3600000).toISOString(),
    description: '',
  });

  const priorityBadges: Record<TicketPriority, { label: string; class: string }> = {
    urgent: { label: 'Urgent SLA', class: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' },
    high: { label: 'High', class: 'bg-amber-100 text-amber-800 border-amber-200' },
    medium: { label: 'Medium', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    low: { label: 'Low', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const statusBadges: Record<TicketStatus, { label: string; class: string }> = {
    open: { label: 'Open', class: 'bg-slate-100 text-slate-800' },
    in_progress: { label: 'In Progress', class: 'bg-amber-50 text-amber-800 border border-amber-200' },
    waiting: { label: 'Waiting Client', class: 'bg-purple-50 text-purple-800 border border-purple-200' },
    resolved: { label: 'Resolved', class: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  };

  const filteredTickets = tickets.filter((t) => {
    if (currentDepartment !== 'all' && t.department !== currentDepartment) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingTicket(null);
    const defaultClient = clients[0];
    setFormData({
      title: '',
      clientId: defaultClient ? defaultClient.id : '',
      clientName: defaultClient ? defaultClient.name : '',
      department: currentDepartment === 'all' ? 'support' : currentDepartment,
      priority: 'medium',
      status: 'open',
      assignedTo: 'Sarah Jenkins (Support)',
      dueDate: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0],
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData(ticket);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientName) return;

    if (editingTicket) {
      await onUpdateTicket(editingTicket.id, formData);
    } else {
      await onAddTicket(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Service Requests & Ticket Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-department SLA tracking, escalation routing, and incident resolutions.
          </p>
        </div>

        <button
          id="btn-file-ticket"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          File Service Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter By:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting on Client</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          {filteredTickets.length} active service items
        </span>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => {
          const priority = priorityBadges[ticket.priority] || priorityBadges.medium;
          const status = statusBadges[ticket.status] || statusBadges.open;
          const isResolved = ticket.status === 'resolved';

          return (
            <div
              key={ticket.id}
              className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                ticket.priority === 'urgent' && !isResolved
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priority.class}`}>
                      {priority.label}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${status.class}`}>
                      {status.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ticket.department === 'it_tech' || (ticket.department as string) === 'engineering' ? 'IT & Tech' : ticket.department} Dept
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-slate-600">
                    {ticket.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-300" />
                      <strong className="text-slate-700 font-medium">{ticket.clientName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-300" />
                      Assigned: {ticket.assignedTo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      Due: {new Date(ticket.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  {ticket.resolutionSummary && (
                    <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      <strong>Resolution Note:</strong> {ticket.resolutionSummary}
                    </div>
                  )}
                </div>

                {/* Status Switcher & Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {!isResolved ? (
                    <button
                      onClick={() => {
                        const note = prompt('Add optional resolution summary:');
                        onUpdateStatus(ticket.id, 'resolved', note || 'Resolved successfully by assigned department.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(ticket.id, 'in_progress')}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Reopen
                    </button>
                  )}

                  {ticket.status === 'open' && (
                    <button
                      onClick={() => onUpdateStatus(ticket.id, 'in_progress')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      Start Work
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(ticket)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                    title="Edit Ticket"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Remove ticket ${ticket.ticketNumber}?`)) onDeleteTicket(ticket.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTickets.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tickets found</p>
            <p className="text-xs text-slate-400 mt-1">All service requests in this view are resolved.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTicket ? 'Edit Ticket' : 'File Department Service Ticket'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Ticket Subject / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Ingress latency alert on primary EU cluster"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Client Account *</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => {
                      const selected = clients.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        clientId: e.target.value,
                        clientName: selected ? selected.name : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Choose Account --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Handling Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                  >
                    <option value="it_tech">IT & Tech</option>
                    {(formData.department as string) === 'engineering' && <option value="engineering">IT & Tech</option>}
                    <option value="support">Support</option>
                    <option value="operations">Operations</option>
                    <option value="sales">Sales</option>
                    <option value="finance">Finance</option>
                    <option value="marketing">Marketing</option>
                    <option value="hr">HR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Priority / SLA Tier</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="urgent">Urgent (4hr SLA)</option>
                    <option value="high">High (24hr SLA)</option>
                    <option value="medium">Medium (48hr SLA)</option>
                    <option value="low">Low (Standard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Current Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting Client</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assigned Handler</label>
                  <input
                    type="text"
                    value={formData.assignedTo || ''}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Resolution Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Detailed Issue Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Symptoms, stack traces, client impact details..."
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
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
                  {editingTicket ? 'Save Ticket' : 'File Ticket'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
