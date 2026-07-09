const BASE_URL = 'http://127.0.0.1:5000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signup(name, email, password) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getApplications() {
  const res = await fetch(`${BASE_URL}/applications`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function createApplication(data) {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateApplication(id, data) {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteApplication(id) {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}

export async function analyzeFit(id, resumeText) {
  const res = await fetch(`${BASE_URL}/applications/${id}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resume_text: resumeText }),
  });
  return res.json();
}
