import React from 'react';
import HeroBanner from './HeroBanner';

/**
 * Home page component displayed at the root route.
 * Renders the existing HeroBanner with a "Shop Now" CTA that
 * navigates to the shop view when clicked.
 */
export default function HomePage({ setCurrentView }) {
  const handleShopClick = () => {
    // Switch to the shop view when the CTA is pressed
    setCurrentView('shop');
  };

  return <HeroBanner onShopClick={handleShopClick} />;
}
