# JobFit Tracker

An AI-powered job application tracker. Paste your resume once, add job descriptions
for companies you're applying to, and get an instant AI-generated fit score, skill
gap analysis, and suggestion for which project to highlight — powered by the Claude API.

Built while applying to companies through Zenken, to solve a real problem: quickly
comparing my own resume against each job description instead of doing it manually.

## Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Flask (Python)
- **Database:** SQLite (swap to MySQL/PostgreSQL by changing `DATABASE_URL`)
- **AI:** Google Gemini API (free tier — no credit card needed)
- **Auth:** JWT

## Features
- Sign up / log in (JWT authentication)
- Add, edit, delete job applications with status tracking (Applied / Interview / Offer / Rejected)
- Paste resume once, reuse it for every analysis
- AI fit score (0–100%) with matching skills, missing skills, and a one-line
  recommendation on which of your projects to highlight for that specific role

## Project Structure
```
job-tracker/
├── backend/
│   ├── app.py            # Flask app, routes
│   ├── models.py         # SQLAlchemy models (User, Application)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main UI
    │   ├── api.js         # Backend API calls
    │   └── main.jsx
    └── package.json
```

## Setup (Windows / VS Code)

### 1. Backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (copy `.env.example`) and add your free Gemini API key
(get one at aistudio.google.com — no credit card needed):
```
GEMINI_API_KEY=your-real-key-here
SECRET_KEY=some-random-string
DATABASE_URL=sqlite:///job_tracker.db
```

Run the backend:
```powershell
python app.py
```
It should start on `http://127.0.0.1:5000`.

### 2. Frontend
Open a **new** terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

> Note: if `npm` is blocked by PowerShell's execution policy (like you saw with
> MedTrack), run this once as Administrator:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

## How it works (for interview explanation)
1. User signs up/logs in → Flask issues a JWT token, stored in the browser
2. User pastes a job description and saves it as an "Application" (stored in SQLite via SQLAlchemy)
3. User pastes resume text once (kept in browser localStorage, reused each time)
4. Clicking "Analyze Fit" sends both texts to the backend, which calls the Gemini API
   with a structured prompt asking for a JSON response (fit score, matching skills,
   gaps, project suggestion)
5. The backend parses the JSON and stores it against that application, so the score
   persists on refresh

## Possible improvements to mention in interviews
- Deploy backend to AWS EC2/Elastic Beanstalk, frontend to S3 + CloudFront
- Move resume storage to AWS S3 instead of localStorage
- Add file upload (PDF resume parsing) instead of pasting text
- Add email reminders for interview dates using AWS SNS (like MedTrack)
