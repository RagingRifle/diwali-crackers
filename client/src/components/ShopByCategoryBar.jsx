import React from 'react';

const CATEGORY_ICONS = {
  'Combo Bundles': '🎁',
  'Sparklers': '✨',
  'Flowerpots': '🌺',
  'Ground Chakkars': '🌀',
  'Fancy Fountains': '🎇',
  'Sky Shots': '🚀',
  'Aerial Shots': '💥',
  'Bombs': '💣',
  'Sound Crackers': '🎆',
  'Garland Crackers': '🧨',
  'Rockets': '🚀',
  'Novelty Items': '🎭',
  'Fancy Novelties': '🦋',
  'Miscellaneous': '🎁',
};

const FEATURED_CATEGORIES = [
  'Combo Bundles',
  'Sparklers',
  'Flowerpots',
  'Ground Chakkars',
  'Fancy Fountains',
  'Aerial Shots',
  'Sound Crackers',
];

export default function ShopByCategoryBar({ onSelectCategory, selectedCategory }) {
  return (
    <div className="shop-by-cat-section">
      <div className="shop-by-cat-title">
        <span className="cat-title-deco">—— ❇️</span>
        <h2>SHOP BY CATEGORY</h2>
        <span className="cat-title-deco">❇️ ——</span>
      </div>

      <div className="shop-by-cat-row">
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`cat-card ${selectedCategory === cat ? 'cat-card--active' : ''}`}
            onClick={() => onSelectCategory(cat)}
            title={cat}
          >
            <div className="cat-card-icon">{CATEGORY_ICONS[cat] || '🎆'}</div>
            <span className="cat-card-label">{cat.toUpperCase()}</span>
          </button>
        ))}

        {/* View All tile */}
        <button
          className={`cat-card cat-card--viewall ${selectedCategory === 'All' ? 'cat-card--active-red' : ''}`}
          onClick={() => onSelectCategory('All')}
        >
          <div className="cat-card-icon" style={{ fontSize: '2rem' }}>⊞</div>
          <span className="cat-card-label">VIEW ALL CATEGORIES</span>
        </button>
      </div>
    </div>
  );
}
