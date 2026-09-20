import React, { useState, useEffect } from 'react';
import {
  Package, ShoppingCart, DollarSign, Clock, CheckCircle2,
  Truck, Plus, Edit2, Trash2, Search, Filter, Eye, X,
  Save, RefreshCw, LogOut, Sparkles, AlertTriangle
} from 'lucide-react';

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
  'Flower pots',
  'Rockets',
  'Chakras',
  'Bombs',
  'Fancy items',
  'Gift boxes'
];

export default function AdminDashboard({ adminUser, onLogout, onProductChange }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [productModal, setProductModal] = useState({ open: false, isEdit: false, data: null });

  // Tracking modal inputs
  const [trackingForm, setTrackingForm] = useState({
    status: 'Packed',
    courier_name: '',
    tracking_number: '',
    note: ''
  });

  // Product form inputs
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Sparklers',
    price: '',
    mrp: '',
    pack_size: '1 Box',
    image: '',
    description: '',
    featured: 0
  });

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
      if (productSearch.trim()) {
        url += `?search=${encodeURIComponent(productSearch.trim())}`;
      }
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
  }, [orderStatusFilter, orderSearch, productSearch]);

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

  // Open Tracking Modal
  const openTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setTrackingForm({
      status: order.status,
      courier_name: order.courier_name || '',
      tracking_number: order.tracking_number || '',
      note: ''
    });
  };

  // Save / Edit Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const isEdit = productModal.isEdit;
      const url = isEdit ? `/api/products/${productModal.data.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price),
          mrp: Number(productForm.mrp) || Number(productForm.price),
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

  // Delete Product
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

  // Open Edit Product Modal
  const openEditProduct = (prod) => {
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      mrp: prod.mrp,
      pack_size: prod.pack_size || '1 Box',
      image: prod.image,
      description: prod.description || '',
      featured: prod.featured || 0
    });
    setProductModal({ open: true, isEdit: true, data: prod });
  };

  // Open New Product Modal
  const openNewProduct = () => {
    setProductForm({
      name: '',
      category: 'Sparklers',
      price: '',
      mrp: '',
      pack_size: '1 Box',
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60',
      description: '',
      featured: 0
    });
    setProductModal({ open: true, isEdit: false, data: null });
  };

  return (
    <div className="admin-container">
      {/* Top Header Bar */}
      <div className="admin-header">
        <div>
          <h2>🪔 Diwali Store Admin Panel</h2>
          <p>
            Logged in as <strong>{adminUser?.username || 'admin'}</strong> • Real-Time Orders & Catalog Management
          </p>
        </div>

        <div className="admin-actions">
          <button
            className={`btn-admin-nav ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={16} />
            <span>Orders & Tracking ({stats ? stats.totalOrders : 0})</span>
          </button>

          <button
            className={`btn-admin-nav ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={16} />
            <span>Crackers Catalog ({products.length})</span>
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

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="admin-table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3>Customer Orders Management</h3>
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
                  <th>Status & Courier</th>
                  <th>Actions</th>
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
                    const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
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
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn-action"
                              title="Update Courier & Tracking Note"
                              onClick={() => openTrackingModal(order)}
                            >
                              <Truck size={14} />
                              <span>Tracking</span>
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

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="admin-table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3>Crackers Catalog CRUD</h3>
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
                placeholder="Search crackers..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price / MRP</th>
                  <th>Pack Size</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          style={{ width: '45px', height: '45px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
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

                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--primary-red)' }}>₹{prod.price}</div>
                      {prod.mrp > prod.price && (
                        <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-light)' }}>
                          MRP: ₹{prod.mrp}
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: '0.85rem' }}>
                      {prod.pack_size || '1 Box'}
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
                          <span>Edit</span>
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
                ))}
              </tbody>
            </table>
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
                      <th style={{ padding: '4px 0' }}>Price</th>
                      <th style={{ padding: '4px 0' }}>Qty</th>
                      <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((i, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed var(--border-light)' }}>
                        <td style={{ padding: '6px 0' }}>{i.product_name}</td>
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

              <button
                className="btn-submit-order"
                style={{ margin: 0 }}
                onClick={() => {
                  openTrackingModal(selectedOrder);
                  setSelectedOrder(null);
                }}
              >
                <Truck size={16} />
                <span>Update Tracking & Courier Information</span>
              </button>
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
                  <span>Save Status & Tracking</span>
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
                    <label>Pack Size / Pieces</label>
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
                    <label>Sale Price (₹) <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="1"
                      placeholder="e.g. 180"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>MRP / Strikethrough (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      placeholder="e.g. 290"
                      value={productForm.mrp}
                      onChange={(e) => setProductForm(prev => ({ ...prev, mrp: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://images.unsplash.com/..."
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
    </div>
  );
}
