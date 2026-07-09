import { useState, useEffect } from 'react';
import * as api from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [resumeText, setResumeText] = useState(localStorage.getItem('resumeText') || '');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  if (!user) {
    return <AuthScreen onLogin={(u) => setUser(u)} />;
  }

  return (
    <Dashboard
      user={user}
      resumeText={resumeText}
      setResumeText={(t) => {
        setResumeText(t);
        localStorage.setItem('resumeText', t);
      }}
      onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }}
    />
  );
}

// ---------------- Auth Screen ----------------
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      const res = await api.signup(form.name, form.email, form.password);
      if (res.error) return setError(res.error);
      setMode('login');
      setError('Account created — please log in.');
      return;
    }
    const res = await api.login(form.email, form.password);
    if (res.error) return setError(res.error);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    onLogin(res.user);
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <h1 style={{ marginBottom: 4 }}>JobFit Tracker</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Track applications. Get AI fit scores against your resume.
        </p>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>}
          <button style={styles.primaryBtn} type="submit">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </a>
        </p>
      </div>
    </div>
  );
}

// ---------------- Dashboard ----------------
function Dashboard({ user, resumeText, setResumeText, onLogout }) {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showResumeBox, setShowResumeBox] = useState(!resumeText);
  const [form, setForm] = useState({ company_name: '', role: '', job_description: '', status: 'Applied' });
  const [analyzing, setAnalyzing] = useState(null);

  async function loadApplications() {
    const data = await api.getApplications();
    if (Array.isArray(data)) setApplications(data);
  }

  useEffect(() => { loadApplications(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    await api.createApplication(form);
    setForm({ company_name: '', role: '', job_description: '', status: 'Applied' });
    setShowForm(false);
    loadApplications();
  }

  async function handleStatusChange(id, status) {
    await api.updateApplication(id, { status });
    loadApplications();
  }

  async function handleDelete(id) {
    await api.deleteApplication(id);
    loadApplications();
  }

  async function handleAnalyze(id) {
    if (!resumeText.trim()) {
      setShowResumeBox(true);
      return;
    }
    setAnalyzing(id);
    await api.analyzeFit(id, resumeText);
    await loadApplications();
    setAnalyzing(null);
  }

  return (
    <div style={styles.dashWrap}>
      <header style={styles.header}>
        <h2>JobFit Tracker</h2>
        <div>
          <span style={{ marginRight: 16, color: '#666' }}>Hi, {user.name}</span>
          <button style={styles.secondaryBtn} onClick={onLogout}>Log out</button>
        </div>
      </header>

      <section style={styles.resumeSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Your Resume Text</strong>
          <button style={styles.linkBtn} onClick={() => setShowResumeBox(!showResumeBox)}>
            {showResumeBox ? 'Hide' : 'Edit'}
          </button>
        </div>
        {showResumeBox && (
          <textarea
            style={styles.textarea}
            placeholder="Paste your resume text here once — it's reused for every AI fit analysis."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 12px' }}>
        <h3 style={{ margin: 0 }}>Applications ({applications.length})</h3>
        <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Application'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={styles.card}>
          <input
            style={styles.input}
            placeholder="Company name"
            required
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <textarea
            style={styles.textarea}
            placeholder="Paste job description here"
            value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })}
          />
          <button style={styles.primaryBtn} type="submit">Save Application</button>
        </form>
      )}

      <div>
        {applications.map((a) => (
          <ApplicationCard
            key={a.id}
            app={a}
            analyzing={analyzing === a.id}
            onAnalyze={() => handleAnalyze(a.id)}
            onStatusChange={(status) => handleStatusChange(a.id, status)}
            onDelete={() => handleDelete(a.id)}
          />
        ))}
        {applications.length === 0 && (
          <p style={{ color: '#888' }}>No applications yet — add your first one above.</p>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app, analyzing, onAnalyze, onStatusChange, onDelete }) {
  const fit = app.fit_summary ? JSON.parse(app.fit_summary) : null;

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontSize: 16 }}>{app.company_name}</strong>
          {app.role && <span style={{ color: '#666' }}> — {app.role}</span>}
        </div>
        <select
          value={app.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={styles.select}
        >
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select>
      </div>

      {fit && (
        <div style={styles.fitBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FitScoreBadge score={fit.fit_score} />
            <span style={{ fontSize: 14 }}>{fit.summary}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <strong>Matching:</strong> {fit.matching_skills?.join(', ') || '—'}
          </div>
          <div style={{ fontSize: 13 }}>
            <strong>Gaps:</strong> {fit.missing_skills?.join(', ') || '—'}
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <strong>Highlight:</strong> {fit.project_to_highlight}
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button style={styles.secondaryBtn} onClick={onAnalyze} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : fit ? 'Re-analyze Fit' : 'Analyze Fit with AI'}
        </button>
        <button style={styles.dangerBtn} onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function FitScoreBadge({ score }) {
  const color = score >= 70 ? '#27ae60' : score >= 40 ? '#e67e22' : '#c0392b';
  return (
    <span style={{ ...styles.badge, backgroundColor: color }}>
      {score}% fit
    </span>
  );
}

const styles = {
  authWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6fa' },
  authCard: { background: '#fff', padding: 32, borderRadius: 12, width: 360, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  dashWrap: { maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  input: { display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' },
  textarea: { display: 'block', width: '100%', minHeight: 90, padding: 10, marginTop: 8, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box', fontFamily: 'inherit' },
  primaryBtn: { background: '#2c3e50', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer' },
  secondaryBtn: { background: '#ecf0f1', color: '#2c3e50', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' },
  dangerBtn: { background: '#fdecea', color: '#c0392b', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' },
  linkBtn: { background: 'none', border: 'none', color: '#2c3e50', textDecoration: 'underline', cursor: 'pointer' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 16, marginBottom: 12 },
  resumeSection: { background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 16 },
  select: { padding: 6, borderRadius: 6, border: '1px solid #ddd' },
  fitBox: { background: '#f8f9fa', borderRadius: 8, padding: 12, marginTop: 12 },
  badge: { color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
};
