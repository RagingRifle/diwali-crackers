import React, { useEffect, useState } from 'react';
import { Plus, Save, Edit2, Trash2, X, TicketPercent } from 'lucide-react';

const blankPromo = () => ({ code: '', discount_type: 'amount', discount_value: '', tiers: [], active: true });

export default function PromoCodesPanel() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState(blankPromo());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('diwali_admin_token')}`,
  });

  const loadPromos = async () => {
    try {
      const response = await fetch('/api/promocodes', { headers: headers() });
      const data = await response.json();
      if (data.success) setPromos(data.promoCodes);
      else setError(data.error || 'Unable to load promo codes.');
    } catch {
      setError('Unable to connect to the promo code service.');
    }
  };

  useEffect(() => { loadPromos(); }, []);

  const editPromo = (promo) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      tiers: promo.tiers || [],
      active: !!promo.active,
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditingId(null);
    setForm(blankPromo());
    setError('');
  };

  const savePromo = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editingId ? `/api/promocodes/${editingId}` : '/api/promocodes', {
        method: editingId ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not save promo code.');
      reset();
      await loadPromos();
    } catch (err) {
      setError(err.message || 'Could not save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const deletePromo = async (promo) => {
    if (!window.confirm(`Delete promo code ${promo.code}?`)) return;
    const response = await fetch(`/api/promocodes/${promo.id}`, { method: 'DELETE', headers: headers() });
    const data = await response.json();
    if (!response.ok || !data.success) setError(data.error || 'Could not delete promo code.');
    else loadPromos();
  };

  const setTier = (index, field, value) => setForm(current => ({
    ...current,
    tiers: current.tiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, [field]: value } : tier),
  }));

  const inputStyle = { width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 7, boxSizing: 'border-box' };
  const labelStyle = { display: 'grid', gap: 5, color: '#374151', fontSize: '0.84rem', fontWeight: 650 };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section className="admin-table-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.35rem', display: 'flex', gap: 8, alignItems: 'center' }}><TicketPercent size={20} /> {editingId ? 'Edit Promo Code' : 'Create Promo Code'}</h3>
        <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.84rem' }}>Set a fixed discount or add cart total ranges. Codes can be edited or deactivated any time.</p>
        {error && <div role="alert" style={{ marginBottom: 12, color: '#991b1b', background: '#fee2e2', borderRadius: 7, padding: 10 }}>{error}</div>}
        <form onSubmit={savePromo} style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.8rem' }}>
            <label style={labelStyle}>Promo code
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={inputStyle} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DIWALI500" required maxLength={32} />
                {!editingId && <button type="button" className="btn-action" onClick={() => setForm({ ...form, code: `DIWALI-${Math.random().toString(36).slice(2, 8).toUpperCase()}` })}>Generate</button>}
              </div>
            </label>
            <label style={labelStyle}>Discount type
              <select style={inputStyle} value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                <option value="amount">Amount off (₹)</option><option value="percentage">Percentage off (%)</option>
              </select>
            </label>
            <label style={labelStyle}>Default discount {form.discount_type === 'percentage' ? '(%)' : '(₹)'}
              <input style={inputStyle} type="number" min="0" max={form.discount_type === 'percentage' ? 100 : undefined} step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} required />
            </label>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div><strong>Cart total ranges (optional)</strong><div style={{ fontSize: '0.78rem', color: '#6b7280' }}>A matching range replaces the default discount. Leave ranges empty to use the default for every cart.</div></div>
              <button type="button" className="btn-action" onClick={() => setForm({ ...form, tiers: [...form.tiers, { min: '', max: '', discount: '' }] })}><Plus size={15} /> Add range</button>
            </div>
            {form.tiers.map((tier, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) auto', alignItems: 'end', gap: 8, marginTop: 10 }}>
                <label style={labelStyle}>Cart minimum (₹)<input style={inputStyle} type="number" min="0" value={tier.min} onChange={e => setTier(index, 'min', e.target.value)} required /></label>
                <label style={labelStyle}>Cart maximum (₹)<input style={inputStyle} type="number" min="0" value={tier.max} onChange={e => setTier(index, 'max', e.target.value)} required /></label>
                <label style={labelStyle}>Discount {form.discount_type === 'percentage' ? '(%)' : '(₹)'}<input style={inputStyle} type="number" min="0" max={form.discount_type === 'percentage' ? 100 : undefined} step="0.01" value={tier.discount} onChange={e => setTier(index, 'discount', e.target.value)} required /></label>
                <button type="button" className="btn-action" aria-label="Remove range" onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) })}><X size={15} /></button>
              </div>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600 }}><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active and available to customers</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-submit-order" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Promo Code'}</button>
            {editingId && <button type="button" className="btn-action" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="admin-table-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Promo Codes ({promos.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead><tr>{['Code', 'Discount', 'Cart ranges', 'Status', 'Used', 'Actions'].map(label => <th key={label} style={{ textAlign: 'left', padding: 9, borderBottom: '1px solid #e5e7eb' }}>{label}</th>)}</tr></thead>
          <tbody>{promos.map(promo => (
            <tr key={promo.id}>
              <td style={{ padding: 9, fontWeight: 750 }}>{promo.code}</td>
              <td style={{ padding: 9 }}>{promo.discount_value}{promo.discount_type === 'percentage' ? '%' : '₹'} default</td>
              <td style={{ padding: 9, fontSize: '0.8rem' }}>{promo.tiers.length ? promo.tiers.map(t => `₹${t.min}–${t.max}: ${t.discount}${promo.discount_type === 'percentage' ? '%' : '₹'}`).join(' · ') : 'All cart totals'}</td>
              <td style={{ padding: 9, color: promo.active ? '#047857' : '#6b7280', fontWeight: 650 }}>{promo.active ? 'Active' : 'Inactive'}</td>
              <td style={{ padding: 9 }}>{promo.redemption_count}</td>
              <td style={{ padding: 9, whiteSpace: 'nowrap' }}>
                <button type="button" className="btn-action" onClick={() => editPromo(promo)} aria-label={`Edit ${promo.code}`}><Edit2 size={15} /></button>{' '}
                <button type="button" className="btn-action" onClick={() => deletePromo(promo)} aria-label={`Delete ${promo.code}`}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {!promos.length && <p style={{ color: '#6b7280' }}>No promo codes created yet.</p>}
      </section>
    </div>
  );
}
