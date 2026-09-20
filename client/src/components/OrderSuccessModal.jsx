import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Check, Truck, ShoppingBag, FileText } from 'lucide-react';

export default function OrderSuccessModal({
  orderData,
  onClose,
  onTrackOrder,
  onContinueShopping,
  onOpenInvoice
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D32F2F', '#FFD700', '#FF5722', '#FFFFFF', '#4CAF50']
      });
    } catch (e) {}
  }, []);

  if (!orderData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderData.orderId || orderData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentOrderId = orderData.orderId || orderData.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="success-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={42} />
          </div>

          <h2 className="success-title">Order Placed Successfully!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Thank you, <strong>{orderData.customerName || orderData.customer_name}</strong>! Your festive crackers order has been received and scheduled for packaging.
          </p>

          <div className="order-badge-container">
            <div className="order-badge-label">Your Unique Order Tracking ID</div>
            <div className="order-badge-id">{currentOrderId}</div>
            <button
              onClick={handleCopy}
              style={{
                background: 'var(--pure-white)',
                border: '1px solid var(--primary-red)',
                color: 'var(--primary-red)',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginTop: '0.35rem'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Order ID'}</span>
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            📱 You can track this order anytime using your mobile number <strong>{orderData.phone}</strong> or Order ID <strong>{currentOrderId}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Download / Print Bill Button */}
            {onOpenInvoice && (
              <button
                style={{
                  background: '#dcfce7',
                  border: '1.5px solid #86efac',
                  color: '#15803d',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  onOpenInvoice(orderData);
                }}
              >
                <FileText size={18} />
                <span>Download &amp; Print Bill / Invoice</span>
              </button>
            )}

            <button
              className="btn-submit-order"
              style={{ margin: 0 }}
              onClick={() => {
                onClose();
                onTrackOrder(currentOrderId);
              }}
            >
              <Truck size={18} />
              <span>Track My Delivery Now</span>
            </button>

            <button
              style={{
                background: 'none',
                border: '1.5px solid var(--border-light)',
                color: 'var(--text-main)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onClick={() => {
                onClose();
                onContinueShopping();
              }}
            >
              <ShoppingBag size={17} />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
