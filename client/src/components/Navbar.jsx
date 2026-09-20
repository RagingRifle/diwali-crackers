import React from 'react';
import { ShoppingBag, Search, Sparkles, Truck, ShieldCheck, UserCheck, LogOut } from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  cartCount,
  setIsCartOpen,
  adminUser,
  onAdminLogout,
  onOpenAdminLogin
}) {
  return (
    <header className="header-wrapper">
      {/* Red Festive Announcement Bar */}
      <div className="header-top-bar">
        <span>✨ Sivakasi Fresh Quality Crackers</span>
        <span>•</span>
        <span className="badge">Diwali 2026 Festive Sale</span>
        <span>•</span>
        <span>🚀 Express Doorstep Dispatch & Real-Time Tracking</span>
      </div>

      {/* Main White & Red Navbar */}
      <nav className="main-navbar">
        <div className="nav-container">
          {/* Brand Logo */}
          <div className="brand-logo" onClick={() => setCurrentView('shop')}>
            <div className="brand-icon">
              🪔
            </div>
            <div className="brand-text">
              <h1>DIWALI SPARK</h1>
              <span>Premium Fireworks & Crackers</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === 'shop' ? 'active' : ''}`}
              onClick={() => setCurrentView('shop')}
            >
              <Sparkles size={17} />
              <span>Shop Crackers</span>
            </button>

            <button
              className={`nav-link ${currentView === 'track' ? 'active' : ''}`}
              onClick={() => setCurrentView('track')}
            >
              <Truck size={17} />
              <span>Track Order</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            {/* Admin Access Button */}
            {adminUser ? (
              <button
                className={`nav-link ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin')}
                style={{ border: '1px solid var(--primary-red)', color: 'var(--primary-red)' }}
              >
                <UserCheck size={16} />
                <span>Admin Panel</span>
              </button>
            ) : (
              <button
                className="nav-link"
                onClick={onOpenAdminLogin}
                title="Store Admin Login"
              >
                <ShieldCheck size={16} />
                <span>Admin Login</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              className="cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="View Shopping Cart"
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              <span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
