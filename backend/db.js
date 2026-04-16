import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('work', 'break')),
    duration_planned INTEGER NOT NULL,
    duration_actual INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

export const createSession = (sessionData) => {
  const stmt = db.prepare(`
    INSERT INTO sessions (type, duration_planned, duration_actual, completed, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    sessionData.type,
    sessionData.duration_planned,
    sessionData.duration_actual,
    sessionData.completed ? 1 : 0,
    sessionData.started_at || null,
    sessionData.completed_at || null
  );
  return { id: info.lastInsertRowid, ...sessionData };
};

export const getSessions = (limit = 50, offset = 0) => {
  const stmt = db.prepare(`
    SELECT * FROM sessions
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
};

export const getSessionsByDateRange = (startDate, endDate, type = null) => {
  let query = `
    SELECT * FROM sessions
    WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
  `;
  const params = [startDate, endDate];
  
  if (type && (type === 'work' || type === 'break')) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

export const getDailyStats = (date = null) => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(CASE WHEN type = 'work' THEN 1 ELSE 0 END) as work_sessions,
      SUM(CASE WHEN type = 'break' THEN 1 ELSE 0 END) as break_sessions,
      SUM(CASE WHEN type = 'work' THEN duration_actual ELSE 0 END) as total_focus_seconds,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_sessions
    FROM sessions
    WHERE date(created_at) = date(?)
  `);
  return stmt.get(targetDate);
};

export const getWeeklyStats = (startDate = null) => {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const stmt = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as total_sessions,
      SUM(CASE WHEN type = 'work' THEN 1 ELSE 0 END) as work_sessions,
      SUM(CASE WHEN type = 'work' THEN duration_actual ELSE 0 END) as total_focus_seconds
    FROM sessions
    WHERE date(created_at) >= date(?)
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `);
  return stmt.all(start);
};

export const getCalendarData = (startDate = null, endDate = null) => {
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const stmt = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as sessions,
      SUM(CASE WHEN type = 'work' THEN 1 ELSE 0 END) as work_sessions,
      SUM(CASE WHEN type = 'work' THEN duration_actual ELSE 0 END) as total_seconds
    FROM sessions
    WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `);
  return stmt.all(start, end);
};

export const exportSessionsCSV = () => {
  const stmt = db.prepare(`
    SELECT 
      id, type, duration_planned, duration_actual, 
      completed, started_at, completed_at, created_at
    FROM sessions
    ORDER BY created_at DESC
  `);
  const sessions = stmt.all();
  
  if (sessions.length === 0) return '';
  
  const headers = Object.keys(sessions[0]).join(',');
  const rows = sessions.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export const updateSession = (id, updates) => {
  const fields = Object.keys(updates).filter(key => key !== 'id');
  if (fields.length === 0) return null;
  
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const stmt = db.prepare(`
    UPDATE sessions
    SET ${setClause}, updated_at = datetime('now')
    WHERE id = ?
  `);
  
  const info = stmt.run(...values, id);
  if (info.changes === 0) return null;
  
  const selectStmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return selectStmt.get(id);
};

export const deleteSession = (id) => {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
};

export default db;