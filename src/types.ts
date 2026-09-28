export type Department = 'it_tech' | 'engineering' | 'sales' | 'support' | 'operations' | 'finance' | 'marketing' | 'hr';

export type EmployeeStatus = 'active' | 'on_leave' | 'probation' | 'inactive';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  role: string;
  status: EmployeeStatus;
  joinedDate: string;
  location?: string;
  skills?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientTier = 'Enterprise' | 'Mid-Market' | 'Startup' | 'Strategic';
export type ClientStatus = 'active' | 'onboarding' | 'churn_risk' | 'dormant';

export interface Client {
  id: string;
  name: string;
  industry: string;
  tier: ClientTier;
  primaryDepartment: Department;
  status: ClientStatus;
  healthScore: number; // 0 - 100
  annualValue: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  assignedLead: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: Department;
  isPrimary: boolean;
  lastContacted: string;
}

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  department: Department;
  stage: DealStage;
  value: number;
  expectedCloseDate: string;
  owner: string;
  probability: number; // 0 - 100
  notes: string;
  updatedAt: string;
}

export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  department: Department;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  resolutionSummary?: string;
  description: string;
}

export type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'handoff' | 'backup';

export interface Activity {
  id: string;
  clientId?: string;
  clientName?: string;
  department: Department | 'system';
  type: ActivityType;
  title: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  timestamp: string;
  type: 'manual' | 'automated' | 'pre_restore_snapshot';
  label: string;
  fileSizeBytes: number;
  counts: {
    clients: number;
    contacts: number;
    deals: number;
    tickets: number;
    activities: number;
  };
  checksum: string;
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  frequencyHours: number;
  maxSnapshotsRetention: number;
  lastBackupAt: string | null;
  lastStatus: 'success' | 'warning' | 'idle';
}

export interface CRMStats {
  totalClients: number;
  totalContacts: number;
  totalEmployees: number;
  activeClients: number;
  totalPipelineValue: number;
  wonRevenue: number;
  openTickets: number;
  urgentTickets: number;
  averageHealthScore: number;
  departmentBreakdown: Record<Department, {
    clientCount: number;
    employeeCount: number;
    dealCount: number;
    pipelineValue: number;
    openTickets: number;
  }>;
  latestBackup: BackupSnapshot | null;
  backupCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
  department?: Department;
  lastLogin?: string;
}

export interface DatabaseTableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface DatabaseTable {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: DatabaseTableColumn[];
}

export interface DatabaseInfo {
  status: string;
  engine: string;
  driver: string;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  foreignKeys: string;
  acidCompliant: boolean;
  tablesCount: number;
  totalRecords: number;
  lastSync: string;
  integrity: string;
  tables: DatabaseTable[];
}

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: number;
  isSelect: boolean;
  changes?: number;
}

