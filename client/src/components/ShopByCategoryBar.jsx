import React, { useEffect, useState } from 'react';
import { Grid2X2 } from 'lucide-react';

const CATEGORIES = [
  { name: 'Sparklers', category: 'Sparklers', image: '/products/5.jpg' },
  { name: 'Flowerpots', category: 'Flowerpots', image: '/products/23.jpg' },
  { name: 'Ground Chakkars', category: 'Ground Chakkars', image: '/products/30.jpg' },
  { name: 'Novel Fireworks', category: 'Novelty Items', image: '/products/302.jpg' },
  { name: 'Sound Crackers', category: 'Sound Crackers', image: '/products/52.jpg' },
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
          {CATEGORIES.map(({ name, category, image }) => {
            const product = products.find((item) => item.category === category && (item.image || item.code));
            return (
              <button className="hp-cat-card" key={name} type="button"
                onClick={() => onSelectCategory?.(category)}>
                <span className="hp-category-image-wrap">
                  <img className="hp-category-product-image" src={product?.image || image} alt={name}
                    onError={(event) => {
                      if (event.currentTarget.dataset.fallback) event.currentTarget.style.visibility = 'hidden';
                      else {
                        event.currentTarget.dataset.fallback = 'true';
                        event.currentTarget.src = image;
                      }
                    }} />
                </span>
                <span className="hp-cat-name">{name}</span>
              </button>
            );
          })}
          <button className="hp-cat-card hp-cat-card--all" type="button" onClick={() => onSelectCategory?.('All')}>
            <Grid2X2 size={34} />
            <span className="hp-cat-name">View All Categories</span>
          </button>
        </div>
      </div>
    </section>
  );
}
