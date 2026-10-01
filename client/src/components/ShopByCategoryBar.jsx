import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, CircleDot, Rocket, Gift } from 'lucide-react';

const CATEGORIES = [
  { name: 'Sparklers', icon: Sparkles, tint: '#fff7e8' },
  { name: 'Flowerpots', icon: Flame, tint: '#fff1f2' },
  { name: 'Ground Chakkars', icon: CircleDot, tint: '#f0fdf4' },
  { name: 'Rockets', icon: Rocket, tint: '#eff6ff' },
  { name: 'Sound Crackers', icon: Sparkles, tint: '#faf5ff' },
  { name: 'Gift boxes', icon: Gift, tint: '#fff1f2', image: '/products/gift-box-category.svg' },
];

export default function ShopByCategoryBar({ onSelectCategory }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products?inStockOnly=true')
      .then((response) => response.json())
      .then((data) => { if (data.success) setProducts(data.products || []); })
      .catch(() => {});
  }, []);

  return (
    <section className="hp-section hp-shop-categories" aria-labelledby="shop-categories-title">
      <div className="hp-section__inner">
        <div className="hp-section__header">
          <h2 className="hp-section__title" id="shop-categories-title">Shop by Category</h2>
        </div>
        <div className="hp-categories">
          {CATEGORIES.map(({ name, icon: Icon, tint, image: categoryImage }) => {
            const product = products.find((item) => item.category === name && (item.image || item.code));
            const image = categoryImage || (product && (product.image || `/products/${product.code}.jpg`));
            return (
            <button className="hp-cat-card" key={name}
              style={{ '--cat-bg': tint, '--cat-border': '#f1d4d4' }}
              onClick={() => onSelectCategory?.(name)} type="button">
              {image ? (
                <span className="hp-category-image-wrap">
                  <img className="hp-category-product-image" src={image} alt={product?.name || name}
                  onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                  <Icon className="hp-category-image-fallback" size={38} strokeWidth={1.8} />
                </span>
              ) : <span className="hp-category-icon"><Icon size={38} strokeWidth={1.8} /></span>}
              <span className="hp-cat-name">{name}</span>
              <span className="hp-category-link">View products</span>
            </button>
          );})}
        </div>
      </div>
    </section>
  );
}
