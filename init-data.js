import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
if (count.count > 0) {
  console.log('Data already seeded, skipping...');
  process.exit(0);
}

// Helper function to generate timestamps
const daysAgo = (days) => new Date(Date.now() - days * 86400000);
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);
const addSeconds = (date, seconds) => new Date(date.getTime() + seconds * 1000);

// Generate realistic session data
const sessions = [];

// Today's sessions (5 sessions - a productive day)
const today = new Date();
sessions.push({
  type: 'work',
  duration_planned: 1500, // 25 min
  duration_actual: 1485,  // slightly under
  completed: 1,
  started_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0).toISOString(),
  completed_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 24, 45).toISOString(),
  created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0).toISOString(),
  updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 24, 45).toISOString()
});

sessions.push({
  type: 'break',
  duration_planned: 300, // 5 min
  duration_actual: 300,
  completed: 1,
  started_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 25, 0).toISOString(),
  completed_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0).toISOString(),
  created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 25, 0).toISOString(),
  updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 35, 0).toISOString(),
  completed_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0).toISOString(),
  created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 35, 0).toISOString(),
  updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 720, // Abandoned after 12 min
  completed: 0,
  started_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 15, 0).toISOString(),
  completed_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 27, 0).toISOString(),
  created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 15, 0).toISOString(),
  updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 27, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1505, // Slightly over
  completed: 1,
  started_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0).toISOString(),
  completed_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 25, 5).toISOString(),
  created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0).toISOString(),
  updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 25, 5).toISOString()
});

// Yesterday's sessions (4 sessions)
const yesterday = daysAgo(1);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 30, 0).toISOString(),
  completed_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 55, 0).toISOString(),
  created_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 30, 0).toISOString(),
  updated_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 55, 0).toISOString()
});

sessions.push({
  type: 'break',
  duration_planned: 300,
  duration_actual: 310,
  completed: 1,
  started_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 55, 0).toISOString(),
  completed_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 0, 10).toISOString(),
  created_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 55, 0).toISOString(),
  updated_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 0, 10).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1800, // 30 min session
  duration_actual: 1800,
  completed: 1,
  started_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 0, 0).toISOString(),
  completed_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 30, 0).toISOString(),
  created_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 0, 0).toISOString(),
  updated_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 30, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 45, 0).toISOString(),
  completed_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16, 10, 0).toISOString(),
  created_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 45, 0).toISOString(),
  updated_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16, 10, 0).toISOString()
});

// 2 days ago (3 sessions)
const twoDaysAgo = daysAgo(2);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1490,
  completed: 1,
  started_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 0, 0).toISOString(),
  completed_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 24, 50).toISOString(),
  created_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 0, 0).toISOString(),
  updated_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 24, 50).toISOString()
});

sessions.push({
  type: 'break',
  duration_planned: 900, // 15 min long break
  duration_actual: 900,
  completed: 1,
  started_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 30, 0).toISOString(),
  completed_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 45, 0).toISOString(),
  created_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 30, 0).toISOString(),
  updated_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 10, 45, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1200, // 20 min session
  duration_actual: 1200,
  completed: 1,
  started_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 13, 15, 0).toISOString(),
  completed_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 13, 35, 0).toISOString(),
  created_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 13, 15, 0).toISOString(),
  updated_at: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 13, 35, 0).toISOString()
});

// 3 days ago (4 sessions)
const threeDaysAgo = daysAgo(3);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 0, 0).toISOString(),
  completed_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 25, 0).toISOString(),
  created_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 0, 0).toISOString(),
  updated_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 25, 0).toISOString()
});

sessions.push({
  type: 'break',
  duration_planned: 300,
  duration_actual: 300,
  completed: 1,
  started_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 25, 0).toISOString(),
  completed_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 30, 0).toISOString(),
  created_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 25, 0).toISOString(),
  updated_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 30, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 35, 0).toISOString(),
  completed_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 10, 0, 0).toISOString(),
  created_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 9, 35, 0).toISOString(),
  updated_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 10, 0, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 450, // Abandoned after 7.5 min
  completed: 0,
  started_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 14, 0, 0).toISOString(),
  completed_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 14, 7, 30).toISOString(),
  created_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 14, 0, 0).toISOString(),
  updated_at: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 14, 7, 30).toISOString()
});

// 5 days ago (3 sessions)
const fiveDaysAgo = daysAgo(5);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1510,
  completed: 1,
  started_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 0, 0).toISOString(),
  completed_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 25, 10).toISOString(),
  created_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 0, 0).toISOString(),
  updated_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 25, 10).toISOString()
});

sessions.push({
  type: 'break',
  duration_planned: 300,
  duration_actual: 300,
  completed: 1,
  started_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 30, 0).toISOString(),
  completed_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 35, 0).toISOString(),
  created_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 30, 0).toISOString(),
  updated_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 11, 35, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 16, 0, 0).toISOString(),
  completed_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 16, 25, 0).toISOString(),
  created_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 16, 0, 0).toISOString(),
  updated_at: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate(), 16, 25, 0).toISOString()
});

