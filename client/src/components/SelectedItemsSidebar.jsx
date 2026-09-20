import React from 'react';
import { ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';

export default function SelectedItemsSidebar({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onOrderNow,
}) {
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const grossMRP = cart.reduce((s, i) => s + (i.mrp || i.price) * i.quantity, 0);
  const netTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const savings = grossMRP - netTotal;

  return (
    <aside className="selected-sidebar">
      <div className="selected-sidebar__header">
        <span className="selected-sidebar__plus">+</span>
        <h3>YOUR SELECTED ITEMS</h3>
      </div>
      <p className="selected-sidebar__sub">Review your selection before placing the enquiry</p>

      {cart.length === 0 ? (
        <div className="selected-sidebar__empty">
          <div className="selected-sidebar__empty-icon">
            <ShoppingBag size={40} strokeWidth={1.2} />
          </div>
          <p className="selected-sidebar__empty-msg">No items selected yet</p>
          <p className="selected-sidebar__empty-sub">Add products from the left to get started</p>
          <button className="btn-order-now btn-order-now--disabled" disabled>
            <ShoppingCart size={16} />
            Order Now
          </button>
        </div>
      ) : (
        <>
          <div className="selected-sidebar__items">
            {cart.map((item) => (
              <div key={item.id} className="selected-sidebar__item">
                <div className="selected-sidebar__item-img">
                  <img
                    src={
                      item.code
                        ? `/products/${item.code}.jpg`
                        : ''
                    }
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="img-fallback-badge">${(item.name || '?').charAt(0)}</div>`;
                    }}
                  />
                </div>
                <div className="selected-sidebar__item-info">
                  <p className="selected-sidebar__item-name">{item.name}</p>
                  <p className="selected-sidebar__item-price">₹{item.price} × {item.quantity} = <strong>₹{(item.price * item.quantity).toFixed(0)}</strong></p>
                  <div className="selected-sidebar__item-controls">
                    <button
                      className="sel-stepper-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >−</button>
                    <span className="sel-stepper-val">{item.quantity}</span>
                    <button
                      className="sel-stepper-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >+</button>
                    <button
                      className="sel-remove-btn"
                      onClick={() => onRemoveItem(item.id)}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="selected-sidebar__summary">
            <div className="summary-row">
              <span>Total Items</span>
              <span>{cart.length} products ({totalItems} pcs)</span>
            </div>
            <div className="summary-row">
              <span>Gross MRP</span>
              <span>₹{grossMRP.toFixed(0)}</span>
            </div>
            {savings > 0 && (
              <div className="summary-row summary-row--savings">
                <span>You Save</span>
                <span>−₹{savings.toFixed(0)}</span>
              </div>
            )}
            <div className="summary-row summary-row--total">
              <span>Net Total</span>
              <span>₹{netTotal.toFixed(0)}</span>
            </div>
          </div>

          <button className="btn-order-now" onClick={onOrderNow}>
            <ShoppingCart size={16} />
            Order Now
          </button>
        </>
      )}
    </aside>
  );
}
