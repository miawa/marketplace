let userData = null;
let userItems = [];
let navContainer = document.getElementById('navContainer');
let itemsTab = document.getElementById('itemsTab');
let reviewsTab = document.getElementById('reviewsTab');
let aboutTab = document.getElementById('aboutTab');

async function loadUserProfile() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userQuery = urlParams.get('user');
    const { data: { user: authUser } } = await window.supabase.auth.getUser();

    let targetUser;
    let isOwnProfile = false;

    if (userQuery) {
      // Viewing another user's profile
      let { data, error } = await window.supabase
        .from('users')
        .select('*')
        .eq('username', userQuery)
        .single();

      if (error || !data) {
        const { data: dataById, error: errorById } = await window.supabase
          .from('users')
          .select('*')
          .eq('id', userQuery)
          .single();

        if (errorById || !dataById) {
          document.getElementById('userName').textContent = 'User not found';
          return;
        }
        targetUser = dataById;
      } else {
        targetUser = data;
      }

      // Check if this is actually the current user's profile
      if (authUser && targetUser.id === authUser.id) {
        isOwnProfile = true;
      }
    } else {
      // Viewing own profile
      if (!authUser) {
        window.location.href = 'login.html';
        return;
      }

      const { data, error } = await window.supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        document.getElementById('userName').textContent = 'Profile not found';
        console.error('Error fetching user profile:', error);
        return;
      }
      targetUser = data;
      isOwnProfile = true;
    }

    userData = targetUser;

    // Fetch user's items
    const { data: items, error: itemsError } = await window.supabase
      .from('items')
      .select('*, item_images(image_url)')
      .eq('seller_id', targetUser.id);

    if (!itemsError) {
      userItems = items || [];
    }

    // Fetch follower/following counts
    const { count: followerCount, error: followerError } = await window.supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUser.id);

    const { count: followingCount, error: followingError } = await window.supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUser.id);

    // Fetch reviews for this user
    const { data: reviews, error: reviewsError } = await window.supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', targetUser.id);

    // Calculate average rating
    let avgRating = 0;
    let reviewCount = 0;
    if (!reviewsError && reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      avgRating = Math.round((totalRating / reviews.length) * 10) / 10;
      reviewCount = reviews.length;
    }

    // Generate stars based on rating
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += '★';
      } else if (i === fullStars && hasHalfStar) {
        starsHtml += '★';
      } else {
        starsHtml += '☆';
      }
    }

    // Populate user info
    document.getElementById('userName').textContent = targetUser.username || 'Unknown User';
    document.getElementById('userAvatar').src = targetUser.avatar_url || 'images/default.png';

    // Update ratings and stats
    document.querySelector('.stars').textContent = starsHtml;
    document.querySelector('.rating-count').textContent = `(${reviewCount})`;
    document.querySelectorAll('.stats span')[0].innerHTML = `<strong>${followerCount || 0}</strong> followers`;
    document.querySelectorAll('.stats span')[1].innerHTML = `<strong>${followingCount || 0}</strong> following`;

    // Update sidebar
    // document.querySelector('.sidebar-avatar').src = targetUser.avatar_url || 'https://rmawimcxlvvmhuznzsnt.supabase.co/storage/v1/object/public/profilePictures/default-avatar.jpg';

    // Show/hide Edit Profile button based on whether it's own profile
    const editBtn = document.getElementById('editProfileBtn');
    if (isOwnProfile) {
      editBtn.style.display = 'inline-block';
    } else {
      editBtn.style.display = 'none';
    }

    // Render items
    loadItems();

  } catch (err) {
    console.error('Error loading profile:', err);
    document.getElementById('userName').textContent = 'Error loading profile';
  }
}
      
function makeProductBox(item) {
  console.log('called');
  const productBox = document.createElement('div');
  productBox.className = 'itemBox';
  productBox.onclick = () => window.location.href = `product.html?id=${item.id}`;
  const imageUrl = item.item_images?.[0]?.image_url || `data:image/svg+xml;base64,...`;
  productBox.innerHTML = `
    <div class="image-wrapper" style="position:relative;">
      <img src="${imageUrl}" alt="${item.title}" onerror="this.src='data:image/svg+xml;base64,...'">
      ${item.is_sold ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;border-radius:8px;"><span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;">SOLD</span></div>` : ''}
    </div>
    <div class="item-info">
      <div class="item-price">£${item.price}</div>
      <div class="item-size">${item.size}</div>
      <div class="item-brand">${item.brand}</div>
    </div>`;
  return productBox;
}

    //puts all users items onto a grid on profile

function loadItems() {
   const grid = document.getElementById('userCloset');
  navContainer.innerHTML = "";
  const grid = document.createElement('div');
  grid.classList.add('items-grid');
  grid.id = 'userCloset';

  // const search = document.getElementById('searchInput').value.toLowerCase();
  grid.innerHTML = '';

  console.log(userItems);
  const active = userItems.filter(i => !i.is_sold);
  const sold   = userItems.filter(i =>  i.is_sold);

  console.log(active);

  console.log(sold);

  if (active.length === 0 && sold.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:50px;">No items found.</p>`;
    return;
  }

  active.forEach(item => grid.appendChild(makeProductBox(item)));

  if (sold.length > 0) {
    const divider = document.createElement('div');
    divider.style = 'grid-column:1/-1;margin:24px 0 8px;font-weight:700;font-size:15px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;';
    divider.textContent = 'Sold';
    grid.appendChild(divider);
    sold.forEach(item => grid.appendChild(makeProductBox(item)));
  }
  
  if (userItems.length <= 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px;">No items found.</p>`;
  }
  navContainer.appendChild(grid);
}

    //modal clicking and handling

    // document.getElementById('searchInput').addEventListener('input', renderProfile);
