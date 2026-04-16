import express from 'express';
import cors from 'cors';
import {
  createSession,
  getSessions,
  getSessionsByDateRange,
  getDailyStats,
  getWeeklyStats,
  getCalendarData,
  exportSessionsCSV
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.post('/api/sessions', (req, res) => {
  try {
    const { type, duration_planned, duration_actual, completed, started_at, completed_at } = req.body;
    
    if (!type || !duration_planned) {
      return res.status(400).json({ success: false, error: 'type and duration_planned are required' });
    }
    
    if (type !== 'work' && type !== 'break') {
      return res.status(400).json({ success: false, error: 'type must be "work" or "break"' });
    }
    
    const session = createSession({
      type,
      duration_planned: parseInt(duration_planned),
      duration_actual: duration_actual ? parseInt(duration_actual) : 0,
      completed: !!completed,
      started_at: started_at || null,
      completed_at: completed_at || null
    });
    
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

app.get('/api/sessions', (req, res) => {
  try {
    const { startDate, endDate, type, limit = 50, offset = 0 } = req.query;
    
    if (startDate && endDate) {
      const sessions = getSessionsByDateRange(startDate, endDate, type || null);
      res.json({ success: true, data: sessions });
    } else {
      const sessions = getSessions(parseInt(limit), parseInt(offset));
      res.json({ success: true, data: sessions });
    }
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

app.get('/api/sessions/stats', (req, res) => {
  try {
    const { period, date } = req.query;
    
    if (period === 'weekly') {
      const stats = getWeeklyStats(date || null);
      res.json({ success: true, data: stats });
    } else {
      const stats = getDailyStats(date || null);
      res.json({ success: true, data: stats });
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

app.get('/api/sessions/calendar', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const calendarData = getCalendarData(startDate || null, endDate || null);
    res.json({ success: true, data: calendarData });
  } catch (err) {
    console.error('Error fetching calendar data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch calendar data' });
  }
});

app.get('/api/sessions/export', (req, res) => {
  try {
    const csv = exportSessionsCSV();
    
    if (!csv) {
      return res.status(404).json({ success: false, error: 'No sessions to export' });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="focusflow-sessions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Error exporting sessions:', err);
    res.status(500).json({ success: false, error: 'Failed to export sessions' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`FocusFlow server running on http://localhost:${PORT}`);
});