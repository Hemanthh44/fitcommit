const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let dbClient = null;
let dbType = 'sqlite'; // 'postgres' or 'sqlite'

// Fallback discrete PostgreSQL configuration
const pgDiscreteConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  database: process.env.PG_DATABASE || 'fitcommit',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
};

async function initDB() {
  if (dbClient) {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  const tryPostgres = Boolean(databaseUrl) || process.env.USE_POSTGRES === 'true' || Boolean(process.env.PG_PASSWORD);

  if (tryPostgres) {
    try {
      const { Pool, Client } = require('pg');

      let poolConfig = null;

      if (databaseUrl) {
        console.log('[Database] Connecting to PostgreSQL using DATABASE_URL...');
        const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
        const requiresSsl = process.env.NODE_ENV === 'production' || 
                            databaseUrl.includes('sslmode=require') || 
                            !isLocalhost;

        poolConfig = {
          connectionString: databaseUrl,
          ssl: requiresSsl ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };
      } else {
        console.log(`[Database] Connecting to discrete PostgreSQL host: ${pgDiscreteConfig.host}:${pgDiscreteConfig.port}...`);
        
        // Check if database exists, create if missing (only for localhost admin client)
        try {
          const adminClient = new Client({
            ...pgDiscreteConfig,
            database: 'postgres'
          });
          await adminClient.connect();
          const checkDb = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [pgDiscreteConfig.database]);
          if (checkDb.rows.length === 0) {
            console.log(`[Database] Creating PostgreSQL database: ${pgDiscreteConfig.database}`);
            await adminClient.query(`CREATE DATABASE "${pgDiscreteConfig.database}"`);
          }
          await adminClient.end();
        } catch (adminErr) {
          console.warn('[Database] Admin database check notice:', adminErr.message);
        }

        poolConfig = {
          ...pgDiscreteConfig,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };
      }

      const pool = new Pool(poolConfig);

      // Gracefully log and prevent crash on idle client errors
      pool.on('error', (err) => {
        console.error('[Database Pool Error] Unexpected idle client error:', err.message);
      });

      // Test connection
      const testRes = await pool.query('SELECT NOW() as current_time');
      console.log(`[Database] Connected successfully to PostgreSQL at: ${testRes.rows[0].current_time}`);

      // Execute schema DDL safely (CREATE TABLE IF NOT EXISTS)
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
      }

      // Enforce duplicate check-in index constraint
      try {
        await pool.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_active_session 
          ON gym_attendance(user_id, gym_id) 
          WHERE status IN ('ACTIVE', 'CHECKED_IN') AND check_out_time IS NULL;
        `);
      } catch (idxErr) {
        console.warn('[Database] Unique index notice:', idxErr.message);
      }

      dbClient = pool;
      dbType = 'postgres';
      return;
    } catch (err) {
      console.warn('[Database] PostgreSQL connection unavailable. Details:', err.message);
      console.warn('[Database] Falling back to seamless embedded SQLite database for local reliability.');
    }
  }

  // Embedded mode using better-sqlite3
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '..', 'fitcommit.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  console.log(`[Database] Using embedded SQLite database at: ${dbPath}`);

  // Create SQLite compatibility wrapper
  dbClient = {
    sqlite,
    async query(text, params = []) {
      // Convert PostgreSQL $1, $2, ... parameter placeholders to SQLite ?
      let sqliteText = text.replace(/\$(\d+)/g, '?');
      sqliteText = sqliteText.replace(/TIMESTAMP WITH TIME ZONE/gi, 'DATETIME');
      sqliteText = sqliteText.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      sqliteText = sqliteText.replace(/NUMERIC\(\d+,\d+\)/gi, 'REAL');
      sqliteText = sqliteText.replace(/JSONB/gi, 'TEXT');
      sqliteText = sqliteText.replace(/CURRENT_DATE \+ INTERVAL '(\d+) days'/gi, "DATE('now', '+$1 days')");
      sqliteText = sqliteText.replace(/CURRENT_DATE - INTERVAL '(\d+) days'/gi, "DATE('now', '-$1 days')");
      sqliteText = sqliteText.replace(/CURRENT_DATE/gi, "DATE('now')");
      sqliteText = sqliteText.replace(/CURRENT_TIMESTAMP/gi, "DATETIME('now')");

      const trimmed = sqliteText.trim();
      const isSelect = /^SELECT\b/i.test(trimmed);

      try {
        if (isSelect) {
          const stmt = sqlite.prepare(sqliteText);
          const rows = stmt.all(...params);
          return { rows, rowCount: rows.length };
        } else {
          const stmt = sqlite.prepare(sqliteText);
          const result = stmt.run(...params);
          return {
            rows: result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : [],
            rowCount: result.changes,
            lastInsertRowid: result.lastInsertRowid,
          };
        }
      } catch (err) {
        console.error('[SQL Execution Error]', err.message, '| Query:', sqliteText, '| Params:', params);
        throw err;
      }
    },
    async exec(text) {
      return sqlite.exec(text);
    }
  };

  // Enforce partial unique index in SQLite
  try {
    sqlite.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_active_session 
      ON gym_attendance(user_id, gym_id) 
      WHERE status IN ('ACTIVE', 'CHECKED_IN') AND check_out_time IS NULL;
    `);
  } catch (idxErr) {
    // ignore if index already exists
  }

  dbType = 'sqlite';
}

async function query(text, params = []) {
  if (!dbClient) {
    await initDB();
  }
  if (dbType === 'postgres') {
    let pgText = text;
    // Normalize SQLite datetime('now', ...) to PostgreSQL (CURRENT_TIMESTAMP + INTERVAL '...')
    pgText = pgText.replace(/datetime\('now',\s*'([+-]?\d+(?:\.\d+)?)\s*(minutes|hours|days)'\)/gi, "(CURRENT_TIMESTAMP + INTERVAL '$1 $2')");
    pgText = pgText.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
    // Normalize SQLite DATE('now', '+/-X days') to PostgreSQL (CURRENT_DATE + INTERVAL '$1 days')::date
    pgText = pgText.replace(/DATE\('now',\s*'([+-]?\d+)\s*days'\)/gi, "(CURRENT_DATE + INTERVAL '$1 days')::date");
    pgText = pgText.replace(/DATE\('now'\)/gi, 'CURRENT_DATE');
    // Normalize last_insert_rowid() to PostgreSQL lastval()
    pgText = pgText.replace(/last_insert_rowid\(\)/gi, 'lastval()');
    return dbClient.query(pgText, params);
  }
  return dbClient.query(text, params);
}

async function exec(text) {
  if (!dbClient) {
    await initDB();
  }
  if (dbType === 'postgres') {
    return dbClient.query(text);
  } else {
    return dbClient.exec(text);
  }
}

async function checkDbHealth() {
  try {
    if (!dbClient) {
      await initDB();
    }
    if (dbType === 'postgres') {
      const res = await dbClient.query('SELECT 1 as healthy');
      return { healthy: Boolean(res.rows?.length), type: 'postgres' };
    } else {
      const row = dbClient.sqlite.prepare('SELECT 1 as healthy').get();
      return { healthy: Boolean(row?.healthy), type: 'sqlite' };
    }
  } catch (err) {
    return { healthy: false, error: err.message, type: dbType };
  }
}

module.exports = {
  initDB,
  query,
  exec,
  checkDbHealth,
  getDbType: () => dbType,
};
