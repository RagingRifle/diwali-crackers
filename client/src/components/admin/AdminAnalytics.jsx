import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, RefreshCw, TrendingUp } from 'lucide-react';

const STATUSES = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
const money = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function costForItem(item, productsById, productsByCode) {
  const product = productsById.get(String(item.product_id)) || productsByCode.get(String(item.product_code || '').toLowerCase());
  if (!product) return null;

  const directCost = Number(product.buying_cost);
  if (directCost > 0) return directCost;

  if (Number(product.is_combo) === 1) {
    try {
      const parts = JSON.parse(product.combo_items || '[]');
      if (!parts.length) return null;
      let total = 0;
      for (const part of parts) {
        const component = productsById.get(String(part.id)) || productsByCode.get(String(part.code || '').toLowerCase());
        const componentCost = Number(component?.buying_cost);
        if (!(componentCost > 0)) return null;
        total += componentCost * (Number(part.quantity) || 1);
      }
      return total;
    } catch {
      return null;
    }
  }

  return null;
}

export default function AdminAnalytics({ orders = [], products = [], loading, onRefresh }) {
  const [period, setPeriod] = useState('30d');
  const [status, setStatus] = useState('All active');
  const [category, setCategory] = useState('All categories');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);
  const report = useMemo(() => {
    const now = new Date();
    let start = null;
    if (period === '7d' || period === '30d' || period === '90d') {
      start = new Date(now);
      start.setDate(start.getDate() - (Number.parseInt(period, 10) - 1));
      start.setHours(0, 0, 0, 0);
    } else if (period === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
    }
    if (period === 'custom' && fromDate) start = new Date(`${fromDate}T00:00:00`);
    const end = period === 'custom' && toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    const customRangeDays = period === 'custom' && start
      ? Math.ceil(((end || now).getTime() - start.getTime()) / 86400000)
      : 0;

    const productsById = new Map(products.map((product) => [String(product.id), product]));
    const productsByCode = new Map(products.map((product) => [String(product.code || '').toLowerCase(), product]));
    const statusOrders = orders.filter((order) => {
      const created = new Date(order.created_at);
      if (Number.isNaN(created.getTime())) return false;
      if (start && created < start) return false;
      if (end && created > end) return false;
      if (status === 'All active' && order.status === 'Cancelled') return false;
      if (status !== 'All active' && status !== 'All statuses' && order.status !== status) return false;
      return true;
    });

    const result = {
      orders: 0,
      activeOrders: 0,
      sales: 0,
      cost: 0,
      costedSales: 0,
      profit: 0,
      units: 0,
      costedUnits: 0,
      promoDiscount: 0,
      statusCounts: Object.fromEntries(STATUSES.map((key) => [key, 0])),
      bestSellers: new Map(),
      profitableProducts: new Map(),
      cities: new Map(),
      trend: new Map(),
    };

    for (const order of statusOrders) {
      const cancelled = order.status === 'Cancelled';
      const items = order.items || [];
      const grossItems = items.reduce((sum, item) => sum + (Number(item.subtotal) || Number(item.price) * (Number(item.quantity) || 1)), 0);
      const matchedItems = items.filter((item) => {
        if (category === 'All categories') return true;
        const product = productsById.get(String(item.product_id)) || productsByCode.get(String(item.product_code || '').toLowerCase());
        return product?.category === category;
      });
      if (category !== 'All categories' && matchedItems.length === 0) continue;

      result.orders += 1;
      result.statusCounts[order.status] = (result.statusCounts[order.status] || 0) + 1;
      if (cancelled) continue;
      result.activeOrders += 1;

      const netOrderSales = Number(order.total_amount) || 0;
      const ratio = grossItems > 0 ? netOrderSales / grossItems : 0;
      const orderSales = matchedItems.reduce((sum, item) => {
        const itemGross = Number(item.subtotal) || Number(item.price) * (Number(item.quantity) || 1);
        return sum + itemGross * ratio;
      }, 0);
      result.sales += orderSales;
      result.promoDiscount += (Number(order.promo_discount) || 0) * (category === 'All categories' || grossItems === 0 ? 1 : matchedItems.reduce((sum, item) => sum + (Number(item.subtotal) || Number(item.price) * (Number(item.quantity) || 1)), 0) / grossItems);

      const city = (order.city || 'Unknown').trim();
      result.cities.set(city, (result.cities.get(city) || 0) + orderSales);

      for (const item of matchedItems) {
        const quantity = Number(item.quantity) || 1;
        const gross = Number(item.subtotal) || Number(item.price) * quantity;
        const sales = gross * ratio;
        const key = item.product_code || item.product_name || 'Product';
        const unitCost = costForItem(item, productsById, productsByCode);
        result.units += quantity;
        if (unitCost !== null) {
          const cost = unitCost * quantity;
          result.costedUnits += quantity;
          result.cost += cost;
          result.costedSales += sales;
          result.profit += sales - cost;
          const productProfit = result.profitableProducts.get(key) || { name: item.product_name || 'Product', profit: 0 };
          productProfit.profit += sales - cost;
          result.profitableProducts.set(key, productProfit);
        }

        const current = result.bestSellers.get(key) || { name: item.product_name || 'Product', units: 0, sales: 0 };
        current.units += quantity;
        current.sales += sales;
        result.bestSellers.set(key, current);
      }

      const date = new Date(order.created_at);
      let bucket;
      if (period === 'ytd' || period === 'all' || customRangeDays > 365) {
        bucket = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === '90d' || customRangeDays > 60) {
        const week = new Date(date);
        week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
        bucket = localDateKey(week);
      } else {
        bucket = localDateKey(date);
      }
      result.trend.set(bucket, (result.trend.get(bucket) || 0) + orderSales);
    }

    return {
      ...result,
      averageOrder: result.activeOrders ? result.sales / result.activeOrders : 0,
      costCoverage: result.units ? (result.costedUnits / result.units) * 100 : 0,
      margin: result.costedSales ? (result.profit / result.costedSales) * 100 : 0,
      bestSellers: [...result.bestSellers.values()].sort((a, b) => b.sales - a.sales).slice(0, 5),
      profitableProducts: [...result.profitableProducts.values()].sort((a, b) => b.profit - a.profit).slice(0, 5),
      cities: [...result.cities.entries()].map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5),
      trend: [...result.trend.entries()].sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [orders, products, period, status, category, fromDate, toDate]);

  const maxTrend = Math.max(1, ...report.trend.map(([, amount]) => amount));
  const labelForBucket = (bucket) => {
    if (bucket.length === 7) return new Date(`${bucket}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' });
    return new Date(`${bucket}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <section className="admin-analytics">
      <div className="admin-analytics__heading">
        <div>
          <h2><BarChart3 size={22} /> Sales &amp; Profit Insights</h2>
          <p>Track net sales, product costs, margins, order patterns, and best sellers.</p>
        </div>
        <button type="button" className="btn-action" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'admin-analytics__spin' : ''} /> {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>

      <div className="admin-analytics__filters">
        <label><CalendarDays size={16} />
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        {period === 'custom' && <>
          <label>From <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label>To <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        </>}
        <label>Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All active</option>
            <option>All statuses</option>
            {STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {loading && orders.length === 0 ? <div className="admin-analytics__empty">Loading sales data…</div> : <>
        <div className="admin-analytics__metrics">
          <article className="admin-analytics__metric admin-analytics__metric--sales"><span>Net sales</span><strong>{money(report.sales)}</strong><small>Excludes cancelled orders</small></article>
          <article className="admin-analytics__metric admin-analytics__metric--profit"><span>Gross profit on costed items</span><strong>{report.costedUnits ? money(report.profit) : 'Add product costs'}</strong><small>{report.costedUnits ? `${report.margin.toFixed(1)}% margin on costed sales` : 'Buying cost is missing'}</small></article>
          <article className="admin-analytics__metric"><span>Recorded buying cost</span><strong>{money(report.cost)}</strong><small>{report.costedUnits.toLocaleString('en-IN')} units with cost</small></article>
          <article className="admin-analytics__metric"><span>Orders</span><strong>{report.orders.toLocaleString('en-IN')}</strong><small>Average order {money(report.averageOrder)}</small></article>
          <article className="admin-analytics__metric"><span>Cost coverage</span><strong>{report.costCoverage.toFixed(0)}%</strong><small>{report.units.toLocaleString('en-IN')} units sold</small></article>
          <article className="admin-analytics__metric"><span>Promotional discounts</span><strong>{money(report.promoDiscount)}</strong><small>Applied to matching sales</small></article>
        </div>

        <p className="admin-analytics__note"><TrendingUp size={15} /> Profit is sales minus recorded product buying costs; it excludes delivery and operating expenses. Historical orders use the catalog’s current buying costs. Add missing costs in Crackers Catalog; uncosted items are excluded from profit.</p>

        <div className="admin-analytics__panels">
          <article className="admin-analytics__panel">
            <h3>Sales trend</h3>
            {report.trend.length ? <div className="admin-analytics__chart">
              {report.trend.map(([bucket, amount]) => <div className="admin-analytics__bar-wrap" key={bucket} title={`${labelForBucket(bucket)}: ${money(amount)}`}>
                <span className="admin-analytics__bar-value">{money(amount)}</span>
                <div className="admin-analytics__bar" style={{ height: `${Math.max(4, (amount / maxTrend) * 100)}%` }} />
                <small>{labelForBucket(bucket)}</small>
              </div>)}
            </div> : <div className="admin-analytics__empty">No sales in this date range.</div>}
          </article>

          <article className="admin-analytics__panel">
            <h3>Order status mix</h3>
            <div className="admin-analytics__status-list">
              {STATUSES.map((item) => <div key={item} className="admin-analytics__status-row"><span>{item}</span><strong>{report.statusCounts[item] || 0}</strong><div><i style={{ width: `${report.orders ? ((report.statusCounts[item] || 0) / report.orders) * 100 : 0}%` }} /></div></div>)}
            </div>
          </article>

          <article className="admin-analytics__panel">
            <h3>Top products by sales</h3>
            {report.bestSellers.length ? <ol className="admin-analytics__rank-list">{report.bestSellers.map((item, index) => <li key={`${item.name}-${index}`}><span className="admin-analytics__rank">{index + 1}</span><span className="admin-analytics__rank-name">{item.name}<small>{item.units} units sold</small></span><strong>{money(item.sales)}</strong></li>)}</ol> : <div className="admin-analytics__empty">No product sales for these filters.</div>}
          </article>

          <article className="admin-analytics__panel">
            <h3>Top cities by sales</h3>
            {report.cities.length ? <ol className="admin-analytics__rank-list">{report.cities.map((item, index) => <li key={item.name}><span className="admin-analytics__rank">{index + 1}</span><span className="admin-analytics__rank-name">{item.name}</span><strong>{money(item.sales)}</strong></li>)}</ol> : <div className="admin-analytics__empty">No city data for these filters.</div>}
          </article>

          <article className="admin-analytics__panel">
            <h3>Top products by gross profit</h3>
            {report.profitableProducts.length ? <ol className="admin-analytics__rank-list">{report.profitableProducts.map((item, index) => <li key={`${item.name}-${index}`}><span className="admin-analytics__rank">{index + 1}</span><span className="admin-analytics__rank-name">{item.name}</span><strong>{money(item.profit)}</strong></li>)}</ol> : <div className="admin-analytics__empty">Enter buying costs to see product profit.</div>}
          </article>
        </div>
      </>}
    </section>
  );
}
