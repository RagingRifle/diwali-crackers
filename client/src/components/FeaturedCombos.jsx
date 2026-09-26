import React, { useEffect, useState } from 'react';

export default function FeaturedCombos({ onAddToCart }) {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?isCombo=true&inStockOnly=true')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.products) setCombos(data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: 'center', color: '#9ca3af' }}>Loading combos...</p>;
  if (combos.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '1rem',
    }}>
      {combos.map((c) => (
        <div
          key={c.id}
          style={{
            background: '#fff',
            border: '2px solid #fde68a',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: '#b91c1c', color: '#fff',
              fontSize: '0.65rem', fontWeight: 800,
              padding: '0.1rem 0.5rem', borderRadius: '4px',
              letterSpacing: '0.05em',
            }}>🎁 COMBO</span>
          </div>

          {/* Image */}
          {c.image ? (
            <img
              src={c.image}
              alt={c.name}
              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100px', background: '#fef3c7',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '2.5rem',
            }}>🎆</div>
          )}

          {/* Name */}
          <h4 style={{ margin: 0, fontSize: '0.97rem', fontWeight: 800, color: '#1f2937', lineHeight: '1.3' }}>
            {c.name}
          </h4>

          {/* Description */}
          {c.description && (
            <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280', lineHeight: '1.5' }}>
              {c.description}
            </p>
          )}

          {/* Price – fixed, no MRP/discount */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#b91c1c' }}>
              ₹{c.price.toFixed(0)}
            </span>
            <button
              onClick={() => onAddToCart && onAddToCart(c)}
              style={{
                background: '#b91c1c', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '0.5rem 1rem', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              🛒 Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
