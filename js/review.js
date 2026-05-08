// Get item ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('itemId');

let currentRating = 0;
let itemData = null;

    async function loadReviewPage() {
    if (!itemId) {
    alert('Item ID not provided');
    window.location.href = 'index.html';
    return;
    }

  try {
    // Check if user is authenticated
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Fetch item details
    const { data: item, error } = await window.supabase
      .from('items')
      .select(`
        *,
        users!inner(id, username),
        item_images(image_url)
      `)
      .eq('id', itemId)
      .single();

    if (error || !item) {
      alert('Item not found');
      window.location.href = 'index.html';
      return;
    }

    itemData = item;

    // Populate item details
    document.getElementById('itemTitle').textContent = item.title;
    document.getElementById('itemPrice').textContent = `£${item.price.toFixed(2)}`;
    document.getElementById('sellerName').textContent = `@${item.users.username}`;

    // Set item image
    const imageUrl = item.item_images && item.item_images.length > 0
      ? item.item_images[0].image_url
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    document.getElementById('itemImage').src = imageUrl;

   
    initializeStarRating();

  } catch (error) {
    console.error('Error loading review page:', error);
    alert('Error loading review page');
    window.location.href = 'index.html';
  }
}

function initializeStarRating() {
  const stars = document.querySelectorAll('.star');
  const ratingText = document.getElementById('ratingText');

    stars.forEach(star => {
        star.addEventListener('click', function(e) {
        const rating = parseInt(this.dataset.rating);
        setRating(rating);
        });

    
    star.addEventListener('mousemove', function(e) {
      if (currentRating === 0) {

        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const halfWidth = rect.width / 2;

      }
    });

    star.addEventListener('mouseleave', function() {
      this.classList.remove('half-hover');
    });
  });

    function setRating(rating) {
        currentRating = rating;
        stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
        });

    // updates text
    const ratingTexts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    ratingText.textContent = ratingTexts[rating] || 'Click to rate';
  }
}

async function submitReview() {
  if (currentRating === 0) {
    alert('Please select a rating');
    return;
  }

  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const comment = document.getElementById('reviewComment').value.trim();

    // submit
    const { error } = await window.supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        reviewee_id: itemData.users.id,
        item_id: itemId,
        rating: currentRating,
        comment: comment || null
      });

    if (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review: ' + error.message);
      return;
    }

    //for marking as sold
    
    // await window.supabase
    //   .from('items')
    //   .update({ is_sold: true })
    //   .eq('id', itemId);

    alert('Thank you for your review!');
    window.location.href = 'index.html';

  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Error submitting review');
  }
}

function skipReview() {
  window.location.href = 'index.html';
}


document.addEventListener('DOMContentLoaded', loadReviewPage);