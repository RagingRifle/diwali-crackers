import React, { useRef, useEffect } from 'react';
import { ShoppingBag, Home, Package, Truck } from 'lucide-react';
import brandLogo from '../assets/logo.png';

export default function Navbar({
  currentView,
  setCurrentView,
  cartCount,
  isCartOpen,
  setIsCartOpen,
  announcementText = 'Sivakasi Fresh Quality Crackers • Diwali 2026 Festive Sale • 🚀 Express Doorstep Dispatch & Real-Time Tracking',
}) {
  const headerRef = useRef(null);

  // Dynamically update --navbar-height so popups, drawers, and sticky chips adjust irrespective of zoom/screen size
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };

    updateNavbarHeight();

    let resizeObserver;
    if (window.ResizeObserver && headerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateNavbarHeight();
      });
      resizeObserver.observe(headerRef.current);
    }

    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('orientationchange', updateNavbarHeight);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('orientationchange', updateNavbarHeight);
    };
  }, []);

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
    <header className="header-wrapper" ref={headerRef}>
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
      <nav className="main-navbar" aria-label="Main Navigation">
        <div className="nav-container">
          {/* Brand Logo featuring the attached logo image */}
          <div
            className="brand-logo"
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Dinosaur Crackers"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img
              src={brandLogo}
              alt="Dinosaur Crackers Logo"
              className="navbar-brand-logo"
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
              title="Home"
            >
              <Home size={16} />
              <span className="nav-link__text">Home</span>
            </button>
            <button
              className={`nav-link ${currentView === 'shop' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Products"
            >
              <Package size={16} />
              <span className="nav-link__text">Products</span>
            </button>

            <button
              className={`nav-link ${currentView === 'track' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('track');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Track Order"
            >
              <Truck size={16} />
              <span className="nav-link__text">Track</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            {/* Cart Button with automatic Drawer Popup */}
            <button
              className="cart-btn"
              onClick={() => setIsCartOpen((prev) => !prev)}
              aria-label="View Shopping Cart"
              aria-expanded={!!isCartOpen}
            >
              <ShoppingBag size={17} />
              <span className="cart-btn__label">Cart</span>
              <span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
