import express from 'express';
import cors from 'cors';
import { db, createSession, getSessions, getDailyStats, getWeeklyStats, getSettings, updateSettings } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes

// GET /api/sessions - with optional limit and offset query params
app.get('/api/sessions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = getSessions(limit, offset);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in /api/sessions GET:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions - creates session and updates daily_stats
app.post('/api/sessions', async (req, res) => {
  try {
    const { type, duration_minutes } = req.body;
    
    if (!type || !duration_minutes) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: type and duration_minutes' 
      });
    }
    
    if (!['work', 'short_break', 'long_break'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid session type. Must be one of: work, short_break, long_break' 
      });
    }
    
    const result = createSession(type, duration_minutes);
    
    if (result.success) {
      res.status(201).json({ success: true, data: { id: result.id } });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in /api/sessions POST:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/stats/daily?date=YYYY-MM-DD
app.get('/api/stats/daily', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required query parameter: date' 
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Must be YYYY-MM-DD' 
      });
    }
    
    const result = getDailyStats(date);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in /api/stats/daily GET:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/stats/weekly - returns last 7 days
app.get('/api/stats/weekly', async (req, res) => {
  try {
    // Calculate start date (7 days ago)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    const startDateString = startDate.toISOString().split('T')[0];
    
    const result = getWeeklyStats(startDateString);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in /api/stats/weekly GET:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = getSettings();
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in /api/settings GET:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/settings
app.put('/api/settings', async (req, res) => {
  try {
    const { 
      work_duration, 
      short_break_duration, 
      long_break_duration, 
      sessions_until_long_break,
      sound_enabled,
      notifications_enabled
    } = req.body;
    
    // Validate required fields
    if (
      work_duration === undefined || 
      short_break_duration === undefined || 
      long_break_duration === undefined || 
      sessions_until_long_break === undefined ||
      sound_enabled === undefined ||
      notifications_enabled === undefined
    ) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Validate numeric fields
    if (
      typeof work_duration !== 'number' || 
      typeof short_break_duration !== 'number' || 
      typeof long_break_duration !== 'number' || 
      typeof sessions_until_long_break !== 'number'
    ) {
      return res.status(400).json({ 
        success: false, 
        error: 'Duration fields must be numbers' 
      });
    }
    
    // Validate boolean fields
    if (
      typeof sound_enabled !== 'boolean' && 
      (sound_enabled !== 0 && sound_enabled !== 1)
    ) {
      return res.status(400).json({ 
        success: false, 
        error: 'sound_enabled must be a boolean or 0/1' 
      });
    }
    
    if (
      typeof notifications_enabled !== 'boolean' && 
      (notifications_enabled !== 0 && notifications_enabled !== 1)
    ) {
      return res.status(400).json({ 
        success: false, 
        error: 'notifications_enabled must be a boolean or 0/1' 
      });
    }
    
    const result = updateSettings({
      work_duration,
      short_break_duration,
      long_break_duration,
      sessions_until_long_break,
      sound_enabled: sound_enabled ? 1 : 0,
      notifications_enabled: notifications_enabled ? 1 : 0
    });
    
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in /api/settings PUT:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`FocusFlow server running on port ${PORT}`);
});