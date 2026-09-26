import React, { useState, useEffect } from 'react';
import {
  Sparkles, Shield, Truck, Flame, ArrowRight,
  Star, Package, Zap, Phone, CheckCircle, MapPin
} from 'lucide-react';
import heroBg from '../assets/diwali_hero.jpg';
import ProductGrid from './ProductGrid';
import FeaturedCombos from './FeaturedCombos';
import TestimonialsCarousel from './TestimonialsCarousel';

/* ─── Countdown to Diwali 2026 (Nov 8, 2026) ────────────────────────────── */
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
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

/* ─── Trust Badges ──────────────────────────────────────────────────────── */
const TRUST = [
  { icon: <Shield size={28} />, title: 'Premium Sivakasi Quality', desc: 'Top quality Sivakasi fireworks tested for high performance & safety' },
  { icon: <Truck size={28} />,  title: 'Express Delivery',     desc: 'Safe and secure packaging shipped directly from Sivakasi' },
  { icon: <Star size={28} />,   title: '2000+ Happy Families', desc: 'Trusted by customers across India for 5+ festive seasons' },
  { icon: <Zap size={28} />,    title: 'Live Order Tracking',   desc: 'Track your order anytime with your mobile number' },
];

/* ─── Testimonials ──────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Priya R.', city: 'Chennai', stars: 5, text: 'Amazing quality sparklers! My kids loved every bit of it. Packaging was super safe and delivery was on time. Will order again!' },
  { name: 'Rahul M.', city: 'Bangalore', stars: 5, text: 'Best Sivakasi crackers online. The gift box was worth every rupee. Order tracking feature is fantastic!' },
  { name: 'Deepa S.', city: 'Hyderabad', stars: 5, text: 'Bought the family combo — absolutely delightful! High quality and safe. Highly recommend Dinosaur Crackers.' },
  { name: 'Anita K.', city: 'Pune', stars: 5, text: 'The combo offers saved us money and the fireworks were spectacular. Loved the whole experience.' },
  { name: 'Vikram P.', city: 'Ahmedabad', stars: 5, text: 'Fast delivery and great customer support. The crackers were exactly as described.' },
  { name: 'Suresh L.', city: 'Coimbatore', stars: 5, text: 'Ordered for the first time this Diwali and honestly I was nervous about online crackers — but these guys nailed it. Same day dispatch and everything was intact. 100% will order again.' },
  { name: 'Meena T.', city: 'Madurai', stars: 5, text: 'The sky shots we got were incredible! Neighbours kept asking where we bought them. Price was really good compared to local market. Very happy customer.' },
  { name: 'Karthik B.', city: 'Chennai', stars: 5, text: 'I order from here every year now. The packing is tight and nothing breaks during transport. Ground chakkars and flower pots were the highlight this year!' },
  { name: 'Nandini V.', city: 'Mysore', stars: 5, text: 'My husband is very picky about cracker quality. He was impressed this time! Got the big combo pack and the whole family enjoyed. Delivery was 2 days ahead of expected.' },
  { name: 'Arun D.', city: 'Salem', stars: 5, text: 'Compared to buying locally, this is cheaper and much better quality. The 30-shot aerial cake was absolutely mind-blowing. Definitely recommending to friends.' },
  { name: 'Kavitha R.', city: 'Trichy', stars: 5, text: 'Very smooth ordering process. Just added to cart, placed the order with phone number and they called to confirm. Real people, real service. Loved it!' },
  { name: 'Bala S.', city: 'Erode', stars: 4, text: 'Good quality products. Delivery was slightly delayed by one day but the crackers themselves were excellent. Will order again next Diwali for sure.' },
];

/* ─── Contact Phone Numbers & Map ────────────────────────────────────────── */
const PHONE_NUMBERS = [
  '93840 05248',
  '75581 75156',
  '91504 31251',
  '96266 22101'
];
const MAP_URL = 'https://maps.google.com/?q=9.421799,77.807465';

