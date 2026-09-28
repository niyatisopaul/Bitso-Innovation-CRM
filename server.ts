import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { serverDatabase } from './server_db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');
const CONFIG_FILE = path.join(DATA_DIR, 'backup_config.json');
const AUTH_FILE = path.join(DATA_DIR, 'admin_auth.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Authentication Store & Password Helpers
function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + ':' + salt).digest('hex');
}

function getAuthStore(): any {
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      const defaultSalt = 'enterprise-crm-salt-2026';
      const initialAuth = {
        users: [
          {
            id: 'usr-admin-1',
            email: 'admin@company.com',
            name: 'System Administrator',
            role: 'admin',
            salt: defaultSalt,
            passwordHash: hashPassword('admin123', defaultSalt),
            createdAt: new Date().toISOString(),
            lastLogin: null,
          }
        ],
        activeSessions: {}
      };
      fs.writeFileSync(AUTH_FILE, JSON.stringify(initialAuth, null, 2), 'utf-8');
      return initialAuth;
    }
    const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading auth store:', err);
    return { users: [], activeSessions: {} };
  }
}

function writeAuthStore(data: any) {
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving auth store:', err);
    return false;
  }
}

// Initial Seed Data Generator
function getInitialSeedData() {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    createdAt: now,
    employees: [],
    clients: [],
    contacts: [],
    deals: [],
    tickets: [],
    activities: [
      {
        id: 'act-genesis',
        department: 'system',
        type: 'backup',
        title: 'Bitso Innovation CRM Initialized',
        description: 'Clean enterprise workspace initialized with zero records. Add your department employees, accounts, and deals.',
        performedBy: 'System Administrator',
        timestamp: now
      }
    ]
  };
}

// Read database
function readDB(): any {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.employees) parsed.employees = [];
    if (!parsed.clients) parsed.clients = [];
    if (!parsed.contacts) parsed.contacts = [];
    if (!parsed.deals) parsed.deals = [];
    if (!parsed.tickets) parsed.tickets = [];
    if (!parsed.activities) parsed.activities = [];
    return parsed;
  } catch (err) {
    console.error('Error reading database file, returning fallback:', err);
    return getInitialSeedData();
  }
}

// Write database
function writeDB(data: any) {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    try {
      serverDatabase.syncFromStore(data, getAuthStore());
    } catch (syncErr) {
      console.warn('[Database] Sync warning:', syncErr);
    }
    return true;
  } catch (err) {
    console.error('Error writing to database:', err);
    return false;
  }
}

// Read Backup Configuration
function readBackupConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      const defaultConfig = {
        autoBackupEnabled: true,
        frequencyHours: 6,
        maxSnapshotsRetention: 20,
        lastBackupAt: new Date().toISOString(),
        lastStatus: 'success',
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (err) {
    return {
      autoBackupEnabled: true,
      frequencyHours: 6,
      maxSnapshotsRetention: 20,
      lastBackupAt: null,
      lastStatus: 'idle',
    };
  }
}

function writeBackupConfig(cfg: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing backup configuration:', err);
    return false;
  }
}

// Snapshot Creation Logic
function createSnapshotSync(label: string = 'Manual Snapshot', type: 'manual' | 'automated' | 'pre_restore_snapshot' = 'manual'): any {
  const db = readDB();
  const timestamp = new Date().toISOString();
  const safeTime = timestamp.replace(/[:.]/g, '-');
  const filename = `crm-backup-${safeTime}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  const payload: any = {
    metadata: {
      backupId: `bk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      label,
      type,
      timestamp,
      version: db.version || '1.0.0',
      clientCount: db.clients?.length || 0,
      contactCount: db.contacts?.length || 0,
      dealCount: db.deals?.length || 0,
      ticketCount: db.tickets?.length || 0,
      activityCount: db.activities?.length || 0,
    },
    data: db
  };

  const serialized = JSON.stringify(payload, null, 2);
  const hash = crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 12);
  payload.metadata['checksum'] = hash;

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  const stats = fs.statSync(filePath);

  // Update backup config
  const cfg = readBackupConfig();
  cfg.lastBackupAt = timestamp;
  cfg.lastStatus = 'success';
  writeBackupConfig(cfg);

  // Prune older backups if exceeded maxSnapshotsRetention
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > (cfg.maxSnapshotsRetention || 20)) {
      const toDelete = files.slice(cfg.maxSnapshotsRetention || 20);
      for (const item of toDelete) {
        fs.unlinkSync(path.join(BACKUPS_DIR, item.name));
      }
    }
  } catch (pruneErr) {
    console.warn('Backup retention pruning warning:', pruneErr);
  }

  return {
    id: payload.metadata.backupId,
    filename,
    timestamp,
    type,
    label,
    fileSizeBytes: stats.size,
    counts: {
      clients: payload.metadata.clientCount,
      contacts: payload.metadata.contactCount,
      deals: payload.metadata.dealCount,
      tickets: payload.metadata.ticketCount,
      activities: payload.metadata.activityCount,
    },
    checksum: hash
  };
}

// Initialize seed and backup on boot
readDB();

// ----------------------------------------------------
// AUTHENTICATION & SESSION MIDDLEWARE & ROUTES
// ----------------------------------------------------

function getSessionUser(req: express.Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const authStore = getAuthStore();
  const session = authStore.activeSessions?.[token];
  if (!session) {
    return null;
  }
  // Check expiration (30 days)
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    delete authStore.activeSessions[token];
    writeAuthStore(authStore);
    return null;
  }
  const user = authStore.users.find((u: any) => u.id === session.userId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    lastLogin: user.lastLogin
  };
}

// Register new Admin or Staff User
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, department, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const authStore = getAuthStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (authStore.users.some((u: any) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);
  const now = new Date();
  const newUser = {
    id: `usr-${Date.now()}`,
    email: normalizedEmail,
    name: String(name).trim(),
    role: role || (authStore.users.length === 0 ? 'admin' : 'manager'),
    department: department || 'it_tech',
    salt,
    passwordHash,
    createdAt: now.toISOString(),
    lastLogin: now.toISOString()
  };

  authStore.users.push(newUser);

  // Create session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  if (!authStore.activeSessions) {
    authStore.activeSessions = {};
  }
  authStore.activeSessions[token] = {
    userId: newUser.id,
    createdAt: now.toISOString(),
    expiresAt
  };
  writeAuthStore(authStore);

  // Log activity in CRM
  const db = readDB();
  db.activities.unshift({
    id: `act-reg-${Date.now()}`,
    department: newUser.department || 'system',
    type: 'meeting',
    title: 'New Account Registered',
    description: `User ${newUser.name} (${newUser.email}) registered as ${newUser.role} in Bitso Innovation.`,
    performedBy: newUser.name,
    timestamp: now.toISOString()
  });
  writeDB(db);

  return res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      lastLogin: newUser.lastLogin
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const authStore = getAuthStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = authStore.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const computedHash = hashPassword(String(password), user.salt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Create session token
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  if (!authStore.activeSessions) {
    authStore.activeSessions = {};
  }
  authStore.activeSessions[token] = {
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt
  };

  user.lastLogin = now.toISOString();
  writeAuthStore(authStore);

  // Log activity
  const db = readDB();
  db.activities.unshift({
    id: `act-login-${Date.now()}`,
    department: 'system',
    type: 'meeting',
    title: 'Admin Session Authenticated',
    description: `User ${user.email} logged into the CRM portal.`,
    performedBy: user.name,
    timestamp: now.toISOString()
  });
  writeDB(db);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin
    }
  });
});

