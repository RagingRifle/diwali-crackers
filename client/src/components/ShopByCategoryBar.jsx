import React from 'react';
import { Sparkles, Flame, CircleDot, Rocket, Gift, Grid2X2 } from 'lucide-react';

const CATEGORIES = [
  { name: 'Sparklers', icon: Sparkles, tint: '#fff7e8' },
  { name: 'Flowerpots', icon: Flame, tint: '#fff1f2' },
  { name: 'Ground Chakkars', icon: CircleDot, tint: '#f0fdf4' },
  { name: 'Rockets', icon: Rocket, tint: '#eff6ff' },
  { name: 'Sound Crackers', icon: Sparkles, tint: '#faf5ff' },
  { name: 'Gift boxes', icon: Gift, tint: '#fff1f2' },
];

export default function ShopByCategoryBar({ onSelectCategory }) {
  return (
    <section className="hp-section hp-shop-categories" aria-labelledby="shop-categories-title">
      <div className="hp-section__inner">
        <div className="hp-section__header">
          <h2 className="hp-section__title" id="shop-categories-title">Shop by Category</h2>
        </div>
        <div className="hp-categories">
          {CATEGORIES.map(({ name, icon: Icon, tint }) => (
            <button className="hp-cat-card" key={name}
              style={{ '--cat-bg': tint, '--cat-border': '#f1d4d4' }}
              onClick={() => onSelectCategory?.(name)} type="button">
              <span className="hp-category-icon"><Icon size={38} strokeWidth={1.8} /></span>
              <span className="hp-cat-name">{name}</span>
              <span className="hp-category-link">View products</span>
            </button>
          ))}
          <button className="hp-cat-card hp-cat-card--all" type="button" onClick={() => onSelectCategory?.('All')}>
            <Grid2X2 size={34} />
            <span className="hp-cat-name">View All Categories</span>
          </button>
        </div>
      </div>
    </section>
  );
}
