document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.settings-card').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('panel-' + item.dataset.panel).classList.add('active');
    });
  });


  function loadSettings() {
    
    const hc = localStorage.getItem('mintedHighContrast') === 'true';
    document.getElementById('highContrast').checked = hc;
    if (hc) document.body.classList.add('high-contrast');

   
    const ds = localStorage.getItem('mintedDefaultSort') || 'recommended';
    document.getElementById('defaultSort').value = ds;

    const offerAlerts = localStorage.getItem('mintedOfferAlerts') !== 'false';
    document.getElementById('offerAlerts').checked = offerAlerts;

    const orderUpdates = localStorage.getItem('mintedOrderUpdates') !== 'false';
    document.getElementById('orderUpdates').checked = orderUpdates;
  }

  
  document.getElementById('highContrast').addEventListener('change', function() {
    document.body.classList.toggle('high-contrast', this.checked);
    localStorage.setItem('mintedHighContrast', this.checked);
  });
  document.getElementById('reduceMotion').addEventListener('change', function() {
    applyReduceMotion(this.checked);
  });


  function saveAccessibility() {
    localStorage.setItem('mintedHighContrast', document.getElementById('highContrast').checked);
   
    
  }

  function saveGeneral() {

    localStorage.setItem('mintedDefaultSort', document.getElementById('defaultSort').value);
    localStorage.setItem('mintedOfferAlerts', document.getElementById('offerAlerts').checked);
    localStorage.setItem('mintedOrderUpdates', document.getElementById('orderUpdates').checked);
    
  }

  async function saveAccount() {
    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('emailAddr').value.trim();

    if (!window.supabase) { return; }

    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) { return; }

     
      if (displayName) {
        await window.supabase.from('users').update({ full_name: displayName }).eq('id', user.id);
      }

      
      if (email && email !== user.email) {
        await window.supabase.auth.updateUser({ email });
        
        return;
      }

     
    } catch(e) {
     
      console.error(e);
    }
  }

 
  async function loadAccountData() {
    if (!window.supabase) return;
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) return;

      document.getElementById('emailAddr').value = user.email || '';

      const { data: profile } = await window.supabase
        .from('users').select('full_name').eq('id', user.id).single();

      if (profile?.full_name) {
        document.getElementById('displayName').value = profile.full_name;
      }
    } catch(e) { console.error(e); }
  }

 
  function openDeleteModal() {
    document.getElementById('deleteModal').classList.add('open');
    document.getElementById('deleteConfirmInput').value = '';
  }

  function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
  }

  async function confirmDeleteAccount() {
    const input = document.getElementById('deleteConfirmInput').value.trim();
    if (input !== 'DELETE') {
     
      return;
    }

    if (!window.supabase) { return; }

    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) { return; }

      
      await window.supabase.from('users').delete().eq('id', user.id);
      await window.supabase.auth.signOut();

      
      setTimeout(() => window.location.href = 'index.html', 1800);
    } catch(e) {
      
      console.error(e);
    }
  }

 
  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

 
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadAccountData();
  });