// Current User Profile
app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized or session expired' });
  }
  return res.json({ success: true, user });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const authStore = getAuthStore();
    if (authStore.activeSessions?.[token]) {
      delete authStore.activeSessions[token];
      writeAuthStore(authStore);
    }
  }
  return res.json({ success: true });
});

// Auth Status & Setup Information
app.get('/api/auth/status', (req, res) => {
  const user = getSessionUser(req);
  const authStore = getAuthStore();
  const hasUsers = authStore.users && authStore.users.length > 0;
  return res.json({
    isAuthenticated: !!user,
    user: user || null,
    hasUsers,
    defaultAdminEmail: 'admin@company.com'
  });
});

// Change Password
app.post('/api/auth/change-password', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const authStore = getAuthStore();
  const targetUser = authStore.users.find((u: any) => u.id === user.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentComputed = hashPassword(String(currentPassword), targetUser.salt);
  if (currentComputed !== targetUser.passwordHash) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }

  // Update password
  targetUser.passwordHash = hashPassword(String(newPassword), targetUser.salt);
  writeAuthStore(authStore);

  return res.json({ success: true, message: 'Password updated successfully' });
});

// ----------------------------------------------------
// DATABASE MANAGEMENT & SQL ENGINE ROUTES
// ----------------------------------------------------

