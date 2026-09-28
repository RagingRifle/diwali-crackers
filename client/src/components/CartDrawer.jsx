import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  minOrderValue = 3000,
  appliedPromo,
  setAppliedPromo
}) {
  const [checkoutError, setCheckoutError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Reset checkout error when drawer opens or cart changes
  useEffect(() => {
    setCheckoutError('');
  }, [isOpen, cartItems]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const promoDiscount = appliedPromo?.discount || 0;
  const totalSavings = cartItems.reduce((acc, item) => {
    const savingPerItem = (item.mrp && item.mrp > item.price) ? (item.mrp - item.price) : 0;
    return acc + (savingPerItem * item.quantity);
  }, 0);

  const isMinOrderMet = subtotal >= minOrderValue;
  const minOrderShortfall = Math.max(0, minOrderValue - subtotal);
  const finalTotal = Math.max(0, subtotal - promoDiscount);

  useEffect(() => {
    if (!appliedPromo?.code) return;
    let cancelled = false;
    fetch('/api/promocodes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: appliedPromo.code, cartTotal: subtotal }),
    }).then(res => res.json()).then(data => {
      if (cancelled) return;
      if (!data.success) {
        setAppliedPromo(null);
        setPromoMessage(data.error || 'Promo code no longer applies to this cart total.');
      } else {
        setAppliedPromo(current => current?.code === data.code && current.discount === data.discount ? current : { code: data.code, discount: data.discount });
      }
    }).catch(() => {
      if (!cancelled) setPromoMessage('Could not refresh the promo discount.');
    });
    return () => { cancelled = true; };
  }, [subtotal, appliedPromo?.code, setAppliedPromo]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoMessage('Enter a promo code first.');
      return;
    }
    setPromoLoading(true);
    setPromoMessage('');
    try {
      const response = await fetch('/api/promocodes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Promo code could not be applied.');
      setAppliedPromo({ code: data.code, discount: data.discount });
      setPromoInput(data.code);
      setPromoMessage(`Promo applied! You save ₹${data.discount.toLocaleString('en-IN')}.`);
      setCheckoutError('');
    } catch (err) {
      setAppliedPromo(null);
      setPromoMessage(err.message || 'Promo code could not be applied.');
    } finally {
      setPromoLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cart-drawer-overlay"
      onClick={onClose}
      onTouchEnd={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <h3>
            <ShoppingBag size={20} />
            <span>Your Crackers Cart ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})</span>
          </h3>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Items List */}
        <div className="drawer-items">
          {cartItems.length === 0 ? (
            <div className="drawer-empty">
              <div className="empty-icon">🪔</div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Your cart is empty
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                Explore our festive collection of sparklers, flower pots, and gift hampers.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item-row">
                <img
                  src={item.code ? `/products/${item.code}.jpg` : item.image}
                  alt={item.name}
                  className="cart-item-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="cart-item-info">
                  <div>
                    <h4 className="cart-item-title">{item.name}</h4>
                    <p className="cart-item-subtext">{item.pack_size || item.category}</p>
                  </div>

                  <div className="cart-item-controls">
                    <span className="cart-item-price">₹{item.price * item.quantity}</span>

                    <div className="quantity-stepper" style={{ height: '30px', transform: 'scale(0.95)' }}>
                      <button
                        className="stepper-btn"
                        style={{ width: '28px' }}
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span className="stepper-val" style={{ padding: '0 8px' }}>{item.quantity}</span>
                      <button
                        className="stepper-btn"
                        style={{ width: '28px' }}
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="price-breakdown">
              <div className="breakdown-row">
                <span>Cart Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {totalSavings > 0 && (
                <div className="breakdown-row" style={{ color: 'var(--green)' }}>
                  <span>Festival Discount Savings</span>
                  <span>- ₹{totalSavings}</span>
                </div>
              )}
              {appliedPromo && (
                <div className="breakdown-row" style={{ color: '#047857' }}>
                  <span>Promo code ({appliedPromo.code})</span>
                  <span>- ₹{promoDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="breakdown-row total">
                <span>Estimated Total</span>
                <span className="amount">₹{finalTotal}</span>
              </div>
              {!isMinOrderMet && subtotal > 0 && (
                <div style={{
                  fontSize: '0.82rem',
                  color: '#92400e',
                  marginTop: '0.6rem',
                  padding: '0.45rem 0.75rem',
                  background: '#fffbeb',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: 600,
                  border: '1px solid #fef3c7'
                }}>
                  Min. order value: ₹{minOrderValue.toLocaleString('en-IN')} (₹{minOrderShortfall.toLocaleString('en-IN')} remaining to fulfill it)
                </div>
              )}
            </div>

            <div style={{ margin: '0.75rem 0' }}>
              <label htmlFor="cart-promo-code" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 5 }}>Promo code</label>
              <div style={{ display: 'flex', gap: 7 }}>
                <input id="cart-promo-code" value={promoInput} onChange={e => {
                  const value = e.target.value.toUpperCase();
                  setPromoInput(value);
                  if (appliedPromo && value.trim() !== appliedPromo.code) setAppliedPromo(null);
                }} placeholder="Enter code" style={{ minWidth: 0, flex: 1, padding: '0.6rem 0.7rem', border: '1px solid #d1d5db', borderRadius: 7 }} />
                <button type="button" className="btn-action" onClick={handleApplyPromo} disabled={promoLoading}>{promoLoading ? 'Checking…' : appliedPromo ? 'Apply another' : 'Apply'}</button>
              </div>
              {promoMessage && <div role="status" style={{ marginTop: 5, fontSize: '0.78rem', color: appliedPromo ? '#047857' : '#991b1b' }}>{promoMessage}</div>}
            </div>

            {checkoutError && !isMinOrderMet && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                fontSize: '0.82rem',
                color: '#991b1b',
                marginBottom: '0.75rem',
                textAlign: 'center',
                fontWeight: 700
              }}>
                ⚠️ {checkoutError}
              </div>
            )}

            <button
              className="btn-proceed-checkout"
              onClick={() => {
                if (!isMinOrderMet) {
                  setCheckoutError(`Minimum order value is ₹${minOrderValue.toLocaleString('en-IN')}. Please add ₹${minOrderShortfall.toLocaleString('en-IN')} more to proceed with checkout.`);
                  return;
                }
                setCheckoutError('');
                onClose();
                onProceedToCheckout();
              }}
            >
              <span>Submit Cart & Fill Delivery Form</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
