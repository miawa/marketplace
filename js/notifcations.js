let notificationsOpen = false;

async function loadNotifications() {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await window.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) { console.error(error); return; }

  updateBell(data);
  renderDropdown(data);
}

function updateBell(notifications) {
  const bell = document.getElementById('notificationBtn');
  if (!bell) return;

  const unread = notifications.filter(n => !n.is_read).length;
  const existing = document.getElementById('notif-badge');
  if (existing) existing.remove();

  if (unread > 0) {
    const badge = document.createElement('span');
    badge.id = 'notif-badge';
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.style.cssText = `
      position:absolute; top:-4px; right:-4px;
      background:#c53030; color:white; border-radius:50%;
      width:18px; height:18px; font-size:11px; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      pointer-events:none;
    `;
    bell.style.position = 'relative';
    bell.appendChild(badge);
  }
}

function renderDropdown(notifications) {
  let dropdown = document.getElementById('notifDropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.style.cssText = `
      position:fixed; background:white; border-radius:14px;
      box-shadow:0 8px 30px rgba(0,0,0,0.15); width:340px;
      max-height:420px; overflow-y:auto; z-index:9999;
      display:none; flex-direction:column;
      border:1px solid #e5e7eb;
    `;
    document.body.appendChild(dropdown);
  }
  if (notifications.length === 0) {
    dropdown.innerHTML = `
      <div style="padding:20px; text-align:center; color:#6b7280; font-size:14px;">
        No notifications yet
      </div>`;
    return;
  }
  dropdown.innerHTML = `
    <div style="padding:14px 16px; font-weight:700; font-size:15px; border-bottom:1px solid #f3f4f6; display:flex; justify-content:space-between; align-items:center;">
      Notifications
      <span onclick="markAllRead()" style="font-size:12px; color:#7032a0; cursor:pointer; font-weight:500;">Mark all read</span>
    </div>
    ${notifications.map(n => `
      <div onclick="handleNotifClick('${n.id}', '${n.link || ''}')"
        style="display:flex; gap:12px; padding:12px 16px; cursor:pointer; align-items:center;
        background:${n.is_read ? 'white' : '#faf5ff'};
        border-bottom:1px solid #f3f4f6; transition:background 0.15s;"
        onmouseover="this.style.background='#f5f0ff'" 
        onmouseout="this.style.background='${n.is_read ? 'white' : '#faf5ff'}'">
        ${n.image_url
          ? `<img src="${n.image_url}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
          : `<div style="width:44px;height:44px;border-radius:8px;background:#ede1f7;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🔔</div>`
        }
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:600; color:#111; margin-bottom:2px;">${n.title}</div>
          <div style="font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n.message}</div>
          <div style="font-size:11px; color:#9ca3af; margin-top:3px;">${timeAgo(n.created_at)}</div>
        </div>
        ${!n.is_read ? `<div style="width:8px;height:8px;border-radius:50%;background:#7032a0;flex-shrink:0;"></div>` : ''}
      </div>
    `).join('')}
    <div onclick="window.location.href='notifications.html'"
      style="padding:12px; text-align:center; font-size:13px; color:#7032a0; cursor:pointer; font-weight:600; border-top:1px solid #f3f4f6;">
      See all notifications →
    </div>
  `;
}

function positionDropdown() {
  const bell = document.getElementById('notificationBtn');
  const dropdown = document.getElementById('notifDropdown');
  if (!bell || !dropdown) return;

  const rect = bell.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + 8}px`;
  dropdown.style.right = `${window.innerWidth - rect.right}px`;
}

async function toggleNotifications() {
  const dropdown = document.getElementById('notifDropdown');
  notificationsOpen = !notificationsOpen;

  if (notificationsOpen) {
    await loadNotifications();
    positionDropdown();
    if (dropdown) dropdown.style.display = 'flex';
  } else {
    if (dropdown) dropdown.style.display = 'none';
  }
}

async function handleNotifClick(notifId, link) {
  await window.supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId);

  if (link) window.location.href = link;
  else toggleNotifications();
}

async function markAllRead() {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) return;

  await window.supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id);

  await loadNotifications();
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// close when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notifDropdown');
  const bell = document.getElementById('notificationBtn');
  if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
    dropdown.style.display = 'none';
    notificationsOpen = false;
  }
});

// helper to create a notification from anywhere in the app
async function createNotification({ userId, type, title, message, imageUrl = null, link = null }) {
  await window.supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    image_url: imageUrl,
    link
  });
}

window.createNotification = createNotification;
window.toggleNotifications = toggleNotifications;

document.addEventListener('DOMContentLoaded', () => {
  const bell = document.getElementById('notificationBtn');
  if (bell) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotifications();
    });
    loadNotifications();
  }
});