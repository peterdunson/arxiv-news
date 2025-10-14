# Deployment Guide

## 1. Backend Deployment (Railway/Render)

### Using Railway:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
cd backend
railway init
```

3. Add environment variables in Railway dashboard:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

4. Deploy:
```bash
railway up
```

### Using Render:

1. Create a `render.yaml` file (already included)
2. Connect your GitHub repo to Render
3. Render will auto-deploy from the config

## 2. Frontend Deployment (Vercel/Netlify)

### Using Vercel:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

3. Set environment variable:
```
VITE_API_URL=https://your-backend.railway.app
```

### Using Netlify:

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
cd frontend
netlify deploy --prod
```

## 3. Database Migration (SQLite → PostgreSQL)

1. Install PostgreSQL:
```bash
pip install psycopg2-binary
```

2. Update `backend/database.py`:
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./arxiv_news.db")
```

3. For Render/Railway, they provide PostgreSQL automatically.

## 4. Daily Scraper Automation

### Option A: GitHub Actions

Create `.github/workflows/scraper.yml` (already included)

### Option B: Cron Job (Linux/Mac Server)

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/arxiv-news/backend && python scraper.py
```

### Option C: Railway/Render Cron

Both platforms support cron jobs:
- Railway: Use Railway Cron
- Render: Create a Cron Job service

## 5. Environment Variables

### Backend:
```
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend:
```
VITE_API_URL=https://your-backend.railway.app
```

## 6. Production Checklist

- [ ] Update CORS origins in `backend/main.py`
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Test API endpoints
- [ ] Set up automated scraper
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Configure backups
