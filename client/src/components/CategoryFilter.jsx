import React from 'react';
import { Search } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Sparklers',
  'Flower pots',
  'Rockets',
  'Chakras',
  'Bombs',
  'Fancy items',
  'Gift boxes'
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) {
  return (
    <div className="filter-section">
      <div className="filter-controls">
        {/* Category Pills */}
        <div className="categories-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat === 'All' && '🎆 '}
              {cat === 'Sparklers' && '✨ '}
              {cat === 'Flower pots' && '🏺 '}
              {cat === 'Rockets' && '🚀 '}
              {cat === 'Chakras' && '🌀 '}
              {cat === 'Bombs' && '💥 '}
              {cat === 'Fancy items' && '🎇 '}
              {cat === 'Gift boxes' && '🎁 '}
              {cat}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="search-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search crackers, rockets, pots..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
