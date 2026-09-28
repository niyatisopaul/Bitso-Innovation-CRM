import React, { useState } from 'react';
import { 
  Plus, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  Calendar, 
  User, 
  X,
  Building,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Deal, DealStage, Department, Client } from '../types';

interface DealsPipelineViewProps {
  deals: Deal[];
  clients: Client[];
  currentDepartment: Department | 'all';
  onAddDeal: (deal: Partial<Deal>) => Promise<void>;
  onUpdateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  onUpdateStage: (id: string, stage: DealStage) => Promise<void>;
  onDeleteDeal: (id: string) => Promise<void>;
}

export const DealsPipelineView: React.FC<DealsPipelineViewProps> = ({
  deals,
  clients,
  currentDepartment,
  onAddDeal,
  onUpdateDeal,
  onUpdateStage,
  onDeleteDeal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [formData, setFormData] = useState<Partial<Deal>>({
    title: '',
    clientId: '',
    clientName: '',
    department: currentDepartment === 'all' ? 'sales' : currentDepartment,
    stage: 'lead',
    value: 50000,
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    owner: 'Marcus Vance',
    probability: 20,
    notes: '',
  });

  const stages: { id: DealStage; label: string; color: string; border: string }[] = [
    { id: 'lead', label: 'Lead & Inbound', color: 'bg-slate-100 text-slate-800', border: 'border-slate-300' },
    { id: 'qualified', label: 'Discovery / Qualified', color: 'bg-blue-50 text-blue-800', border: 'border-blue-300' },
    { id: 'proposal', label: 'Proposal & RFP', color: 'bg-indigo-50 text-indigo-800', border: 'border-indigo-300' },
    { id: 'negotiation', label: 'Legal & Negotiation', color: 'bg-amber-50 text-amber-800', border: 'border-amber-300' },
    { id: 'won', label: 'Closed Won', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-300' },
    { id: 'lost', label: 'Closed Lost', color: 'bg-rose-50 text-rose-800', border: 'border-rose-300' },
  ];

  const stageOrder: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

  const filteredDeals = deals.filter((deal) => {
    if (currentDepartment !== 'all' && deal.department !== currentDepartment) return false;
    return true;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenAdd = () => {
    setEditingDeal(null);
    const defaultClient = clients[0];
    setFormData({
      title: '',
      clientId: defaultClient ? defaultClient.id : '',
      clientName: defaultClient ? defaultClient.name : '',
      department: currentDepartment === 'all' ? 'sales' : currentDepartment,
      stage: 'lead',
      value: 75000,
      expectedCloseDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      owner: 'Marcus Vance',
      probability: 20,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData(deal);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientName) return;

    if (editingDeal) {
      await onUpdateDeal(editingDeal.id, formData);
    } else {
      await onAddDeal(formData);
    }
    setIsModalOpen(false);
  };

  const moveStage = (deal: Deal, direction: 'next' | 'prev') => {
    const currentIndex = stageOrder.indexOf(deal.stage);
    if (direction === 'next' && currentIndex < stageOrder.length - 2) { // Won is before Lost
      onUpdateStage(deal.id, stageOrder[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      onUpdateStage(deal.id, stageOrder[currentIndex - 1]);
    }
  };

  const totalActivePipeline = filteredDeals
    .filter(d => d.stage !== 'lost')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pipeline & Opportunity Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active pipeline velocity: <span className="font-semibold text-slate-800">{formatCurrency(totalActivePipeline)}</span> across {filteredDeals.length} opportunities.
          </p>
        </div>

        <button
          id="btn-add-deal"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Opportunity
        </button>
      </div>

      {/* Kanban Stages Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

          return (
            <div
              key={stage.id}
              className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 min-w-[220px] flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 mt-2">
                  {formatCurrency(stageTotal)}
                </div>
              </div>

              {/* Deal Cards */}
              <div className="space-y-2.5 mt-3 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs hover:border-indigo-300 transition-all group text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-slate-900 leading-snug">
                        {deal.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      {deal.clientName}
                    </p>

                    <div className="mt-2.5 flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-900 text-xs">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {deal.probability}% Prob
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-300" />
                        {deal.owner}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {deal.expectedCloseDate}
                      </span>
                    </div>

                    {/* Stage Transition & Edit buttons */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(deal)}
                          className="p-1 hover:text-indigo-600 rounded hover:bg-indigo-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete deal "${deal.title}"?`)) onDeleteDeal(deal.id);
                          }}
                          className="p-1 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Movement controls */}
                      <div className="flex items-center gap-1">
                        {stage.id !== 'lead' && (
                          <button
                            onClick={() => moveStage(deal, 'prev')}
                            className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                            title="Previous Stage"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {stage.id !== 'won' && stage.id !== 'lost' && (
                          <button
                            onClick={() => moveStage(deal, 'next')}
                            className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                            title="Next Stage"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {stage.id !== 'won' && (
                          <button
                            onClick={() => onUpdateStage(deal.id, 'won')}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Mark as Won"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-slate-300 text-xs italic">
                    Empty Stage
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingDeal ? 'Modify Opportunity' : 'Register New Opportunity'}
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
                <label className="block text-slate-700 font-medium mb-1">Deal / Opportunity Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Enterprise Cloud Renewal 2027"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Client Account *</label>
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
                  <label className="block text-slate-700 font-medium mb-1">Assigned Department</label>
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

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contract Value ($)</label>
                  <input
                    type="number"
                    value={formData.value || 0}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Current Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="lead">Lead</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={formData.expectedCloseDate || ''}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Deal Owner</label>
                  <input
                    type="text"
                    value={formData.owner || ''}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability || 50}
                    onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Opportunity Notes & Deliverables</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Terms, legal points, technical demo outcomes..."
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
                  {editingDeal ? 'Save Deal' : 'Add Opportunity'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
