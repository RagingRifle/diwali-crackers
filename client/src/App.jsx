import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ShopByCategoryBar from './components/ShopByCategoryBar';
import ProductRowItem from './components/ProductRowItem';
import SelectedItemsSidebar from './components/SelectedItemsSidebar';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import TrackOrderPage from './components/TrackOrderPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { Search, Flame } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('shop');
  const [products, setProducts] = useState([]);
  const [categoryMeta, setCategoryMeta] = useState([]); // [{category, count}]
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [trackInitialQuery, setTrackInitialQuery] = useState('');

  // Admin
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('diwali_admin_user');
      const token = localStorage.getItem('diwali_admin_token');
      return saved && token ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Persist cart
  useEffect(() => {
    try { localStorage.setItem('diwali_cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.success) setProducts(prodData.products);
      if (catData.success) setCategoryMeta(catData.categories);
    } catch (e) {
      console.error('Error fetching products:', e);
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

  const handleAdminLogout = () => {
    localStorage.removeItem('diwali_admin_token');
    localStorage.removeItem('diwali_admin_user');
    setAdminUser(null);
    setCurrentView('shop');
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
        adminUser={adminUser}
        onAdminLogout={handleAdminLogout}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      <main style={{ flex: 1 }}>
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

            {/* ── 3-COLUMN LAYOUT ── */}
            <div className="catalog-3col" id="catalog-3col">

              {/* LEFT: Category Sidebar */}
              <aside className="cat-sidebar">
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

              {/* CENTER: Product List */}
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

              {/* RIGHT: Selected Items Sidebar */}
              <SelectedItemsSidebar
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveCartItem}
                onOrderNow={() => setIsCheckoutOpen(true)}
              />
            </div>
          </>
        )}

        {currentView === 'track' && (
          <TrackOrderPage initialSearchQuery={trackInitialQuery} />
        )}

        {currentView === 'admin' && (
          adminUser ? (
            <AdminDashboard
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              onProductChange={fetchProducts}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <h2>Admin Access Required</h2>
              <p style={{ color: 'var(--text-muted)', margin: '1rem 0 1.5rem' }}>
                Please log in with admin credentials to access the management dashboard.
              </p>
              <button
                className="btn-submit-order"
                style={{ maxWidth: '240px', margin: '0 auto' }}
                onClick={() => setIsAdminLoginOpen(true)}
              >
                Open Admin Login
              </button>
            </div>
          )
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
        />
      )}

      {/* Admin Login Modal */}
      <AdminLogin
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setCurrentView('admin');
        }}
      />

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🪔</span>
              <h3 style={{ color: 'var(--primary-red)', fontWeight: 800 }}>DIWALI SPARK</h3>
            </div>
            <p>
              Direct Sivakasi fireworks delivery celebrating safe and joyous festivities across India. Certified green crackers with quality assurance.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
              <span
                style={{ cursor: 'pointer', color: 'var(--text-main)' }}
                onClick={() => { setCurrentView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                🎆 Shop All Crackers
              </span>
              <span
                style={{ cursor: 'pointer', color: 'var(--text-main)' }}
                onClick={() => { setCurrentView('track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                🚚 Live Order Tracking
              </span>
              <span
                style={{ cursor: 'pointer', color: 'var(--text-main)' }}
                onClick={() => setIsAdminLoginOpen(true)}
              >
                🔒 Store Admin Portal
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Customer Support &amp; Helpline</h4>
            <p>
              <strong>Helpline:</strong> +91 98765 43210<br />
              <strong>Email:</strong> support@diwalispark.com<br />
              <strong>Dispatch Hub:</strong> Sivakasi, Tamil Nadu, India
            </p>
          </div>

          <div className="footer-col">
            <h4>Safe &amp; Certified</h4>
            <p>
              ✅ CSIR-NEERI Certified Green Crackers<br />
              ✅ Fire-Proof Multi-Layer Packaging<br />
              ✅ Track anytime via Mobile Number
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Diwali Spark Fireworks. Happy Diwali! 🪔</p>
        </div>
      </footer>
    </div>
  );
}
