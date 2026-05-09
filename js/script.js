//starts on all items page (so its not filtered/on profile etc) and puts all found items into an array to be loaded onto the main page
let allItems = [];
let currentCategory = "All Items";

const grid = document.getElementById("productGrid");

// gets items from item table in supabase
async function loadItems() {
  try {
    const { data, error } = await window.supabase
      .from('items')
      .select(`
        id,
        title,
        description,
        price,
        brand,
        size,
        condition,
        category,
        created_at,
        is_sold,
        users!inner(username),
        item_images(image_url)
      `)
      //checks that already sold items aren't being put on main marketplace
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading items:', error);
      return;
    }

    allItems = data || [];
    loadProductsToPage();
  } catch (error) {
    console.error('Error:', error);
  }
}

// actually puts items onto page
<<<<<<< HEAD
async function loadProductsToPage(filter = "", category = currentCategory) {
  if (!grid) return;

  if (category === "Watch List") {
    await loadWatchList(filter);
    return;
  }

=======
function loadProductsToPage(filter = "", category = currentCategory) {
  if (!grid) return
>>>>>>> 00c9bab30622bc18aafdd6def1275052eeb783fc
  grid.innerHTML = "";

  const filteredAndSearched = allItems.filter(item => {
    //allows item to be searched by title, description, brand and category. putting to lowercase basically allows any format to search it properly
    const matchesSearch = item.title.toLowerCase().includes(filter.toLowerCase()) ||item.description?.toLowerCase().includes(filter.toLowerCase()) ||item.brand?.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = category === "All Items" || item.category === category;


    return matchesSearch && matchesCategory;
  });

<<<<<<< HEAD
  renderProductGrid(filteredAndSearched);
}

function renderProductGrid(items) {
  if (!grid) return;
  grid.innerHTML = "";

  if (!items || items.length === 0) {
=======
  //loads a message on to main page saying no items. should seperate js and html better here
  if (filteredAndSearched.length === 0) {
>>>>>>> 00c9bab30622bc18aafdd6def1275052eeb783fc
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <div>No items found</div>
        <div style="font-size: 14px; margin-top: 8px;">Try adjusting your search or category filter</div>
      </div> `;
    return;
  }

<<<<<<< HEAD
  items.forEach((item) => {
=======

  filteredAndSearched.forEach((item) => {
>>>>>>> 00c9bab30622bc18aafdd6def1275052eeb783fc


    const filteredLoad = document.createElement("div");
    filteredLoad.className = "productLoad"; filteredLoad.addEventListener("click", () => {
    
       window.location.href = `product.html?id=${item.id}`; });


    // gets image to put for that item. if image length is less than 0, uses placeholder image
    const imageUrl = item.item_images && item.item_images.length > 0
      ? item.item_images[0].image_url
      : 'data:image/placeholder';
      //currently no placeholder image

    const priceFormatted = `£${item.price.toFixed(2)}`;
    // const priceFormatted = `£${item.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

    //puts all information about product on screen, stops when clicked off
    //error handling (placeholde rimage)
          filteredLoad.innerHTML = `
              <img class="product-image" src="${imageUrl}" alt="${item.title}" onerror="this.src='data:image/placeholder';">
              <div class="product-body">
                <div class="title-row">
                  <div class="product-title">${item.title}</div>
                  <div class="product-price">${priceFormatted}</div>
                </div>
                <div class="product-user" onclick="event.stopPropagation(); window.location.href='profile.html?user=${item.users.username}'" style="cursor:pointer; color:#757575;">@${item.users.username}</div>
              </div>
            `;

    grid.appendChild(filteredLoad);
  });
}


searchInput?.addEventListener("input", (e) => {loadProductsToPage(e.target.value, currentCategory);});

sidebarItems.forEach(item => {
item.addEventListener("click", () => {
    sidebarItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
<<<<<<< HEAD
        currentCategory = item.textContent.trim();
=======
        currentCategory = item.textContent;
>>>>>>> 00c9bab30622bc18aafdd6def1275052eeb783fc

    loadProductsToPage(searchInput?.value || "", currentCategory);});});
    
    

createListingButton?.addEventListener("click", () => {
  window.location.href = "createListing.html";
});

<<<<<<< HEAD
async function loadWatchList(filter = "") {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <div>Log in to view your Watch List</div>
      </div> `;
    return;
  }

  const { data, error } = await window.supabase
    .from('saved_items')
    .select(`
      item_id,
      items(
        id,
        title,
        description,
        price,
        brand,
        size,
        condition,
        category,
        created_at,
        is_sold,
        users!inner(username),
        item_images(image_url)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading watch list:', error);
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <div>Could not load watch list.</div>
      </div> `;
    return;
  }

  const watchItems = (data || [])
    .map(row => row.items)
    .filter(item => {
      if (!item) return false;
      const matchesSearch = item.title.toLowerCase().includes(filter.toLowerCase()) || item.description?.toLowerCase().includes(filter.toLowerCase()) || item.brand?.toLowerCase().includes(filter.toLowerCase());
      return matchesSearch;
    });

  renderProductGrid(watchItems);
}
=======
>>>>>>> 00c9bab30622bc18aafdd6def1275052eeb783fc

  document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  });