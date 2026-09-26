import React from 'react';
import { ShoppingBag, Home, Package, Truck } from 'lucide-react';
import brandLogo from '../assets/logo.png';

export default function Navbar({
  currentView,
  setCurrentView,
  cartCount,
  setIsCartOpen,
  announcementText = 'Sivakasi Fresh Quality Crackers • Diwali 2026 Festive Sale • 🚀 Express Doorstep Dispatch & Real-Time Tracking',
}) {
  // Render announcement parts cleanly
  const renderAnnouncement = () => {
    if (!announcementText) return null;
    if (announcementText.includes('•')) {
      const parts = announcementText.split('•');
      return parts.map((part, idx) => {
        const trimmed = part.trim();
        const isBadge = /(festive|sale|special|discount|offer)/i.test(trimmed);
        return (
          <React.Fragment key={idx}>
            {isBadge ? <span className="badge">{trimmed}</span> : <span>{trimmed}</span>}
            {idx < parts.length - 1 && <span className="ticker-dot">•</span>}
          </React.Fragment>
        );
      });
    }
    return <span>{announcementText}</span>;
  };

  return (
    <header className="header-wrapper">
      {/* Red Festive Announcement Bar (Customizable from Admin - marquee scrolling if long) */}
      <div className="header-top-bar" title={announcementText}>
        <div className="header-top-bar__ticker">
          <div className="header-top-bar__track">
            {renderAnnouncement()}
          </div>
          {/* Duplicate track for seamless infinite scroll on long text */}
          <div className="header-top-bar__track" aria-hidden="true">
            {renderAnnouncement()}
          </div>
        </div>
      </div>

      {/* Main White & Red Navbar */}
      <nav className="main-navbar">
        <div className="nav-container">
          {/* Brand Logo featuring the attached logo image */}
          <div
            className="brand-logo"
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Dinosaur Crackers"
          >
            <img
              src={brandLogo}
              alt="Dinosaur Crackers Logo"
              className="navbar-brand-logo"
              style={{
                height: '75px',
                maxHeight: '85px',
                width: 'auto',
                maxWidth: '240px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Home size={17} />
              <span>Home</span>
            </button>
            <button
              className={`nav-link ${currentView === 'shop' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Package size={17} />
              <span>Products</span>
            </button>

            <button
              className={`nav-link ${currentView === 'track' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('track');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Truck size={17} />
              <span>Track Order</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            {/* Cart Button with automatic Drawer Popup */}
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
