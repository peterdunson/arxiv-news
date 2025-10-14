# 🚀 Quick Start Guide

Get arXiv News running in 5 minutes!

## Prerequisites

- Python 3.12+ installed
- Node.js 18+ installed
- A terminal/command prompt

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the API server (keep this terminal open)
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Step 2: Frontend Setup (2 minutes)

Open a **new terminal window**:

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies (first time only)
npm install

# Start the dev server (keep this terminal open)
npm run dev
```

You should see:
```
VITE v7.1.9  ready in 194 ms
➜  Local:   http://localhost:5173/
```

## Step 3: Add Some Papers (1 minute)

Open a **third terminal window**:

```bash
# Navigate to backend
cd backend

# Run the scraper to fetch papers
python scraper.py
```

This will fetch recent papers from arXiv. Wait for it to finish (~30 seconds).

## Step 4: Explore! 🎉

Open your browser to: **http://localhost:5173**

### Try These Features:

1. **Vote on a paper** 
   - Click the star icon
   - It should turn orange
   - Refresh the page - your vote persists!

2. **View paper details**
   - Click any paper title
   - See full abstract and metadata
   - Vote and comment from here too

3. **Add a comment**
   - On the detail page, scroll down
   - Enter your name and comment
   - Click "Post Comment"

4. **Try different sorts**
   - Click "Hot", "New", or "Discussed" tabs
   - Papers reorder based on votes, recency, or comments

## Troubleshooting

### Backend won't start
- Make sure port 8000 is free
- Check if Python dependencies installed: `pip list`
- Try: `pip install fastapi uvicorn sqlalchemy`

### Frontend won't start
- Make sure port 5173 is free
- Delete `node_modules` and run `npm install` again
- Check Node version: `node --version` (should be 18+)

### No papers showing
- Make sure you ran `python scraper.py`
- Check backend terminal for errors
- Try running scraper again

### API errors
- Make sure backend is running on port 8000
- Check browser console (F12) for error messages
- Verify CORS settings in `backend/main.py`

## What's Next?

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to production
- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for all features

## Daily Usage

Once set up, you only need to run:

**Terminal 1 (Backend):**
```bash
cd backend && uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```

**Terminal 3 (Optional - Update papers):**
```bash
cd backend && python scraper.py
```

---

Enjoy exploring arXiv papers! 📚✨
