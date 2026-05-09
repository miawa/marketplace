const reportsBody = document.getElementById('reportsBody');
const reportStatusBanner = document.getElementById('reportStatus');

async function signOut() {
  await window.supabase.auth.signOut();
  window.location.href = 'login.html';
}

function showStatus(message, type = 'success') {
  if (!reportStatusBanner) return;
  reportStatusBanner.textContent = message;
  reportStatusBanner.className = `status-banner ${type}`;
  setTimeout(() => {
    reportStatusBanner.className = 'status-banner';
    reportStatusBanner.textContent = '';
  }, 4500);
}

//basic cross site scripting to prevent malicious code through text boxes

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

    async function requireAdmin() {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }

  const { data, error } = await window.supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data?.is_admin) {
    showStatus('You must be an administrator to access this page.', 'error');

    window.location.href = 'index.html';
    return null;
    }

    return user;
    }

async function loadReports() {
  if (!reportsBody) return;
  reportsBody.innerHTML = '<tr><td colspan="6" style="padding: 32px; text-align: center; color: #6b7280;">Loading reports…</td></tr>';

    const { data: reports, error } = await window.supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

  if (error) {
    reportsBody.innerHTML = `<tr><td colspan="6" style="padding: 32px; text-align: center; color: #991b1b;">Unable to load reports.</td></tr>`;
    console.error('Error loading reports:', error);
    return;
    }

  if (!reports || reports.length === 0) {
    reportsBody.innerHTML = `<tr><td colspan="6" style="padding: 32px; text-align: center; color: #6b7280;">No reports available.</td></tr>`;
    return;
  }

  const userIds = Array.from(new Set(reports.map((report) => report.user_id).filter(Boolean)));

  const itemIds = Array.from(new Set(reports.map((report) => report.item_id).filter(Boolean)));

  const [{ data: users }, { data: items }] = await Promise.all([

    window.supabase.from('users').select('id,username').in('id', userIds),
    window.supabase.from('items').select('id,title').in('id', itemIds)

  ]);

  //lookups for user and item names to avoid loops  by collecting all user & item ids for one query the building the map
    const userMap = (users || []).reduce((map, user) => {
        map[user.id] = user.username;
        return map;
    }, {});

    const itemMap = (items || []).reduce((map, item) => {
        map[item.id] = item.title;
        return map;
         }, {});

        reportsBody.innerHTML = reports.map((report) => {

        const title = escapeHTML(itemMap[report.item_id] || 'View listing');
        const reporter = escapeHTML(userMap[report.user_id] || report.user_id || 'Unknown');
        const description = escapeHTML(report.description || '-');
        const statusClass = `status-Button status-${report.status || 'pending'}`;

        const isPending = report.status === 'pending' || !report.status;

    return `
      <tr>
        <td><a href="product.html?id=${report.item_id}" target="_blank">${title}</a></td>
        <td>${reporter}</td>
        <td>${escapeHTML(report.reason || 'Unknown')}</td>
        <td style="max-width: 350px; white-space: pre-wrap;">${description}</td>
        <td><span class="${statusClass}">${escapeHTML(report.status || 'pending')}</span></td>
        <td>
          <div class="action-buttons">
            <button class="action-btn light" onclick="setReportStatus('${report.id}', 'ignored')" ${!isPending ? 'disabled' : ''}>Ignore</button>
            <button class="action-btn secondary" onclick="setReportStatus('${report.id}', 'warning')" ${!isPending ? 'disabled' : ''}>Warning</button>
            <button class="action-btn" onclick="setReportStatus('${report.id}', 'deleted')" ${!isPending ? 'disabled' : ''}>Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function setReportStatus(reportId, newStatus) {

  try {
    const { data: report, error: reportError } = await window.supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();


    if (reportError || !report) {
      showStatus('Unable to locate report.', 'error');
      return;
    }

        const updates = await window.supabase
      .from('reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', reportId);

    if (updates.error) {
      showStatus('Unable to update report status.', 'error');
      console.error('Report update failed:', updates.error);
      return;
    }


    if (newStatus === 'deleted' && report.item_id) {

      const { error: itemError } = await window.supabase
        .from('items')
        .update({ is_sold: true })
        .eq('id', report.item_id);

      if (itemError) {
        console.warn('Could not mark listing as deleted:', itemError.message);
      }
    }

    showStatus(`Report marked ${newStatus}.`, 'success');
    await loadReports();

  } catch (error) {

    showStatus('An unexpected error occurred.', 'error');
    console.error('setReportStatus error:', error);
    
  }
}

    window.setReportStatus = setReportStatus;
    window.signOut = signOut;

window.addEventListener('DOMContentLoaded', async () => {
  const adminUser = await requireAdmin();
  if (!adminUser) return;
  await loadReports();
});
