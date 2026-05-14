const searchInput = document.getElementById("searchInput");
const sidebarItems = document.querySelectorAll(".sidebar li");
const createListingButton = document.getElementById("createListingBtn");

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await window.supabase.auth.signOut();
  window.location.href = 'login.html';
});

// Gets accessibility settings from local storage and applies them if applicable
(function applyAccessibilitySettings() {
  // High contrast
  if (localStorage.getItem('mintedHighContrast') === 'true') {
    document.documentElement.classList.add('high-contrast');
  }

 
  const fontSize = localStorage.getItem('mintedFontSize');
  if (fontSize) {
    document.documentElement.style.fontSize = fontSize + 'px';
  }

 
  if (localStorage.getItem('mintedReduceMotion') === 'true') {
    const style = document.createElement('style');
    style.id = 'reduceMotionStyle';
    style.textContent = '* { transition: none !important; animation: none !important; }';
    document.head.appendChild(style);
  }

  
  if (localStorage.getItem('mintedUnderlineLinks') === 'true') {
    const style = document.createElement('style');
    style.id = 'underlineLinksStyle';
    style.textContent = 'a, [onclick], .nav-item, .productLoad { text-decoration: underline !important; }';
    document.head.appendChild(style);
  }
})();