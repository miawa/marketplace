const orderSteps = [
  { key: 'pending', label: 'The seller is preparing your order' },
  { key: 'shipped', label: 'Seller has shipped your order' },
  { key: 'in_transit', label: 'On the way to you' },
  { key: 'delivered', label: 'Shipped!' }
];

let currentUser = null;
let activeOrders = [];
let selectedOrder = null;

function formatMoney(value) {
  return `£${parseFloat(value || 0).toFixed(2)}`;
}

function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(status) {
  const mapping = {
    pending: 'Preparing your order',
    shipped: 'Seller has shipped your order',
    in_transit: 'On the way to you',
    delivered: 'Shipped!'
  };
  return mapping[status] || 'Preparing your order';
}

function statusBadgeText(status) {
  const mapping = {
    pending: 'Preparing',
    shipped: 'Shipped',
    in_transit: 'In transit',
    delivered: 'Delivered'
  };
  return mapping[status] || 'Preparing';
}

function getOrderStageIndex(status) {
  return orderSteps.findIndex((step) => step.key === status);
}

async function loadOrders() {
  const { data, error } = await window.supabase
    .from('orders')
    .select(`
      id,
      status,
      total_price,
      tracking_number,
      created_at,
      updated_at,
      item_id,
      items(id, title, price, item_images(image_url), users(id, username))
    `)
    .eq('buyer_id', currentUser.id)
    .order('updated_at', { ascending: false });

  if (error) {
    document.getElementById('activeOrdersList').innerHTML = `<div class="empty-state">Unable to load orders.</div>`;
    document.getElementById('orderHistoryList').innerHTML = `<div class="empty-state">Unable to load order history.</div>`;
    console.error(error);
    return;
  }

  activeOrders = data || [];
  renderActiveOrders();
  renderOrderHistory();

  if (!selectedOrder) {
    const firstActive = activeOrders.find((order) => order.status !== 'delivered');
    if (firstActive) selectOrder(firstActive);
  }
}

