import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: number;
  isSelect: boolean;
  changes?: number;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }[];
}

class ServerDatabase {
  private db: Database | null = null;
  private dbPath: string;
  private dataDir: string;
  private isInitialized = false;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.dbPath = path.join(this.dataDir, 'crm_database.sqlite');
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } catch (err) {
        console.error('Error loading existing SQLite database, creating new:', err);
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON;');
    
    // Create base tables and indexes
    this.createSchema();
    this.saveToDisk();
    this.isInitialized = true;
    console.log(`[Database] SQLite Database initialized at ${this.dbPath}`);
  }

  private createSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'manager',
        department TEXT DEFAULT 'it_tech',
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_login TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        department TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        joined_date TEXT,
        location TEXT,
        skills_json TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        industry TEXT,
        status TEXT NOT NULL DEFAULT 'lead',
        primary_department TEXT NOT NULL DEFAULT 'sales',
        assigned_employee_id TEXT,
        assigned_employee_name TEXT,
        health_score INTEGER DEFAULT 80,
        contract_value REAL DEFAULT 0,
        tags_json TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        client_name TEXT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT,
        is_primary INTEGER DEFAULT 0,
        department TEXT DEFAULT 'sales',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT,
        department TEXT NOT NULL DEFAULT 'sales',
        value REAL NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'lead',
        probability INTEGER DEFAULT 20,
        expected_close_date TEXT,
        owner_id TEXT,
        owner_name TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        client_id TEXT NOT NULL,
        client_name TEXT,
        department TEXT NOT NULL DEFAULT 'support',
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        assigned_to_id TEXT,
        assigned_to_name TEXT,
        resolution_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        department TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        performed_by TEXT,
        related_entity_id TEXT,
        related_entity_type TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS database_backups (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        checksum TEXT NOT NULL,
        record_counts_json TEXT,
        created_at TEXT NOT NULL
      );

      -- Performance Indexes
      CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department);
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
      CREATE INDEX IF NOT EXISTS idx_clients_dept ON clients(primary_department);
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
      CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
      CREATE INDEX IF NOT EXISTS idx_deals_dept ON deals(department);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_dept ON tickets(department);
      CREATE INDEX IF NOT EXISTS idx_activities_time ON activities(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
    `);

    // Record baseline migration
    const res = this.db.exec("SELECT count(*) as count FROM schema_migrations WHERE version = 'v1.0.0_initial'");
    if (res.length === 0 || res[0].values[0][0] === 0) {
      this.db.run(
        "INSERT INTO schema_migrations (version, applied_at, description) VALUES (?, ?, ?)",
        ['v1.0.0_initial', new Date().toISOString(), 'Base CRM schema with users, employees, clients, deals, tickets, activities, and indexing']
      );
    }
  }

  public saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('[Database] Error saving SQLite database to disk:', err);
    }
  }

  public getDbFilePath(): string {
    return this.dbPath;
  }

  public getDbFileSize(): number {
    try {
      if (fs.existsSync(this.dbPath)) {
        return fs.statSync(this.dbPath).size;
      }
    } catch (e) {}
    return 0;
  }

  public executeQuery(sql: string, params: any[] = []): SqlQueryResult {
    if (!this.db) throw new Error('Database not initialized');
    const start = performance.now();
    const trimmed = sql.trim();
    const isSelect = /^(SELECT|PRAGMA|EXPLAIN)/i.test(trimmed);

    try {
      if (isSelect) {
        const results = this.db.exec(trimmed, params);
        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        if (results.length === 0) {
          return {
            columns: [],
            values: [],
            rowCount: 0,
            executionTimeMs,
            isSelect: true
          };
        }
        return {
          columns: results[0].columns,
          values: results[0].values,
          rowCount: results[0].values.length,
          executionTimeMs,
          isSelect: true
        };
      } else {
        this.db.run(trimmed, params);
        this.saveToDisk();
        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        return {
          columns: ['status', 'message'],
          values: [['success', 'Statement executed successfully']],
          rowCount: 1,
          executionTimeMs,
          isSelect: false,
          changes: this.db.getRowsModified()
        };
      }
    } catch (err: any) {
      const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
      throw new Error(`SQL Error [${executionTimeMs}ms]: ${err.message}`);
    }
  }

  public getTables(): TableInfo[] {
    if (!this.db) throw new Error('Database not initialized');
    const tablesRes = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;");
    if (tablesRes.length === 0) return [];

    const tables: TableInfo[] = [];
    for (const row of tablesRes[0].values) {
      const tableName = String(row[0]);
      // Column info
      const colRes = this.db.exec(`PRAGMA table_info("${tableName}");`);
      const columns = colRes.length > 0
        ? colRes[0].values.map((c: any) => ({
            cid: Number(c[0]),
            name: String(c[1]),
            type: String(c[2]),
            notnull: Number(c[3]),
            dflt_value: c[4],
            pk: Number(c[5])
          }))
        : [];

      // Count
      let rowCount = 0;
      try {
        const countRes = this.db.exec(`SELECT count(*) FROM "${tableName}";`);
        if (countRes.length > 0) {
          rowCount = Number(countRes[0].values[0][0]);
        }
      } catch (e) {}

      tables.push({
        name: tableName,
        rowCount,
        columnCount: columns.length,
        columns
      });
    }

    return tables;
  }

  public getTableData(tableName: string, limit: number = 50, offset: number = 0, search?: string) {
    if (!this.db) throw new Error('Database not initialized');
    // Sanitize table name
    const validTables = this.getTables().map(t => t.name);
    if (!validTables.includes(tableName)) {
      throw new Error(`Table "${tableName}" does not exist in SQLite database.`);
    }

    let query = `SELECT * FROM "${tableName}"`;
    const params: any[] = [];

    if (search && search.trim()) {
      // Find text columns
      const tableInfo = this.getTables().find(t => t.name === tableName);
      const textCols = tableInfo?.columns.filter(c => c.type.toUpperCase().includes('TEXT') || c.type.toUpperCase().includes('CHAR')) || [];
      if (textCols.length > 0) {
        const conditions = textCols.map(c => `"${c.name}" LIKE ?`).join(' OR ');
        query += ` WHERE ${conditions}`;
        textCols.forEach(() => params.push(`%${search.trim()}%`));
      }
    }

    query += ` LIMIT ${Math.min(limit, 500)} OFFSET ${Math.max(offset, 0)};`;

    const res = this.db.exec(query, params);
    const countRes = this.db.exec(`SELECT count(*) FROM "${tableName}";`);
    const totalRows = countRes.length > 0 ? Number(countRes[0].values[0][0]) : 0;

    if (res.length === 0) {
      return { columns: [], rows: [], totalRows, page: Math.floor(offset / limit) + 1 };
    }

    const columns = res[0].columns;
    const rows = res[0].values.map((v: any[]) => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = v[idx];
      });
      return obj;
    });

    return {
      columns,
      rows,
      totalRows,
      page: Math.floor(offset / limit) + 1
    };
  }

  public generateSqlDump(): string {
    if (!this.db) throw new Error('Database not initialized');
    const tables = this.getTables();
    let sqlDump = `-- ==========================================================\n`;
    sqlDump += `-- Bitso Innovation CRM - Complete SQLite Database SQL Dump\n`;
    sqlDump += `-- Exported at: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: crm_database.sqlite\n`;
    sqlDump += `-- ==========================================================\n\n`;
    sqlDump += `PRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n\n`;

    for (const table of tables) {
      const ddlRes = this.db.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.name}';`);
      if (ddlRes.length > 0 && ddlRes[0].values[0][0]) {
        sqlDump += `-- Structure for table ${table.name}\n`;
        sqlDump += `DROP TABLE IF EXISTS "${table.name}";\n`;
        sqlDump += `${ddlRes[0].values[0][0]};\n\n`;
      }

      // Rows
      const dataRes = this.db.exec(`SELECT * FROM "${table.name}";`);
      if (dataRes.length > 0 && dataRes[0].values.length > 0) {
        const columns = dataRes[0].columns.map(c => `"${c}"`).join(', ');
        sqlDump += `-- Data records for table ${table.name} (${dataRes[0].values.length} rows)\n`;
        for (const row of dataRes[0].values) {
          const formattedVals = row.map(v => {
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            return `'${String(v).replace(/'/g, "''")}'`;
          }).join(', ');
          sqlDump += `INSERT INTO "${table.name}" (${columns}) VALUES (${formattedVals});\n`;
        }
        sqlDump += `\n`;
      }
    }

    sqlDump += `COMMIT;\nPRAGMA foreign_keys = ON;\n-- End of SQL Dump\n`;
    return sqlDump;
  }

  public optimize(): { vacuumed: boolean; integrity: string; executionTimeMs: number } {
    if (!this.db) throw new Error('Database not initialized');
    const start = performance.now();
    this.db.run('VACUUM;');
    this.db.run('REINDEX;');
    const integrityRes = this.db.exec('PRAGMA integrity_check;');
    this.saveToDisk();
    const integrity = integrityRes.length > 0 && integrityRes[0].values.length > 0
      ? String(integrityRes[0].values[0][0])
      : 'ok';

    return {
      vacuumed: true,
      integrity,
      executionTimeMs: Math.round((performance.now() - start) * 100) / 100
    };
  }

  public syncFromStore(data: any, authStore?: any) {
    if (!this.db) return;
    try {
      // Sync users
      if (authStore && authStore.users && authStore.users.length > 0) {
        for (const u of authStore.users) {
          this.db.run(`
            INSERT OR REPLACE INTO users (id, email, name, role, department, salt, password_hash, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            u.id,
            u.email,
            u.name,
            u.role || 'admin',
            u.department || 'it_tech',
            u.salt || '',
            u.passwordHash || '',
            u.createdAt || new Date().toISOString(),
            u.lastLogin || null
          ]);
        }
      }

      // Sync employees
      if (Array.isArray(data.employees)) {
        for (const e of data.employees) {
          this.db.run(`
            INSERT OR REPLACE INTO employees (id, name, email, phone, department, role, status, joined_date, location, skills_json, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            e.id,
            e.name,
            e.email,
            e.phone || '',
            e.department || 'it_tech',
            e.role || 'Specialist',
            e.status || 'active',
            e.joinedDate || '',
            e.location || 'HQ',
            JSON.stringify(e.skills || []),
            e.notes || '',
            e.createdAt || new Date().toISOString(),
            e.updatedAt || new Date().toISOString()
          ]);
        }
      }

      // Sync clients
      if (Array.isArray(data.clients)) {
        for (const c of data.clients) {
          this.db.run(`
            INSERT OR REPLACE INTO clients (id, name, company, email, phone, industry, status, primary_department, assigned_employee_id, assigned_employee_name, health_score, contract_value, tags_json, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            c.id,
            c.name,
            c.company,
            c.email,
            c.phone || '',
            c.industry || '',
            c.status || 'active',
            c.primaryDepartment || 'sales',
            c.assignedEmployeeId || '',
            c.assignedEmployeeName || '',
            c.healthScore || 80,
            c.contractValue || 0,
            JSON.stringify(c.tags || []),
            c.notes || '',
            c.createdAt || new Date().toISOString(),
            c.updatedAt || new Date().toISOString()
          ]);
        }
      }

      // Sync contacts
      if (Array.isArray(data.contacts)) {
        for (const ct of data.contacts) {
          this.db.run(`
            INSERT OR REPLACE INTO contacts (id, client_id, client_name, name, email, phone, role, is_primary, department, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            ct.id,
            ct.clientId || '',
            ct.clientName || '',
            ct.name,
            ct.email,
            ct.phone || '',
            ct.role || '',
            ct.isPrimary ? 1 : 0,
            ct.department || 'sales',
            ct.createdAt || new Date().toISOString(),
            ct.updatedAt || new Date().toISOString()
          ]);
        }
      }

      // Sync deals
      if (Array.isArray(data.deals)) {
        for (const d of data.deals) {
          this.db.run(`
            INSERT OR REPLACE INTO deals (id, title, client_id, client_name, department, value, stage, probability, expected_close_date, owner_id, owner_name, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            d.id,
            d.title,
            d.clientId || '',
            d.clientName || '',
            d.department || 'sales',
            d.value || 0,
            d.stage || 'lead',
            d.probability || 20,
            d.expectedCloseDate || '',
            d.ownerId || '',
            d.ownerName || '',
            d.notes || '',
            d.createdAt || new Date().toISOString(),
            d.updatedAt || new Date().toISOString()
          ]);
        }
      }

      // Sync tickets
      if (Array.isArray(data.tickets)) {
        for (const t of data.tickets) {
          this.db.run(`
            INSERT OR REPLACE INTO tickets (id, title, description, client_id, client_name, department, status, priority, assigned_to_id, assigned_to_name, resolution_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            t.id,
            t.title,
            t.description || '',
            t.clientId || '',
            t.clientName || '',
            t.department || 'support',
            t.status || 'open',
            t.priority || 'medium',
            t.assignedToId || '',
            t.assignedToName || '',
            t.resolutionNotes || '',
            t.createdAt || new Date().toISOString(),
            t.updatedAt || new Date().toISOString()
          ]);
        }
      }

      // Sync activities
      if (Array.isArray(data.activities)) {
        for (const a of data.activities) {
          this.db.run(`
            INSERT OR REPLACE INTO activities (id, department, type, title, description, performed_by, related_entity_id, related_entity_type, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            a.id,
            a.department || 'system',
            a.type || 'system',
            a.title,
            a.description || '',
            a.performedBy || 'System',
            a.relatedEntityId || null,
            a.relatedEntityType || null,
            a.timestamp || new Date().toISOString()
          ]);
        }
      }

      this.saveToDisk();
    } catch (err) {
      console.error('[Database] Sync error:', err);
    }
  }

  public getRawDb(): Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }
}

export const serverDatabase = new ServerDatabase();