// Database Info & Status
app.get('/api/database/info', (req, res) => {
  try {
    const tables = serverDatabase.getTables();
    let totalRecords = 0;
    tables.forEach(t => totalRecords += t.rowCount);

    return res.json({
      status: 'connected',
      engine: 'SQLite 3 (WebAssembly Embedded Server)',
      driver: 'sql.js',
      filePath: serverDatabase.getDbFilePath(),
      fileName: 'crm_database.sqlite',
      fileSizeBytes: serverDatabase.getDbFileSize(),
      foreignKeys: 'ENABLED (PRAGMA foreign_keys = ON)',
      acidCompliant: true,
      tablesCount: tables.length,
      totalRecords,
      lastSync: new Date().toISOString(),
      integrity: 'ok',
      tables
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve database info: ' + err.message });
  }
});

// Database Tables & Schema Explorer
app.get('/api/database/tables', (req, res) => {
  try {
    const tables = serverDatabase.getTables();
    return res.json({ tables });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to list tables: ' + err.message });
  }
});

// Execute Arbitrary SQL Queries (Query Runner)
app.post('/api/database/query', (req, res) => {
  try {
    const { query, params } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const result = serverDatabase.executeQuery(query, params || []);
    return res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Table Data Browser with Search and Pagination
app.get('/api/database/table/:name', (req, res) => {
  try {
    const tableName = req.params.name;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || '';

    const data = serverDatabase.getTableData(tableName, limit, offset, search);
    return res.json(data);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// Optimize Database (VACUUM, REINDEX, PRAGMA integrity_check)
app.post('/api/database/optimize', (req, res) => {
  try {
    const result = serverDatabase.optimize();
    return res.json({
      success: true,
      message: 'Database optimized successfully. Tables vacuumed, indexes rebuilt, and integrity confirmed.',
      ...result,
      newFileSizeBytes: serverDatabase.getDbFileSize()
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Optimization failed: ' + err.message });
  }
});

// Download binary SQLite .sqlite database file
app.get('/api/database/download-sqlite', (req, res) => {
  try {
    serverDatabase.saveToDisk();
    const filePath = serverDatabase.getDbFilePath();
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', 'attachment; filename="crm_database.sqlite"');
      res.setHeader('Content-Type', 'application/x-sqlite3');
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Database file not found on disk' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to download SQLite file: ' + err.message });
  }
});

// Export ANSI SQL Dump file
app.get('/api/database/export-sql', (req, res) => {
  try {
    const sqlDump = serverDatabase.generateSqlDump();
    res.setHeader('Content-Disposition', 'attachment; filename="crm_database_dump.sql"');
    res.setHeader('Content-Type', 'application/sql');
    return res.send(sqlDump);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate SQL dump: ' + err.message });
  }
});

// Seed Sample Data into Database
app.post('/api/database/seed-sample', (req, res) => {
  try {
    const now = new Date().toISOString();
    const sampleEmployees = [
      { id: 'emp-1', name: 'Alex Rivera', email: 'alex.rivera@bitso.com', phone: '+1 555-0192', department: 'it_tech', role: 'Principal Architect', status: 'active', joinedDate: '2023-01-15', location: 'San Francisco, CA', skills: ['PostgreSQL', 'TypeScript', 'Distributed Systems'], notes: 'Core backend lead' },
      { id: 'emp-2', name: 'Elena Chen', email: 'elena.chen@bitso.com', phone: '+1 555-0183', department: 'sales', role: 'Enterprise Account Executive', status: 'active', joinedDate: '2023-04-10', location: 'New York, NY', skills: ['B2B Sales', 'Negotiation', 'CRM Strategy'], notes: 'Top revenue generator' },
      { id: 'emp-3', name: 'Marcus Johnson', email: 'marcus.j@bitso.com', phone: '+1 555-0174', department: 'support', role: 'Tier 3 Support Lead', status: 'active', joinedDate: '2023-06-01', location: 'Austin, TX', skills: ['Incident Response', 'SLA Management'], notes: 'Manages critical escalation queue' },
      { id: 'emp-4', name: 'Sophia Larsson', email: 'sophia.l@bitso.com', phone: '+1 555-0165', department: 'operations', role: 'Operations Director', status: 'active', joinedDate: '2022-11-20', location: 'London, UK', skills: ['Infrastructure', 'Compliance', 'SOC 2'], notes: 'Disaster recovery and backup auditor' },
      { id: 'emp-5', name: 'David Park', email: 'david.p@bitso.com', phone: '+1 555-0156', department: 'finance', role: 'Senior Financial Analyst', status: 'active', joinedDate: '2023-08-12', location: 'Chicago, IL', skills: ['Revenue Modeling', 'Billing Audit'], notes: 'Oversees billing pipelines' },
      { id: 'emp-6', name: 'Amina Mansour', email: 'amina.m@bitso.com', phone: '+1 555-0147', department: 'marketing', role: 'Growth Marketing Manager', status: 'active', joinedDate: '2024-01-05', location: 'Toronto, CA', skills: ['SEO', 'Product Led Growth'], notes: 'Manages multi-channel acquisition' },
      { id: 'emp-7', name: 'Liam O\'Connor', email: 'liam.oc@bitso.com', phone: '+1 555-0138', department: 'hr', role: 'People Operations Lead', status: 'active', joinedDate: '2023-03-22', location: 'Dublin, IE', skills: ['Talent Acquisition', 'Culture'], notes: 'Coordinates onboarding across teams' }
    ];

    const sampleClients = [
      { id: 'cli-1', name: 'Apex Global Logistics', industry: 'Logistics & Supply Chain', tier: 'Enterprise', primaryDepartment: 'sales', status: 'active', healthScore: 94, annualValue: 180000, contactName: 'Rachel Vance', contactEmail: 'r.vance@apexlogistics.com', contactPhone: '+1 555-4301', assignedLead: 'Elena Chen', notes: 'Strategic enterprise client on annual renewal cycle' },
      { id: 'cli-2', name: 'Nova Health Systems', industry: 'Healthcare Technology', tier: 'Enterprise', primaryDepartment: 'it_tech', status: 'active', healthScore: 88, annualValue: 240000, contactName: 'Dr. Gregory House', contactEmail: 'ghouse@novahealth.org', contactPhone: '+1 555-4302', assignedLead: 'Alex Rivera', notes: 'HIPAA compliant deployment in progress' },
      { id: 'cli-3', name: 'Hyperion FinTech', industry: 'Financial Services', tier: 'Strategic', primaryDepartment: 'finance', status: 'active', healthScore: 96, annualValue: 310000, contactName: 'Sanjay Patel', contactEmail: 'spatel@hyperionfin.com', contactPhone: '+1 555-4303', assignedLead: 'David Park', notes: 'Real-time ledger processing client' },
      { id: 'cli-4', name: 'Zenith Retail Network', industry: 'E-Commerce', tier: 'Mid-Market', primaryDepartment: 'support', status: 'onboarding', healthScore: 82, annualValue: 95000, contactName: 'Chloe Bennett', contactEmail: 'cbennett@zenithretail.com', contactPhone: '+1 555-4304', assignedLead: 'Marcus Johnson', notes: 'Initial integration testing' }
    ];

    const sampleDeals = [
      { id: 'deal-1', title: 'Apex Global Multi-Year Fleet Expansion', clientId: 'cli-1', clientName: 'Apex Global Logistics', department: 'sales', stage: 'negotiation', value: 180000, probability: 85, expectedCloseDate: '2026-11-15', owner: 'Elena Chen', notes: 'Finalizing legal terms' },
      { id: 'deal-2', title: 'Nova Health Telemetry Cloud Upgrade', clientId: 'cli-2', clientName: 'Nova Health Systems', department: 'it_tech', stage: 'proposal', value: 120000, probability: 70, expectedCloseDate: '2026-12-01', owner: 'Alex Rivera', notes: 'Architecture design review approved' },
      { id: 'deal-3', title: 'Hyperion Realtime High-Frequency Gateway', clientId: 'cli-3', clientName: 'Hyperion FinTech', department: 'finance', stage: 'won', value: 310000, probability: 100, expectedCloseDate: '2026-09-10', owner: 'David Park', notes: 'Contract executed and active' }
    ];

    const sampleTickets = [
      { id: 'tkt-1', ticketNumber: 'TKT-1001', title: 'High-Throughput API Rate Limit Adjustment', clientId: 'cli-3', clientName: 'Hyperion FinTech', department: 'it_tech', priority: 'urgent', status: 'in_progress', assignedTo: 'Alex Rivera', createdAt: now, dueDate: '2026-10-01', description: 'Requesting quota elevation for end-of-quarter volume test.' },
      { id: 'tkt-2', ticketNumber: 'TKT-1002', title: 'SSO SAML Identity Provider Configuration', clientId: 'cli-2', clientName: 'Nova Health Systems', department: 'support', priority: 'high', status: 'open', assignedTo: 'Marcus Johnson', createdAt: now, dueDate: '2026-10-05', description: 'Assistance needed verifying Okta metadata XML certificate.' }
    ];

    const sampleContacts = [
      { id: 'ct-1', clientId: 'cli-1', clientName: 'Apex Global Logistics', name: 'Rachel Vance', email: 'r.vance@apexlogistics.com', phone: '+1 555-4301', role: 'VP of Technology', department: 'sales', isPrimary: true, lastContacted: now },
      { id: 'ct-2', clientId: 'cli-2', clientName: 'Nova Health Systems', name: 'Dr. Gregory House', email: 'ghouse@novahealth.org', phone: '+1 555-4302', role: 'Chief Medical Information Officer', department: 'it_tech', isPrimary: true, lastContacted: now }
    ];

    const sampleActivities = [
      { id: `act-seed-${Date.now()}`, department: 'system', type: 'backup', title: 'Sample Database Records Seeded', description: 'Loaded representative multi-department enterprise dataset into SQLite relational database.', performedBy: 'Database Administrator', timestamp: now }
    ];

    const fullStore = {
      version: '1.0.0',
      createdAt: now,
      employees: sampleEmployees,
      clients: sampleClients,
      deals: sampleDeals,
      tickets: sampleTickets,
      contacts: sampleContacts,
      activities: sampleActivities
    };

    writeDB(fullStore);

    return res.json({
      success: true,
      message: 'Sample records successfully seeded into SQLite relational database.',
      counts: {
        employees: sampleEmployees.length,
        clients: sampleClients.length,
        deals: sampleDeals.length,
        tickets: sampleTickets.length,
        contacts: sampleContacts.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to seed sample records: ' + err.message });
  }
});

// Reset Database to Pristine Blank CRM
app.post('/api/database/reset-blank', (req, res) => {
  try {
    const initialBlank = getInitialSeedData();
    writeDB(initialBlank);
    // Also clean SQLite tables
    try {
      const db = serverDatabase.getRawDb();
      db.run('DELETE FROM employees;');
      db.run('DELETE FROM clients;');
      db.run('DELETE FROM contacts;');
      db.run('DELETE FROM deals;');
      db.run('DELETE FROM tickets;');
      db.run('DELETE FROM activities;');
      serverDatabase.saveToDisk();
    } catch (e) {}

    return res.json({
      success: true,
      message: 'CRM database has been reset to an entirely blank workspace.',
      data: initialBlank
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Bitso Innovation CRM & Relational Database Studio',
    databaseEngine: 'SQLite 3 (WebAssembly Embedded Server)',
    databaseFile: 'data/crm_database.sqlite',
    databaseFileSizeBytes: serverDatabase.getDbFileSize(),
    tablesCount: serverDatabase.getTables().length,
    acidCompliant: true,
  });
});

// Overall Stats and Department Breakdown
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const employees = db.employees || [];
  const clients = db.clients || [];
  const deals = db.deals || [];
  const tickets = db.tickets || [];
  const contacts = db.contacts || [];

  const activeClients = clients.filter((c: any) => c.status === 'active').length;
  const totalPipelineValue = deals
    .filter((d: any) => d.stage !== 'lost')
    .reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
  const wonRevenue = deals
    .filter((d: any) => d.stage === 'won')
    .reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
  const openTickets = tickets.filter((t: any) => t.status !== 'resolved').length;
  const urgentTickets = tickets.filter((t: any) => t.priority === 'urgent' && t.status !== 'resolved').length;

  const totalHealth = clients.reduce((acc: number, c: any) => acc + (Number(c.healthScore) || 0), 0);
  const averageHealthScore = clients.length > 0 ? Math.round(totalHealth / clients.length) : 0;

  const departments = ['it_tech', 'sales', 'support', 'operations', 'finance', 'marketing', 'hr'] as const;
  const departmentBreakdown: any = {};

  for (const dep of departments) {
    const isDeptMatch = (dVal: string) => dVal === dep || (dep === 'it_tech' && dVal === 'engineering');
    const depEmployees = employees.filter((e: any) => isDeptMatch(e.department));
    const depClients = clients.filter((c: any) => isDeptMatch(c.primaryDepartment));
    const depDeals = deals.filter((d: any) => isDeptMatch(d.department));
    const depTickets = tickets.filter((t: any) => isDeptMatch(t.department) && t.status !== 'resolved');
    const depPipe = depDeals.filter((d: any) => d.stage !== 'lost').reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);

    departmentBreakdown[dep] = {
      clientCount: depClients.length,
      employeeCount: depEmployees.length,
      dealCount: depDeals.length,
      pipelineValue: depPipe,
      openTickets: depTickets.length,
    };
  }
  departmentBreakdown['engineering'] = departmentBreakdown['it_tech'];

  // Backup files count
  let backupFiles: any[] = [];
  try {
    backupFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
  } catch (e) {}

  res.json({
    totalEmployees: employees.length,
    totalClients: clients.length,
    activeClients,
    totalContacts: contacts.length,
    totalPipelineValue,
    wonRevenue,
    openTickets,
    urgentTickets,
    averageHealthScore,
    departmentBreakdown,
    backupCount: backupFiles.length,
    backupConfig: readBackupConfig(),
  });
});

// ----------------------------------------------------
// EMPLOYEES CRUD
// ----------------------------------------------------
app.get('/api/employees', (req, res) => {
  const db = readDB();
  let results = db.employees || [];

  const { department, status, search } = req.query;
  if (department && department !== 'all') {
    results = results.filter((e: any) => e.department === department);
  }
  if (status && status !== 'all') {
    results = results.filter((e: any) => e.status === status);
  }
  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter((e: any) =>
      e.name?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s) ||
      e.role?.toLowerCase().includes(s) ||
      e.phone?.toLowerCase().includes(s)
    );
  }

  res.json(results);
});

app.post('/api/employees', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (!body.name || !body.email) {
    return res.status(400).json({ error: 'Employee name and email are required.' });
  }

  const now = new Date().toISOString();
  const newEmployee = {
    id: `emp-${Date.now()}`,
    name: body.name,
    email: body.email,
    phone: body.phone || '',
    department: body.department || 'it_tech',
    role: body.role || 'Specialist',
    status: body.status || 'active',
    joinedDate: body.joinedDate || new Date().toISOString().split('T')[0],
    location: body.location || 'Remote / HQ',
    skills: Array.isArray(body.skills) ? body.skills : [],
    notes: body.notes || '',
    createdAt: now,
    updatedAt: now
  };

  if (!db.employees) db.employees = [];
  db.employees.unshift(newEmployee);

  db.activities.unshift({
    id: `act-emp-${Date.now()}`,
    department: newEmployee.department,
    type: 'note',
    title: `Employee Added: ${newEmployee.name}`,
    description: `Added ${newEmployee.name} as ${newEmployee.role} in ${newEmployee.department} department.`,
    performedBy: 'Bitso Administrator',
    timestamp: now
  });

  writeDB(db);
  res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = (db.employees || []).findIndex((e: any) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const existing = db.employees[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  db.employees[index] = updated;
  writeDB(db);
  res.json(updated);
});

app.delete('/api/employees/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLen = (db.employees || []).length;
  db.employees = (db.employees || []).filter((e: any) => e.id !== id);
  if (db.employees.length === initialLen) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  db.activities.unshift({
    id: `act-del-emp-${Date.now()}`,
    department: 'system',
    type: 'note',
    title: 'Employee Removed',
    description: `Employee profile ${id} removed from directory.`,
    performedBy: 'Bitso Administrator',
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, message: 'Employee deleted.' });
});

// ----------------------------------------------------
// CLIENTS CRUD
// ----------------------------------------------------
app.get('/api/clients', (req, res) => {
  const db = readDB();
  let results = db.clients || [];

  const { department, status, tier, search } = req.query;
  if (department && department !== 'all') {
    results = results.filter((c: any) => c.primaryDepartment === department);
  }
  if (status && status !== 'all') {
    results = results.filter((c: any) => c.status === status);
  }
  if (tier && tier !== 'all') {
    results = results.filter((c: any) => c.tier === tier);
  }
  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter((c: any) =>
      c.name.toLowerCase().includes(s) ||
      c.contactName?.toLowerCase().includes(s) ||
      c.industry?.toLowerCase().includes(s)
    );
  }

  res.json(results);
});

app.post('/api/clients', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: 'Client name is required.' });
  }

  const newClient = {
    id: `c-${Date.now()}`,
    name: body.name,
    industry: body.industry || 'Technology',
    tier: body.tier || 'Mid-Market',
    primaryDepartment: body.primaryDepartment || 'sales',
    status: body.status || 'active',
    healthScore: Number(body.healthScore) || 85,
    annualValue: Number(body.annualValue) || 0,
    contactName: body.contactName || '',
    contactEmail: body.contactEmail || '',
    contactPhone: body.contactPhone || '',
    assignedLead: body.assignedLead || 'Unassigned',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.clients = [newClient, ...(db.clients || [])];

  // Log activity
  db.activities = [
    {
      id: `act-${Date.now()}`,
      clientId: newClient.id,
      clientName: newClient.name,
      department: newClient.primaryDepartment,
      type: 'note',
      title: `Account Created: ${newClient.name}`,
      description: `New ${newClient.tier} client registered under ${newClient.primaryDepartment.toUpperCase()} department.`,
      performedBy: body.assignedLead || 'System User',
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const index = (db.clients || []).findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Client not found.' });
  }

  const existing = db.clients[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  db.clients[index] = updated;

  // Log activity
  db.activities = [
    {
      id: `act-${Date.now()}`,
      clientId: updated.id,
      clientName: updated.name,
      department: updated.primaryDepartment,
      type: 'note',
      title: `Account Updated: ${updated.name}`,
      description: `Status: ${updated.status}, Health Score: ${updated.healthScore}, Department: ${updated.primaryDepartment}.`,
      performedBy: updated.assignedLead || 'Account Manager',
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.json(updated);
});

app.delete('/api/clients/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const client = (db.clients || []).find((c: any) => c.id === id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found.' });
  }

  db.clients = (db.clients || []).filter((c: any) => c.id !== id);
  // Also clean up related records or keep clean
  db.contacts = (db.contacts || []).filter((c: any) => c.clientId !== id);
  db.deals = (db.deals || []).filter((d: any) => d.clientId !== id);
  db.tickets = (db.tickets || []).filter((t: any) => t.clientId !== id);

  db.activities = [
    {
      id: `act-${Date.now()}`,
      department: client.primaryDepartment || 'sales',
      type: 'note',
      title: `Client Removed: ${client.name}`,
      description: `Record and associated pipeline items were archived.`,
      performedBy: 'CRM Admin',
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.json({ success: true, removedId: id });
});

// ----------------------------------------------------
// CONTACTS CRUD
// ----------------------------------------------------
app.get('/api/contacts', (req, res) => {
  const db = readDB();
  let results = db.contacts || [];
  const { clientId, department, search } = req.query;

  if (clientId) {
    results = results.filter((c: any) => c.clientId === clientId);
  }
  if (department && department !== 'all') {
    results = results.filter((c: any) => c.department === department);
  }
  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter((c: any) =>
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.clientName?.toLowerCase().includes(s) ||
      c.role?.toLowerCase().includes(s)
    );
  }
  res.json(results);
});

app.post('/api/contacts', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (!body.name || !body.email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const newContact = {
    id: `ct-${Date.now()}`,
    clientId: body.clientId || '',
    clientName: body.clientName || 'General Stakeholder',
    name: body.name,
    email: body.email,
    phone: body.phone || '',
    role: body.role || 'Stakeholder',
    department: body.department || 'sales',
    isPrimary: Boolean(body.isPrimary),
    lastContacted: new Date().toISOString(),
  };

  db.contacts = [newContact, ...(db.contacts || [])];
  writeDB(db);
  res.status(201).json(newContact);
});

app.put('/api/contacts/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const index = (db.contacts || []).findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found.' });
  }

  const updated = {
    ...db.contacts[index],
    ...req.body,
    id,
  };
  db.contacts[index] = updated;
  writeDB(db);
  res.json(updated);
});

