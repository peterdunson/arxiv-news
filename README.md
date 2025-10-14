# 🔬 arXiv News

A Hacker News-style platform for arXiv papers. Discover, vote on, and discuss the latest research papers from arXiv.

## ✨ Features

- 📰 **Daily Paper Feed** - Automatically fetches latest papers from arXiv
- 🔥 **Voting System** - Upvote papers you find interesting (with persistent state)
- 💬 **Comments** - Discuss papers with the community
- 🎯 **Smart Sorting** - Sort by votes, recency, or discussion activity
- 📱 **Responsive Design** - Works great on mobile and desktop
- 🔍 **Detailed View** - Full paper information with metadata and links

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload

# In another terminal, run the scraper to fetch papers
python scraper.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
arxiv-news/
├── backend/
│   ├── database.py      # Database models and connection
│   ├── main.py          # FastAPI routes
│   ├── models.py        # SQLAlchemy models
│   ├── scraper.py       # Daily arXiv scraper
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PaperFeed.jsx    # Main feed
│   │   │   ├── PaperCard.jsx    # Paper card component
│   │   │   └── PaperDetail.jsx  # Detailed paper view
│   │   ├── api.js       # API client
│   │   └── App.jsx      # Main app with routing
│   └── package.json
└── renderarxiv/         # Original arXiv API client
```

## 🔧 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** (development) / **PostgreSQL** (production)
- **arXiv API** - For fetching papers

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **TailwindCSS 4** - Styling
- **Axios** - HTTP client

## 🎨 Features in Detail

### 1. Paper Feed
- View latest research papers from arXiv
- Sort by: Hot (votes), New (recency), or Discussed (comments)
- Loading states and error handling
- Empty state with helpful instructions

### 2. Voting System
- One-click voting on papers
- Visual feedback (orange when voted)
- Persistent vote state (localStorage)
- Real-time vote counts

### 3. Paper Detail Page
- Full paper information
- Author list and metadata
- Direct links to arXiv and PDF
- Comments section
- Vote directly from detail page

### 4. Comments
- Add comments with your name
- Timestamps on all comments
- Real-time comment counts
- Empty state encouragement

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

**Backend:**
- [Railway](https://railway.app) - Easiest, includes PostgreSQL
- [Render](https://render.com) - Free tier with cron jobs
- [Fly.io](https://fly.io) - Good for global distribution

**Frontend:**
- [Vercel](https://vercel.com) - One-click deploy
- [Netlify](https://netlify.com) - Also very easy
- [Cloudflare Pages](https://pages.cloudflare.com) - Fast CDN

### Environment Variables

**Backend:**
```bash
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://your-frontend.vercel.app
```

**Frontend:**
```bash
VITE_API_URL=https://your-backend.railway.app
```

## 📊 Database Schema

### Tables

**papers**
- id, arxiv_id, title, authors, abstract
- pdf_url, arxiv_url, published, updated
- categories, primary_category
- vote_count, comment_count
- metadata (comment, journal_ref, doi)

**votes**
- id, paper_id, user_identifier, created_at

**comments**
- id, paper_id, user_name, content, created_at

## 🔄 Daily Scraper

The scraper runs daily to fetch new papers from arXiv across multiple categories:

```bash
python backend/scraper.py
```

### Automated Scheduling Options

1. **GitHub Actions** - Free, runs in the cloud
2. **Cron Job** - Traditional Unix scheduling
3. **Railway/Render Cron** - Platform-native scheduling

See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions.

## 🛠️ Development

### Run Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Linting
```bash
# Backend
cd backend
pylint *.py

# Frontend
cd frontend
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Credits

- Built with the [arXiv API](https://arxiv.org/help/api)
- Inspired by [Hacker News](https://news.ycombinator.com)
- Uses [Semantic Scholar API](https://www.semanticscholar.org/product/api) for citation data

## 🐛 Known Issues

- Citation counts may be slow to fetch
- SQLite has concurrency limitations (use PostgreSQL in production)
- No user authentication yet (using localStorage for identity)

## 🔮 Future Enhancements

- [ ] User accounts and authentication
- [ ] Paper bookmarking/favorites
- [ ] Email notifications for new papers
- [ ] Advanced search and filtering
- [ ] RSS feed
- [ ] Dark mode
- [ ] Reply threads on comments
- [ ] Moderation tools

---

Made with ❤️ for the research community
