// gets product id from url to fetch product details from SB table
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const productDetail = document.getElementById("productDetail");

//global variables for carousel
window.showImage = showImage;
window.nextImage = nextImage;
window.prevImage = prevImage;
window.handleBuyNow = handleBuyNow;

const DELIVERY_OPTIONS = [
  { value: 'first_class', label: "1st class", cost: 3.00 },
  { value: 'priority', label: "Priority delivery", cost: 5.00 },
  { value: 'home_delivery', label: "Home delivery", cost: 6.50 },
  { value: 'dropoff', label: "Dropoff location", cost: 4.00 }
];
const APP_FEE = 1.50;
let buyNowItem = null;
let buyNowConversationId = null;

async function loadProduct() {
    //if no id found
    if (!id) {
    productDetail.innerHTML = "<p>Product ID not provided.</p>";
    return;
    }
//gets all information about item
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
        .eq('id', id)
        .single();

    if (error || !data) {
        productDetail.innerHTML = "<p>Product not found.</p>";
        return;
    }

    //formating date and money
    const p = data;
    const priceFormatted = `£${p.price.toFixed(2)}`;

    //FIX - need to change this to upload english date (day month year) currently in american date as this is how its stored in supabase? i think
    const uploadDate = new Date(p.created_at).toLocaleDateString();
    const conditionFormatted = p.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    // image carousel 

    let imageSection = '';
    if (p.item_images && p.item_images.length > 0) {

        //if only one image, carousel not created. otherwise creates carousel class
        if (p.item_images.length === 1) {
        imageSection = `<img src="${p.item_images[0].image_url}" alt="${p.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">`;
        } else {
        // Create carousel for multiple images

        //FIX - need to fix the dots on carousel - doesn't show 
        imageSection = `
            <div class="image-carousel">
            <div class="carousel-container">
                ${p.item_images.map((img, index) => `
                <img src="${img.image_url}" alt="${p.title} ${index + 1}" class="carousel-image ${index === 0 ? 'active' : ''}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                `).join('')}
            </div>
            
            <div class="carousel-dots">
                ${p.item_images.map((_, index) => `
                <span class="dot ${index === 0 ? 'active' : ''}" onclick="showImage(${index})"></span>
                `).join('')}
            </div>
            <button class="carousel-prev" onclick="prevImage()">&#10094;</button>
            <button class="carousel-next" onclick="nextImage()">&#10095;</button>
            </div>
        `;
        }
    } else {
        imageSection = `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==" alt="${p.title}">`;
    }

    //puts all product info from the items table that was called earlier onto screen
    productDetail.innerHTML = `
        <div class="main-content">
        <div class="image-section">
            ${imageSection}
        </div>

        <div class="details-sidebar">
            <h1 style="font-size: 18px; margin-bottom: 8px;">${p.title}</h1>
            <div class="price-tag">${priceFormatted}</div>
            <div class="secondary-text">
            <span>Includes Buyer Protection ⓘ</span>
            </div>

            <table class="info-table">
            <tr><td>Brand</td><td><strong>${p.brand || 'No Brand'}</strong></td></tr>
            <tr><td>Size</td><td><strong>${p.size || 'One Size'}</strong></td></tr>
            <tr><td>Condition</td><td><strong>${conditionFormatted}</strong></td></tr>
            <tr><td>Category</td><td><strong>${p.category.replace(/\b\w/g, l => l.toUpperCase())}</strong></td></tr>
            <tr><td>Uploaded</td><td><strong>${uploadDate}</strong></td></tr>
            <tr><td>Seller</td><td><strong><a href="profile.html?user=${p.users.username}" style="color: #007782; text-decoration: none;">@${p.users.username}</a></strong></td></tr>
            </table>

            <div class="actions">
            <div class="like-watch-buttons">
                <button class="btn btn-like">Like</button>
                <button id="watchButton" class="btn btn-watch" onclick="handleWatch('${p.id}')">Watch</button>
            </div>
            <button class="btn btn-primary" onclick="handleBuyNow('${p.id}')">Buy now</button>
            <button class="btn btn-secondary" onclick="handleOffer('${p.id}', '${p.users.username}', '${p.title.replace(/'/g,"\\'")}')">Offer</button>
            <button class="btn btn-secondary" onclick="handleContact('${p.id}', '${p.users.username}')">Contact Seller</button>
            </div>

            ${p.description ? `
            <div class="description-box">
                <p>${p.description}</p>
            </div>
            ` : ''}
        </div>
        </div>
    `;

    await updateWatchButtonState(p.id);

    if (p.item_images && p.item_images.length > 1) {
        window.currentImageIndex = 0;
    }

    } catch (error) {
    console.error('Error loading product:', error);
    productDetail.innerHTML = "<p>Error loading product.</p>";
    }
}