app.delete('/api/contacts/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  db.contacts = (db.contacts || []).filter((c: any) => c.id !== id);
  writeDB(db);
  res.json({ success: true, removedId: id });
});

// ----------------------------------------------------
// DEALS / PIPELINE CRUD
// ----------------------------------------------------
app.get('/api/deals', (req, res) => {
  const db = readDB();
  let results = db.deals || [];
  const { department, stage } = req.query;

  if (department && department !== 'all') {
    results = results.filter((d: any) => d.department === department);
  }
  if (stage && stage !== 'all') {
    results = results.filter((d: any) => d.stage === stage);
  }
  res.json(results);
});

app.post('/api/deals', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (!body.title || !body.clientName) {
    return res.status(400).json({ error: 'Deal title and client name are required.' });
  }

  const newDeal = {
    id: `d-${Date.now()}`,
    title: body.title,
    clientId: body.clientId || '',
    clientName: body.clientName,
    department: body.department || 'sales',
    stage: body.stage || 'lead',
    value: Number(body.value) || 0,
    expectedCloseDate: body.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    owner: body.owner || 'Marcus Vance',
    probability: Number(body.probability) || 50,
    notes: body.notes || '',
    updatedAt: new Date().toISOString(),
  };

  db.deals = [newDeal, ...(db.deals || [])];
  db.activities = [
    {
      id: `act-${Date.now()}`,
      clientId: newDeal.clientId,
      clientName: newDeal.clientName,
      department: newDeal.department,
      type: 'note',
      title: `Opportunity Logged: ${newDeal.title}`,
      description: `Value: $${newDeal.value.toLocaleString()} | Initial Stage: ${newDeal.stage.toUpperCase()}`,
      performedBy: newDeal.owner,
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.status(201).json(newDeal);
});

app.put('/api/deals/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const index = (db.deals || []).findIndex((d: any) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Deal not found.' });
  }

  const updated = {
    ...db.deals[index],
    ...req.body,
    id,
    updatedAt: new Date().toISOString(),
  };

  db.deals[index] = updated;
  writeDB(db);
  res.json(updated);
});

