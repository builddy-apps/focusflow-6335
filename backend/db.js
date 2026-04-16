import Database from 'better-sqlite3';
import fs from 'fs';

// Create data directory if it doesn't exist
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// Initialize database connection
const db = new Database('./data/app.db');
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('work', 'short_break', 'long_break')),
    duration_minutes INTEGER,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE,
    work_sessions INTEGER DEFAULT 0,
    total_focus_minutes INTEGER DEFAULT 0,
    breaks_taken INTEGER DEFAULT 0,
    streak_day BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_duration INTEGER DEFAULT 25,
    short_break_duration INTEGER DEFAULT 5,
    long_break_duration INTEGER DEFAULT 15,
    sessions_until_long_break INTEGER DEFAULT 4,
    sound_enabled BOOLEAN DEFAULT 1,
    notifications_enabled BOOLEAN DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
  CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
`);

// Helper functions
function createSession(type, durationMinutes) {
  try {
    const stmt = db.prepare(`
      INSERT INTO sessions (type, duration_minutes, completed_at)
      VALUES (?, ?, datetime('now'))
    `);
    const result = stmt.run(type, durationMinutes);
    
    // Update daily stats when a work session is completed
    if (type === 'work') {
      updateDailyStats(durationMinutes);
    }
    
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
}

function getSessions(limit = 20, offset = 0) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM sessions
      ORDER BY completed_at DESC
      LIMIT ? OFFSET ?
    `);
    const sessions = stmt.all(limit, offset);
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { success: false, error: error.message };
  }
}

function getDailyStats(date) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM daily_stats
      WHERE date = ?
    `);
    const stats = stmt.get(date);
    
    if (!stats) {
      return { success: true, data: null };
    }
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return { success: false, error: error.message };
  }
}

function getWeeklyStats(startDate) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM daily_stats
      WHERE date >= ? AND date < date(?, '+7 days')
      ORDER BY date
    `);
    const stats = stmt.all(startDate);
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return { success: false, error: error.message };
  }
}

function updateDailyStats(focusMinutes = 0) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today's stats exist
    const existingStats = getDailyStats(today);
    
    if (existingStats.success && existingStats.data) {
      // Update existing stats
      const stmt = db.prepare(`
        UPDATE daily_stats
        SET work_sessions = work_sessions + 1,
            total_focus_minutes = total_focus_minutes + ?,
            streak_day = 1
        WHERE date = ?
      `);
      stmt.run(focusMinutes, today);
    } else {
      // Create new stats for today
      const stmt = db.prepare(`
        INSERT INTO daily_stats (date, work_sessions, total_focus_minutes, streak_day)
        VALUES (?, 1, ?, 1)
      `);
      stmt.run(today, focusMinutes);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating daily stats:', error);
    return { success: false, error: error.message };
  }
}

function getSettings() {
  try {
    const stmt = db.prepare(`
      SELECT * FROM settings
      ORDER BY id DESC
      LIMIT 1
    `);
    const settings = stmt.get();
    
    if (!settings) {
      // Return default settings if none exist
      return {
        success: true,
        data: {
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          sessions_until_long_break: 4,
          sound_enabled: 1,
          notifications_enabled: 1
        }
      };
    }
    
    return { success: true, data: settings };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, error: error.message };
  }
}

function updateSettings(settings) {
  try {
    // Get current settings
    const currentSettings = getSettings();
    
    if (currentSettings.success && currentSettings.data) {
      // Update existing settings
      const stmt = db.prepare(`
        UPDATE settings
        SET work_duration = ?,
            short_break_duration = ?,
            long_break_duration = ?,
            sessions_until_long_break = ?,
            sound_enabled = ?,
            notifications_enabled = ?
        WHERE id = ?
      `);
      stmt.run(
        settings.work_duration,
        settings.short_break_duration,
        settings.long_break_duration,
        settings.sessions_until_long_break,
        settings.sound_enabled,
        settings.notifications_enabled,
        currentSettings.data.id
      );
    } else {
      // Create new settings
      const stmt = db.prepare(`
        INSERT INTO settings (
          work_duration,
          short_break_duration,
          long_break_duration,
          sessions_until_long_break,
          sound_enabled,
          notifications_enabled
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        settings.work_duration,
        settings.short_break_duration,
        settings.long_break_duration,
        settings.sessions_until_long_break,
        settings.sound_enabled,
        settings.notifications_enabled
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
}

// Export database instance and helper functions
export { db, createSession, getSessions, getDailyStats, getWeeklyStats, updateDailyStats, getSettings, updateSettings };