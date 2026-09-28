import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Activity, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { Client, Department, ClientTier, ClientStatus } from '../types';

interface ClientsViewProps {
  clients: Client[];
  currentDepartment: Department | 'all';
  onAddClient: (client: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  currentDepartment,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    industry: '',
    tier: 'Mid-Market',
    primaryDepartment: currentDepartment === 'all' ? 'sales' : currentDepartment,
    status: 'active',
    healthScore: 85,
    annualValue: 50000,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    assignedLead: '',
    notes: '',
  });

  const filteredClients = clients.filter((client) => {
    if (currentDepartment !== 'all' && client.primaryDepartment !== currentDepartment) return false;
    if (statusFilter !== 'all' && client.status !== statusFilter) return false;
    if (tierFilter !== 'all' && client.tier !== tierFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(q) ||
        client.contactName?.toLowerCase().includes(q) ||
        client.industry?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      industry: 'Enterprise Software',
      tier: 'Mid-Market',
      primaryDepartment: currentDepartment === 'all' ? 'sales' : currentDepartment,
      status: 'active',
      healthScore: 85,
      annualValue: 50000,
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      assignedLead: 'Marcus Vance',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (editingClient) {
      await onUpdateClient(editingClient.id, formData);
    } else {
      await onAddClient(formData);
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statusBadges: Record<ClientStatus, { label: string; class: string }> = {
    active: { label: 'Active', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    onboarding: { label: 'Onboarding', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    churn_risk: { label: 'Churn Risk', class: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
    dormant: { label: 'Dormant', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Accounts & Client Organizations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Managing {clients.length} enterprise accounts across departments with live health scores.
          </p>
        </div>

        <button
          id="btn-add-client"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="client-search-input"
            type="text"
            placeholder="Search account, contact, industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            id="filter-client-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="churn_risk">Churn Risk</option>
            <option value="dormant">Dormant</option>
          </select>

          {/* Tier Filter */}
          <select
            id="filter-client-tier"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Strategic">Strategic</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="Startup">Startup</option>
          </select>

          <span className="text-xs text-slate-400 ml-auto md:ml-2">
            Showing {filteredClients.length} of {clients.length}
          </span>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const badge = statusBadges[client.status] || statusBadges.active;
          const isHighHealth = client.healthScore >= 80;
          const isMidHealth = client.healthScore >= 60 && client.healthScore < 80;

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {client.tier}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">
                      {client.name}
                    </h3>
                    <p className="text-xs text-slate-500">{client.industry}</p>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Financials & Department */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Annual Value</span>
                    <span className="font-bold text-slate-900">{formatCurrency(client.annualValue)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Lead Dept</span>
                    <span className="font-semibold text-slate-800 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 uppercase">
                      {client.primaryDepartment === 'it_tech' || (client.primaryDepartment as string) === 'engineering' ? 'IT & Tech' : client.primaryDepartment}
                    </span>
                  </div>
                </div>

                {/* Health Score Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-400">Account Health</span>
                    <span className={`font-bold ${isHighHealth ? 'text-emerald-600' : isMidHealth ? 'text-amber-600' : 'text-rose-600'}`}>
                      {client.healthScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isHighHealth ? 'bg-emerald-500' : isMidHealth ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${client.healthScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Key Stakeholder Info */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="font-medium text-slate-800 flex items-center justify-between">
                    <span>{client.contactName || 'No contact assigned'}</span>
                    <span className="text-[10px] text-slate-400">Lead: {client.assignedLead}</span>
                  </div>
                  {client.contactEmail && (
                    <div className="text-slate-500 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{client.contactEmail}</span>
                    </div>
                  )}
                  {client.contactPhone && (
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{client.contactPhone}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                    "{client.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(client)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                  title="Edit Account"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Archive and remove account for ${client.name}?`)) {
                      onDeleteClient(client.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No accounts match criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query.</p>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingClient ? 'Edit Account Information' : 'Register New Client Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Apex Global Corp"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry || ''}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Fintech, Healthcare"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Account Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as ClientTier })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Strategic">Strategic</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="Startup">Startup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Primary Department</label>
                  <select
                    value={formData.primaryDepartment}
                    onChange={(e) => setFormData({ ...formData, primaryDepartment: e.target.value as Department })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                  >
                    <option value="it_tech">IT & Tech</option>
                    {(formData.primaryDepartment as string) === 'engineering' && <option value="engineering">IT & Tech</option>}
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="operations">Operations</option>
                    <option value="finance">Finance</option>
                    <option value="marketing">Marketing</option>
                    <option value="hr">HR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="churn_risk">Churn Risk</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Annual Contract Value ($)</label>
                  <input
                    type="number"
                    value={formData.annualValue || 0}
                    onChange={(e) => setFormData({ ...formData, annualValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Health Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.healthScore || 80}
                    onChange={(e) => setFormData({ ...formData, healthScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-2">Primary Stakeholder Contact</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName || ''}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assigned Lead / Owner</label>
                  <input
                    type="text"
                    value={formData.assignedLead || ''}
                    onChange={(e) => setFormData({ ...formData, assignedLead: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Account Executive"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="jane@company.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Account Notes & Context</label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="SLA agreements, upcoming renewals, technical requirements..."
                  ></textarea>
                </div>
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
                  {editingClient ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