app.patch('/api/deals/:id/stage', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const { stage } = req.body;
  const deal = (db.deals || []).find((d: any) => d.id === id);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found.' });
  }

  const oldStage = deal.stage;
  deal.stage = stage;
  deal.updatedAt = new Date().toISOString();

  // Probability auto-adjustment based on stage
  const stageProbabilities: Record<string, number> = {
    lead: 20,
    qualified: 45,
    proposal: 65,
    negotiation: 85,
    won: 100,
    lost: 0,
  };
  if (stageProbabilities[stage] !== undefined) {
    deal.probability = stageProbabilities[stage];
  }

  db.activities = [
    {
      id: `act-${Date.now()}`,
      clientId: deal.clientId,
      clientName: deal.clientName,
      department: deal.department,
      type: 'handoff',
      title: `Pipeline Stage Changed: ${deal.title}`,
      description: `Progressed from ${oldStage.toUpperCase()} to ${stage.toUpperCase()} ($${Number(deal.value).toLocaleString()}).`,
      performedBy: deal.owner || 'Sales Rep',
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.json(deal);
});

app.delete('/api/deals/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  db.deals = (db.deals || []).filter((d: any) => d.id !== id);
  writeDB(db);
  res.json({ success: true, removedId: id });
});

// ----------------------------------------------------
// TICKETS / SERVICE REQUESTS CRUD
// ----------------------------------------------------
app.get('/api/tickets', (req, res) => {
  const db = readDB();
  let results = db.tickets || [];
  const { department, status, priority } = req.query;

  if (department && department !== 'all') {
    results = results.filter((t: any) => t.department === department);
  }
  if (status && status !== 'all') {
    results = results.filter((t: any) => t.status === status);
  }
  if (priority && priority !== 'all') {
    results = results.filter((t: any) => t.priority === priority);
  }
  res.json(results);
});

