# FocusFlow

A calming Pomodoro timer that helps you build focus, one session at a time.

Built with [Builddy](https://builddy.app) — AI-powered app builder using GLM 5.1.

## Features

- Circular progress timer with smooth SVG ring animation
- Work/break mode transitions with calming color palette shifts
- Session counter tracking completed pomodoros with auto long-break scheduling
- Start/pause/reset controls with confirmation dialogs
- Audio chime and browser notifications on session completion
- Tab title updates showing remaining time
- Daily and weekly productivity statistics with visual charts
- Session history log with timestamps and duration
- Streak tracking for consecutive productive days
- Customizable timer durations via settings modal
- Dark mode with persistent preference
- Toast notifications for user feedback

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