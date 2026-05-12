let allItems = [];
let currentCategory = "All Items";
let currentPage = 0;
const PAGE_SIZE = 12;
let isLoading = false;
let allLoaded = false;
let currentFilter = "";

const grid = document.getElementById("productGrid");
const spinner = document.getElementById("loadingSpinner");

async function checkAdminAccess() {
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.style.display = 'none';
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
      const { data: profile } = await window.supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (profile?.is_admin) adminBtn.style.display = 'block';
    }
  }
}
checkAdminAccess();

async function loadItems() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const cat = searchParams.get('category');
    currentCategory = cat ?? 'All Items';

    const { data, error } = await window.supabase
      .from('items')
      .select(`
        id, title, description, price, old_price, brand, size,
        condition, category, created_at, is_sold,
        users!inner(username, avatar_url),
        item_images(image_url)
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (error) { console.error('Error loading items:', error); return; }

    allItems = data || [];
    resetAndRender();
  } catch (err) {
    console.error('Error:', err);
  }
}

// Filter state
let activeConditions = [];
let minPrice = null;
let maxPrice = null;
let sortOrder = 'newest';

function getFilteredItems() {
  let filtered = allItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(currentFilter.toLowerCase()) ||
      item.description?.toLowerCase().includes(currentFilter.toLowerCase()) ||
      item.brand?.toLowerCase().includes(currentFilter.toLowerCase());
    const matchesCategory = currentCategory === "All Items" || item.category === currentCategory;
    const matchesCondition = activeConditions.length === 0 || activeConditions.includes(item.condition);
    const matchesMin = minPrice === null || item.price >= minPrice;
    const matchesMax = maxPrice === null || item.price <= maxPrice;
    return matchesSearch && matchesCategory && matchesCondition && matchesMin && matchesMax;
  });

  if (sortOrder === 'low') filtered.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'high') filtered.sort((a, b) => b.price - a.price);

  return filtered;
}

function resetAndRender() {
  currentPage = 0;
  allLoaded = false;
  grid.innerHTML = "";
  loadNextPage();
}

function loadNextPage() {
  if (isLoading || allLoaded) return;

  if (currentCategory === "Watch List") {
    loadWatchList(currentFilter);
    return;
  }

  isLoading = true;
  spinner.classList.add('active');

  const filtered = getFilteredItems();
  const start = currentPage * PAGE_SIZE;
  const chunk = filtered.slice(start, start + PAGE_SIZE);

  setTimeout(() => {
    if (chunk.length === 0 && currentPage === 0) {
      grid.innerHTML = `
        <div style="text-align:center;padding:40px;color:#6b7280;">
          <div>No items found</div>
          <div style="font-size:14px;margin-top:8px;">Try adjusting your search or category filter</div>
        </div>`;
    } else {
      chunk.forEach(item => {
        const card = document.createElement("div");
        card.className = "productLoad";
        card.addEventListener("click", () => {
          window.location.href = `product.html?category=${item.category}&id=${item.id}`;
        });

        const imageUrl = item.item_images?.length > 0 ? item.item_images[0].image_url : 'images/default.png';
        const priceFormatted = `£${item.price.toFixed(2)}`;
        const oldPriceHtml = item.old_price ? `<span class="old-price">£${Number(item.old_price).toFixed(2)}</span>` : '';

        card.innerHTML = `
          <img class="product-image" src="${imageUrl}" alt="${item.title}" onerror="this.src='images/default.png';">
          <div class="product-body">
            <div class="title-row">
              <div class="product-title">${item.title}</div>
              <div class="product-price">${priceFormatted}${oldPriceHtml}</div>
            </div>
            <div class="product-user" onclick="event.stopPropagation(); window.location.href='profile.html?user=${item.users.username}'">
              <div class="product-user-name">@${item.users.username}</div>
              <div class="product-user-avatar">
                <img src="${item.users.avatar_url || 'images/default.png'}" alt="${item.users.username}'s avatar" onerror="this.src='images/default.png';">
              </div>
            </div>
          </div>`;

        grid.appendChild(card);
      });
    }

    if (chunk.length < PAGE_SIZE) allLoaded = true;
    currentPage++;
    isLoading = false;
    spinner.classList.remove('active');
  }, 400); // small delay so spinner is visible
}



// Filter toggles
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (!isOpen) { menu.classList.add('open'); btn.classList.add('active'); }
    e.stopPropagation();
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
});

document.querySelectorAll('.filter-menu input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    activeConditions = [...document.querySelectorAll('.filter-menu input[type="checkbox"]:checked')].map(c => c.value);
    resetAndRender();
  });
});

document.getElementById('applyPrice')?.addEventListener('click', () => {
  minPrice = parseFloat(document.getElementById('minPrice').value) || null;
  maxPrice = parseFloat(document.getElementById('maxPrice').value) || null;
  resetAndRender();
});

document.querySelectorAll('input[name="sort"]').forEach(radio => {
  radio.addEventListener('change', async (e) => {
    sortOrder = e.target.value;

    if (sortOrder === 'recommended') {
      grid.innerHTML = '';
      spinner.classList.add('active');

      const items = await getRecommendations();
      spinner.classList.remove('active');

      if (!items || items.length === 0) {
        grid.innerHTML = `
          <div style="text-align:center;padding:40px;color:#6b7280;">
            <div>No recommendations yet</div>
            <div style="font-size:14px;margin-top:8px;">Like some items to get personalised recommendations</div>
          </div>`;
        return;
      }

      grid.innerHTML = '';
      items.forEach(item => {
        const card = document.createElement("div");
        card.className = "productLoad";
        card.addEventListener("click", () => {
          window.location.href = `product.html?category=${item.category}&id=${item.id}`;
        });
        const imageUrl = item.item_images?.length > 0 ? item.item_images[0].image_url : 'images/default.png';
        const priceFormatted = `£${item.price.toFixed(2)}`;
        const oldPriceHtml = item.old_price ? `<span class="old-price">£${Number(item.old_price).toFixed(2)}</span>` : '';
        card.innerHTML = `
          <img class="product-image" src="${imageUrl}" alt="${item.title}" onerror="this.src='images/default.png';">
          <div class="product-body">
            <div class="title-row">
              <div class="product-title">${item.title}</div>
              <div class="product-price">${priceFormatted}${oldPriceHtml}</div>
            </div>
            <div class="product-user" onclick="event.stopPropagation(); window.location.href='profile.html?user=${item.users.username}'">
              <div class="product-user-name">@${item.users.username}</div>
              <div class="product-user-avatar">
                <img src="${item.users.avatar_url || 'images/default.png'}" alt="${item.users.username}'s avatar" onerror="this.src='images/default.png';">
              </div>
            </div>
          </div>`;
        grid.appendChild(card);
      });

    } else {
      resetAndRender();
    }
  });
});

document.querySelectorAll('name="category"').forEach(radio => {
  radio.addEventListener('change', async (e) => {

    currentCategory = e.target.value;

    resetAndRender();
    
  });
});

searchInput?.addEventListener("input", (e) => {
  currentFilter = e.target.value;
  resetAndRender();
});

sidebarItems.forEach(item => {
  item.addEventListener("click", () => {
    sidebarItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentCategory = item.textContent.trim();
    resetAndRender();
  });
});

.product-image-wrapper {
  position: relative;
}

.card-like-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.1s ease;
}

.card-like-btn:hover {
  transform: scale(1.1);
}

.like-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

createListingButton?.addEventListener("click", () => {
  window.location.href = "createListing.html";
});

async function loadWatchList(filter = "") {
  isLoading = true;
  spinner.classList.add('active');

  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    grid.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;"><div>Log in to view your Watch List</div></div>`;
    spinner.classList.remove('active');
    isLoading = false;
    allLoaded = true;
    return;
  }

  const { data, error } = await window.supabase
    .from('saved_items')
    .select(`
      item_id,
      items(
        id, title, description, price, old_price, brand, size,
        condition, category, created_at, is_sold,
        users!inner(username),
        item_images(image_url)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  spinner.classList.remove('active');
  isLoading = false;
  allLoaded = true;

  if (error) {
    grid.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;"><div>Could not load watch list.</div></div>`;
    return;
  }

  const watchItems = (data || [])
    .map(row => row.items)
    .filter(item => {
      if (!item) return false;
      return item.title.toLowerCase().includes(filter.toLowerCase()) ||
        item.description?.toLowerCase().includes(filter.toLowerCase()) ||
        item.brand?.toLowerCase().includes(filter.toLowerCase());
    });

  grid.innerHTML = "";
  watchItems.forEach(item => {
    // reuse same card structure as above
    const card = document.createElement("div");
    card.className = "productLoad";
    card.addEventListener("click", () => {
      window.location.href = `product.html?category=${item.category}&id=${item.id}`;
    });
    const imageUrl = item.item_images?.length > 0 ? item.item_images[0].image_url : 'images/default.png';
    card.innerHTML = `
      <img class="product-image" src="${imageUrl}" alt="${item.title}" onerror="this.src='images/default.png';">
      <div class="product-body">
        <div class="title-row">
          <div class="product-title">${item.title}</div>
          <div class="product-price">£${item.price.toFixed(2)}</div>
        </div>
        <div class="product-user" onclick="event.stopPropagation(); window.location.href='profile.html?user=${item.users.username}'">
          <div class="product-user-name">@${item.users.username}</div>
          <div class="product-user-avatar">
            <img src="${item.users.avatar_url || 'images/default.png'}" alt="${item.users.username}'s avatar" onerror="this.src='images/default.png';">
          </div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

const sentinel = document.getElementById('scrollSentinel');
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !isLoading && !allLoaded && allItems.length > 0) {
    loadNextPage();
  }
}, { rootMargin: '100px' });

if (sentinel) observer.observe(sentinel);

async function toggleLike(itemId, itemCategory) {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) return null;

  // check if already liked
  const { data: existing } = await window.supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle();

  // get current category count
  const { data: catRow } = await window.supabase
    .from('user_category_likes')
    .select('like_count')
    .eq('user_id', user.id)
    .eq('category', itemCategory)
    .maybeSingle();

  if (existing) {
    // unlike
    await window.supabase.from('likes').delete().eq('id', existing.id);
    await window.supabase
      .from('user_category_likes')
      .upsert({
        user_id: user.id,
        category: itemCategory,
        like_count: Math.max((catRow?.like_count || 1) - 1, 0)
      }, { onConflict: 'user_id,category' });
    return false; // unliked

  } else {
    // like
    await window.supabase.from('likes').insert({ user_id: user.id, item_id: itemId });
    await window.supabase
      .from('user_category_likes')
      .upsert({
        user_id: user.id,
        category: itemCategory,
        like_count: (catRow?.like_count || 0) + 1
      }, { onConflict: 'user_id,category' });
    return true; // liked
  }
}

async function getRecommendations() {
  const { data: { user } } = await window.supabase.auth.getUser();

  if (!user) return allItems;

  const { data: catLikes } = await window.supabase
    .from('user_category_likes')
    .select('category, like_count')
    .eq('user_id', user.id);

  if (!catLikes || catLikes.length === 0) return allItems;

  const scoreMap = {};
  catLikes.forEach(({ category, like_count }) => {
    scoreMap[category] = like_count;
  });

  const scored = [...allItems].map(item => ({
    ...item,
    _score: scoreMap[item.category] || 0
  }));

  scored.sort((a, b) => b._score - a._score);

  return scored;
}

document.addEventListener('DOMContentLoaded', () => {
  loadItems();
});