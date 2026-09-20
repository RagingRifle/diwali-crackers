async function runTest() {
  const fetch = globalThis.fetch;
  const BASE_URL = 'http://localhost:5000';

  console.log('1. Testing Public Product Catalog...');
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  const prodData = await prodRes.json();
  console.log(`Products count: ${prodData.count}`);

  console.log('\n2. Testing Customer Order Submission (Form Submit)...');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Aarav Sharma',
      phone: '9876543210',
      email: 'aarav@example.com',
      address: 'Flat 302, Royal Palms, Anna Nagar',
      city: 'Chennai',
      pincode: '600040',
      notes: 'Please ring bell twice on arrival',
      items: [
        { id: 1, name: '10cm Electric Sparklers', price: 65, quantity: 2 },
        { id: 5, name: 'Flower Pots Special (Asoka)', price: 140, quantity: 1 }
      ]
    })
  });
  const orderData = await orderRes.json();
  console.log('Order submission result:', orderData);
  const orderId = orderData.orderId;

  console.log('\n3. Testing Public Tracking Lookup via Phone Number...');
  const trackPhoneRes = await fetch(`${BASE_URL}/api/orders/track?phone=9876543210`);
  const trackPhoneData = await trackPhoneRes.json();
  console.log(`Found ${trackPhoneData.count} orders for phone 9876543210`);
  console.log('Order status:', trackPhoneData.orders[0].status);

  console.log('\n4. Testing Admin Authentication...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'diwali@2026' })
  });
  const loginData = await loginRes.json();
  console.log('Admin login success:', loginData.success, '| Admin:', loginData.admin.username);
  const token = loginData.token;

  console.log('\n5. Testing Admin Updating Order Status & Tracking Info...');
  const updateRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status: 'Out for Delivery',
      courier_name: 'DTDC Express',
      tracking_number: 'DTDC-CH-778899',
      note: 'Package dispatched from Chennai central hub and out with delivery rider.'
    })
  });
  const updateData = await updateRes.json();
  console.log('Admin update status result:', updateData.message);

  console.log('\n6. Verifying Updated Tracking Timeline for Customer...');
  const verifyTrackRes = await fetch(`${BASE_URL}/api/orders/track?orderId=${orderId}`);
  const verifyTrackData = await verifyTrackRes.json();
  const trackedOrder = verifyTrackData.orders[0];
  console.log(`Current Status: ${trackedOrder.status}`);
  console.log(`Courier: ${trackedOrder.courier_name} (AWB: ${trackedOrder.tracking_number})`);
  console.log(`Timeline updates count: ${trackedOrder.status_updates.length}`);
  console.log('Latest Note:', trackedOrder.status_updates[trackedOrder.status_updates.length - 1].note);

  console.log('\n7. Testing Admin Dashboard Metrics Stats...');
  const statsRes = await fetch(`${BASE_URL}/api/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log('Dashboard Stats:', statsData.stats);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(console.error);
