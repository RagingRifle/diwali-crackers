function evaluatePromo(promo, cartTotal) {
  let discountValue = Number(promo.discount_value) || 0;
  try {
    const tiers = JSON.parse(promo.tiers || '[]');
    if (tiers.length) {
      const tier = tiers.find(item => cartTotal >= Number(item.min) && cartTotal <= Number(item.max));
      if (!tier) return null;
      discountValue = Number(tier.discount) || 0;
    }
  } catch {
    return null;
  }
  if (discountValue <= 0) return null;
  const discount = promo.discount_type === 'percentage'
    ? Math.round(cartTotal * discountValue) / 100
    : discountValue;
  return { discount: Math.min(cartTotal, Math.max(0, Math.round(discount * 100) / 100)) };
}

module.exports = { evaluatePromo };
