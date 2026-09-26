import React, { useState, useEffect, useRef } from 'react';

export default function TestimonialsCarousel({ testimonials }) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;
  const intervalRef = useRef(null);

  const startAuto = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 3000);
  };

  useEffect(() => {
    startAuto();
    return () => clearInterval(intervalRef.current);
  }, [total]);

  const go = (idx) => {
    setCurrent((idx + total) % total);
    startAuto();
  };

  const { name, city, stars, text } = testimonials[current];

  return (
    <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto', padding: '0 2.5rem' }}>
      {/* Prev button */}
      <button
        onClick={() => go(current - 1)}
        aria-label="Previous"
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--primary-red)', color: '#fff', border: 'none',
          borderRadius: '50%', width: '36px', height: '36px',
          fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}
      >‹</button>

      {/* Card */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.75rem 1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        textAlign: 'center',
        minHeight: '180px',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>
          {'⭐'.repeat(stars)}
        </div>
        <p style={{
          fontStyle: 'italic',
          fontSize: '0.97rem',
          color: '#374151',
          lineHeight: '1.6',
          marginBottom: '1rem',
        }}>
          "{text}"
        </p>
        <div style={{ fontWeight: 700, color: 'var(--primary-red)', fontSize: '0.95rem' }}>
          {name}
          <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '0.4rem' }}>— {city}</span>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={() => go(current + 1)}
        aria-label="Next"
        style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--primary-red)', color: '#fff', border: 'none',
          borderRadius: '50%', width: '36px', height: '36px',
          fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}
      >›</button>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to review ${i + 1}`}
            style={{
              width: i === current ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              border: 'none',
              background: i === current ? 'var(--primary-red)' : '#d1d5db',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
