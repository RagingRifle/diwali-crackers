import React from 'react';
import { ShoppingBag, Home, Package, Truck } from 'lucide-react';
import brandLogo from '../assets/logo.png';

export default function Navbar({
  currentView,
  setCurrentView,
  cartCount,
  setIsCartOpen,
  announcementText = '✨ Sivakasi Fresh Quality Crackers • Diwali 2026 Festive Sale • 🚀 Express Doorstep Dispatch & Real-Time Tracking',
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
            {idx < parts.length - 1 && <span>•</span>}
          </React.Fragment>
        );
      });
    }
    return <span>{announcementText}</span>;
  };

  return (
    <header className="header-wrapper">
      {/* Red Festive Announcement Bar (Customizable from Admin) */}
      <div className="header-top-bar">
        {renderAnnouncement()}
      </div>

      {/* Main White & Red Navbar */}
      <nav className="main-navbar">
        <div className="nav-container">
          {/* Brand Logo featuring the attached logo image */}
          <div
            className="brand-logo"
            onClick={() => setCurrentView('home')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Dinosaur Crackers"
          >
            <img
              src={brandLogo}
              alt="Logo"
              className="navbar-brand-logo"
              style={{
                height: '80px',
                maxHeight: '90px',
                width: 'auto',
                maxWidth: '250px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              <Home size={17} />
              <span>Home</span>
            </button>
            <button
              className={`nav-link ${currentView === 'shop' ? 'active' : ''}`}
              onClick={() => setCurrentView('shop')}
            >
              <Package size={17} />
              <span>Products</span>
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
