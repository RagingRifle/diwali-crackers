import React from 'react';
import { ShoppingBag, Plus, Minus } from 'lucide-react';

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onUpdateQuantity
}) {
  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const savings = product.mrp > product.price ? product.mrp - product.price : 0;
  const isOutOfStock = product.in_stock === 0;

  return (
    <div className="product-card">
      {/* Image Wrap */}
      <div className="card-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60';
          }}
        />

        {discountPercent > 0 && (
          <div className="card-discount-tag">
            {discountPercent}% OFF
          </div>
        )}

        <div className="card-category-tag">
          {product.category}
        </div>

        {isOutOfStock && (
          <div className="card-out-of-stock">
            Sold Out
          </div>
        )}
      </div>

      {/* Body */}
      <div className="card-body">
        <h3 className="card-title">{product.name}</h3>
        <p className="card-pack">{product.pack_size || '1 Box'}</p>
        <p className="card-desc">{product.description}</p>

        <div className="card-pricing">
          <span className="card-price">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="card-mrp">₹{product.mrp}</span>
          )}
          {savings > 0 && (
            <span className="card-save">Save ₹{savings}</span>
          )}
        </div>
      </div>

      {/* Footer / Add to Cart */}
      <div className="card-footer">
        {isOutOfStock ? (
          <button className="btn-add-cart" disabled>
            Out of Stock
          </button>
        ) : cartItem ? (
          <div className="quantity-stepper">
            <button
              className="stepper-btn"
              onClick={() => onUpdateQuantity(product.id, cartItem.quantity - 1)}
              title="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="stepper-val">{cartItem.quantity}</span>
            <button
              className="stepper-btn"
              onClick={() => onUpdateQuantity(product.id, cartItem.quantity + 1)}
              title="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            className="btn-add-cart"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingBag size={16} />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  );
}
