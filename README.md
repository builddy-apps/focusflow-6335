# FocusFlow

A beautiful Pomodoro timer app with session tracking, analytics, streak calendar, and ambient sounds for rewarding focus sessions.

Built with [Builddy](https://builddy.app) — AI-powered app builder using GLM 5.1.

## Features

- Animated circular countdown timer with smooth 60fps progress ring
- Work/break mode auto-toggling with customizable durations
- Session history log with filters and timestamps
- Visual streak calendar heatmap for daily productivity
- Daily and weekly statistics dashboard
- Ambient background sounds (rain, café, white noise)
- Notification sounds for session transitions
- Dark mode with smooth theme transitions
- Keyboard shortcuts (Space, R, S)
- CSV export for session data
- Settings persistence with localStorage

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Docker

```bash
docker compose up
```

### Deploy to Railway/Render

1. Push this directory to a GitHub repo
2. Connect to Railway or Render
3. It auto-detects the Dockerfile
4. Done!

## Tech Stack

- **Frontend**: HTML/CSS/JS + Tailwind CSS
- **Backend**: Express.js
- **Database**: SQLite
- **Deployment**: Docker