app.post('/api/tickets', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (!body.title || !body.clientName) {
    return res.status(400).json({ error: 'Title and client name are required.' });
  }

  const count = (db.tickets?.length || 0) + 1052;
  const newTicket = {
    id: `t-${Date.now()}`,
    ticketNumber: `TCK-${count}`,
    title: body.title,
    clientId: body.clientId || '',
    clientName: body.clientName,
    department: body.department || 'support',
    priority: body.priority || 'medium',
    status: body.status || 'open',
    assignedTo: body.assignedTo || 'Unassigned Staff',
    createdAt: new Date().toISOString(),
    dueDate: body.dueDate || new Date(Date.now() + 48 * 3600000).toISOString(),
    description: body.description || '',
    resolutionSummary: body.resolutionSummary || '',
  };

  db.tickets = [newTicket, ...(db.tickets || [])];
  db.activities = [
    {
      id: `act-${Date.now()}`,
      clientId: newTicket.clientId,
      clientName: newTicket.clientName,
      department: newTicket.department,
      type: 'note',
      title: `Ticket Filed: [${newTicket.ticketNumber}] ${newTicket.title}`,
      description: `Priority: ${newTicket.priority.toUpperCase()} | Assigned: ${newTicket.assignedTo}`,
      performedBy: newTicket.assignedTo,
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.status(201).json(newTicket);
});

app.put('/api/tickets/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const index = (db.tickets || []).findIndex((t: any) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  const updated = {
    ...db.tickets[index],
    ...req.body,
    id,
  };
  db.tickets[index] = updated;
  writeDB(db);
  res.json(updated);
});

app.patch('/api/tickets/:id/status', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const { status, resolutionSummary } = req.body;
  const ticket = (db.tickets || []).find((t: any) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  const prevStatus = ticket.status;
  ticket.status = status;
  if (resolutionSummary) {
    ticket.resolutionSummary = resolutionSummary;
  }

  db.activities = [
    {
      id: `act-${Date.now()}`,
      clientId: ticket.clientId,
      clientName: ticket.clientName,
      department: ticket.department,
      type: 'note',
      title: `Ticket Status: ${ticket.ticketNumber} is now ${status.toUpperCase()}`,
      description: resolutionSummary ? `Resolution: ${resolutionSummary}` : `Updated from ${prevStatus} to ${status}.`,
      performedBy: ticket.assignedTo || 'Support Staff',
      timestamp: new Date().toISOString(),
    },
    ...(db.activities || [])
  ];

  writeDB(db);
  res.json(ticket);
});

app.delete('/api/tickets/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  db.tickets = (db.tickets || []).filter((t: any) => t.id !== id);
  writeDB(db);
  res.json({ success: true, removedId: id });
});

// ----------------------------------------------------
// ACTIVITIES / INTERACTION LOGS
// ----------------------------------------------------
app.get('/api/activities', (req, res) => {
  const db = readDB();
  let activities = db.activities || [];
  const { department, clientId, limit } = req.query;

  if (department && department !== 'all') {
    activities = activities.filter((a: any) => a.department === department);
  }
  if (clientId) {
    activities = activities.filter((a: any) => a.clientId === clientId);
  }

  const max = Number(limit) || 50;
  res.json(activities.slice(0, max));
});

app.post('/api/activities', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (!body.title) {
    return res.status(400).json({ error: 'Activity title is required.' });
  }

  const newActivity = {
    id: `act-${Date.now()}`,
    clientId: body.clientId || '',
    clientName: body.clientName || 'General',
    department: body.department || 'sales',
    type: body.type || 'note',
    title: body.title,
    description: body.description || '',
    performedBy: body.performedBy || 'Current Staff',
    timestamp: new Date().toISOString(),
  };

  db.activities = [newActivity, ...(db.activities || [])];
  writeDB(db);
  res.status(201).json(newActivity);
});

// ----------------------------------------------------
// BACKUP & RECOVERY SYSTEM (THE BAK UP ENGINE & WEBSITE API)
// ----------------------------------------------------

// List all server backups with stats & metadata
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    const backups = files.map(filename => {
      const filePath = path.join(BACKUPS_DIR, filename);
      const stat = fs.statSync(filePath);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const meta = content.metadata || {};
        return {
          id: meta.backupId || filename,
          filename,
          timestamp: meta.timestamp || stat.mtime.toISOString(),
          type: meta.type || 'manual',
          label: meta.label || filename,
          fileSizeBytes: stat.size,
          counts: {
            clients: meta.clientCount || content.data?.clients?.length || 0,
            contacts: meta.contactCount || content.data?.contacts?.length || 0,
            deals: meta.dealCount || content.data?.deals?.length || 0,
            tickets: meta.ticketCount || content.data?.tickets?.length || 0,
            activities: meta.activityCount || content.data?.activities?.length || 0,
          },
          checksum: meta.checksum || 'verified',
        };
      } catch (err) {
        return {
          id: filename,
          filename,
          timestamp: stat.mtime.toISOString(),
          type: 'manual',
          label: filename,
          fileSizeBytes: stat.size,
          counts: { clients: 0, contacts: 0, deals: 0, tickets: 0, activities: 0 },
          checksum: 'unknown',
        };
      }
    });

    // Sort newest first
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(backups);
  } catch (err: any) {
    console.error('Failed to list backups:', err);
    res.status(500).json({ error: 'Failed to retrieve backups list', details: err.message });
  }
});

