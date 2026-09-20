import React, { useState } from 'react';
import { X, Lock, User, ShieldAlert, Sparkles, LogIn } from 'lucide-react';

export default function AdminLogin({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('diwali@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      localStorage.setItem('diwali_admin_token', data.token);
      localStorage.setItem('diwali_admin_user', JSON.stringify(data.admin));
      onLoginSuccess(data.admin, data.token);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3>
            <Lock size={18} />
            <span>Store Admin Portal</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#991B1B',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              border: '1px solid #FCA5A5'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Admin Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username (e.g. admin)"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.85rem' }}>
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password (e.g. diwali@2026)"
              />
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.65rem',
              background: 'var(--primary-red-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--primary-red)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Default: <strong>admin</strong> / <strong>diwali@2026</strong></span>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: '1px solid var(--primary-red)',
                  color: 'var(--primary-red)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
                onClick={() => {
                  setUsername('admin');
                  setPassword('diwali@2026');
                }}
              >
                Auto-Fill
              </button>
            </div>

            <button
              type="submit"
              className="btn-submit-order"
              style={{ marginTop: '1.25rem' }}
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In To Admin Panel'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
