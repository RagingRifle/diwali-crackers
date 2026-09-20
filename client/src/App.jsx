import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import TrackOrderPage from './components/TrackOrderPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { Sparkles, Phone, ShieldCheck, Truck, Heart, ArrowUp } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('shop'); // 'shop', 'track', 'admin'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State (with local storage persistence)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('diwali_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [trackInitialQuery, setTrackInitialQuery] = useState('');

  // Admin state
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('diwali_admin_user');
      const token = localStorage.getItem('diwali_admin_token');
      return saved && token ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Save Cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('diwali_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Cart actions
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === productId ? { ...i, quantity: newQty } : i))
      );
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

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Red & White Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        cartCount={cartTotalCount}
        setIsCartOpen={setIsCartOpen}
        adminUser={adminUser}
        onAdminLogout={handleAdminLogout}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Main View Controller */}
      <main style={{ flex: 1 }}>
        {currentView === 'shop' && (
          <>
            {/* Festive Hero Banner */}
            <HeroBanner
              onShopClick={() => {
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* Category Filter & Search */}
            <div id="catalog-section">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Products Catalog */}
            <div className="products-container">
              <div className="catalog-header">
                <h2>
                  {selectedCategory === 'All' ? 'All Festive Crackers' : selectedCategory}
                </h2>
                <span className="count">
                  Showing {filteredProducts.length} items
                </span>
              </div>

              {loadingProducts ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
                  <h3>Loading festive crackers catalog...</h3>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 1rem',
                  background: 'var(--pure-white)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h3>No Crackers Found</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Try searching with another keyword or select "All" categories.
                  </p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map((product) => {
                    const cartItem = cart.find((i) => i.id === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartItem={cartItem}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                      />
                    );
                  })}
                </div>
              )}
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

      {/* Checkout Modal Form */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success Confetti Modal */}
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

      {/* Red & White Festive Footer */}
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
            <h4>Customer Support & Helpline</h4>
            <p>
              <strong>Helpline:</strong> +91 98765 43210<br />
              <strong>Email:</strong> support@diwalispark.com<br />
              <strong>Dispatch Hub:</strong> Sivakasi, Tamil Nadu, India
            </p>
          </div>

          <div className="footer-col">
            <h4>Safe & Certified</h4>
            <p>
              ✅ CSIR-NEERI Certified Green Crackers<br />
              ✅ Fire-Proof Multi-Layer Packaging<br />
              ✅ Track anytime via Mobile Number
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Diwali Spark Fireworks. Designed in festive Red & White. Happy Diwali!</p>
        </div>
      </footer>
    </div>
  );
}