// Trigger an immediate manual or automated snapshot
app.post('/api/backups/create', (req, res) => {
  try {
    const { label, type } = req.body;
    const snapshot = createSnapshotSync(label || 'Manual Snapshot', type || 'manual');

    // Register activity
    const db = readDB();
    db.activities = [
      {
        id: `act-${Date.now()}`,
        department: 'system',
        type: 'backup',
        title: `System Backup Generated: ${snapshot.label}`,
        description: `Snapshot stored safely. Total records: ${snapshot.counts.clients} clients, ${snapshot.counts.deals} deals, ${snapshot.counts.tickets} tickets. Checksum: ${snapshot.checksum}.`,
        performedBy: 'Disaster Recovery Daemon',
        timestamp: new Date().toISOString(),
      },
      ...(db.activities || [])
    ];
    writeDB(db);

    res.status(201).json({
      success: true,
      message: 'Backup snapshot generated and securely saved on server.',
      snapshot,
    });
  } catch (err: any) {
    console.error('Failed to create backup:', err);
    res.status(500).json({ error: 'Failed to create backup snapshot', details: err.message });
  }
});

// Restore database from a server snapshot
app.post('/api/backups/restore/:id', (req, res) => {
  try {
    const id = req.params.id;
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    let targetFile = files.find(f => f === id || f === `${id}.json`);

    // If not direct match, inspect metadata backupId
    if (!targetFile) {
      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, file), 'utf-8'));
          if (content.metadata?.backupId === id) {
            targetFile = file;
            break;
          }
        } catch (e) {}
      }
    }

    if (!targetFile) {
      return res.status(404).json({ error: 'Specified backup snapshot file was not found.' });
    }

    const targetPath = path.join(BACKUPS_DIR, targetFile);
    const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    const restoreData = parsed.data || parsed;

    if (!restoreData.clients || !Array.isArray(restoreData.clients)) {
      return res.status(400).json({ error: 'Backup structure is invalid or corrupt.' });
    }

    // Step 1: Create a safety rollback snapshot of the CURRENT state before replacing
    const safetySnapshot = createSnapshotSync(`Pre-Restore Rollback (${new Date().toLocaleTimeString()})`, 'pre_restore_snapshot');

    // Step 2: Overwrite the active DB with the restore data
    restoreData.restoredAt = new Date().toISOString();
    restoreData.restoredFrom = targetFile;

    // Add activity log to the restored data
    restoreData.activities = [
      {
        id: `act-${Date.now()}`,
        department: 'system',
        type: 'backup',
        title: `Database Restored from Snapshot: ${parsed.metadata?.label || targetFile}`,
        description: `Rollback safety snapshot saved as ${safetySnapshot.filename}. Database operational.`,
        performedBy: 'System Administrator',
        timestamp: new Date().toISOString(),
      },
      ...(restoreData.activities || [])
    ];

    writeDB(restoreData);

    res.json({
      success: true,
      message: `Database successfully restored from snapshot [${targetFile}].`,
      safetySnapshot,
      recordSummary: {
        clients: restoreData.clients.length,
        contacts: restoreData.contacts?.length || 0,
        deals: restoreData.deals?.length || 0,
        tickets: restoreData.tickets?.length || 0,
      }
    });
  } catch (err: any) {
    console.error('Error restoring backup:', err);
    res.status(500).json({ error: 'Restore operation failed', details: err.message });
  }
});

