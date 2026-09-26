import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProductRowItem({ product, cartItem, onAddToCart, onUpdateQuantity }) {
  const [showComboItems, setShowComboItems] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const discountPct = product.discount_percent || (product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0);

  const lineTotal = cartItem ? (product.price * cartItem.quantity).toFixed(0) : product.price.toFixed(0);
  const isOutOfStock = product.in_stock === 0;
  const isCombo = product.is_combo === 1 || product.category === 'Combo Bundles';

  let comboItems = [];
  if (isCombo && product.combo_items) {
    try {
      comboItems = typeof product.combo_items === 'string'
        ? JSON.parse(product.combo_items)
        : product.combo_items;
    } catch (e) {
      comboItems = [];
    }
  }

  // Resolve image
  const imgSrc = product.code
    ? `/products/${product.code}.jpg`
    : (product.image || '');

  return (
    <>
      {/* ── Image lightbox ── */}
      {lightboxOpen && !isCombo && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out',
          }}
        >
          <img
            src={imgSrc}
            alt={product.name}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: '#fff', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', fontSize: '1.2rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}

      <div className={`product-row ${isOutOfStock ? 'product-row--oos' : ''} ${isCombo ? 'product-row--combo' : ''}`}>

        {/* Thumbnail */}
        <div className="product-row__img">
          {isCombo ? (
            <div className="img-combo-badge">🎁</div>
          ) : (
            <img
              src={imgSrc}
              alt={product.name}
              loading="lazy"
              onClick={() => setLightboxOpen(true)}
              style={{ cursor: 'zoom-in' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const badge = e.target.parentElement.querySelector('.img-fallback-badge');
                if (!badge) {
                  const div = document.createElement('div');
                  div.className = 'img-fallback-badge';
                  div.textContent = product.code || '?';
                  e.target.parentElement.appendChild(div);
                }
              }}
            />
          )}
        </div>

        {/* Info */}
        <div className="product-row__info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {isCombo && (
              <span style={{
                background: '#b91c1c',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}>
                🎁 COMBO BUNDLE
              </span>
            )}
            {product.code && (
              <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-red)' }}>
                [{product.code}]
              </span>
            )}
            <span className="product-row__name">{product.name}</span>
          </div>

          <p className="product-row__pack">{product.content || product.pack_size || '1 Box'}</p>

          {/* Description for combos */}
          {isCombo && product.description && (
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.15rem 0 0.25rem', lineHeight: '1.4' }}>
              {product.description}
            </p>
          )}

          {/* Expandable combo items (legacy combos with items list) */}
          {isCombo && comboItems.length > 0 && (
            <div style={{ margin: '0.2rem 0 0.35rem' }}>
              <button
                type="button"
                onClick={() => setShowComboItems(!showComboItems)}
                style={{
                  background: 'none', border: 'none', color: '#b91c1c',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                }}
              >
                <span>{showComboItems ? 'Hide Items Inside' : `View ${comboItems.length} Items Included`}</span>
                {showComboItems ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showComboItems && (
                <div style={{
                  marginTop: '0.35rem', background: '#fffbeb',
                  border: '1px solid #fef3c7', borderRadius: '6px',
                  padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: '#4b5563'
                }}>
                  {comboItems.map((ci, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                      <span>• {ci.quantity}x {ci.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="product-row__pricing">
            {/* Combos: fixed price only — no MRP or discount shown to customer */}
            {!isCombo && product.mrp > product.price && (
              <span className="product-row__mrp">₹{product.mrp.toFixed(0)}</span>
            )}
            <span className="product-row__price">₹{product.price.toFixed(0)}</span>
            {!isCombo && discountPct > 0 && (
              <span className="product-row__off">{discountPct}% OFF</span>
            )}
          </div>

          {cartItem && (
            <p className="product-row__total">Total: ₹{lineTotal}</p>
          )}
        </div>

        {/* Controls */}
        <div className="product-row__controls">
          {isOutOfStock ? (
            <span className="product-row__oos-label">Out of Stock</span>
          ) : cartItem ? (
            <div className="row-stepper">
              <button
                className="row-stepper__btn"
                onClick={() => onUpdateQuantity(product.id, cartItem.quantity - 1)}
              >
                <Minus size={13} />
              </button>
              <span className="row-stepper__val">{cartItem.quantity}</span>
              <button
                className="row-stepper__btn"
                onClick={() => onUpdateQuantity(product.id, cartItem.quantity + 1)}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              className="btn-row-add"
              onClick={() => onAddToCart(product)}
            >
              <ShoppingCart size={14} />
              <span>Add</span>
            </button>
          )}
        </div>

      </div>
    </>
  );
}
