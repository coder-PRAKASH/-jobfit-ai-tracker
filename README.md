# JobFit AI 🎯

**AI-powered job application tracker with automatic resume-to-JD fit scoring.**

Built while applying to companies through Zenken — instead of manually comparing my
resume against every job description, I built a tool that does it in seconds using AI.

---

## 🚀 Features

- 🔐 **Secure authentication** — JWT-based signup/login with hashed passwords
- 📄 **PDF resume upload** — automatically extracts text from your resume (or paste manually)
- 📋 **Application tracking** — add companies, roles, job descriptions; track status (Applied → Interview → Offer/Rejected)
- 🤖 **AI Fit Analysis** — one click sends your resume + the job description to Google's Gemini API and returns:
  - Fit score (0–100%)
  - Matching skills
  - Missing skills / gaps
  - Which of your projects to highlight for that specific role
- 💾 Fit results persist per application — no need to re-analyze on refresh

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Flask (Python) |
| Database | SQLite (SQLAlchemy ORM) |
| Auth | JWT (PyJWT) |
| AI | Google Gemini API |
| PDF Parsing | PyPDF2 |

## 📸 Screenshots

> _Add screenshots here after running the app: signup page, dashboard, and the AI fit-score result card._

## 🏗️ Architecture

```
User uploads resume (PDF)
        ↓
Flask extracts text (PyPDF2)
        ↓
User adds Job Description → stored in SQLite
        ↓
Click "Analyze Fit"
        ↓
Flask sends resume + JD to Gemini API (structured JSON prompt)
        ↓
Response parsed & stored → displayed as fit score, gaps, and recommendation
```

## ⚙️ Setup

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see `.env.example`):
```
GEMINI_API_KEY=your-free-key-from-aistudio.google.com
SECRET_KEY=any-random-string
DATABASE_URL=sqlite:///job_tracker.db
```

Run it:
```bash
python app.py
```
Backend runs on `http://127.0.0.1:5000`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`

## 🔒 Security Notes
- Passwords are hashed with Werkzeug, never stored in plain text
- API keys are loaded from environment variables, never hardcoded
- Every application route verifies the requesting user owns that resource
- `.gitignore` excludes `.env`, `venv/`, `node_modules/`, and local database files

## 🔮 Future Improvements
- Deploy backend to AWS (EC2), frontend to Vercel/Netlify
- Switch SQLite → PostgreSQL for production
- OCR support for scanned/image-based PDF resumes
- Email reminders for interview dates (AWS SNS)

## 👤 Author
**Prakash** — [github.com/coder-PRAKASH](https://github.com/coder-PRAKASH)
