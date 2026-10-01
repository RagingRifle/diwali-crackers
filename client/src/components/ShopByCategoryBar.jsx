import React from 'react';
import { Grid2X2 } from 'lucide-react';

const CATEGORIES = [
  { name: 'Sparklers', category: 'Sparklers', image: '/category-images/sparklers.jpg' },
  { name: 'Flowerpots', category: 'Flowerpots', image: '/category-images/flowerpots.png' },
  { name: 'Ground Chakkars', category: 'Ground Chakkars', image: '/category-images/ground-chakkars.jpg' },
  { name: 'Novel Fireworks', category: 'Novelty Items', image: '/category-images/novel-fireworks.jpg' },
  { name: 'Sound Crackers', category: 'Sound Crackers', image: '/category-images/sound-crackers.jpg' },
];

export default function ShopByCategoryBar({ onSelectCategory }) {
  return (
    <section className="hp-section hp-shop-categories" aria-labelledby="shop-categories-title">
      <div className="hp-section__inner">
        <div className="hp-section__header">
          <h2 className="hp-section__title" id="shop-categories-title">Shop by Category</h2>
        </div>
        <div className="hp-categories">
          {CATEGORIES.map(({ name, category, image }) => (
              <button className="hp-cat-card" key={name} type="button"
                onClick={() => onSelectCategory?.(category)}>
                <span className="hp-category-image-wrap">
                  <img className="hp-category-image" src={image} alt={`${name} fireworks`} loading="lazy" />
                </span>
                <span className="hp-cat-name">{name}</span>
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
