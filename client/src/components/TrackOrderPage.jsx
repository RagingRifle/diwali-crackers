import React, { useState, useEffect } from 'react';
import { Search, Truck, Package, CheckCircle, Clock, MapPin, Phone, AlertCircle, Calendar, FileText } from 'lucide-react';

const ORDER_STEPS = [
  { key: 'Pending', label: 'Order Placed', icon: Clock },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'Packed', label: 'Packed & Inspected', icon: Package },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle }
];

export default function TrackOrderPage({ initialSearchQuery = '', onOpenInvoice }) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (query) => {
    if (!query || !query.trim()) {
      setError('Please enter a valid Order ID or Phone Number.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const isOrderId = query.trim().toUpperCase().startsWith('CRK');
      const paramName = isOrderId ? 'orderId' : (isNaN(query.trim()) ? 'orderId' : 'phone');
      
      const response = await fetch(`/api/orders/track?${paramName}=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No matching orders found. Please check your details.');
      }

      setOrders(data.orders || []);
    } catch (err) {
      setOrders([]);
      setError(err.message || 'Error tracking order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      fetchTracking(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracking(searchQuery);
  };

  // Helper to determine step status
  const getStepState = (orderStatus, stepKey) => {
    const statuses = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(orderStatus);
    const stepIndex = statuses.indexOf(stepKey);

    if (orderStatus === 'Cancelled') {
      return 'cancelled';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="track-page-container">
      {/* Header */}
      <div className="track-hero">
        <h2>Live Order & Delivery Tracking</h2>
        <p>
          Check the real-time preparation and doorstep transit status of your Diwali crackers package.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="track-search-card">
        <form onSubmit={handleSearchSubmit}>
          <div className="track-input-group">
            <input
              type="text"
              className="track-input"
              placeholder="Enter your 10-digit Mobile Number OR Order ID (e.g. CRK-2026-XXXX)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-track" disabled={loading}>
              <Search size={18} />
              <span>{loading ? 'Searching...' : 'Track Package'}</span>
            </button>
          </div>
        </form>

        <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          💡 Tip: You can look up your order anytime without an account using either your Mobile Phone or Order ID.
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty Search Result State */}
      {searched && !loading && orders.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'var(--pure-white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Order Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            We couldn't find any orders matching "<strong>{searchQuery}</strong>". Please verify your phone number or Order ID.
          </p>
        </div>
      )}

      {/* Orders List */}
      {orders.map((order) => {
        const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
        const formattedDate = order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }) : '';

        return (
          <div key={order.id} className="order-tracking-card">
            {/* Header info */}
            <div className="order-tracking-header">
              <div className="order-header-info">
                <h3>
                  <span>Order {order.id}</span>
                </h3>
                <p>
                  Placed on {formattedDate} • Recipient: <strong>{order.customer_name}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`status-pill ${statusClass}`}>
                  ● {order.status}
                </span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-red)' }}>
                  ₹{order.total_amount}
                </span>
                {onOpenInvoice && (
                  <button
                    className="btn-action"
                    style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac', fontWeight: 700, padding: '0.35rem 0.75rem' }}
                    onClick={() => onOpenInvoice(order)}
                    title="Download / Print Bill"
                  >
                    <FileText size={14} />
                    <span>Download Bill</span>
                  </button>
                )}
              </div>
            </div>

            {/* Courier / Shipping banner if present */}
            {(order.courier_name || order.tracking_number) && (
              <div style={{
                background: 'var(--primary-red-light)',
                borderBottom: '1px solid var(--red-border)',
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--primary-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Truck size={16} />
                <span>
                  Dispatched via <strong>{order.courier_name || 'Festive Express Partner'}</strong>
                  {order.tracking_number && ` • Tracking AWB: ${order.tracking_number}`}
                </span>
              </div>
            )}

            {/* Visual Step Progress Tracker */}
            {order.status !== 'Cancelled' ? (
              <div className="tracking-stepper-wrap">
                <div className="tracking-stepper">
                  {ORDER_STEPS.map((step, idx) => {
                    const state = getStepState(order.status, step.key);
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className={`tracking-step ${state}`}>
                        <div className="step-node">
                          {state === 'completed' ? '✓' : idx + 1}
                        </div>
                        <span className="step-title">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '1.25rem 1.5rem',
                background: '#FEE2E2',
                color: '#991B1B',
                fontWeight: 700
              }}>
                ❌ This order has been cancelled.
              </div>
            )}

            {/* Order Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border-light)'
            }}>
              {/* Delivery Address & Customer Info */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-red)', marginBottom: '0.5rem' }}>
                  📍 Delivery Details
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  <strong>{order.customer_name}</strong><br />
                  {order.address}<br />
                  {order.city} - {order.pincode}<br />
                  Phone: <strong>{order.phone}</strong>
                  {order.email && <><br />Email: {order.email}</>}
                </p>
                {order.notes && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Note: "{order.notes}"
                  </p>
                )}
              </div>

              {/* Package contents */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-red)', marginBottom: '0.5rem' }}>
                  📦 Package Contents ({order.items ? order.items.length : 0} items)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      padding: '0.3rem 0',
                      borderBottom: '1px dashed var(--border-light)'
                    }}>
                      <span>{item.product_name} <strong>x {item.quantity}</strong></span>
                      <span style={{ fontWeight: 700 }}>₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status History Timeline */}
            {order.status_updates && order.status_updates.length > 0 && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div className="tracking-timeline-box">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    🕒 Tracking History Log
                  </h4>
                  {order.status_updates.slice().reverse().map((update, idx) => (
                    <div key={idx} className="timeline-entry">
                      <div className="timeline-dot" />
                      <div className="timeline-info">
                        <div className="timeline-status">{update.status}</div>
                        <div className="timeline-time">
                          {new Date(update.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                        {update.note && (
                          <div className="timeline-note">{update.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
