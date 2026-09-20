import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, CheckCircle2, Phone, MapPin, Package, Calendar } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, order }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !order) return null;

  const items = order.items || [];
  const grossMRP = items.reduce((sum, item) => {
    const mrp = Number(item.mrp) || Number(item.price) || 0;
    return sum + (mrp * (Number(item.quantity) || 1));
  }, 0);

  const netTotal = Number(order.total_amount) || items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
  const totalSavings = grossMRP > netTotal ? grossMRP - netTotal : 0;
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!invoiceRef.current) return;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${order.id} - Diwali Spark Fireworks</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; background: #fff; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #d32f2f; padding-bottom: 16px; margin-bottom: 20px; }
    .inv-logo h1 { margin: 0 0 4px; color: #d32f2f; font-size: 24px; font-weight: 800; }
    .inv-logo p { margin: 0; color: #6b7280; font-size: 12px; }
    .inv-badge { text-align: right; }
    .inv-badge h2 { margin: 0 0 4px; font-size: 20px; color: #111; }
    .inv-badge .id { font-family: monospace; font-weight: 800; color: #d32f2f; font-size: 16px; }
    .inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .inv-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; }
    .inv-box h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #d32f2f; letter-spacing: 0.05em; }
    .inv-box p { margin: 0; font-size: 13px; line-height: 1.5; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { background: #f3f4f6; color: #374151; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; font-weight: 700; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-table { width: 320px; margin-left: auto; margin-bottom: 24px; font-size: 13px; }
    .summary-table td { padding: 6px 10px; }
    .summary-table tr.total { font-weight: 800; font-size: 16px; color: #d32f2f; border-top: 2px solid #d32f2f; }
    .savings-pill { color: #15803d; font-weight: 700; }
    .inv-footer { border-top: 1px dashed #d1d5db; padding-top: 16px; text-align: center; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 0; } .invoice-card { border: none; padding: 0; } }
  </style>
</head>
<body>
  ${invoiceRef.current.innerHTML}
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay invoice-modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Controls Bar */}
        <div className="invoice-action-bar no-print">
          <div className="invoice-action-title">
            <Sparkles size={18} style={{ color: '#D32F2F' }} />
            <span>Tax Invoice / Bill Preview (#{order.id})</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn-invoice-action" onClick={handlePrint} title="Print or Save as PDF">
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button className="btn-invoice-action btn-invoice-action--secondary" onClick={handleDownloadHtml} title="Download HTML Invoice">
              <Download size={15} />
              <span>Download HTML</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div className="invoice-printable-area" ref={invoiceRef}>
          <div className="invoice-card">
            {/* Header */}
            <div className="inv-header">
              <div className="inv-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>🪔</span>
                  <h1>DIWALI SPARK FIREWORKS</h1>
                </div>
                <p>Direct Sivakasi Factory Fireworks • Certified CSIR-NEERI Green Crackers</p>
                <p>Factory Hub: 4/128 Fireworks Road, Sivakasi - 626123, Tamil Nadu, India</p>
                <p>Helpline: +91 98765 43210 • Email: support@diwalispark.com</p>
              </div>

              <div className="inv-badge">
                <h2>FESTIVE BILL / ESTIMATE</h2>
                <div className="id">Order #{order.id}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                  Date: {orderDate}
                </div>
                <div style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: order.status === 'Delivered' ? '#dcfce7' : '#fee2e2',
                  color: order.status === 'Delivered' ? '#15803d' : '#b91c1c'
                }}>
                  {order.status || 'Pending'}
                </div>
              </div>
            </div>

            {/* Customer & Shipping Info Grid */}
            <div className="inv-grid">
              <div className="inv-box">
                <h3>Billed &amp; Delivered To</h3>
                <p>
                  <strong>{order.customer_name}</strong><br />
                  📞 {order.phone}<br />
                  {order.email && <>✉️ {order.email}<br /></>}
                  📍 {order.address}<br />
                  {order.city} - {order.pincode}
                </p>
              </div>

              <div className="inv-box">
                <h3>Dispatch &amp; Courier Details</h3>
                <p>
                  <strong>Dispatch Centre:</strong> Sivakasi Central Dispatch Hub<br />
                  <strong>Courier Partner:</strong> {order.courier_name || 'Festive Express Logistics'}<br />
                  <strong>AWB / Tracking No:</strong> {order.tracking_number || 'Will update upon dispatch'}<br />
                  {order.notes && <><strong>Delivery Note:</strong> {order.notes}</>}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }} className="text-center">#</th>
                  <th style={{ width: '60px' }}>Code</th>
                  <th>Cracker Item Description</th>
                  <th style={{ width: '80px' }}>Pack Size</th>
                  <th className="text-right" style={{ width: '80px' }}>MRP (₹)</th>
                  <th className="text-right" style={{ width: '80px' }}>Rate (₹)</th>
                  <th className="text-center" style={{ width: '50px' }}>Qty</th>
                  <th className="text-right" style={{ width: '90px' }}>Subtotal (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center" style={{ padding: '2rem', color: '#6b7280' }}>
                      No items recorded in order.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const itemMRP = Number(item.mrp) || Number(item.price) || 0;
                    const itemRate = Number(item.price) || 0;
                    const qty = Number(item.quantity) || 1;
                    const subtotal = Number(item.subtotal) || (itemRate * qty);

                    return (
                      <tr key={idx}>
                        <td className="text-center" style={{ color: '#9ca3af' }}>{idx + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#D32F2F' }}>
                          {item.product_code || item.code || '-'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product_name || item.name}</div>
                          {item.is_combo === 1 && (
                            <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700 }}>
                              🎁 FESTIVE COMBO BUNDLE
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>
                          {item.content || '1 Box'}
                        </td>
                        <td className="text-right" style={{ textDecoration: itemMRP > itemRate ? 'line-through' : 'none', color: '#9ca3af' }}>
                          ₹{itemMRP.toFixed(0)}
                        </td>
                        <td className="text-right" style={{ fontWeight: 700, color: '#111' }}>
                          ₹{itemRate.toFixed(0)}
                        </td>
                        <td className="text-center" style={{ fontWeight: 700 }}>
                          {qty}
                        </td>
                        <td className="text-right" style={{ fontWeight: 800, color: '#D32F2F' }}>
                          ₹{subtotal.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Summary Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ maxWidth: '380px', fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.5' }}>
                <p style={{ fontWeight: 700, color: '#111', marginBottom: '4px' }}>Safety &amp; Delivery Instructions:</p>
                <p>
                  • CSIR-NEERI Certified Green Crackers with low emissions.<br />
                  • Store fireworks in a dry, cool area away from open flames.<br />
                  • Always ignite fireworks under adult supervision in open grounds.
                </p>
              </div>

              <table className="summary-table">
                <tbody>
                  <tr>
                    <td>Total Products &amp; Packs:</td>
                    <td className="text-right"><strong>{items.length} items ({totalQty} packs)</strong></td>
                  </tr>
                  <tr>
                    <td>Gross Value (MRP):</td>
                    <td className="text-right">₹{grossMRP.toFixed(0)}</td>
                  </tr>
                  {totalSavings > 0 && (
                    <tr>
                      <td className="savings-pill">Festive Factory Discount:</td>
                      <td className="text-right savings-pill">−₹{totalSavings.toFixed(0)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Doorstep Delivery:</td>
                    <td className="text-right" style={{ color: '#15803d', fontWeight: 700 }}>FREE</td>
                  </tr>
                  <tr className="total">
                    <td>Net Payable Amount:</td>
                    <td className="text-right">₹{netTotal.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Authorized Signatory & Festive greeting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#D32F2F' }}>
                  Happy &amp; Safe Diwali from DIWALI SPARK! 🪔✨
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
                  This is a computer generated festive tax invoice / delivery estimate.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '130px', borderBottom: '1px solid #9ca3af', marginBottom: '4px' }}></div>
                <span style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Authorized Signatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