// showing image for carousel by counting through index and updates dots underneath to show where you are on the carousel e.g how 
//many images are left / gone through. loops once you've gone all the way through (could change to just stop at end)
function showImage(index) {
    const images = document.querySelectorAll('.carousel-image');
    const dots = document.querySelectorAll('.dot');

    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    images[index].classList.add('active');
    dots[index].classList.add('active');
    window.currentImageIndex = index;
}

//next and prev images just check where at carousel it is and if its at the end one or not, to decide whether to loop back or keep going through index

function nextImage() {
    const images = document.querySelectorAll('.carousel-image');
    if (!images.length) return;

    window.currentImageIndex = (window.currentImageIndex + 1) % images.length;
    showImage(window.currentImageIndex);
}

function prevImage() {
    const images = document.querySelectorAll('.carousel-image');
    if (!images.length) return;

    window.currentImageIndex = (window.currentImageIndex - 1 + images.length) % images.length;
    showImage(window.currentImageIndex);
}




//makes sure products always loaded on page open
loadProduct();


async function handleBuyNow(itemId) {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const { data: item, error } = await window.supabase
        .from('items')
        .select(`id, title, price, users!inner(username), is_sold`)
        .eq('id', itemId)
        .single();

    if (error || !item) {
        alert('Unable to load this item. Please try again.');
        return;
    }

    if (item.is_sold) {
        alert('This item has already been purchased.');
        return;
    }

    buyNowItem = item;
    await openBuyNowModal(item);
}

function formatReceiptMoney(value) {
    return `£${parseFloat(value || 0).toFixed(2)}`;
}

async function openBuyNowModal(item) {
    const select = document.getElementById('buyNowDeliverySelect');
    select.innerHTML = DELIVERY_OPTIONS.map((option, index) =>
        `<option value="${option.value}" ${index === 0 ? 'selected' : ''}>${option.label} (£${option.cost.toFixed(2)})</option>`
    ).join('');

    document.getElementById('buyNowItemTitle').textContent = item.title;
    document.getElementById('buyNowItemPrice').textContent = formatReceiptMoney(item.price);
    document.getElementById('buyNowFeeLink').onclick = showAppFeeInfo;
    select.onchange = updateBuyNowTotals;
    updateBuyNowTotals();

    document.getElementById('buyNowModal').style.display = 'flex';
}

function updateBuyNowTotals() {
    const select = document.getElementById('buyNowDeliverySelect');
    const deliveryOption = DELIVERY_OPTIONS.find((o) => o.value === select.value) || DELIVERY_OPTIONS[0];
    const deliveryCost = deliveryOption.cost;
    const total = parseFloat(buyNowItem.price) + deliveryCost + APP_FEE;

    document.getElementById('buyNowDeliveryCost').textContent = formatReceiptMoney(deliveryCost);
    document.getElementById('buyNowTotalPrice').textContent = formatReceiptMoney(total);
}

function showAppFeeInfo(event) {
    event.preventDefault();
    alert('The fee covers secure payments, platform support, and order protection.');
}

