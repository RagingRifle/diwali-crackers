import React, { useState, useEffect } from 'react';
import {
  Sparkles, Shield, Truck, Flame, ArrowRight,
  Star, Package, Zap, Phone, CheckCircle, Gift,
} from 'lucide-react';
import heroBg from '../assets/diwali_hero.jpg';

/* ─── Countdown to Diwali 2026 (Oct 19, 2026) ───────────────────────────── */
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ─── Trust Badges ──────────────────────────────────────────────────────── */
const TRUST = [
  { icon: <Shield size={28} />, title: 'CSIR-NEERI Certified', desc: 'Eco-friendly green crackers approved by top environmental body' },
  { icon: <Truck size={28} />,  title: 'Express Delivery',     desc: 'Fire-proof multi-layer packaging shipped from Sivakasi' },
  { icon: <Star size={28} />,   title: '10,000+ Happy Families', desc: 'Trusted by customers across India for 8+ festive seasons' },
  { icon: <Zap size={28} />,    title: 'Live Order Tracking',   desc: 'Track your order anytime with your mobile number' },
];

/* ─── Testimonials ──────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Priya R.', city: 'Chennai', stars: 5, text: 'Amazing quality sparklers! My kids loved every bit of it. Packaging was super safe and delivery was on time. Will order again!' },
  { name: 'Rahul M.', city: 'Bangalore', stars: 5, text: 'Best Sivakasi crackers online. The gift box was worth every rupee. Order tracking feature is fantastic!' },
  { name: 'Deepa S.', city: 'Hyderabad', stars: 5, text: 'Bought the family combo — absolutely delightful! Eco-friendly and safe. Highly recommend Diwali Spark.' },
];

/* ─── Category emoji map ─────────────────────────────────────────────────── */
const CATEGORY_EMOJI = {
  'Sparklers': '✨',
  'Sky Shots': '🚀',
  'Flower Pots': '🌺',
  'Ground Chakras': '🎆',
  'Gift boxes': '🎁',
  'Family Combos': '🔥',
};

