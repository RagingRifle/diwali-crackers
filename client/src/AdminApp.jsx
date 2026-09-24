import React, { useState } from 'react';
import { Lock, LogIn, User, ShieldAlert } from 'lucide-react';
import AdminDashboard from './components/admin/AdminDashboard';

/* ─── Persist admin session ─────────────────────────────────────────────── */
function getSavedAdmin() {
  try {
    const user = localStorage.getItem('diwali_admin_user');
    const token = localStorage.getItem('diwali_admin_token');
    return user && token ? JSON.parse(user) : null;
  } catch { return null; }
}

/* ─── Login Page ─────────────────────────────────────────────────────────── */
function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Invalid credentials.');
      localStorage.setItem('diwali_admin_token', data.token);
      localStorage.setItem('diwali_admin_user', JSON.stringify(data.admin));
      onLoginSuccess(data.admin);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 50%, #1a0a0a 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
            Admin Portal
          </h1>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Dinosaur Crackers — Staff Only
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEE2E2', color: '#991B1B',
            padding: '0.75rem', borderRadius: '8px',
            fontSize: '0.85rem', marginBottom: '1rem',
            border: '1px solid #FCA5A5',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#333' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Enter admin username"
              style={{
                width: '100%', padding: '0.7rem 0.9rem',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#333' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter password"
              style={{
                width: '100%', padding: '0.7rem 0.9rem',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.85rem',
              background: loading ? '#aaa' : '#D32F2F',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontFamily: 'inherit',
            }}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: '#bbb' }}>
          🛡️ This portal is for authorised staff only.
        </p>
      </div>
    </div>
  );
}

/* ─── Root Admin App ─────────────────────────────────────────────────────── */
export default function AdminApp() {
  const [adminUser, setAdminUser] = useState(getSavedAdmin);

  const handleLogout = () => {
    localStorage.removeItem('diwali_admin_token');
    localStorage.removeItem('diwali_admin_user');
    setAdminUser(null);
  };

  if (!adminUser) {
    return <AdminLoginPage onLoginSuccess={setAdminUser} />;
  }

  return (
    <AdminDashboard
      adminUser={adminUser}
      onLogout={handleLogout}
      onProductChange={() => {}}
    />
  );
}
