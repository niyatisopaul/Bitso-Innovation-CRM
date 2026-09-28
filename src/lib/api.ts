import { Client, Contact, Deal, Ticket, Activity, BackupSnapshot, BackupConfig, CRMStats, Department, AuthUser, Employee, DatabaseInfo, DatabaseTable, SqlQueryResult } from '../types';

export const api = {
  // Authentication & Token Management
  getAuthToken(): string | null {
    return localStorage.getItem('crm_admin_token');
  },

  setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('crm_admin_token', token);
    } else {
      localStorage.removeItem('crm_admin_token');
    }
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed. Please verify credentials.');
    }
    const data = await res.json();
    if (data.token) {
      this.setAuthToken(data.token);
    }
    return data;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    department?: Department;
    role?: 'admin' | 'manager' | 'operator';
  }): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed. Please check your details.');
    }
    const data = await res.json();
    if (data.token) {
      this.setAuthToken(data.token);
    }
    return data;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = this.getAuthToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        this.setAuthToken(null);
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } finally {
      this.setAuthToken(null);
    }
  },

  async getAuthStatus(): Promise<{ isAuthenticated: boolean; user: AuthUser | null; hasUsers: boolean; defaultAdminEmail: string }> {
    const res = await fetch('/api/auth/status', {
      headers: this.getAuthHeaders(),
    });
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change password');
    }
    return res.json();
  },

  async resetDatabaseToBlank(): Promise<any> {
    const res = await fetch('/api/database/reset-blank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset database');
    }
    return res.json();
  },

  // Stats & Health
  async getStats(): Promise<CRMStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch CRM stats');
    return res.json();
  },

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Employees & Department Workforce
  async getEmployees(params?: { department?: string; status?: string; search?: string }): Promise<Employee[]> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/employees?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load employees');
    return res.json();
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create employee');
    }
    return res.json();
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update employee');
    return res.json();
  },

  async deleteEmployee(id: string): Promise<void> {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete employee');
  },

  // Clients
  async getClients(params?: { department?: string; status?: string; tier?: string; search?: string }): Promise<Client[]> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.tier) query.set('tier', params.tier);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/clients?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load clients');
    return res.json();
  },

  async createClient(client: Partial<Client>): Promise<Client> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create client');
    }
    return res.json();
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update client');
    return res.json();
  },

  async deleteClient(id: string): Promise<void> {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete client');
  },

  // Contacts
  async getContacts(params?: { department?: string; clientId?: string; search?: string }): Promise<Contact[]> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/contacts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load contacts');
    return res.json();
  },

  async createContact(contact: Partial<Contact>): Promise<Contact> {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create contact');
    }
    return res.json();
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update contact');
    return res.json();
  },

  async deleteContact(id: string): Promise<void> {
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete contact');
  },

  // Deals
  async getDeals(params?: { department?: string; stage?: string }): Promise<Deal[]> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.stage) query.set('stage', params.stage);

    const res = await fetch(`/api/deals?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load deals');
    return res.json();
  },

  async createDeal(deal: Partial<Deal>): Promise<Deal> {
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deal),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create deal');
    }
    return res.json();
  },

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update deal');
    return res.json();
  },

  async updateDealStage(id: string, stage: string): Promise<Deal> {
    const res = await fetch(`/api/deals/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) throw new Error('Failed to update deal stage');
    return res.json();
  },

  async deleteDeal(id: string): Promise<void> {
    const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete deal');
  },

  // Tickets
  async getTickets(params?: { department?: string; status?: string; priority?: string }): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);

    const res = await fetch(`/api/tickets?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load tickets');
    return res.json();
  },

  async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to file ticket');
    }
    return res.json();
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update ticket');
    return res.json();
  },

  async updateTicketStatus(id: string, status: string, resolutionSummary?: string): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionSummary }),
    });
    if (!res.ok) throw new Error('Failed to update ticket status');
    return res.json();
  },

  async deleteTicket(id: string): Promise<void> {
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete ticket');
  },

  // Activities
  async getActivities(params?: { department?: string; clientId?: string; limit?: number }): Promise<Activity[]> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/activities?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load activity logs');
    return res.json();
  },

  // Backups & Disaster Recovery Hub
  async getBackups(): Promise<BackupSnapshot[]> {
    const res = await fetch('/api/backups');
    if (!res.ok) throw new Error('Failed to retrieve backup list');
    return res.json();
  },

  async createBackup(label: string, type: 'manual' | 'automated' = 'manual'): Promise<{ snapshot: BackupSnapshot; message: string }> {
    const res = await fetch('/api/backups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, type }),
    });
    if (!res.ok) throw new Error('Failed to trigger backup snapshot');
    return res.json();
  },

  async restoreBackup(id: string): Promise<{ success: boolean; message: string; safetySnapshot: any }> {
    const res = await fetch(`/api/backups/restore/${id}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Restore failed');
    }
    return res.json();
  },

  async uploadBackup(content: string, restoreImmediately: boolean = false, label?: string): Promise<any> {
    const res = await fetch('/api/backups/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupContent: content, restoreImmediately, label }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload backup failed');
    }
    return res.json();
  },

  async deleteBackup(id: string): Promise<void> {
    const res = await fetch(`/api/backups/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete backup');
  },

  async getBackupConfig(): Promise<BackupConfig> {
    const res = await fetch('/api/backup-settings');
    if (!res.ok) throw new Error('Failed to get backup config');
    return res.json();
  },

  async updateBackupConfig(config: Partial<BackupConfig>): Promise<BackupConfig> {
    const res = await fetch('/api/backup-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to save backup config');
    return res.json();
  },

  async getDatabaseDiagnostics(): Promise<any> {
    const res = await fetch('/api/database/diagnostics');
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },

  // AI Department Briefing
  async getAiDepartmentInsight(department?: Department | 'all', topic?: string): Promise<{ analysis: string; source: string }> {
    const res = await fetch('/api/ai/department-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department, topic }),
    });
    if (!res.ok) throw new Error('Failed to generate insight');
    return res.json();
  },

  // ----------------------------------------------------
  // DATABASE STUDIO & SQL ENGINE METHODS
  // ----------------------------------------------------
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const res = await fetch('/api/database/info', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch database information');
    }
    return res.json();
  },

  async getDatabaseTables(): Promise<{ tables: DatabaseTable[] }> {
    const res = await fetch('/api/database/tables', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch tables');
    }
    return res.json();
  },

  async runSqlQuery(query: string, params?: any[]): Promise<SqlQueryResult> {
    const res = await fetch('/api/database/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ query, params }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Query execution failed');
    }
    return data;
  },

  async getTableData(tableName: string, limit: number = 50, offset: number = 0, search: string = ''): Promise<{ columns: string[]; rows: any[]; totalRows: number; page: number }> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      search
    });
    const res = await fetch(`/api/database/table/${encodeURIComponent(tableName)}?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch data for table ${tableName}`);
    }
    return res.json();
  },

  async optimizeDatabase(): Promise<{ success: boolean; message: string; vacuumed: boolean; integrity: string; executionTimeMs: number; newFileSizeBytes: number }> {
    const res = await fetch('/api/database/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Database optimization failed');
    }
    return res.json();
  },

  async seedSampleDatabase(): Promise<{ success: boolean; message: string; counts: any }> {
    const res = await fetch('/api/database/seed-sample', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to seed sample database records');
    }
    return res.json();
  },

  async resetBlankDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/database/reset-blank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset database');
    }
    return res.json();
  }
};