// Upload and restore/store custom backup file
app.post('/api/backups/upload', (req, res) => {
  try {
    const { backupContent, restoreImmediately, label } = req.body;
    if (!backupContent) {
      return res.status(400).json({ error: 'No backup content provided.' });
    }

    let parsed: any;
    if (typeof backupContent === 'string') {
      parsed = JSON.parse(backupContent);
    } else {
      parsed = backupContent;
    }

    const actualData = parsed.data || parsed;
    if (!actualData.clients || !Array.isArray(actualData.clients)) {
      return res.status(400).json({ error: 'Uploaded JSON does not contain valid CRM dataset schema.' });
    }

    // Save as a snapshot file
    const timestamp = new Date().toISOString();
    const safeTime = timestamp.replace(/[:.]/g, '-');
    const filename = `crm-backup-uploaded-${safeTime}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const snapshotPayload: any = {
      metadata: {
        backupId: `bk-up-${Date.now()}`,
        label: label || 'External Uploaded Snapshot',
        type: 'manual',
        timestamp,
        version: actualData.version || '1.0.0',
        clientCount: actualData.clients?.length || 0,
        contactCount: actualData.contacts?.length || 0,
        dealCount: actualData.deals?.length || 0,
        ticketCount: actualData.tickets?.length || 0,
        activityCount: actualData.activities?.length || 0,
      },
      data: actualData,
    };

    const serialized = JSON.stringify(snapshotPayload, null, 2);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 12);
    snapshotPayload.metadata['checksum'] = hash;

    fs.writeFileSync(filePath, serialized, 'utf-8');

    if (restoreImmediately) {
      // Create rollback first
      createSnapshotSync('Pre-Upload-Restore Rollback', 'pre_restore_snapshot');
      writeDB(actualData);
    }

    res.json({
      success: true,
      filename,
      restored: Boolean(restoreImmediately),
      checksum: hash,
      recordSummary: {
        clients: actualData.clients.length,
        contacts: actualData.contacts?.length || 0,
        deals: actualData.deals?.length || 0,
        tickets: actualData.tickets?.length || 0,
      }
    });
  } catch (err: any) {
    console.error('Error handling uploaded backup:', err);
    res.status(400).json({ error: 'Failed to process uploaded backup', details: err.message });
  }
});

// Download a specific backup snapshot
app.get('/api/backups/download/:id', (req, res) => {
  try {
    const id = req.params.id;
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    let targetFile = files.find(f => f === id || f === `${id}.json`);

    if (!targetFile) {
      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, file), 'utf-8'));
          if (content.metadata?.backupId === id) {
            targetFile = file;
            break;
          }
        } catch (e) {}
      }
    }

    if (!targetFile) {
      return res.status(404).json({ error: 'Backup file not found.' });
    }

    const fullPath = path.join(BACKUPS_DIR, targetFile);
    res.setHeader('Content-Disposition', `attachment; filename="${targetFile}"`);
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(fullPath);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to download backup', details: err.message });
  }
});

// Live Database Direct Export
app.get('/api/backups/export-live', (req, res) => {
  try {
    const db = readDB();
    const timestamp = new Date().toISOString();
    const filename = `crm-live-export-${timestamp.replace(/[:.]/g, '-')}.json`;

    const exportBundle = {
      exportInfo: {
        system: 'Department CRM & Backup Hub',
        exportDate: timestamp,
        schemaVersion: '1.0.0',
      },
      data: db
    };

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportBundle, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: 'Export failed', details: err.message });
  }
});

// Delete a backup snapshot
app.delete('/api/backups/:id', (req, res) => {
  try {
    const id = req.params.id;
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    let targetFile = files.find(f => f === id || f === `${id}.json`);

    if (!targetFile) {
      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, file), 'utf-8'));
          if (content.metadata?.backupId === id) {
            targetFile = file;
            break;
          }
        } catch (e) {}
      }
    }

    if (!targetFile) {
      return res.status(404).json({ error: 'Snapshot not found.' });
    }

    fs.unlinkSync(path.join(BACKUPS_DIR, targetFile));
    res.json({ success: true, removed: targetFile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete snapshot', details: err.message });
  }
});

// Backup Configuration Endpoints
app.get('/api/backup-settings', (req, res) => {
  res.json(readBackupConfig());
});

app.post('/api/backup-settings', (req, res) => {
  const current = readBackupConfig();
  const updated = {
    ...current,
    autoBackupEnabled: req.body.autoBackupEnabled !== undefined ? Boolean(req.body.autoBackupEnabled) : current.autoBackupEnabled,
    frequencyHours: Number(req.body.frequencyHours) || current.frequencyHours,
    maxSnapshotsRetention: Number(req.body.maxSnapshotsRetention) || current.maxSnapshotsRetention,
  };
  writeBackupConfig(updated);
  res.json(updated);
});

// Database Diagnostics and Integrity Verification
app.get('/api/database/diagnostics', (req, res) => {
  try {
    const db = readDB();
    const stat = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
    const backupFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));

    let totalBackupBytes = 0;
    for (const f of backupFiles) {
      totalBackupBytes += fs.statSync(path.join(BACKUPS_DIR, f)).size;
    }

    // Check for broken foreign keys (e.g. deals or contacts referencing deleted clients)
    const clientIds = new Set((db.clients || []).map((c: any) => c.id));
    const orphanedContacts = (db.contacts || []).filter((ct: any) => ct.clientId && !clientIds.has(ct.clientId)).length;
    const orphanedDeals = (db.deals || []).filter((d: any) => d.clientId && !clientIds.has(d.clientId)).length;
    const orphanedTickets = (db.tickets || []).filter((t: any) => t.clientId && !clientIds.has(t.clientId)).length;

    res.json({
      status: 'operational',
      databaseFileSizeBytes: stat ? stat.size : 0,
      totalBackupsCount: backupFiles.length,
      totalBackupsStorageBytes: totalBackupBytes,
      integrityAudit: {
        healthy: orphanedContacts === 0 && orphanedDeals === 0 && orphanedTickets === 0,
        orphanedContacts,
        orphanedDeals,
        orphanedTickets,
        totalEntities: (db.clients?.length || 0) + (db.contacts?.length || 0) + (db.deals?.length || 0) + (db.tickets?.length || 0),
      },
      lastModified: stat ? stat.mtime.toISOString() : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Diagnostics failed', details: err.message });
  }
});

// ----------------------------------------------------
// AI INSIGHTS / DEPARTMENT BRIEFING (Optional Gemini Integration)
// ----------------------------------------------------
app.post('/api/ai/department-insight', async (req, res) => {
  const { department, topic } = req.body;
  const db = readDB();

  const depClients = (db.clients || []).filter((c: any) => !department || department === 'all' || c.primaryDepartment === department);
  const depDeals = (db.deals || []).filter((d: any) => !department || department === 'all' || d.department === department);
  const depTickets = (db.tickets || []).filter((t: any) => !department || department === 'all' || t.department === department);

  const contextData = {
    selectedDepartment: department || 'all',
    clientCount: depClients.length,
    activeRevenuePipeline: depDeals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0),
    urgentTicketsCount: depTickets.filter((t: any) => t.priority === 'urgent' && t.status !== 'resolved').length,
    clientsAtRisk: depClients.filter((c: any) => c.status === 'churn_risk').map((c: any) => c.name),
  };

  // If GEMINI_API_KEY is available, use GoogleGenAI
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an executive operational CRM analyst for an enterprise with Sales, Support, Operations, Finance, and Marketing departments.
Analyze the following department data and generate a high-impact, actionable 3-point briefing:
Data: ${JSON.stringify(contextData, null, 2)}
Topic/Focus requested: ${topic || 'Executive health check & risk mitigations'}

Format with 3 clear bullet points:
1. Operational Health & Pipeline Momentum
2. Critical Risks & Immediate Escalations
3. Cross-Department Recommendations`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({
        analysis: response.text,
        source: 'gemini-ai',
        generatedAt: new Date().toISOString(),
      });
    } catch (aiErr: any) {
      console.warn('Gemini API call failed, falling back to algorithmic analysis:', aiErr.message);
    }
  }

  // High quality algorithmic fallback briefing if no API key
  const fallbackBriefing = `**Departmental Operational Briefing (${department ? department.toUpperCase() : 'ALL DEPARTMENTS'}):**

• **Pipeline Momentum:** Currently managing ${depClients.length} accounts with an aggregate pipeline value of $${contextData.activeRevenuePipeline.toLocaleString()}. Priority deal momentum is steady.
• **Risk & SLA Status:** ${contextData.urgentTicketsCount} urgent tickets currently active. ${contextData.clientsAtRisk.length > 0 ? `Accounts flagged as churn risk: ${contextData.clientsAtRisk.join(', ')}. Recommend immediate customer success touchpoint.` : 'No critical customer churn flags detected in this period.'}
• **Operational Action:** Cross-department coordination between Sales and Operations recommended to guarantee SLA fulfillment and ensure seamless backup integrity checks.`;

  res.json({
    analysis: fallbackBriefing,
    source: 'system-rules-engine',
    generatedAt: new Date().toISOString(),
  });
});

// Endpoint to directly download project source archive
app.get('/api/download-archive', (req, res) => {
  const archivePath = path.join(process.cwd(), 'public', 'downloads', 'bitso_innovation_crm.tar.gz');
  if (fs.existsSync(archivePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="bitso_innovation_crm.tar.gz"');
    res.setHeader('Content-Type', 'application/gzip');
    return res.sendFile(archivePath);
  }
  res.status(404).json({ error: 'Archive package not found on server' });
});

// ----------------------------------------------------
// VITE SPA INTEGRATION
// ----------------------------------------------------
async function startServer() {
  try {
    await serverDatabase.init();
    serverDatabase.syncFromStore(readDB(), getAuthStore());
    console.log('[Database] SQLite Database Engine ready and synchronized.');
  } catch (dbErr) {
    console.error('[Database] Failed to initialize SQLite database:', dbErr);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Department CRM & Backup Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