// 7 days ago (2 sessions)
const sevenDaysAgo = daysAgo(7);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 10, 0, 0).toISOString(),
  completed_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 10, 25, 0).toISOString(),
  created_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 10, 0, 0).toISOString(),
  updated_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 10, 25, 0).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 600, // Abandoned after 10 min
  completed: 0,
  started_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 14, 30, 0).toISOString(),
  completed_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 14, 40, 0).toISOString(),
  created_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 14, 30, 0).toISOString(),
  updated_at: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 14, 40, 0).toISOString()
});

// 10 days ago (2 sessions)
const tenDaysAgo = daysAgo(10);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 15, 0).toISOString(),
  completed_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 40, 0).toISOString(),
  created_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 15, 0).toISOString(),
  updated_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 40, 0).toISOString()
});

sessions.push({
  type: 'break',
  duration_planned: 300,
  duration_actual: 300,
  completed: 1,
  started_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 40, 0).toISOString(),
  completed_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 45, 0).toISOString(),
  created_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 40, 0).toISOString(),
  updated_at: new Date(tenDaysAgo.getFullYear(), tenDaysAgo.getMonth(), tenDaysAgo.getDate(), 9, 45, 0).toISOString()
});

// 14 days ago (2 sessions)
const fourteenDaysAgo = daysAgo(14);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1495,
  completed: 1,
  started_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 11, 30, 0).toISOString(),
  completed_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 11, 54, 55).toISOString(),
  created_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 11, 30, 0).toISOString(),
  updated_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 11, 54, 55).toISOString()
});

sessions.push({
  type: 'work',
  duration_planned: 1800,
  duration_actual: 1800,
  completed: 1,
  started_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 15, 0, 0).toISOString(),
  completed_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 15, 30, 0).toISOString(),
  created_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 15, 0, 0).toISOString(),
  updated_at: new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate(), 15, 30, 0).toISOString()
});

// 21 days ago (1 session)
const twentyOneDaysAgo = daysAgo(21);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 1500,
  completed: 1,
  started_at: new Date(twentyOneDaysAgo.getFullYear(), twentyOneDaysAgo.getMonth(), twentyOneDaysAgo.getDate(), 10, 0, 0).toISOString(),
  completed_at: new Date(twentyOneDaysAgo.getFullYear(), twentyOneDaysAgo.getMonth(), twentyOneDaysAgo.getDate(), 10, 25, 0).toISOString(),
  created_at: new Date(twentyOneDaysAgo.getFullYear(), twentyOneDaysAgo.getMonth(), twentyOneDaysAgo.getDate(), 10, 0, 0).toISOString(),
  updated_at: new Date(twentyOneDaysAgo.getFullYear(), twentyOneDaysAgo.getMonth(), twentyOneDaysAgo.getDate(), 10, 25, 0).toISOString()
});

// 28 days ago (1 session)
const twentyEightDaysAgo = daysAgo(28);
sessions.push({
  type: 'work',
  duration_planned: 1500,
  duration_actual: 300, // Abandoned after 5 min
  completed: 0,
  started_at: new Date(twentyEightDaysAgo.getFullYear(), twentyEightDaysAgo.getMonth(), twentyEightDaysAgo.getDate(), 14, 0, 0).toISOString(),
  completed_at: new Date(twentyEightDaysAgo.getFullYear(), twentyEightDaysAgo.getMonth(), twentyEightDaysAgo.getDate(), 14, 5, 0).toISOString(),
  created_at: new Date(twentyEightDaysAgo.getFullYear(), twentyEightDaysAgo.getMonth(), twentyEightDaysAgo.getDate(), 14, 0, 0).toISOString(),
  updated_at: new Date(twentyEightDaysAgo.getFullYear(), twentyEightDaysAgo.getMonth(), twentyEightDaysAgo.getDate(), 14, 5, 0).toISOString()
});

// Insert all sessions in a transaction
const insertAll = db.transaction(() => {
  const stmt = db.prepare(`
    INSERT INTO sessions (type, duration_planned, duration_actual, completed, started_at, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const session of sessions) {
    stmt.run(
      session.type,
      session.duration_planned,
      session.duration_actual,
      session.completed,
      session.started_at,
      session.completed_at,
      session.created_at,
      session.updated_at
    );
  }
});

insertAll();

const finalCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
const workCount = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE type = 'work'").get();
const breakCount = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE type = 'break'").get();
const completedCount = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE completed = 1").get();

console.log(`✨ FocusFlow database seeded successfully!`);
console.log(`📊 Seeded: ${finalCount.count} total sessions`);
console.log(`   - ${workCount.count} work sessions`);
console.log(`   - ${breakCount.count} break sessions`);
console.log(`   - ${completedCount.count} completed sessions`);
console.log(`   - Sessions span across the last 30 days`);

db.close();