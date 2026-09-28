import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Trash2, 
  Edit3, 
  X, 
  Star,
  ContactRound
} from 'lucide-react';
import { Contact, Department, Client } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  clients: Client[];
  currentDepartment: Department | 'all';
  onAddContact: (contact: Partial<Contact>) => Promise<void>;
  onUpdateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  clients,
  currentDepartment,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    clientId: '',
    clientName: '',
    department: currentDepartment === 'all' ? 'sales' : currentDepartment,
    isPrimary: false,
  });

  const filteredContacts = contacts.filter((ct) => {
    if (currentDepartment !== 'all' && ct.department !== currentDepartment) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ct.name.toLowerCase().includes(q) ||
        ct.email.toLowerCase().includes(q) ||
        ct.clientName?.toLowerCase().includes(q) ||
        ct.role?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingContact(null);
    const defClient = clients[0];
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Key Decision Maker',
      clientId: defClient ? defClient.id : '',
      clientName: defClient ? defClient.name : '',
      department: currentDepartment === 'all' ? 'sales' : currentDepartment,
      isPrimary: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ct: Contact) => {
    setEditingContact(ct);
    setFormData(ct);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingContact) {
      await onUpdateContact(editingContact.id, formData);
    } else {
      await onAddContact(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Stakeholder Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key client contacts, executives, and department liaison personnel.
          </p>
        </div>

        <button
          id="btn-add-contact"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Stakeholder
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, role, email or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </span>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                    {contact.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-slate-500">{contact.role}</p>
                  </div>
                </div>

                {contact.isPrimary && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Primary
                  </span>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{contact.clientName}</span>
                <span className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded font-medium">
                  {contact.department === 'it_tech' || (contact.department as string) === 'engineering' ? 'IT & Tech' : contact.department}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline truncate">
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                onClick={() => handleOpenEdit(contact)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                title="Edit Contact"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remove stakeholder ${contact.name}?`)) onDeleteContact(contact.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-slate-200">
            <ContactRound className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No stakeholders found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search filters or add a new contact.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingContact ? 'Modify Stakeholder' : 'Add Client Stakeholder'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Dr. Arthur Vance"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Company Account *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => {
                    const sel = clients.find(c => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      clientId: e.target.value,
                      clientName: sel ? sel.name : '',
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="VP Operations"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Liaison Department</label>
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
                <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="contact@enterprise.com"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-700 font-medium">Designate as Primary Account Stakeholder</span>
                </label>
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
                  {editingContact ? 'Save Contact' : 'Add Stakeholder'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