function renderActiveOrders() {
  const listEl = document.getElementById('activeOrdersList');
  const active = activeOrders.filter((order) => order.status !== 'delivered');

  if (!active.length) {
    listEl.innerHTML = `<div class="empty-state">No active orders at the moment.</div>`;
    return;
  }

  listEl.innerHTML = '';
  active.forEach((order) => {
    const item = order.items || {};
    const card = document.createElement('div');
    card.className = `order-item${selectedOrder?.id === order.id ? ' active' : ''}`;
    card.onclick = () => selectOrder(order);
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(item.title || 'Unknown item')}</strong>
        <span>${statusBadgeText(order.status)} · ${formatMoney(order.total_price)}</span>
      </div>
      <span>${formatDate(order.updated_at || order.created_at)}</span>
    `;
    listEl.appendChild(card);
  });
}

function renderOrderHistory() {
  const historyEl = document.getElementById('orderHistoryList');
  const completed = activeOrders.filter((order) => order.status === 'delivered');

  if (!completed.length) {
    historyEl.innerHTML = `<div class="empty-state">No completed orders yet.</div>`;
    return;
  }

  historyEl.innerHTML = '';
  completed.forEach((order) => {
    const item = order.items || {};
    const itemId = item.id || order.item_id;
    const itemUrl = itemId ? `product.html?id=${encodeURIComponent(itemId)}` : '#';
    const card = document.createElement('div');
    card.className = 'order-history-card';
    card.innerHTML = `
      <div class="history-meta">
        <h3><a href="${itemUrl}" class="order-history-link">${escapeHtml(item.title || 'Unknown item')}</a></h3>
        <span class="order-status-pill">${statusBadgeText(order.status)}</span>
      </div>
      <p>${formatMoney(order.total_price)}</p>
      <p>Purchased on ${formatDate(order.updated_at || order.created_at)}</p>
      ${order.tracking_number ? `<p>Tracking number: ${escapeHtml(order.tracking_number)}</p>` : ''}
    `;
    historyEl.appendChild(card);
  });
}

function selectOrder(order) {
  selectedOrder = order;
  renderActiveOrders();
  renderOrderDetail(order);
  syncOrderStatusMessage(order);
}

function renderOrderDetail(order) {
  const item = order.items || {};
  const selectedEl = document.getElementById('orderDetailCard');
  const stepIndex = Math.max(getOrderStageIndex(order.status), 0);
  const stageText = statusLabel(order.status);

  selectedEl.innerHTML = `
    <div class="order-detail-header">
      <button class="btn-secondary" id="backToOrdersBtn">Back to orders</button>
    </div>
    <div class="order-stage-summary">
      <div class="order-meta">
        <h3>${escapeHtml(item.title || 'Unknown item')}</h3>
        <p>${stageText}</p>
        <div class="order-status-detail">
          <strong>Order status:</strong> ${escapeHtml(statusBadgeText(order.status))}<br>
          <strong>Total:</strong> ${formatMoney(order.total_price)}${order.tracking_number ? `<br><strong>Tracking:</strong> ${escapeHtml(order.tracking_number)}` : ''}
        </div>
      </div>
      <div class="stage-badge">${escapeHtml(statusBadgeText(order.status))}</div>
    </div>
    <div class="order-stage-timeline">
      ${orderSteps
        .map((step, index) => `
          <div class="timeline-step">
            <div>
              <div class="timeline-dot ${index <= stepIndex ? 'active' : ''}"></div>
              ${index < orderSteps.length - 1 ? '<div class="timeline-connector"></div>' : ''}
            </div>
            <div>
              <div class="timeline-label">${escapeHtml(step.label)}</div>
              <div class="timeline-description">${escapeHtml(index <= stepIndex ? 'Completed' : 'Upcoming')}</div>
            </div>
          </div>
        `)
        .join('')}
    </div>
    <div class="order-actions">
      <button class="btn-primary" id="acceptOrderBtn">Accept order</button>
      <button class="btn-secondary" id="reportIssueBtn">Report any issues</button>
    </div>
  `;

  document.getElementById('backToOrdersBtn').addEventListener('click', clearSelectedOrder);
  document.getElementById('acceptOrderBtn').addEventListener('click', acceptOrder);
  document.getElementById('reportIssueBtn').addEventListener('click', reportIssue);
}

function clearSelectedOrder() {
  selectedOrder = null;
  renderActiveOrders();
  const selectedEl = document.getElementById('orderDetailCard');
  if (selectedEl) {
    selectedEl.innerHTML = `
      <div class="empty-state">
        <strong>No active order selected</strong>
        <p>Choose an active order from the sidebar to see the lifecycle tracker.</p>
      </div>
    `;
  }
}

async function getConversationForOrder(order) {
  const sellerId = order.items?.users?.id;
  if (!sellerId) return null;

  const { data, error } = await window.supabase
    .from('conversations')
    .select('id')
    .eq('item_id', order.item_id)
    .eq('buyer_id', currentUser.id)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (error) return null;
  return data?.id || null;
}

async function syncOrderStatusMessage(order) {
  const convId = await getConversationForOrder(order);
  if (!convId) return;

  const { data: lastMessage, error } = await window.supabase
    .from('messages')
    .select('content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return;

  const lastContent = lastMessage?.content || '';
  const [type, status, orderId, tracking] = lastContent.split('|');
  if (type === 'ORDERSTATUS' && status === order.status && (tracking || '') === (order.tracking_number || '')) {
    return;
  }

  await window.supabase.from('messages').insert({
    conversation_id: convId,
    sender_id: currentUser.id,
    content: `ORDERSTATUS|${order.status}|${order.id}|${order.tracking_number || ''}`,
    is_read: false
  });
}

async function acceptOrder() {
  if (!selectedOrder) return;

  if (selectedOrder.status === 'delivered') {
    window.location.href = `review.html?itemId=${selectedOrder.item_id}`;
    return;
  }

  const { error } = await window.supabase
    .from('orders')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', selectedOrder.id);

  if (error) {
    alert('Unable to accept order. Please try again.');
    console.error(error);
    return;
  }

  selectedOrder.status = 'delivered';
  await syncOrderStatusMessage(selectedOrder);
  window.location.href = `review.html?itemId=${selectedOrder.item_id}`;
}

async function reportIssue() {
  if (!selectedOrder) return;
  const convId = await getConversationForOrder(selectedOrder);
  if (convId) {
    window.location.href = `messages.html?conversation=${convId}`;
    return;
  }

  alert('No conversation was found for this order yet. Please contact the seller through Messages.');
}

function escapeHtml(value) {
  if (!value && value !== 0) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const session = await requireAuth('login.html');
  currentUser = session.user;
  await loadOrders();
});