async function submitBuyNow() {
    if (!buyNowItem) return;

    const btn = document.getElementById('buyNowConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const deliverySelect = document.getElementById('buyNowDeliverySelect');
    const deliveryOption = DELIVERY_OPTIONS.find((o) => o.value === deliverySelect.value) || DELIVERY_OPTIONS[0];
    const totalPrice = parseFloat(buyNowItem.price) + deliveryOption.cost + APP_FEE;

    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const convId = await getOrCreateConversation(buyNowItem.id, buyNowItem.users.username);
    if (!convId) {
        btn.disabled = false;
        btn.textContent = 'Buy now';
        return;
    }

    const { data: order, error: orderError } = await window.supabase
        .from('orders')
        .insert({
            item_id: buyNowItem.id,
            buyer_id: user.id,
            total_price: totalPrice.toFixed(2),
            status: 'pending'
        })
        .select('id')
        .single();

    if (orderError || !order) {
        alert('Unable to complete purchase. Please try again.');
        console.error(orderError);
        btn.disabled = false;
        btn.textContent = 'Buy now';
        return;
    }

    await window.supabase
        .from('items')
        .update({ is_sold: true })
        .eq('id', buyNowItem.id);

    await window.supabase.from('messages').insert([
        {
            conversation_id: convId,
            sender_id: user.id,
            content: `ORDERSTATUS|pending|${order.id}|${deliveryOption.label}`,
            is_read: false
        },
        {
            conversation_id: convId,
            sender_id: user.id,
            content: `PURCHASECONFIRM|${buyNowItem.title}|${totalPrice.toFixed(2)}`,
            is_read: false
        }
    ]);

    buyNowConversationId = convId;
    window._buyNowConversationId = convId;
    document.getElementById('buyNowModal').style.display = 'none';
    document.getElementById('buyNowSuccessModal').style.display = 'flex';
    btn.textContent = 'Buy now';
    btn.disabled = false;
}

window.closeBuyNowModal = function() {
    document.getElementById('buyNowModal').style.display = 'none';
    document.getElementById('buyNowConfirmBtn').disabled = false;
    document.getElementById('buyNowConfirmBtn').textContent = 'Buy now';
};

window.closeBuyNowSuccessModal = function() {
    document.getElementById('buyNowSuccessModal').style.display = 'none';
};

window.goToMessagesAfterPurchase = function() {
    if (buyNowConversationId) {
        window.location.href = `messages.html?conversation=${buyNowConversationId}`;
    }
};

async function updateWatchButtonState(itemId) {
    const button = document.getElementById('watchButton');
    if (!button) return;

    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
        button.textContent = 'Watch';
        button.classList.remove('btn-watching');
        button.classList.add('btn-watch');
        return;
    }

    const { data: existing, error } = await window.supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .maybeSingle();

    if (error) {
        console.error('Error checking watch status:', error);
        return;
    }

    const isWatching = Boolean(existing);
    button.textContent = isWatching ? 'Watching' : 'Watch';
    button.classList.toggle('btn-watching', isWatching);
    button.classList.toggle('btn-watch', !isWatching);
}

async function handleWatch(itemId) {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const { data: existing, error: existingError } = await window.supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .maybeSingle();

    if (existingError) {
        console.error('Error checking watch status:', existingError);
        alert('Could not update your Watch List.');
        return;
    }

    if (existing) {
        const { error } = await window.supabase
            .from('saved_items')
            .delete()
            .eq('id', existing.id);

        if (error) {
            console.error('Error removing item from watch list:', error);
            alert('Could not remove this item from your Watch List.');
            return;
        }
        alert('Item removed from your Watch List.');
    } else {
        const { error } = await window.supabase
            .from('saved_items')
            .insert({ user_id: user.id, item_id: itemId });

        if (error) {
            console.error('Error saving item to watch list:', error);
            alert('Could not save this item to your Watch List.');
            return;
        }
        alert('Item saved to your Watch List.');
    }

    await updateWatchButtonState(itemId);
}

