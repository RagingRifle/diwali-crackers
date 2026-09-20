import React, { useState } from 'react';
import { X, Send, Sparkles, MapPin, Phone, User, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isFreeDelivery = subtotal >= 999;
  const deliveryFee = isFreeDelivery ? 0 : 99;
  const finalTotal = subtotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.customer_name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Please enter your delivery street address.');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please enter your city.');
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.trim().length < 5) {
      setError('Please enter a valid postal pincode.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        items: cartItems.map(item => ({
          id: item.id,
          code: item.code || '',
          name: item.name,
          content: item.content || item.pack_size || '',
          mrp: Number(item.mrp) || Number(item.price) || 0,
          price: Number(item.price),
          quantity: item.quantity,
          is_combo: item.is_combo || 0
        }))
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order. Please try again.');
      }

      onOrderSuccess(data.order || {
        id: data.orderId,
        orderId: data.orderId,
        customer_name: formData.customer_name,
        customerName: formData.customer_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        notes: formData.notes,
        total_amount: data.totalAmount,
        totalAmount: data.totalAmount,
        items: payload.items,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err.message || 'Network error submitting order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>
            <Sparkles size={20} />
            <span>Complete Delivery Form & Confirm Order</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="modal-body">
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#991B1B',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              border: '1px solid #FCA5A5'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid two-col">
              <div className="form-group">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="customer_name"
                    className="form-control"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="e.g. 9876543210 (Used for Tracking)"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="e.g. ramesh@gmail.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>
                Door No / Building / Street Address <span className="required">*</span>
              </label>
              <textarea
                name="address"
                className="form-control"
                placeholder="Flat 4B, Lotus Apartments, MG Road"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                required
              />
            </div>

            <div className="form-grid two-col" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>
                  City / Town <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  placeholder="e.g. Chennai, Bangalore, Mumbai"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Pincode <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  className="form-control"
                  placeholder="e.g. 600001"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>
                Delivery Instructions / Notes
              </label>
              <input
                type="text"
                name="notes"
                className="form-control"
                placeholder="e.g. Ring bell twice, deliver before 6 PM"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Summary Box */}
            <div className="form-summary-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-red)' }}>
                  📦 Order Package ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)
                </span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-red)' }}>
                  Total: ₹{finalTotal}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {cartItems.map(i => `${i.name} (x${i.quantity})`).join(', ')}
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-order"
              disabled={loading}
            >
              {loading ? (
                <span>Submitting Your Festive Order...</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Order & Generate Tracking ID</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              🔒 No login needed to place an order. Track your delivery anytime with your Mobile & Order ID.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
