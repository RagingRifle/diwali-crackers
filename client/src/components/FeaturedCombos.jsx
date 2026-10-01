import React, { useEffect, useState } from 'react';

function ComboCard({ combo, onAddToCart }) {
  const [showContents, setShowContents] = useState(false);
  const [showImage, setShowImage] = useState(false);

  return (
    <>
      {showImage && combo.image && (
        <div onClick={() => setShowImage(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}>
          <img src={combo.image} alt={combo.name} style={{ maxWidth: '96vw', maxHeight: '94vh', objectFit: 'contain' }} />
        </div>
      )}
      <div style={{ background: '#fff', border: '2px solid #fde68a', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ background: '#b91c1c', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '4px', letterSpacing: '0.05em' }}>ðŸŽ COMBO</span>
        </div>
        {combo.image ? (
          <img src={combo.image} alt={combo.name} onClick={() => setShowImage(true)}
            style={{ width: '100%', height: '180px', objectFit: 'contain', borderRadius: '8px', cursor: 'zoom-in', background: '#fff' }}
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
        ) : (
          <div style={{ width: '100%', height: '100px', background: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>ðŸŽ†</div>
        )}
        <h4 style={{ margin: 0, fontSize: '0.97rem', fontWeight: 800, color: '#1f2937', lineHeight: '1.3' }}>{combo.name}</h4>
        {combo.description && (
          <div>
            <button type="button" onClick={() => setShowContents(!showContents)} style={{ background: 'none', border: 0, padding: 0, color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              {showContents ? 'Hide contents' : 'See contents'}
            </button>
            {showContents && <p style={{ margin: '0.4rem 0 0', fontSize: '0.83rem', color: '#6b7280', lineHeight: '1.5' }}>{combo.description}</p>}
          </div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#b91c1c' }}>â‚¹{combo.price.toFixed(0)}</span>
          <button onClick={() => onAddToCart && onAddToCart(combo)} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>ðŸ›’ Add</button>
        </div>
      </div>
    </>
  );
}

export default function FeaturedCombos({ onAddToCart }) {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?isCombo=true&inStockOnly=true')
      .then((r) => r.json())
      .then((data) => { if (data.success && data.products) setCombos(data.products); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: 'center', color: '#9ca3af' }}>Loading combos...</p>;
  if (combos.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
      {combos.map((combo) => <ComboCard key={combo.id} combo={combo} onAddToCart={onAddToCart} />)}
    </div>
  );
}
