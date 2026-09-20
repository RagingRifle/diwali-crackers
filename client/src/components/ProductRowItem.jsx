import React from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

export default function ProductRowItem({ product, cartItem, onAddToCart, onUpdateQuantity }) {
  const discountPct = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const lineTotal = cartItem ? (product.price * cartItem.quantity).toFixed(0) : product.price.toFixed(0);
  const isOutOfStock = product.in_stock === 0;

  // Resolve image: check for /products/{code}.ext, else use image field, else blank
  const imgSrc = product.code
    ? `/products/${product.code}.jpg`
    : (product.image || '');

  return (
    <div className={`product-row ${isOutOfStock ? 'product-row--oos' : ''}`}>
      {/* Thumbnail */}
      <div className="product-row__img">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            // Show code badge as fallback
            const badge = e.target.parentElement.querySelector('.img-fallback-badge');
            if (!badge) {
              const div = document.createElement('div');
              div.className = 'img-fallback-badge';
              div.textContent = product.code || '?';
              e.target.parentElement.appendChild(div);
            }
          }}
        />
      </div>

      {/* Info */}
      <div className="product-row__info">
        <p className="product-row__name">{product.name}</p>
        <p className="product-row__pack">{product.content || product.pack_size || '1 Box'}</p>
        <div className="product-row__pricing">
          {product.mrp > product.price && (
            <span className="product-row__mrp">₹{product.mrp.toFixed(0)}</span>
          )}
          <span className="product-row__price">₹{product.price.toFixed(0)}</span>
          {discountPct > 0 && (
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
  );
}