export default function HomePage({ setCurrentView, onSelectCategory, onAddToCart }) {
  const { days, hours, minutes, seconds } = useCountdown('2026-10-19T00:00:00');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  /* Fetch featured products on mount */
  useEffect(() => {
    fetch('/api/products?featured=true&inStockOnly=true')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setFeaturedProducts(data.products.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, []);

  const goShop = (cat) => {
    if (cat && onSelectCategory) onSelectCategory(cat);
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart(product);
  };

  return (
    <div className="homepage">

      {/* ══════════════════ HERO SECTION ══════════════════ */}
      <section className="hp-hero">
        <img src={heroBg} alt="Diwali 2026 Celebration" className="hp-hero__bg" />
        <div className="hp-hero__overlay" />

        <div className="hp-hero__content">
          {/* Badge */}
          <div className="hp-hero__badge">
            <Sparkles size={15} />
            <span>Diwali 2026 — Festival of Lights</span>
          </div>

          {/* Title */}
          <h1 className="hp-hero__title">
            Light Up Your <br />
            <span className="hp-hero__title-highlight">Diwali 2026</span><br />
            with Authentic Sivakasi Crackers
          </h1>

          <p className="hp-hero__subtitle">
            Premium quality eco-certified fireworks delivered safely to your doorstep.
            Sparklers, rockets, chakras, gift boxes &amp; more — direct from the cracker capital of India.
          </p>

          {/* CTA Buttons */}
          <div className="hp-hero__actions">
            <button className="hp-btn hp-btn--primary" onClick={() => goShop()}>
              <Flame size={18} />
              Shop All Crackers
              <ArrowRight size={16} />
            </button>
            <button className="hp-btn hp-btn--secondary" onClick={() => goShop('Gift boxes')}>
              <Gift size={18} />
              Explore Gift Boxes
            </button>
          </div>

          {/* Feature pills */}
          <div className="hp-hero__pills">
            <span className="hp-pill">✅ 100% Eco-Friendly</span>
            <span className="hp-pill">🚚 Safe Packaging</span>
            <span className="hp-pill">📦 Doorstep Delivery</span>
            <span className="hp-pill">📱 Live Tracking</span>
          </div>
        </div>

        {/* Countdown card floating on hero */}
        <div className="hp-countdown">
          <div className="hp-countdown__label">🪔 Diwali 2026 Countdown</div>
          <div className="hp-countdown__timer">
            {[['Days', days], ['Hrs', hours], ['Min', minutes], ['Sec', seconds]].map(([label, val]) => (
              <div className="hp-countdown__unit" key={label}>
                <span className="hp-countdown__num">{String(val).padStart(2, '0')}</span>
                <span className="hp-countdown__lbl">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section className="hp-stats">
        {[
          { val: '10,000+', label: 'Happy Customers' },
          { val: '50+', label: 'Product Varieties' },
          { val: '8+', label: 'Years of Trust' },
          { val: '100%', label: 'Eco-Certified' },
        ].map(({ val, label }) => (
          <div className="hp-stats__item" key={label}>
            <span className="hp-stats__val">{val}</span>
            <span className="hp-stats__label">{label}</span>
          </div>
        ))}
      </section>

      {/* ══════════════════ FEATURED CRACKERS ══════════════════ */}
      <section className="hp-section">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">⭐ Featured Crackers</h2>
            <p className="hp-section__sub">Handpicked bestsellers — loved by thousands of families</p>
          </div>

          {loadingFeatured ? (
            <div className="hp-featured-grid">
              {[...Array(6)].map((_, i) => (
                <div className="hp-featured-skeleton" key={i} />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="hp-featured-empty">
              <p>No featured products yet. Check back soon! 🎆</p>
              <button className="hp-btn hp-btn--primary" onClick={() => goShop()}>
                Browse All Crackers <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="hp-featured-grid">
              {featuredProducts.map((product) => (
                <div className="hp-featured-card" key={product.id} onClick={() => goShop()}>
                  <div className="hp-featured-card__badge">⭐ Featured</div>
                  <div className="hp-featured-card__emoji">
                    {CATEGORY_EMOJI[product.category] || '🧨'}
                  </div>
                  <div className="hp-featured-card__body">
                    <span className="hp-featured-card__cat">{product.category}</span>
                    <h3 className="hp-featured-card__name">{product.name}</h3>
                    {product.description && (
                      <p className="hp-featured-card__desc">{product.description}</p>
                    )}
                    <div className="hp-featured-card__footer">
                      <div className="hp-featured-card__price">
                        <span className="hp-featured-card__price-val">₹{product.price}</span>
                        {product.unit && (
                          <span className="hp-featured-card__price-unit"> / {product.unit}</span>
                        )}
                      </div>
                      <button
                        className="hp-btn hp-btn--primary hp-btn--sm"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="hp-btn hp-btn--secondary" onClick={() => goShop()}>
              View All Crackers <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURE BANNER ══════════════════ */}
      <section className="hp-feature-banner">
        <div className="hp-feature-banner__inner">
          <div className="hp-feature-banner__text">
            <div className="hp-feature-banner__badge">🎆 Limited Time Offer</div>
            <h2>Diwali Mega Gift Boxes</h2>
            <p>
              Curated assortment packs — sparklers, flower pots, sky shots, whistling rockets
              &amp; more. Perfect for the whole family. <strong>Up to 50% OFF</strong> this festive season!
            </p>
            <button className="hp-btn hp-btn--primary" onClick={() => goShop('Gift boxes')}>
              <Gift size={18} /> Grab the Deal <ArrowRight size={16} />
            </button>
          </div>
          <div className="hp-feature-banner__visual">
            <div className="hp-feature-banner__burst">50% OFF</div>
            <div className="hp-feature-banner__emojis">
              <span>🎆</span><span>✨</span><span>🎇</span>
              <span>🪔</span><span>🎁</span><span>🚀</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ WHY CHOOSE US ══════════════════ */}
      <section className="hp-section hp-section--light">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">Why Choose Diwali Spark?</h2>
            <p className="hp-section__sub">Your trust is our biggest celebration</p>
          </div>
          <div className="hp-trust">
            {TRUST.map((t) => (
              <div className="hp-trust__card" key={t.title}>
                <div className="hp-trust__icon">{t.icon}</div>
                <h3 className="hp-trust__title">{t.title}</h3>
                <p className="hp-trust__desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="hp-section">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">Order in 3 Simple Steps</h2>
            <p className="hp-section__sub">Simple, fast, and delivered to your doorstep</p>
          </div>
          <div className="hp-steps">
            {[
              { step: '01', icon: <Package size={32} />, title: 'Browse & Add to Cart', desc: 'Pick from 50+ fireworks varieties. Add quantities as you like.' },
              { step: '02', icon: <Phone size={32} />,   title: 'Place Order with Phone', desc: 'Enter your name, phone number, and delivery address to confirm.' },
              { step: '03', icon: <CheckCircle size={32} />, title: 'Track & Celebrate!', desc: 'Track live with your phone number and burst crackers when it arrives!' },
            ].map((s) => (
              <div className="hp-step" key={s.step}>
                <div className="hp-step__num">{s.step}</div>
                <div className="hp-step__icon">{s.icon}</div>
                <h3 className="hp-step__title">{s.title}</h3>
                <p className="hp-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="hp-btn hp-btn--primary hp-btn--lg" onClick={() => goShop()}>
              <Flame size={20} /> Start Shopping Now <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="hp-section hp-section--light">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">What Our Customers Say</h2>
            <p className="hp-section__sub">Trusted by thousands of families across India</p>
          </div>
          <div className="hp-testimonials">
            {TESTIMONIALS.map((t) => (
              <div className="hp-testi" key={t.name}>
                <div className="hp-testi__stars">{'⭐'.repeat(t.stars)}</div>
                <p className="hp-testi__text">"{t.text}"</p>
                <div className="hp-testi__author">
                  <span className="hp-testi__name">{t.name}</span>
                  <span className="hp-testi__city">📍 {t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA BAND ══════════════════ */}
      <section className="hp-cta-band">
        <h2>🎆 Diwali 2026 is almost here!</h2>
        <p>Don't miss out — stock up on your favourite fireworks before they sell out.</p>
        <button className="hp-btn hp-btn--white" onClick={() => goShop()}>
          Shop All Crackers <ArrowRight size={16} />
        </button>
      </section>

    </div>
  );
}
