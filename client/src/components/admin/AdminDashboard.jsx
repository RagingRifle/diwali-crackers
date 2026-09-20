import React, { useState, useEffect } from 'react';
import {
  Package, ShoppingCart, DollarSign, Clock, CheckCircle2,
  Truck, Plus, Edit2, Trash2, Search, Filter, Eye, X,
  Save, RefreshCw, LogOut, Sparkles, AlertTriangle, FileText,
  Percent, Layers, Minus
} from 'lucide-react';
import InvoiceModal from '../InvoiceModal';

const ORDER_STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Packed',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const CATEGORIES = [
  'Sparklers',
  'Flowerpots',
  'Ground Chakkars',
  'Sound Crackers',
  'Bombs',
  'Fancy Fountains',
  'Aerial Shots',
  'Sky Shots',
  'Garland Crackers',
  'Rockets',
  'Novelty Items',
  'Fancy Novelties',
  'Combo Bundles',
  'Miscellaneous'
];

export default function AdminDashboard({ adminUser, onLogout, onProductChange }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'combos'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [productModal, setProductModal] = useState({ open: false, isEdit: false, data: null });
  const [comboModal, setComboModal] = useState({ open: false, isEdit: false, data: null });
  const [discountModal, setDiscountModal] = useState({ open: false, product: null, discount_percent: 0, price: 0 });

  // Bulk Discount Bar
  const [bulkCategory, setBulkCategory] = useState('All');
  const [bulkDiscountVal, setBulkDiscountVal] = useState(80);
  const [bulkApplying, setBulkApplying] = useState(false);

  // Tracking modal inputs
  const [trackingForm, setTrackingForm] = useState({
    status: 'Packed',
    courier_name: '',
    tracking_number: '',
    note: ''
  });

  // Product form inputs
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    category: 'Sparklers',
    price: '',
    mrp: '',
    discount_percent: 80,
    pack_size: '1 Box',
    image: '',
    description: '',
    featured: 0
  });

  // Combo Builder Form
  const [comboForm, setComboForm] = useState({
    code: '',
    name: '',
    content: '5 Items Hamper',
    description: '',
    image: '',
    discount_percent: 85,
    price: '',
    mrp: '',
    featured: 1,
    items: [] // array of { id, code, name, content, mrp, price, quantity }
  });

  // Selected item to add in combo builder
  const [selectedAddId, setSelectedAddId] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('diwali_admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', { headers: getAuthHeader() });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Stats error', e);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/api/orders?status=${encodeURIComponent(orderStatusFilter)}`;
      if (orderSearch.trim()) {
        url += `&search=${encodeURIComponent(orderSearch.trim())}`;
      }
      const res = await fetch(url, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Orders error', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      let url = '/api/products';
      const params = [];
      if (productSearch.trim()) {
        params.push(`search=${encodeURIComponent(productSearch.trim())}`);
      }
      if (productCategoryFilter !== 'All') {
        params.push(`category=${encodeURIComponent(productCategoryFilter)}`);
      }
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error('Products error', e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOrders();
    fetchProducts();
  }, [orderStatusFilter, orderSearch, productSearch, productCategoryFilter]);

  // Update Status Quick
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        fetchStats();
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  // Save Detailed Tracking & Courier Info
  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    try {
      const res = await fetch(`/api/orders/${trackingModalOrder.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(trackingForm)
      });
      const data = await res.json();
      if (data.success) {
        setTrackingModalOrder(null);
        fetchOrders();
        fetchStats();
      } else {
        alert(data.error || 'Failed to update tracking');
      }
    } catch (e) {
      alert('Error updating tracking');
    }
  };

  const openTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setTrackingForm({
      status: order.status,
      courier_name: order.courier_name || '',
      tracking_number: order.tracking_number || '',
      note: ''
    });
  };

  // Save / Edit Regular Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const isEdit = productModal.isEdit;
      const url = isEdit ? `/api/products/${productModal.data.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const mrpNum = Number(productForm.mrp) || Number(productForm.price);
      const priceNum = Number(productForm.price);
      const discNum = mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

      const res = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify({
          ...productForm,
          price: priceNum,
          mrp: mrpNum,
          discount_percent: discNum,
          featured: productForm.featured ? 1 : 0
        })
      });

      const data = await res.json();
      if (data.success) {
        setProductModal({ open: false, isEdit: false, data: null });
        fetchProducts();
        fetchStats();
        if (onProductChange) onProductChange();
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (e) {
      alert('Error saving product');
    }
  };

  // Toggle Product Stock
  const handleToggleStock = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}/toggle-stock`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        if (onProductChange) onProductChange();
      }
    } catch (e) {
      alert('Failed to toggle stock');
    }
  };

  // Delete Product or Combo
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        fetchStats();
        if (onProductChange) onProductChange();
      }
    } catch (e) {
      alert('Failed to delete product');
    }
  };

  // Open Edit Regular Product Modal
  const openEditProduct = (prod) => {
    setProductForm({
      code: prod.code || '',
      name: prod.name,
      category: prod.category,
      price: prod.price,
      mrp: prod.mrp,
      discount_percent: prod.discount_percent || 0,
      pack_size: prod.pack_size || prod.content || '1 Box',
      image: prod.image,
      description: prod.description || '',
      featured: prod.featured || 0
    });
    setProductModal({ open: true, isEdit: true, data: prod });
  };

  // Open New Regular Product Modal
  const openNewProduct = () => {
    setProductForm({
      code: '',
      name: '',
      category: 'Sparklers',
      price: '',
      mrp: '',
      discount_percent: 80,
      pack_size: '1 Box',
      image: '',
      description: '',
      featured: 0
    });
    setProductModal({ open: true, isEdit: false, data: null });
  };

  // ─── COMBO BUILDER LOGIC ────────────────────────────────────────────────────
  const regularProducts = products.filter(p => p.is_combo !== 1);
  const comboProducts = products.filter(p => p.is_combo === 1 || p.category === 'Combo Bundles');

  const openNewCombo = () => {
    const nextCode = `CB-${101 + comboProducts.length}`;
    setComboForm({
      code: nextCode,
      name: '',
      content: '5 Items Hamper',
      description: '',
      image: '',
      discount_percent: 85,
      price: '',
      mrp: 0,
      featured: 1,
      items: []
    });
    setSelectedAddId('');
    setComboModal({ open: true, isEdit: false, data: null });
  };

  const openEditCombo = (combo) => {
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(combo.combo_items || '[]');
    } catch (e) {
      parsedItems = [];
    }

    setComboForm({
      code: combo.code || '',
      name: combo.name,
      content: combo.content || combo.pack_size || `${parsedItems.length} Items Hamper`,
      description: combo.description || '',
      image: combo.image || '',
      discount_percent: combo.discount_percent || 85,
      price: combo.price,
      mrp: combo.mrp,
      featured: combo.featured || 0,
      items: parsedItems
    });
    setSelectedAddId('');
    setComboModal({ open: true, isEdit: true, data: combo });
  };

  const handleAddCrackerToCombo = () => {
    if (!selectedAddId) return;
    const prod = products.find(p => String(p.id) === String(selectedAddId));
    if (!prod) return;

    setComboForm(prev => {
      const existing = prev.items.find(i => String(i.id) === String(prod.id));
      let newItems = [];
      if (existing) {
        newItems = prev.items.map(i =>
          String(i.id) === String(prod.id) ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [
          ...prev.items,
          {
            id: prod.id,
            code: prod.code,
            name: prod.name,
            content: prod.content || prod.pack_size || '1 Box',
            mrp: prod.mrp,
            price: prod.price,
            quantity: 1
          }
        ];
      }

      // Recalculate combo MRP & price
      const totalMrp = newItems.reduce((s, i) => s + ((i.mrp || i.price) * i.quantity), 0);
      const disc = prev.discount_percent || 85;
      const calcPrice = Math.max(1, Math.round(totalMrp * (1 - disc / 100)));

      return {
        ...prev,
        items: newItems,
        mrp: totalMrp,
        price: calcPrice,
        content: `${newItems.reduce((s, i) => s + i.quantity, 0)} Items Hamper`
      };
    });

    setSelectedAddId('');
  };

  const handleUpdateComboItemQty = (id, newQty) => {
    setComboForm(prev => {
      let newItems = [];
      if (newQty <= 0) {
        newItems = prev.items.filter(i => String(i.id) !== String(id));
      } else {
        newItems = prev.items.map(i => String(i.id) === String(id) ? { ...i, quantity: newQty } : i);
      }

      const totalMrp = newItems.reduce((s, i) => s + ((i.mrp || i.price) * i.quantity), 0);
      const disc = prev.discount_percent || 85;
      const calcPrice = Math.max(1, Math.round(totalMrp * (1 - disc / 100)));

      return {
        ...prev,
        items: newItems,
        mrp: totalMrp,
        price: calcPrice,
        content: `${newItems.reduce((s, i) => s + i.quantity, 0)} Items Hamper`
      };
    });
  };

  const handleComboDiscountChange = (newDisc) => {
    const disc = Math.max(0, Math.min(99, Number(newDisc) || 0));
    setComboForm(prev => {
      const calcPrice = Math.max(1, Math.round(prev.mrp * (1 - disc / 100)));
      return {
        ...prev,
        discount_percent: disc,
        price: calcPrice
      };
    });
  };

  const handleComboPriceChange = (newPrice) => {
    const price = Math.max(1, Number(newPrice) || 1);
    setComboForm(prev => {
      const disc = prev.mrp > price ? Math.round(((prev.mrp - price) / prev.mrp) * 100) : 0;
      return {
        ...prev,
        price,
        discount_percent: disc
      };
    });
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (comboForm.items.length === 0) {
      alert('Please add at least one cracker item into this combo bundle!');
      return;
    }

    try {
      const isEdit = comboModal.isEdit;
      const url = isEdit ? `/api/products/${comboModal.data.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        code: comboForm.code || `CB-${100 + Math.floor(Math.random() * 900)}`,
        name: comboForm.name,
        category: 'Combo Bundles',
        content: comboForm.content,
        pack_size: comboForm.content,
        mrp: Number(comboForm.mrp),
        price: Number(comboForm.price),
        discount_percent: Number(comboForm.discount_percent),
        image: comboForm.image,
        description: comboForm.description || `Special Festive Combo Hamper featuring ${comboForm.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
        is_combo: 1,
        featured: comboForm.featured ? 1 : 0,
        combo_items: comboForm.items
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setComboModal({ open: false, isEdit: false, data: null });
        fetchProducts();
        if (onProductChange) onProductChange();
      } else {
        alert(data.error || 'Failed to save combo bundle');
      }
    } catch (e) {
      alert('Error saving combo bundle');
    }
  };

  // ─── MANUAL DISCOUNT ADJUSTER (FOR PRODUCTS & COMBOS) ───────────────────────
  const openDiscountModal = (product) => {
    const disc = product.discount_percent || (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);
    setDiscountModal({
      open: true,
      product,
      discount_percent: disc,
      price: product.price
    });
  };

  const handleQuickDiscountSave = async (e) => {
    e.preventDefault();
    if (!discountModal.product) return;

    try {
      const res = await fetch(`/api/products/${discountModal.product.id}/discount`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({
          discount_percent: discountModal.discount_percent,
          price: discountModal.price
        })
      });

      const data = await res.json();
      if (data.success) {
        setDiscountModal({ open: false, product: null, discount_percent: 0, price: 0 });
        fetchProducts();
        if (onProductChange) onProductChange();
      } else {
        alert(data.error || 'Failed to update discount');
      }
    } catch (e) {
      alert('Error saving discount');
    }
  };

  // Bulk Discount Apply
  const handleBulkDiscountApply = async () => {
    if (!window.confirm(`Apply ${bulkDiscountVal}% discount to all ${bulkCategory === 'All' ? 'products' : bulkCategory}?`)) return;

    try {
      setBulkApplying(true);
      const res = await fetch('/api/products/bulk-discount', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          category: bulkCategory,
          discount_percent: Number(bulkDiscountVal),
          is_combo: bulkCategory === 'Combo Bundles' ? 1 : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Successfully updated discounts for ${data.updatedCount} products to ${data.discountApplied}%!`);
        fetchProducts();
        if (onProductChange) onProductChange();
      } else {
        alert(data.error || 'Failed to apply bulk discount');
      }
    } catch (e) {
      alert('Error applying bulk discount');
    } finally {
      setBulkApplying(false);
    }
  };

  return (
    <div className="admin-container">
      {/* Top Header Bar */}
      <div className="admin-header">
        <div>
          <h2>🪔 Diwali Store Admin Panel</h2>
          <p>
            Logged in as <strong>{adminUser?.username || 'admin'}</strong> • Real-Time Orders, Bundles &amp; Discount Management
          </p>
        </div>

        <div className="admin-actions">
          <button
            className={`btn-admin-nav ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={16} />
            <span>Orders &amp; Bills ({stats ? stats.totalOrders : 0})</span>
          </button>

          <button
            className={`btn-admin-nav ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={16} />
            <span>Crackers Catalog ({regularProducts.length})</span>
          </button>

          <button
            className={`btn-admin-nav ${activeTab === 'combos' ? 'active' : ''}`}
            onClick={() => setActiveTab('combos')}
            style={{ background: activeTab === 'combos' ? 'var(--primary-red)' : '#fef3c7', color: activeTab === 'combos' ? '#fff' : '#92400e' }}
          >
            <Layers size={16} />
            <span>Cook Up Combos 🎁 ({comboProducts.length})</span>
          </button>

          <button className="btn-admin-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><DollarSign size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><ShoppingCart size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders}</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeftColor: '#F59E0B' }}>
            <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Clock size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Pending Dispatch</div>
              <div className="stat-value">{stats.pendingOrders}</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeftColor: '#8B5CF6' }}>
            <div className="stat-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}><Truck size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">In Transit / Packed</div>
              <div className="stat-value">{stats.inTransitOrders}</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeftColor: '#10B981' }}>
            <div className="stat-icon" style={{ background: '#D1FAE5', color: '#059669' }}><CheckCircle2 size={24} /></div>
            <div className="stat-info">
              <div className="stat-label">Delivered Orders</div>
              <div className="stat-value">{stats.deliveredOrders}</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: ORDERS & INVOICE BILLS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="admin-table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3>Customer Orders &amp; Downloadable Bills</h3>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {['All', ...ORDER_STATUS_OPTIONS].map(status => (
                  <button
                    key={status}
                    className={`category-pill ${orderStatusFilter === status ? 'active' : ''}`}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                    onClick={() => setOrderStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="search-box" style={{ minWidth: '240px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search ID, phone, name, city..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Info</th>
                  <th>Delivery Address</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status &amp; Courier</th>
                  <th>Actions &amp; Bill</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No orders found matching this filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    return (
                      <tr key={order.id}>
                        <td>
                          <strong style={{ color: 'var(--primary-red)', fontFamily: 'monospace' }}>
                            {order.id}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📞 {order.phone}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', maxWidth: '200px', lineHeight: '1.3' }}>
                            {order.address}, {order.city} - {order.pincode}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {order.items ? order.items.length : 0} items
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {order.items && order.items.slice(0, 2).map(i => i.product_name).join(', ')}
                            {order.items && order.items.length > 2 && '...'}
                          </div>
                        </td>

                        <td>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--primary-red)' }}>
                            ₹{order.total_amount}
                          </strong>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <select
                              className="status-select"
                              value={order.status}
                              onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                            >
                              {ORDER_STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>

                            {order.courier_name && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                🚚 {order.courier_name} {order.tracking_number ? `(${order.tracking_number})` : ''}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn-action"
                              style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
                              title="Generate & Download Tax Invoice / Bill"
                              onClick={() => setInvoiceOrder(order)}
                            >
                              <FileText size={14} />
                              <span>Bill</span>
                            </button>
                            <button
                              className="btn-action"
                              title="Update Courier & Tracking Note"
                              onClick={() => openTrackingModal(order)}
                            >
                              <Truck size={14} />
                            </button>
                            <button
                              className="btn-action"
                              title="View Full Details"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: CRACKERS CATALOG (WITH MANUAL DISCOUNT CONTROLS)
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <div className="admin-table-card">
          <div className="table-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3>Crackers Catalog &amp; Manual Discount Rates</h3>
                <button
                  className="cart-btn"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                  onClick={openNewProduct}
                >
                  <Plus size={16} />
                  <span>Add New Cracker</span>
                </button>
              </div>

              <div className="search-box" style={{ minWidth: '240px' }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search crackers by code or name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Bulk Discount Banner */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                <Percent size={18} />
                <span>Quick Bulk Discount Manager:</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={bulkDiscountVal}
                    onChange={(e) => setBulkDiscountVal(e.target.value)}
                    style={{ width: '60px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', textAlign: 'center', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>% OFF</span>
                </div>

                <button
                  className="btn-action"
                  style={{ background: 'var(--primary-red)', color: '#fff', borderColor: 'var(--primary-red)', fontWeight: 700 }}
                  onClick={handleBulkDiscountApply}
                  disabled={bulkApplying}
                >
                  {bulkApplying ? 'Applying...' : 'Apply Discount'}
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Code</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>MRP (₹)</th>
                  <th>Discount</th>
                  <th>Selling Price (₹)</th>
                  <th>Pack Size</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regularProducts.map((prod) => {
                  const disc = prod.discount_percent || (prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0);

                  return (
                    <tr key={prod.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary-red)' }}>
                        {prod.code || '-'}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={prod.code ? `/products/${prod.code}.jpg` : prod.image}
                            alt={prod.name}
                            style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700 }}>{prod.name}</div>
                            {prod.featured === 1 && (
                              <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 800 }}>
                                ★ FEATURED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-pill" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                          {prod.category}
                        </span>
                      </td>

                      <td style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{prod.mrp}
                      </td>

                      <td>
                        <button
                          className="btn-action"
                          style={{ background: '#e8f5e9', color: '#2e7d32', borderColor: '#a5d6a7', fontWeight: 800 }}
                          title="Click to edit discount percentage manually"
                          onClick={() => openDiscountModal(prod)}
                        >
                          <Percent size={12} />
                          <span>{disc}% OFF</span>
                        </button>
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--primary-red)', fontSize: '1rem' }}>
                          ₹{prod.price}
                        </div>
                      </td>

                      <td style={{ fontSize: '0.85rem' }}>
                        {prod.pack_size || prod.content || '1 Box'}
                      </td>

                      <td>
                        <button
                          onClick={() => handleToggleStock(prod.id)}
                          className={`status-pill ${prod.in_stock ? 'delivered' : 'cancelled'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle stock status"
                        >
                          {prod.in_stock ? '● In Stock' : '● Sold Out'}
                        </button>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className="btn-action"
                            onClick={() => openEditProduct(prod)}
                            title="Edit Cracker"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-action danger"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            title="Delete Cracker"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: COOK UP COMBO BUNDLES 🎁
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'combos' && (
        <div className="admin-table-card">
          <div className="table-toolbar">
            <div>
              <h3>🎁 Cook Up Combo Bundles</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Assemble custom festive hampers from your 137 crackers with dedicated bundle pricing and combo discounts.
              </p>
            </div>

            <button
              className="cart-btn"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem', background: '#b91c1c' }}
              onClick={openNewCombo}
            >
              <Plus size={16} />
              <span>+ Cook Up New Combo</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Code</th>
                  <th>Combo Bundle Name</th>
                  <th>Included Cracker Products</th>
                  <th>Total MRP</th>
                  <th>Combo Discount</th>
                  <th>Bundle Sale Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comboProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No combo bundles created yet. Click "+ Cook Up New Combo" above to create your first package!
                    </td>
                  </tr>
                ) : (
                  comboProducts.map((combo) => {
                    let items = [];
                    try { items = JSON.parse(combo.combo_items || '[]'); } catch (e) {}

                    return (
                      <tr key={combo.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary-red)' }}>
                          {combo.code || '-'}
                        </td>

                        <td>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{combo.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {combo.content || `${items.length} Items Hamper`}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {items.map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
                                <span>• {it.quantity}x {it.name}</span>
                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>₹{it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          ₹{combo.mrp}
                        </td>

                        <td>
                          <button
                            className="btn-action"
                            style={{ background: '#e8f5e9', color: '#2e7d32', borderColor: '#a5d6a7', fontWeight: 800 }}
                            title="Edit combo discount manually"
                            onClick={() => openDiscountModal(combo)}
                          >
                            <Percent size={12} />
                            <span>{combo.discount_percent || 85}% OFF</span>
                          </button>
                        </td>

                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--primary-red)', fontSize: '1.1rem' }}>
                            ₹{combo.price}
                          </div>
                        </td>

                        <td>
                          <button
                            onClick={() => handleToggleStock(combo.id)}
                            className={`status-pill ${combo.in_stock ? 'delivered' : 'cancelled'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {combo.in_stock ? '● In Stock' : '● Sold Out'}
                          </button>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              className="btn-action"
                              onClick={() => openEditCombo(combo)}
                              title="Edit Combo Pack"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn-action danger"
                              onClick={() => handleDeleteProduct(combo.id, combo.name)}
                              title="Delete Combo Pack"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: COMBO BUILDER
      ═══════════════════════════════════════════════════════════════ */}
      {comboModal.open && (
        <div className="modal-overlay" onClick={() => setComboModal({ open: false, isEdit: false, data: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>
                <Layers size={20} />
                <span>{comboModal.isEdit ? 'Edit Combo Bundle' : 'Cook Up New Festive Combo Bundle'}</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setComboModal({ open: false, isEdit: false, data: null })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSaveCombo}>
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label>Combo Bundle Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Diwali Mega Family Dhamaka Pack"
                      value={comboForm.name}
                      onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Bundle Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CB-104"
                      value={comboForm.code}
                      onChange={(e) => setComboForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Bundle Tagline / Pack Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 7 Varieties (15 Boxes Total) Hamper"
                    value={comboForm.content}
                    onChange={(e) => setComboForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                {/* Cracker Selector / Ingredient Adder */}
                <div style={{ marginTop: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-red)', marginBottom: '0.5rem' }}>
                    Select &amp; Add Existing Crackers To This Combo
                  </h4>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-control"
                      value={selectedAddId}
                      onChange={(e) => setSelectedAddId(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Choose a cracker from catalog --</option>
                      {regularProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name} (MRP: ₹{p.mrp} | Standard: ₹{p.price})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="btn-action"
                      style={{ background: 'var(--primary-red)', color: '#fff', borderColor: 'var(--primary-red)', fontWeight: 700 }}
                      onClick={handleAddCrackerToCombo}
                    >
                      <Plus size={16} />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div style={{ marginTop: '0.75rem' }}>
                    {comboForm.items.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '0.5rem 0' }}>
                        No items added yet. Select products above to assemble the bundle.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {comboForm.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '0.4rem 0.65rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div>
                              <strong>[{item.code}] {item.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                (MRP: ₹{item.mrp} × {item.quantity} = ₹{item.mrp * item.quantity})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="sel-stepper-btn"
                                onClick={() => handleUpdateComboItemQty(item.id, item.quantity - 1)}
                              >−</button>
                              <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                              <button
                                type="button"
                                className="sel-stepper-btn"
                                onClick={() => handleUpdateComboItemQty(item.id, item.quantity + 1)}
                              >+</button>
                              <button
                                type="button"
                                className="sel-remove-btn"
                                onClick={() => handleUpdateComboItemQty(item.id, 0)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto Calculated Pricing & Manual Discount */}
                <div style={{
                  marginTop: '1rem',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700 }}>Total Combined MRP</label>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e' }}>
                      ₹{comboForm.mrp || 0}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700 }}>Combo Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      className="form-control"
                      value={comboForm.discount_percent}
                      onChange={(e) => handleComboDiscountChange(e.target.value)}
                      style={{ fontWeight: 800, textAlign: 'center', background: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--primary-red)', fontWeight: 700 }}>Bundle Sale Price (₹)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={comboForm.price}
                      onChange={(e) => handleComboPriceChange(e.target.value)}
                      style={{ fontWeight: 800, color: 'var(--primary-red)', fontSize: '1.1rem', background: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="combo-featured"
                    checked={comboForm.featured === 1}
                    onChange={(e) => setComboForm(prev => ({ ...prev, featured: e.target.checked ? 1 : 0 }))}
                  />
                  <label htmlFor="combo-featured" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Feature this combo bundle prominently on homepage
                  </label>
                </div>

                <button type="submit" className="btn-submit-order" style={{ marginTop: '1.25rem' }}>
                  <Save size={18} />
                  <span>{comboModal.isEdit ? 'Update Combo Bundle' : 'Save & Publish Combo Bundle'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: MANUAL DISCOUNT ADJUSTER (FOR INDIVIDUAL PRODUCT/COMBO)
      ═══════════════════════════════════════════════════════════════ */}
      {discountModal.open && discountModal.product && (
        <div className="modal-overlay" onClick={() => setDiscountModal({ open: false, product: null, discount_percent: 0, price: 0 })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>
                <Percent size={20} />
                <span>Adjust Discount &amp; Price</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setDiscountModal({ open: false, product: null, discount_percent: 0, price: 0 })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleQuickDiscountSave}>
                <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h4 style={{ margin: 0 }}>{discountModal.product.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0 0' }}>
                    Code: <strong>{discountModal.product.code}</strong> • MRP: <strong>₹{discountModal.product.mrp}</strong>
                  </p>
                </div>

                <div className="form-group">
                  <label>Manual Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    className="form-control"
                    required
                    value={discountModal.discount_percent}
                    onChange={(e) => {
                      const disc = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                      const newPrice = Math.max(1, Math.round(discountModal.product.mrp * (1 - disc / 100)));
                      setDiscountModal(prev => ({
                        ...prev,
                        discount_percent: disc,
                        price: newPrice
                      }));
                    }}
                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Calculated Selling Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    required
                    value={discountModal.price}
                    onChange={(e) => {
                      const p = Math.max(1, Number(e.target.value) || 1);
                      const disc = discountModal.product.mrp > p
                        ? Math.round(((discountModal.product.mrp - p) / discountModal.product.mrp) * 100)
                        : 0;
                      setDiscountModal(prev => ({
                        ...prev,
                        price: p,
                        discount_percent: disc
                      }));
                    }}
                    style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-red)' }}
                  />
                </div>

                <button type="submit" className="btn-submit-order" style={{ marginTop: '1.25rem' }}>
                  <Save size={18} />
                  <span>Update Discount Rate</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Order Details Viewer */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Package size={20} />
                <span>Order #{selectedOrder.id} Details</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                <h4 style={{ color: 'var(--primary-red)', marginBottom: '0.35rem' }}>Customer Information</h4>
                <p style={{ fontSize: '0.9rem' }}>
                  <strong>Name:</strong> {selectedOrder.customer_name}<br />
                  <strong>Phone:</strong> {selectedOrder.phone}<br />
                  <strong>Email:</strong> {selectedOrder.email || 'None'}<br />
                  <strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pincode}
                </p>
                {selectedOrder.notes && (
                  <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Special Instructions:</strong> {selectedOrder.notes}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: 'var(--primary-red)', marginBottom: '0.5rem' }}>Package Items</h4>
                <table style={{ width: '100%', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                      <th style={{ padding: '4px 0' }}>Item</th>
                      <th style={{ padding: '4px 0' }}>Rate</th>
                      <th style={{ padding: '4px 0' }}>Qty</th>
                      <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((i, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed var(--border-light)' }}>
                        <td style={{ padding: '6px 0' }}>
                          <strong>{i.product_name}</strong>
                          {i.product_code && <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '4px' }}>[{i.product_code}]</span>}
                        </td>
                        <td style={{ padding: '6px 0' }}>₹{i.price}</td>
                        <td style={{ padding: '6px 0' }}>x {i.quantity}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700 }}>₹{i.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-red)' }}>
                  Total: ₹{selectedOrder.total_amount}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  className="btn-action"
                  style={{ flex: 1, padding: '0.65rem', background: '#dcfce7', color: '#15803d', borderColor: '#86efac', fontWeight: 700, fontSize: '0.9rem' }}
                  onClick={() => {
                    setInvoiceOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <FileText size={16} />
                  <span>Download / Print Bill</span>
                </button>

                <button
                  className="btn-submit-order"
                  style={{ flex: 1, margin: 0 }}
                  onClick={() => {
                    openTrackingModal(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <Truck size={16} />
                  <span>Update Courier Info</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Update Tracking & Status */}
      {trackingModalOrder && (
        <div className="modal-overlay" onClick={() => setTrackingModalOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <Truck size={20} />
                <span>Update Delivery Tracking (#{trackingModalOrder.id})</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setTrackingModalOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveTracking}>
                <div className="form-group">
                  <label>Order Status</label>
                  <select
                    className="form-control"
                    value={trackingForm.status}
                    onChange={(e) => setTrackingForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    {ORDER_STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Courier Partner Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. DTDC, Blue Dart, Express Logistics"
                    value={trackingForm.courier_name}
                    onChange={(e) => setTrackingForm(prev => ({ ...prev, courier_name: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Courier Tracking Number / AWB</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. DTDC98451234IN"
                    value={trackingForm.tracking_number}
                    onChange={(e) => setTrackingForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Timeline Status Note (Visible to Customer)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Package dispatched from Sivakasi hub, expected delivery in 2 days."
                    value={trackingForm.note}
                    onChange={(e) => setTrackingForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>

                <button type="submit" className="btn-submit-order" style={{ marginTop: '1.25rem' }}>
                  <Save size={18} />
                  <span>Save Status &amp; Tracking</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Product Add / Edit */}
      {productModal.open && (
        <div className="modal-overlay" onClick={() => setProductModal({ open: false, isEdit: false, data: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Sparkles size={20} />
                <span>{productModal.isEdit ? 'Edit Cracker Product' : 'Add New Cracker To Catalog'}</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setProductModal({ open: false, isEdit: false, data: null })}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveProduct}>
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label>Product Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 5, 23, 301"
                      value={productForm.code}
                      onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cracker Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. 15cm Green Crackling Sparklers"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-grid two-col" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Pack Size / Content</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 10 Sticks / Box"
                      value={productForm.pack_size}
                      onChange={(e) => setProductForm(prev => ({ ...prev, pack_size: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-grid two-col" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>MRP / Strikethrough (₹) <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="1"
                      placeholder="e.g. 290"
                      value={productForm.mrp}
                      onChange={(e) => {
                        const m = Number(e.target.value) || 0;
                        const d = Number(productForm.discount_percent) || 0;
                        const p = m > 0 && d > 0 ? Math.round(m * (1 - d / 100)) : productForm.price;
                        setProductForm(prev => ({ ...prev, mrp: e.target.value, price: p }));
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Manual Discount (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="99"
                      value={productForm.discount_percent}
                      onChange={(e) => {
                        const d = Number(e.target.value) || 0;
                        const m = Number(productForm.mrp) || 0;
                        const p = m > 0 ? Math.round(m * (1 - d / 100)) : productForm.price;
                        setProductForm(prev => ({ ...prev, discount_percent: e.target.value, price: p }));
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Wholesale Sale Price (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min="1"
                    placeholder="e.g. 45"
                    value={productForm.price}
                    onChange={(e) => {
                      const p = Number(e.target.value) || 0;
                      const m = Number(productForm.mrp) || 0;
                      const d = m > p ? Math.round(((m - p) / m) * 100) : 0;
                      setProductForm(prev => ({ ...prev, price: e.target.value, discount_percent: d }));
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. /products/5.jpg or URL"
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Safe sparklers with golden shower effect..."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={productForm.featured === 1}
                    onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked ? 1 : 0 }))}
                  />
                  <label htmlFor="featured-check" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Mark as Featured Festive Product
                  </label>
                </div>

                <button type="submit" className="btn-submit-order" style={{ marginTop: '1.25rem' }}>
                  <Save size={18} />
                  <span>{productModal.isEdit ? 'Update Cracker' : 'Save & Publish Cracker'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Printable & Downloadable Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          isOpen={!!invoiceOrder}
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