loadUserProfile();

reviewsTab.addEventListener('click', async (e) => {
  e.preventDefault();
  await loadReviews();
  switchActive(reviewsTab);
});

itemsTab.addEventListener('click', async (e) => {
  e.preventDefault();
  await loadItems();
  switchActive(itemsTab);
});

aboutTab.addEventListener('click', async (e) => {
  e.preventDefault();
  await loadAbout();
  switchActive(aboutTab);
});

function switchActive(tab) {
    reviewsTab.classList.remove('active');
    itemsTab.classList.remove('active');
    aboutTab.classList.remove('active');
    tab.classList.add('active');
}

function loadAbout() {
    navContainer.innerHTML = "";

    const aboutHtml = '<p style="grid-column: 1/-1; text-align: center; padding: 50px;">No about info.</p>';
    navContainer.innerHTML = aboutHtml;
}

// document.getElementById('closeReviewsBtn').addEventListener('click', () => {
//   document.getElementById('reviewsModal').style.display = 'none';
// });

   
// document.getElementById('reviewsModal').addEventListener('click', (e) => {
//   if (e.target.id === 'reviewsModal') {
//     document.getElementById('reviewsModal').style.display = 'none';
//   }
// });

    //modal clicking end--------------

async function loadReviews() {
  try {
    const { data: { user: authUser } } = await window.supabase.auth.getUser();
    if (!authUser) return;

    // fetch reviews for the current user with supabase 
    const { data: reviews, error } = await window.supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_id')
      .eq('reviewee_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return;
    }

    // fetching reviewer information from supabase
    const reviewsWithReviewers = await Promise.all(
      (reviews || []).map(async (review) => {
        if (review.reviewer_id) {
          const { data: reviewer } = await window.supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', review.reviewer_id)
            .single();
          return { ...review, reviewer };
        }
        return { ...review, reviewer: null };
      })
    );

    navContainer.innerHTML = '';

    if (!reviewsWithReviewers || reviewsWithReviewers.length === 0) {
      navContainer.innerHTML = '<p style="text-align: center; color: #999;">No reviews yet</p>';
    //   document.getElementById('reviewsModal').style.display = 'flex';
      return;
    }
    //basic fallback for review information. best if user is deleted or cannot be loaded
    //preferably always 'load' user information with a default avatar and username for fallback
    reviewsWithReviewers.forEach((review) => {
      const reviewer = review.reviewer;
      const reviewerName = reviewer?.username || 'Anonymous';
      const reviewerAvatar = reviewer?.avatar_url || 'https://rmawimcxlvvmhuznzsnt.supabase.co/storage/v1/object/public/profilePictures/default-avatar.jpg';

      // stars for their review based on their rating
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        starsHtml += i < review.rating ? '★' : '☆';
      }

      const reviewDate = new Date(review.created_at).toLocaleDateString();
    //creating look for the reviews portion with review information, image of review etc
      const reviewBox = document.createElement('div');
      reviewBox.className = 'reviewBox';
      reviewBox.innerHTML = `
        <div class="review-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${reviewerAvatar}" alt="${reviewerName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            <span class="reviewer-name">${reviewerName}</span>
          </div>
          <span class="review-rating">${starsHtml}</span>
        </div>
        <p class="review-comment">${review.comment || 'No comment'}</p>
        <div class="review-date">${reviewDate}</div>
      `;
      navContainer.appendChild(reviewBox);
    });

    // document.getElementById('reviewsModal').style.display = 'flex';

  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}

    // edit profile button
document.getElementById('editProfileBtn').addEventListener('click', async () => {
  const { data: { user: authUser } } = await window.supabase.auth.getUser();
  if (!authUser || !userData) return;

  //fills form with current correct user data
  document.getElementById('editFullName').value = userData.full_name || '';
    document.getElementById('editBio').value = userData.bio || '';
    document.getElementById('editAvatarPreview').src = userData.avatar_url || 'https://rmawimcxlvvmhuznzsnt.supabase.co/storage/v1/object/public/profilePictures/default-avatar.jpg';

  document.getElementById('editProfileModal').style.display = 'flex';
});

    
document.getElementById('closeEditBtn').addEventListener('click', () => {
  document.getElementById('editProfileModal').style.display = 'none';
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
  document.getElementById('editProfileModal').style.display = 'none';
});

//preview profile picture
document.getElementById('avatarInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('editAvatarPreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

//basic, closes modal when clicking off
document.getElementById('editProfileModal').addEventListener('click', (e) => {
  if (e.target.id === 'editProfileModal') {
    document.getElementById('editProfileModal').style.display = 'none';
  }
});

//allowing user to change profile information, reloads state and updates web
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const { data: { user: authUser } } = await window.supabase.auth.getUser();
    if (!authUser) return;

    let avatarUrl = userData.avatar_url;

    
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput.files.length > 0) {
      const file = avatarInput.files[0];
      const filePath = `${authUser.id}/avatar_${Date.now()}.jpg`;

      const { error: uploadError } = await window.supabase.storage
        .from('profilePictures')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = window.supabase.storage
        .from('profilePictures')
        .getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }

    const { error } = await window.supabase
      .from('users')
      .update({
        full_name: document.getElementById('editFullName').value,
        bio: document.getElementById('editBio').value,
        avatar_url: avatarUrl
      })
      .eq('id', authUser.id);

    if (error) throw error;

    
    document.getElementById('editProfileModal').style.display = 'none';
    await loadUserProfile();
    alert('Profile updated successfully!');

  } catch (err) {
    console.error('Error updating profile:', err);
    alert('Error updating profile: ' + err.message);
  }
})