export default function HomePage({ setCurrentView, onSelectCategory, onAddToCart }) {
  const { days, hours, minutes, seconds } = useCountdown('2026-11-08T00:00:00');

  const goShop = (cat) => {
    if (cat && onSelectCategory) onSelectCategory(cat);
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (e, product) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onAddToCart) onAddToCart(product);
  };

  return (
    <div className="homepage">

      {/* ══════════════════ HERO SECTION ══════════════════ */}
      <section className="hp-hero">
        <img src={heroBg} alt="Diwali 2026 Celebration" className="hp-hero__bg" />
        <div className="hp-hero__overlay" />
        <div className="hp-hero__content">
          <div className="hp-hero__badge"><Sparkles size={15} /><span>Diwali 2026 — Festival of Lights</span></div>
          <h1 className="hp-hero__title">Light Up Your <br /><span className="hp-hero__title-highlight">Diwali 2026</span><br />with Dinosaur Crackers</h1>
          <p className="hp-hero__subtitle">Premium quality fireworks delivered safely to your doorstep. Sparklers, rockets, ground chakkars, flower pots &amp; sky shots — direct from Sivakasi.</p>
          <div className="hp-hero__actions">
            <button className="hp-btn hp-btn--primary" onClick={() => goShop()}><Flame size={18} />Shop All Crackers<ArrowRight size={16} /></button>
            <button className="hp-btn hp-btn--secondary" onClick={() => goShop('Sparklers')}><Sparkles size={18} />Explore Sparklers</button>
          </div>
          <div className="hp-hero__pills">
            <span className="hp-pill">✨ 100% Quality Assured</span>
            <span className="hp-pill">🚚 Safe and Secure Packaging</span>
            <span className="hp-pill">📦 Doorstep Delivery</span>
            <span className="hp-pill">📱 Live Tracking</span>
          </div>
        </div>
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
          { val: '2000+', label: 'Happy Customers' },
          { val: '200+', label: 'Product Varieties' },
          { val: '5+', label: 'Years of Trust' },
        ].map(({ val, label }) => (
          <div className="hp-stats__item" key={label}>
            <span className="hp-stats__val">{val}</span>
            <span className="hp-stats__label">{label}</span>
          </div>
        ))}
      </section>

      {/* ══════════════════ FEATURED COMBOS & SCROLLABLE PRODUCTS BOX ══════════════════ */}
      <section className="hp-section">
        <div className="hp-section__inner">
          {/* Section 1: Featured Combos */}
          <div className="hp-section__header">
            <h2 className="hp-section__title">⭐ Featured Combos</h2>
            <p className="hp-section__sub">Best value festive hampers direct from Sivakasi (Fixed Price)</p>
          </div>
          <FeaturedCombos onAddToCart={handleAddToCart} />

          {/* Section 2: All Products in compact scrollable box */}
          <div className="hp-section__header" style={{ marginTop: '2.5rem' }}>
            <h2 className="hp-section__title">🎆 All Cracker Products</h2>
            <p className="hp-section__sub">
              Browse and add to cart directly from this scrollable box without leaving the page
            </p>
          </div>
          <ProductGrid onAddToCart={handleAddToCart} onGoToCatalog={() => goShop()} />
        </div>
      </section>

      {/* ══════════════════ FEATURE BANNER ══════════════════ */}
      <section className="hp-feature-banner">
        <div className="hp-feature-banner__inner">
          <div className="hp-feature-banner__text">
            <div className="hp-feature-banner__badge">🎆 Special Festive Offer</div>
            <h2>Authentic Sivakasi Crackers</h2>
            <p>Light up your celebrations with genuine sparklers, flower pots, sky shots &amp; sound crackers. <strong>Up to 85% OFF</strong> factory direct pricing from Dinosaur Crackers!</p>
            <button className="hp-btn hp-btn--primary" onClick={() => goShop()}><Flame size={18} />Shop Crackers Now<ArrowRight size={16} /></button>
          </div>
          <div className="hp-feature-banner__visual">
            <div className="hp-feature-banner__burst">85% OFF</div>
            <div className="hp-feature-banner__emojis">
              <span>🎆</span><span>✨</span><span>🎇</span>
              <span>🪔</span><span>🧨</span><span>🚀</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ WHY CHOOSE US ══════════════════ */}
      <section className="hp-section hp-section--light">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">Why Choose Dinosaur Crackers?</h2>
            <p className="hp-section__sub">Your trust is our biggest celebration</p>
          </div>
          <div className="hp-trust" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {TRUST.map((t) => (
              <div className="hp-trust__card" key={t.title} style={{ flex: '0 1 260px' }}>
                <div className="hp-trust__icon">{t.icon}</div>
                <h3 className="hp-trust__title">{t.title}</h3>
                <p className="hp-trust__desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ ORDER IN 3 STEPS ══════════════════ */}
      <section className="hp-section">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">Order in 3 Simple Steps</h2>
            <p className="hp-section__sub">Simple, fast, and delivered to your doorstep</p>
          </div>
          <div className="hp-steps" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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

      {/* ══════════════════ TESTIMONIALS (AUTO-MOVING CAROUSEL) ══════════════════ */}
      <section className="hp-section hp-section--light">
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">What Our Customers Say</h2>
            <p className="hp-section__sub">Trusted by thousands of families across India</p>
          </div>
          <TestimonialsCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>

      {/* ══════════════════ SIVAKASI HUB LOCATION & DIRECT CONTACT ══════════════════ */}
      <section className="hp-section" style={{ background: '#fffbeb', borderTop: '2px solid #fef3c7', borderBottom: '2px solid #fef3c7' }}>
        <div className="hp-section__inner">
          <div className="hp-section__header">
            <h2 className="hp-section__title">📍 Direct Sivakasi Dispatch Hub &amp; Support</h2>
            <p className="hp-section__sub">Call us anytime for bulk bookings, order inquiries or visit our hub directly in Sivakasi</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            alignItems: 'stretch',
          }}>
            {/* Phones Card */}
            <div style={{
              background: '#fff',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <h3 style={{ fontSize: '1.1rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                <Phone size={20} /> Direct Helplines
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '1rem' }}>
                Tap any number below to call directly or message on WhatsApp:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {PHONE_NUMBERS.map(ph => (
                  <a
                    key={ph}
                    href={`tel:${ph.replace(/\s+/g, '')}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#fff8f6',
                      border: '1px solid #fee2e2',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                    }}
                  >
                    📞 {ph}
                  </a>
                ))}
              </div>
            </div>

            {/* Google Maps Location Card */}
            <div style={{
              background: '#fff',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem' }}>
                  <MapPin size={20} /> Sivakasi Dispatch Center
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.5', margin: '0 0 1rem' }}>
                  Direct factory dispatches across Tamil Nadu, Bangalore, Hyderabad and all over India with secure parcel packaging.
                </p>
              </div>

              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#16a34a',
                  color: '#fff',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                }}
              >
                <MapPin size={18} /> Open in Google Maps (9.421799, 77.807465)
              </a>
            </div>
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
