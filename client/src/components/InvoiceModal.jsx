import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, Phone, MapPin, Package, Calendar } from 'lucide-react';

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

  const generateFullInvoiceHtml = () => {
    const tableRows = items.map((item, idx) => {
      const itemMRP = Number(item.mrp) || Number(item.price) || 0;
      const itemRate = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      const subtotal = Number(item.subtotal) || (itemRate * qty);

      return `
        <tr>
          <td style="text-align:center; color:#6b7280;">${idx + 1}</td>
          <td style="font-family:monospace; font-weight:700; color:#b91c1c;">${item.product_code || item.code || '-'}</td>
          <td>
            <div style="font-weight:600; color:#111827;">${item.product_name || item.name}</div>
            ${item.is_combo === 1 ? '<span style="font-size:9px; background:#fee2e2; color:#991b1b; padding:1px 4px; border-radius:3px; font-weight:700;">🎁 COMBO BUNDLE</span>' : ''}
          </td>
          <td style="text-transform:uppercase; font-size:10px; color:#4b5563;">${item.content || '1 Box'}</td>
          <td style="text-align:right; text-decoration:${itemMRP > itemRate ? 'line-through' : 'none'}; color:#9ca3af;">₹${itemMRP.toFixed(0)}</td>
          <td style="text-align:right; font-weight:700; color:#111827;">₹${itemRate.toFixed(0)}</td>
          <td style="text-align:center; font-weight:700;">${qty}</td>
          <td style="text-align:right; font-weight:800; color:#b91c1c;">₹${subtotal.toFixed(0)}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill_${order.id}_DiwaliSpark</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
    }
    .invoice-card {
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      padding: 0;
    }
    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #b91c1c;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .inv-logo h1 {
      margin: 0 0 2px;
      color: #b91c1c;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.03em;
    }
    .inv-logo p {
      margin: 0;
      color: #4b5563;
      font-size: 9.5px;
      line-height: 1.3;
    }
    .inv-badge {
      text-align: right;
    }
    .inv-badge h2 {
      margin: 0 0 2px;
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.05em;
    }
    .inv-badge .id {
      font-family: monospace;
      font-weight: 800;
      color: #b91c1c;
      font-size: 13px;
    }
    .inv-badge .status-tag {
      display: inline-block;
      margin-top: 3px;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      background: #fee2e2;
      color: #991b1b;
    }
    .inv-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .inv-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 6px 10px;
    }
    .inv-box h3 {
      margin: 0 0 4px;
      font-size: 10px;
      text-transform: uppercase;
      color: #b91c1c;
      font-weight: 800;
      letter-spacing: 0.04em;
    }
    .inv-box p {
      margin: 0;
      font-size: 10px;
      line-height: 1.35;
      color: #374151;
    }
    table.inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10px;
    }
    table.inv-table th {
      background: #f3f4f6;
      color: #1f2937;
      padding: 5px 6px;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1.5px solid #d1d5db;
      font-weight: 800;
      text-align: left;
    }
    table.inv-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }
    .summary-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 4px;
    }
    .safety-notice {
      max-width: 380px;
      font-size: 9px;
      color: #6b7280;
      line-height: 1.35;
    }
    .summary-table {
      width: 250px;
      border-collapse: collapse;
      font-size: 10px;
    }
    .summary-table td {
      padding: 2px 6px;
    }
    .summary-table tr.total td {
      font-size: 13px;
      font-weight: 900;
      color: #b91c1c;
      border-top: 1.5px solid #b91c1c;
      padding-top: 4px;
    }
    .savings-row td {
      color: #15803d;
      font-weight: 700;
    }
    .inv-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }
    .inv-footer p {
      margin: 0;
      font-size: 9.5px;
    }
    .sign-box {
      text-align: center;
      width: 120px;
    }
    .sign-line {
      border-bottom: 1px solid #9ca3af;
      margin-bottom: 2px;
    }
    .sign-box span {
      font-size: 8.5px;
      color: #6b7280;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="inv-header">
      <div class="inv-logo">
        <div style="display:flex; align-items:center; gap:5px;">
          <span style="font-size:18px;">🪔</span>
          <h1>DINOSAUR CRACKERS FIREWORKS</h1>
        </div>
        <p>Direct Sivakasi Factory Fireworks • Certified CSIR-NEERI Green Crackers</p>
        <p>Hub: 4/128 Fireworks Road, Sivakasi - 626123, Tamil Nadu • Helpline: +91 98765 43210</p>
      </div>

      <div class="inv-badge">
        <h2>FESTIVE BILL / ESTIMATE</h2>
        <div class="id">#${order.id}</div>
        <div style="color:#6b7280; font-size:9px; margin-top:2px;">Date: ${orderDate}</div>
        <div class="status-tag">${order.status || 'Pending'}</div>
      </div>
    </div>

    <!-- Customer & Dispatch Grid -->
    <div class="inv-grid">
      <div class="inv-box">
        <h3>Billed &amp; Delivered To</h3>
        <p>
          <strong>${order.customer_name}</strong><br />
          📞 ${order.phone}${order.email ? ` • ✉️ ${order.email}` : ''}<br />
          📍 ${order.address}, ${order.city} - ${order.pincode}
        </p>
      </div>

      <div class="inv-box">
        <h3>Shipping &amp; Logistics</h3>
        <p>
          <strong>Dispatch Hub:</strong> Sivakasi Central Logistics Hub<br />
          <strong>Courier:</strong> ${order.courier_name || 'Festive Express Partner'}<br />
          <strong>AWB Tracking:</strong> ${order.tracking_number || 'Generated on dispatch'}<br />
          ${order.notes ? `<strong>Note:</strong> ${order.notes}` : ''}
        </p>
      </div>
    </div>

    <!-- Items Table -->
    <table class="inv-table">
      <thead>
        <tr>
          <th style="width:28px; text-align:center;">#</th>
          <th style="width:50px;">Code</th>
          <th>Item Description</th>
          <th style="width:70px;">Pack</th>
          <th style="width:65px; text-align:right;">MRP</th>
          <th style="width:65px; text-align:right;">Rate</th>
          <th style="width:40px; text-align:center;">Qty</th>
          <th style="width:75px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <!-- Summary & Notice -->
    <div class="summary-wrap">
      <div class="safety-notice">
        <strong style="color:#111;">Safety &amp; Compliance Notes:</strong><br />
        • Certified Green Crackers with low smoke and eco-friendly composition.<br />
        • Store in a cool, dry place away from children. Always light in open areas.<br />
        • Thank you for celebrating with Dinosaur Crackers Fireworks!
      </div>

      <table class="summary-table">
        <tbody>
          <tr>
            <td>Total Items:</td>
            <td style="text-align:right; font-weight:700;">${items.length} items (${totalQty} packs)</td>
          </tr>
          <tr>
            <td>Gross Total (MRP):</td>
            <td style="text-align:right;">₹${grossMRP.toFixed(0)}</td>
          </tr>
          ${totalSavings > 0 ? `
          <tr class="savings-row">
            <td>Factory Savings:</td>
            <td style="text-align:right;">−₹${totalSavings.toFixed(0)}</td>
          </tr>` : ''}
          <tr>
            <td>Delivery:</td>
            <td style="text-align:right; color:#15803d; font-weight:700;">FREE</td>
          </tr>
          <tr class="total">
            <td>Net Payable:</td>
            <td style="text-align:right;">₹${netTotal.toFixed(0)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="inv-footer">
      <div>
        <p style="font-weight:700; color:#b91c1c;">Happy &amp; Safe Diwali from DINOSAUR CRACKERS! 🪔✨</p>
        <p style="color:#9ca3af; font-size:8.5px;">Computer generated festive tax invoice / estimate.</p>
      </div>

      <div class="sign-box">
        <div class="sign-line"></div>
        <span>Authorized Signatory</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    // Create an isolated hidden iframe specifically for printing
    let iframe = document.getElementById('invoice-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'invoice-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const htmlContent = generateFullInvoiceHtml();
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Trigger printing once DOM is loaded in the iframe
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error, fallback to window.print', err);
        window.print();
      }
    }, 300);
  };

  const handleDownloadHtml = () => {
    const content = generateFullInvoiceHtml();
    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${order.id}.html`;
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
            <button className="btn-invoice-action" onClick={handlePrint} title="Print or Save as PDF (Single Page A4)">
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

        {/* Modal Visual Preview */}
        <div className="invoice-printable-area" ref={invoiceRef}>
          <div className="invoice-card" style={{ maxWidth: '760px', margin: '0 auto', background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            {/* Header */}
            <div className="inv-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #b91c1c', paddingBottom: '8px', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🪔</span>
                  <h1 style={{ margin: 0, color: '#b91c1c', fontSize: '1.15rem', fontWeight: 900 }}>DINOSAUR CRACKERS FIREWORKS</h1>
                </div>
                <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '0.75rem' }}>
                  Direct Sivakasi Factory Fireworks • Certified CSIR-NEERI Green Crackers
                </p>
                <p style={{ margin: '1px 0 0', color: '#6b7280', fontSize: '0.72rem' }}>
                  Factory Hub: 4/128 Fireworks Road, Sivakasi - 626123, Tamil Nadu • Helpline: +91 98765 43210
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>FESTIVE BILL / ESTIMATE</h2>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#b91c1c', fontSize: '0.95rem' }}>#{order.id}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Date: {orderDate}</div>
                <span style={{
                  display: 'inline-block',
                  marginTop: '2px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: order.status === 'Delivered' ? '#dcfce7' : '#fee2e2',
                  color: order.status === 'Delivered' ? '#15803d' : '#991b1b'
                }}>
                  {order.status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '12px' }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem 0.75rem' }}>
                <h3 style={{ margin: '0 0 3px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#b91c1c', fontWeight: 800 }}>Billed &amp; Delivered To</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: '#374151' }}>
                  <strong>{order.customer_name}</strong><br />
                  📞 {order.phone} {order.email && `• ✉️ ${order.email}`}<br />
                  📍 {order.address}, {order.city} - {order.pincode}
                </p>
              </div>

              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem 0.75rem' }}>
                <h3 style={{ margin: '0 0 3px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#b91c1c', fontWeight: 800 }}>Shipping &amp; Logistics</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: '#374151' }}>
                  <strong>Dispatch Hub:</strong> Sivakasi Central Logistics Hub<br />
                  <strong>Courier:</strong> {order.courier_name || 'Festive Express Partner'}<br />
                  <strong>AWB Tracking:</strong> {order.tracking_number || 'Generated on dispatch'}<br />
                  {order.notes && <span><strong>Note:</strong> {order.notes}</span>}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderTop: '1px solid #e5e7eb', borderBottom: '1.5px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ padding: '5px', width: '28px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '5px', width: '50px' }}>Code</th>
                  <th style={{ padding: '5px' }}>Item Description</th>
                  <th style={{ padding: '5px', width: '70px' }}>Pack</th>
                  <th style={{ padding: '5px', width: '65px', textAlign: 'right' }}>MRP</th>
                  <th style={{ padding: '5px', width: '65px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '5px', width: '40px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '5px', width: '75px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const itemMRP = Number(item.mrp) || Number(item.price) || 0;
                  const itemRate = Number(item.price) || 0;
                  const qty = Number(item.quantity) || 1;
                  const subtotal = Number(item.subtotal) || (itemRate * qty);

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '4px 5px', textAlign: 'center', color: '#9ca3af' }}>{idx + 1}</td>
                      <td style={{ padding: '4px 5px', fontFamily: 'monospace', fontWeight: 700, color: '#b91c1c' }}>
                        {item.product_code || item.code || '-'}
                      </td>
                      <td style={{ padding: '4px 5px' }}>
                        <div style={{ fontWeight: 600 }}>{item.product_name || item.name}</div>
                        {item.is_combo === 1 && (
                          <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                            🎁 COMBO BUNDLE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '4px 5px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                        {item.content || '1 Box'}
                      </td>
                      <td style={{ padding: '4px 5px', textAlign: 'right', textDecoration: itemMRP > itemRate ? 'line-through' : 'none', color: '#9ca3af' }}>
                        ₹{itemMRP.toFixed(0)}
                      </td>
                      <td style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 700 }}>
                        ₹{itemRate.toFixed(0)}
                      </td>
                      <td style={{ padding: '4px 5px', textAlign: 'center', fontWeight: 700 }}>
                        {qty}
                      </td>
                      <td style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>
                        ₹{subtotal.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary & Safety Notice */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ maxWidth: '380px', fontSize: '0.72rem', color: '#6b7280', lineHeight: '1.4' }}>
                <strong style={{ color: '#111' }}>Safety &amp; Compliance Notes:</strong><br />
                • Certified CSIR-NEERI Green Crackers with low smoke emissions.<br />
                • Store in a cool dry place away from children. Always light in open areas.<br />
                • Thank you for celebrating with Dinosaur Crackers Fireworks!
              </div>

              <table style={{ width: '240px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 4px' }}>Total Items:</td>
                    <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>{items.length} items ({totalQty} packs)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px' }}>Gross Total (MRP):</td>
                    <td style={{ padding: '2px 4px', textAlign: 'right' }}>₹{grossMRP.toFixed(0)}</td>
                  </tr>
                  {totalSavings > 0 && (
                    <tr style={{ color: '#15803d', fontWeight: 700 }}>
                      <td style={{ padding: '2px 4px' }}>Factory Savings:</td>
                      <td style={{ padding: '2px 4px', textAlign: 'right' }}>−₹{totalSavings.toFixed(0)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '2px 4px' }}>Doorstep Delivery:</td>
                    <td style={{ padding: '2px 4px', textAlign: 'right', color: '#15803d', fontWeight: 700 }}>FREE</td>
                  </tr>
                  <tr style={{ borderTop: '1.5px solid #b91c1c', fontWeight: 900, fontSize: '0.95rem', color: '#b91c1c' }}>
                    <td style={{ padding: '4px 4px' }}>Net Payable:</td>
                    <td style={{ padding: '4px 4px', textAlign: 'right' }}>₹{netTotal.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c' }}>
                  Happy &amp; Safe Diwali from DINOSAUR CRACKERS! 🪔✨
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.68rem', color: '#9ca3af' }}>
                  Computer generated festive tax invoice / estimate.
                </p>
              </div>

              <div style={{ textAlign: 'center', width: '110px' }}>
                <div style={{ borderBottom: '1px solid #9ca3af', marginBottom: '2px' }}></div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase' }}>
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