async function getOrCreateConversation(itemId, sellerUsername) {

    //checks what account user is logge din and if user is authenticated, otherwise returns to login
    //PLEASE KEEP THIS! May seem uncessary cuz it checks on page load anyway but jump between pages sometimes messes up so needs to check again
    const { data: { user: authUser } } = await window.supabase.auth.getUser();
    if (!authUser) { window.location.href = 'login.html'; return null; }

//gets seller and buyer info
    const { data: sellerData, error: sellerErr } = await window.supabase
    .from('users')
    .select('id')
    .eq('username', sellerUsername)
    .single();

    if (sellerErr || !sellerData) { alert('Could not find seller.'); return null; }

    const sellerId = sellerData.id;

    //makes sure you cant offer, message or buy your own listing
    if (authUser.id === sellerId) {
    alert("This is your own listing.");
    return null;
    }

    // checks if already has conversation, if it does retrieves messages, if not creates new conversation and then retrieves messages (so basically either way gets messages but just checks if need to create conversation first or not)
    const { data: existing } = await window.supabase
    .from('conversations')
    .select('id')
    .eq('item_id', itemId)
    .eq('buyer_id', authUser.id)
    .eq('seller_id', sellerId)
    .maybeSingle();

    if (existing) return existing.id;

    //creating conversation in table and then retrieves conversation id to pass to messages
    const { data: newConv, error: createErr } = await window.supabase
    .from('conversations')
    .insert({ item_id: itemId, buyer_id: authUser.id, seller_id: sellerId })
    .select('id')
    .single();

    if (createErr) { alert('Could not start conversation: ' + createErr.message); return null; }
    return newConv.id;
}

//handles contact seller button by getting or creating conversation and then redirecting to messages page with conversation id in url so messages page knows which conversation to load
async function handleContact(itemId, sellerUsername) {
    const convId = await getOrCreateConversation(itemId, sellerUsername);
    if (convId) window.location.href = `messages.html?conversation=${convId}`;}


let pendingOffer = null;
//checks what's being offered, gets information about offer to display with message
async function handleOffer(itemId, sellerUsername, itemTitle) {

    pendingOffer = { itemId, sellerUsername, itemTitle };
    document.getElementById('offerItemTitle').textContent = itemTitle;
    document.getElementById('offerAmount').value = '';
    document.getElementById('offerModal').classList.add('open');
    
    setTimeout(() => document.getElementById('offerAmount').focus(), 100);
}
// creates offer message and uploads conversation to messages table
async function submitOffer() {


    const amount = parseFloat(document.getElementById('offerAmount').value);

    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }

    
    const btn = document.getElementById('offerSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const convId = await getOrCreateConversation(pendingOffer.itemId, pendingOffer.sellerUsername);
    if (!convId) { btn.disabled = false; btn.textContent = 'Send Offer'; return; }

    const { data: { user: authUser } } = await window.supabase.auth.getUser();
    await window.supabase.from('messages').insert([
    {
        conversation_id: convId,
        sender_id: authUser.id,
        content: `Offer: Would you take £${amount.toFixed(2)} for this?`,
        is_read: false
    },
{
conversation_id: convId,
sender_id: authUser.id,
content: `OFFER|PENDING|${amount.toFixed(2)}`,
is_read: false
}
]);

    

    closeOfferModal();
    window.location.href = `messages.html?conversation=${convId}`;
}
//dont think need both of these? can prob combine - will check
function closeOfferModal() {
    document.getElementById('offerModal').classList.remove('open');
    if (document.getElementById('offerSubmitBtn')) {
    document.getElementById('offerSubmitBtn').disabled = false;
    document.getElementById('offerSubmitBtn').textContent = 'Send Offer';
    }
}

document.getElementById('offerModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('offerModal')) closeOfferModal();
});

window.handleOffer   = handleOffer;
window.handleContact = handleContact;
window.submitOffer   = submitOffer;
window.closeOfferModal = closeOfferModal;
window.handleBuyNow = handleBuyNow;
window.handleWatch = handleWatch;