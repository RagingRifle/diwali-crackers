import React, { useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  minOrderValue = 3000
}) {
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

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalSavings = cartItems.reduce((acc, item) => {
    const savingPerItem = (item.mrp && item.mrp > item.price) ? (item.mrp - item.price) : 0;
    return acc + (savingPerItem * item.quantity);
  }, 0);

  const isMinOrderMet = subtotal >= minOrderValue;
  const minOrderShortfall = Math.max(0, minOrderValue - subtotal);
  const minOrderProgress = Math.min(100, Math.round((subtotal / minOrderValue) * 100));

  const isFreeDelivery = subtotal >= 999;
  const deliveryFee = subtotal === 0 ? 0 : (isFreeDelivery ? 0 : 99);
  const finalTotal = subtotal + deliveryFee;

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

        {/* Minimum Order Value & Delivery Bar */}
        {subtotal > 0 && (
          <div style={{
            background: isMinOrderMet ? '#ecfdf5' : '#fffbeb',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border-light)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: isMinOrderMet ? '#065f46' : '#92400e',
              marginBottom: isMinOrderMet ? 0 : '0.45rem',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={16} />
                <span>
                  {isMinOrderMet
                    ? `🎉 Min. order ₹${minOrderValue.toLocaleString('en-IN')} reached! Free Express Delivery unlocked!`
                    : `Min. order is ₹${minOrderValue.toLocaleString('en-IN')} (Add ₹${minOrderShortfall.toLocaleString('en-IN')} more)`}
                </span>
              </div>
              {!isMinOrderMet && (
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{minOrderProgress}%</span>
              )}
            </div>

            {!isMinOrderMet && (
              <div style={{
                width: '100%',
                height: '7px',
                background: '#fef3c7',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${minOrderProgress}%`,
                  height: '100%',
                  background: '#d97706',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
        )}

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
                  src={item.image}
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
              <div className="breakdown-row">
                <span>Safe Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--green)' }}>FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div className="breakdown-row total">
                <span>Estimated Total</span>
                <span className="amount">₹{finalTotal}</span>
              </div>
            </div>

            {!isMinOrderMet && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '0.55rem 0.75rem',
                fontSize: '0.8rem',
                color: '#92400e',
                marginBottom: '0.75rem',
                textAlign: 'center',
                fontWeight: 600
              }}>
                ⚠️ Add items worth ₹{minOrderShortfall.toLocaleString('en-IN')} more to reach the ₹{minOrderValue.toLocaleString('en-IN')} minimum order requirement.
              </div>
            )}

            <button
              className="btn-proceed-checkout"
              disabled={!isMinOrderMet}
              onClick={() => {
                if (!isMinOrderMet) return;
                onClose();
                onProceedToCheckout();
              }}
              style={{
                opacity: isMinOrderMet ? 1 : 0.65,
                cursor: isMinOrderMet ? 'pointer' : 'not-allowed',
                background: isMinOrderMet ? 'var(--primary-red)' : '#6b7280',
                boxShadow: isMinOrderMet ? '0 4px 14px rgba(211, 47, 47, 0.3)' : 'none'
              }}
            >
              {isMinOrderMet ? (
                <>
                  <span>Submit Cart & Fill Delivery Form</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <span>Add ₹{minOrderShortfall.toLocaleString('en-IN')} More to Checkout</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
