import React, { useEffect, useState, useMemo } from 'react';
import ProductRowItem from './ProductRowItem';
import { Search, Flame, ArrowRight } from 'lucide-react';

export default function ProductGrid({ onAddToCart, onGoToCatalog }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  useEffect(() => {
    fetch('/api/products?inStockOnly=true&isCombo=false')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.products) setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  // Unique categories for quick filter chips
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const matchCat = selectedCat === 'All' || p.category === selectedCat;
      const matchQ = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.code && String(p.code).toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [products, selectedCat, search]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        <p style={{ fontSize: '1.5rem', margin: 0 }}>✨</p>
        <p>Loading cracker catalog...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #fee2e2',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      margin: '1.25rem 0',
    }}>
      {/* Box Header Toolbar */}
      <div style={{
        background: '#fff8f6',
        borderBottom: '1px solid #fee2e2',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={20} color="#b91c1c" />
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1f2937' }}>
            Explore All Crackers ({filtered.length})
          </span>
          <span style={{
            fontSize: '0.75rem',
            background: '#fee2e2',
            color: '#b91c1c',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
          }}>
            Direct Sivakasi Rates
          </span>
        </div>

        {/* Quick Search */}
        <div style={{
          position: 'relative',
          minWidth: '220px',
          flex: '1 1 240px',
          maxWidth: '360px',
        }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.6rem 0.45rem 2rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>
      </div>

      {/* Category Pills Bar */}
      <div style={{
        padding: '0.65rem 1rem',
        background: '#fafafa',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'thin',
      }}>
        {categories.slice(0, 10).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            style={{
              background: selectedCat === cat ? '#b91c1c' : '#fff',
              color: selectedCat === cat ? '#fff' : '#4b5563',
              border: selectedCat === cat ? '1px solid #b91c1c' : '1px solid #e5e7eb',
              borderRadius: '999px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scrollable Box Container */}
      <div style={{
        maxHeight: '520px',
        overflowY: 'auto',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🔍</p>
            <p style={{ margin: 0, fontWeight: 600 }}>No crackers found matching "{search}".</p>
          </div>
        ) : (
          filtered.map(p => (
            <ProductRowItem
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              onUpdateQuantity={() => {}}
            />
          ))
        )}
      </div>

      {/* Box Footer Banner */}
      <div style={{
        padding: '0.75rem 1.25rem',
        background: '#fff8f6',
        borderTop: '1px solid #fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        fontSize: '0.84rem',
      }}>
        <span style={{ color: '#6b7280' }}>
          💡 Scroll up and down inside the box to view all items. Add to cart anytime!
        </span>
        {onGoToCatalog && (
          <button
            onClick={onGoToCatalog}
            style={{
              background: 'none',
              border: 'none',
              color: '#b91c1c',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0',
            }}
          >
            Open Full Products Page <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
