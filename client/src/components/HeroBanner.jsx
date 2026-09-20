import React from 'react';
import { Sparkles, Shield, Truck, Flame, ArrowRight } from 'lucide-react';

export default function HeroBanner({ onShopClick, onSelectCategory }) {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-tag">
            <Sparkles size={16} />
            <span>Celebrate The Festival Of Lights With Joy & Safety</span>
          </div>

          <h1 className="hero-title">
            Brighten Your Diwali With <br />
            <span className="highlight">Authentic Sivakasi Crackers</span>
          </h1>

          <p className="hero-subtitle">
            Order your favourite Sparklers, Rockets, Chakras, Flower Pots, and Family Gift Boxes
            directly to your doorstep. Simple cart ordering with live phone and order tracking!
          </p>

          <div className="hero-features">
            <div className="feature-pill">
              <span className="icon"><Shield size={16} /></span>
              <span>100% Eco-Friendly Green Crackers</span>
            </div>
            <div className="feature-pill">
              <span className="icon"><Truck size={16} /></span>
              <span>Safe Fire-Proof Packaging</span>
            </div>
            <div className="feature-pill">
              <span className="icon"><Flame size={16} /></span>
              <span>Instant Order & Delivery Tracking</span>
            </div>
          </div>
        </div>

        <div className="hero-banner-card">
          <div className="discount-burst">UP TO 50% OFF</div>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎁</div>
          <h3>Diwali Mega Gift Boxes</h3>
          <p>
            Curated assortment boxes packed with sparklers, flower pots, whistles, and aerial sky shots for the whole family.
          </p>
          <button
            className="hero-cta-btn"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Gift boxes');
              if (onShopClick) onShopClick();
            }}
          >
            <span>Explore Gift Hampers</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
