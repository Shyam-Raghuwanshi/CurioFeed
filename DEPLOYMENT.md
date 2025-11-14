# CurioFeed Deployment Guide

This app includes both a React frontend and Express API server that can be deployed together or separately.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)
1. Push your code to GitHub
2. Connect your repo to [Railway](https://railway.app)
3. Add environment variable: `VITE_FIRECRAWL_API_KEY=your_api_key`
4. Deploy automatically!

### Option 2: Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Choose "Web Service"
3. Build Command: `npm run build:all`
4. Start Command: `npm run server:prod`
5. Add environment variables

### Option 3: Vercel + Railway
- **Frontend**: Deploy to Vercel (automatic from GitHub)
- **Backend**: Deploy Express server to Railway
- Update frontend API calls to use Railway server URL

## 🔧 Environment Variables Required

```bash
VITE_FIRECRAWL_API_KEY=your_firecrawl_api_key
NODE_ENV=production
PORT=3001
```

## 🏗️ Build Commands

```bash
# Development
npm run dev:full

# Production Build
npm run build:all

# Production Start
npm start
```

## 📝 Notes

- Server runs on port 3001 (or $PORT in production)
- In production, server serves both API routes (/api/*) and static React files
- CORS is configured for both development and production
- React Router is handled with catch-all route in production

## 🐳 Docker Deployment

```bash
docker build -t curiofeed .
docker run -p 3001:3001 -e VITE_FIRECRAWL_API_KEY=your_key curiofeed
```