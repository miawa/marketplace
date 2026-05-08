const searchInput = document.getElementById("searchInput");
const sidebarItems = document.querySelectorAll(".sidebar li");
const createListingButton = document.getElementById("createListingBtn");

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await window.supabase.auth.signOut();
    window.location.href = 'login.html';
    });