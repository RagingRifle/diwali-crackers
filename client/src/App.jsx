import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ShopByCategoryBar from './components/ShopByCategoryBar';
import ProductRowItem from './components/ProductRowItem';
import SelectedItemsSidebar from './components/SelectedItemsSidebar';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import TrackOrderPage from './components/TrackOrderPage';
import InvoiceModal from './components/InvoiceModal';
import { Search, Flame } from 'lucide-react';
import HomePage from './components/HomePage';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [products, setProducts] = useState([]);
  const [categoryMeta, setCategoryMeta] = useState([]); // [{category, count}]
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [siteSettings, setSiteSettings] = useState({
    top_announcement_bar: '✨ Sivakasi Fresh Quality Crackers • Diwali 2026 Festive Sale • 🚀 Express Doorstep Dispatch & Real-Time Tracking'
  });

  // Cart
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('diwali_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [trackInitialQuery, setTrackInitialQuery] = useState('');

  // Persist cart
  useEffect(() => {
    try { localStorage.setItem('diwali_cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  // Fetch Products & Site Settings
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, catRes, setRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/categories'),
        fetch('/api/settings').catch(() => null),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.success) setProducts(prodData.products);
      if (catData.success) setCategoryMeta(catData.categories);

      if (setRes) {
        const setData = await setRes.json();
        if (setData.success && setData.settings) {
          setSiteSettings(setData.settings);
        }
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Cart actions
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    // Open cart drawer after adding item
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== productId));
    } else {
      setCart((prev) => prev.map((i) => i.id === productId ? { ...i, quantity: newQty } : i));
    }
  };

  const handleRemoveCartItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const handleOrderSuccess = (orderSummary) => {
    setCart([]);
    setIsCheckoutOpen(false);
    setSuccessOrderData(orderSummary);
  };

  const handleTrackDirect = (orderId) => {
    setTrackInitialQuery(orderId);
    setCurrentView('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Filter & group ─────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Group by category, preserving category order
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of filteredProducts) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p);
    }
    return Array.from(map.entries()); // [[category, [products...]], ...]
  }, [filteredProducts]);

  const totalItems = products.filter(p => p.in_stock !== 0).length;
  const cartTotalCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        cartCount={cartTotalCount}
        setIsCartOpen={setIsCartOpen}
        announcementText={siteSettings.top_announcement_bar}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'home' && (
          <HomePage
            setCurrentView={setCurrentView}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSearchQuery('');
            }}
            onAddToCart={handleAddToCart}
          />
        )}
        {currentView === 'shop' && (
          <>
            {/* ── SHOP BY CATEGORY BAR ── */}
            <ShopByCategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSearchQuery('');
                const el = document.getElementById('catalog-3col');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* ── MOBILE CATEGORY CHIPS BAR (Sticky under navbar on mobile) ── */}
            <div className="mobile-cat-chips-bar">
              <button
                className={`mobile-cat-chip ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              >
                All ({totalItems})
              </button>
              {categoryMeta.map(({ category, count }) => (
                <button
                  key={category}
                  className={`mobile-cat-chip ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(category); setSearchQuery(''); }}
                >
                  {category} ({count})
                </button>
              ))}
            </div>

            {/* ── 3-COLUMN LAYOUT ── */}
            <div className="catalog-3col" id="catalog-3col">

              {/* LEFT: Category Sidebar (Desktop only) */}
              <aside className="cat-sidebar desktop-only">
                <div className="cat-sidebar__header">CATEGORIES</div>
                <ul className="cat-sidebar__list">
                  <li
                    className={`cat-sidebar__item ${selectedCategory === 'All' ? 'cat-sidebar__item--active' : ''}`}
                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  >
                    <span className="cat-sidebar__name">All Products</span>
                    <span className="cat-sidebar__count">({totalItems} Products)</span>
                    <span className="cat-sidebar__arrow">›</span>
                  </li>
                  {categoryMeta.map(({ category, count }) => (
                    <li
                      key={category}
                      className={`cat-sidebar__item ${selectedCategory === category ? 'cat-sidebar__item--active' : ''}`}
                      onClick={() => { setSelectedCategory(category); setSearchQuery(''); }}
                    >
                      <span className="cat-sidebar__name">{category}</span>
                      <span className="cat-sidebar__count">({count} Products)</span>
                      <span className="cat-sidebar__arrow">›</span>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* CENTER: Product List (First section on mobile) */}
              <div className="catalog-center">
                {/* Header */}
                <div className="catalog-center__header">
                  <div className="catalog-center__title">
                    <Flame size={18} style={{ color: '#e84040' }} />
                    <span>
                      {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                    </span>
                  </div>
                  <span className="catalog-center__badge">
                    {filteredProducts.length} Items
                  </span>
                </div>

                {/* Search bar */}
                <div className="catalog-search-wrap">
                  <Search size={16} className="catalog-search-icon" />
                  <input
                    type="text"
                    className="catalog-search-input"
                    placeholder="Search products by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Product rows, grouped by category */}
                {loadingProducts ? (
                  <div className="catalog-loading">
                    <div style={{ fontSize: '2.5rem' }}>✨</div>
                    <p>Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="catalog-empty">
                    <div style={{ fontSize: '2.5rem' }}>🔍</div>
                    <p>No products found. Try a different search or category.</p>
                  </div>
                ) : (
                  grouped.map(([cat, items]) => (
                    <div key={cat} className="product-group">
                      <div className="product-group__banner">{cat}</div>
                      {items.map((product) => {
                        const cartItem = cart.find((i) => i.id === product.id);
                        return (
                          <ProductRowItem
                            key={product.id}
                            product={product}
                            cartItem={cartItem}
                            onAddToCart={handleAddToCart}
                            onUpdateQuantity={handleUpdateQuantity}
                          />
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT: Selected Items Sidebar (Desktop only) */}
              <div className="desktop-only" style={{ position: 'sticky', top: '80px' }}>
                <SelectedItemsSidebar
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onOrderNow={() => setIsCheckoutOpen(true)}
                />
              </div>
            </div>
          </>
        )}

        {currentView === 'track' && (
          <TrackOrderPage
            initialSearchQuery={trackInitialQuery}
            onOpenInvoice={(order) => setInvoiceOrder(order)}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success Modal */}
      {successOrderData && (
        <OrderSuccessModal
          orderData={successOrderData}
          onClose={() => setSuccessOrderData(null)}
          onTrackOrder={handleTrackDirect}
          onContinueShopping={() => {
            setSuccessOrderData(null);
            setCurrentView('shop');
          }}
          onOpenInvoice={(order) => setInvoiceOrder(order)}
        />
      )}

      {/* Standalone Printable & Downloadable Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          isOpen={!!invoiceOrder}
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🪔</span>
              <h3 style={{ color: 'var(--primary-red)', fontWeight: 800 }}>DINOSAUR CRACKERS</h3>
            </div>
            <p>
              Direct Sivakasi fireworks delivery celebrating safe and joyous festivities across India. Premium crackers with quality assurance.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
              <span
                style={{ cursor: 'pointer', color: 'var(--text-main)' }}
                onClick={() => { setCurrentView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                🎆 Products Catalog
              </span>
              <span
                style={{ cursor: 'pointer', color: 'var(--text-main)' }}
                onClick={() => { setCurrentView('track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                🚚 Live Order Tracking
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Customer Support &amp; Helplines</h4>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
              Direct Sivakasi Helpline Numbers:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem' }}>
              <a href="tel:9384005248" style={{ color: 'var(--primary-red)', fontWeight: 700, textDecoration: 'none' }}>
                📞 93840 05248
              </a>
              <a href="tel:7558175156" style={{ color: 'var(--primary-red)', fontWeight: 700, textDecoration: 'none' }}>
                📞 75581 75156
              </a>
              <a href="tel:9150431251" style={{ color: 'var(--primary-red)', fontWeight: 700, textDecoration: 'none' }}>
                📞 91504 31251
              </a>
              <a href="tel:9626622101" style={{ color: 'var(--primary-red)', fontWeight: 700, textDecoration: 'none' }}>
                📞 96266 22101
              </a>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <a
                href="https://maps.google.com/?q=9.421799,77.807465"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#15803d',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'underline'
                }}
              >
                📍 Dispatch Hub: Sivakasi (9.421799, 77.807465)
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Safe &amp; Secure</h4>
            <p>
              ✅ 100% Quality Assured Crackers<br />
              ✅ Safe and Secure Packaging<br />
              ✅ Track anytime via Mobile Number
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Dinosaur Crackers. Happy Diwali! 🪔</p>
        </div>
      </footer>
    </div>
  );
}
