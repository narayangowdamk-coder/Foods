/* ============================================================
   MC WEBSITE — SCRIPT
   Vanilla JS only. Handles: menu rendering, live search,
   cart (add/remove/qty/totals), cart panel, scroll animations,
   mobile nav.
   ============================================================ */

/* ---------- 1. FOOD DATA ---------- */
// Prices in INR. Ratings out of 5.
const foodItems = [
  {
    id: 'egg-bhurji',
    name: 'Masala Egg Bhurji',
    category: 'Breakfast',
    description: 'Scrambled eggs simmered with onion, tomato, green chilli and fresh coriander.',
    price: 129,
    rating: 4.5,
    img: foodImages['egg-bhurji']
  },
  {
    id: 'tomato-curry-rice',
    name: 'Kadai Curry with Steamed Rice',
    category: 'Curries & Rice',
    description: 'A rich tomato-onion kadai gravy served over fluffy steamed rice.',
    price: 189,
    rating: 4.6,
    img: foodImages['tomato-curry-rice']
  },
  {
    id: 'bhindi-masala',
    name: 'Bhindi Masala',
    category: 'Vegetables',
    description: 'Crisp okra tossed with onions, tomato and a blend of home-ground spices.',
    price: 149,
    rating: 4.4,
    img: foodImages['bhindi-masala']
  },
  {
    id: 'dal-tadka',
    name: 'Dal Tadka',
    category: 'Dal',
    description: 'Yellow lentils slow-cooked and finished with a smoky ghee tempering.',
    price: 119,
    rating: 4.7,
    img: foodImages['dal-tadka']
  },
  {
    id: 'tomato-dal',
    name: 'Tomato Katori Dal',
    category: 'Dal',
    description: 'Tangy tomato-forward dal tempered with mustard seeds and curry leaves.',
    price: 129,
    rating: 4.5,
    img: foodImages['tomato-dal']
  },
  {
    id: 'matar-paneer-roti',
    name: 'Matar Paneer with Roti',
    category: 'Combo',
    description: 'Soft paneer and green peas in a creamy tomato gravy, served with fresh roti.',
    price: 179,
    rating: 4.8,
    img: foodImages['matar-paneer-roti']
  }
];

/* ---------- 2. STATE ---------- */
// cart: { [id]: quantity }
let cart = {};
const GST_RATE = 0.05;
const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 499;

/* ---------- 3. DOM REFS ---------- */
const menuGrid = document.getElementById('menuGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const cartBtn = document.getElementById('cartBtn');
const cartClose = document.getElementById('cartClose');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartCount = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartSummaryEl = document.getElementById('cartSummary');
const subtotalEl = document.getElementById('subtotal');
const gstEl = document.getElementById('gst');
const deliveryEl = document.getElementById('delivery');
const grandTotalEl = document.getElementById('grandTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const toast = document.getElementById('toast');

/* Per-card selector quantity (before adding to cart), keyed by food id */
const selectorQty = {};
foodItems.forEach(item => { selectorQty[item.id] = 1; });

/* ---------- 4. RENDER STAR RATING ---------- */
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalf) stars += '½';
  return `${stars} ${rating.toFixed(1)}`;
}

/* ---------- 5. RENDER MENU ---------- */
function renderMenu(items) {
  menuGrid.innerHTML = '';

  if (items.length === 0) {
    noResults.hidden = false;
    return;
  }
  noResults.hidden = true;

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'food-card fade-in';
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="food-media">
        <img src="${item.img}" alt="${item.name}" loading="lazy">
        <span class="food-category">${item.category}</span>
        <span class="food-rating">${renderStars(item.rating)}</span>
      </div>
      <div class="food-body">
        <h3 class="food-name">${item.name}</h3>
        <p class="food-desc">${item.description}</p>
        <p class="food-price">₹${item.price}</p>
        <div class="food-actions">
          <div class="qty-control" data-id="${item.id}">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">&minus;</button>
            <span class="qty-value">${selectorQty[item.id]}</span>
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="btn-add" data-id="${item.id}">Add to Cart</button>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });

  // Re-observe newly created cards for fade-in
  document.querySelectorAll('.food-card.fade-in').forEach(el => scrollObserver.observe(el));
}

/* ---------- 6. QUANTITY SELECTOR (per card, before adding) ---------- */
menuGrid.addEventListener('click', (e) => {
  const minusBtn = e.target.closest('.qty-minus');
  const plusBtn = e.target.closest('.qty-plus');
  const addBtn = e.target.closest('.btn-add');

  if (minusBtn) {
    const id = minusBtn.closest('.qty-control').dataset.id;
    selectorQty[id] = Math.max(1, selectorQty[id] - 1);
    minusBtn.closest('.qty-control').querySelector('.qty-value').textContent = selectorQty[id];
  }

  if (plusBtn) {
    const id = plusBtn.closest('.qty-control').dataset.id;
    selectorQty[id] = Math.min(20, selectorQty[id] + 1);
    plusBtn.closest('.qty-control').querySelector('.qty-value').textContent = selectorQty[id];
  }

  if (addBtn) {
    const id = addBtn.dataset.id;
    addToCart(id, selectorQty[id]);
    // Reset the on-card selector back to 1 after adding
    selectorQty[id] = 1;
    const control = menuGrid.querySelector(`.qty-control[data-id="${id}"] .qty-value`);
    if (control) control.textContent = '1';

    addBtn.classList.add('added');
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Added ✓';
    setTimeout(() => {
      addBtn.classList.remove('added');
      addBtn.textContent = originalText;
    }, 1100);
  }
});

/* ---------- 7. CART LOGIC ---------- */
function addToCart(id, qty) {
  cart[id] = (cart[id] || 0) + qty;
  updateCartUI();
  showToast(`Added ${foodItems.find(f => f.id === id).name} to cart`);
}

function changeCartQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  updateCartUI();
}

function removeFromCart(id) {
  delete cart[id];
  updateCartUI();
}

function getCartCount() {
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function getSubtotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = foodItems.find(f => f.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
}

function updateCartUI() {
  const count = getCartCount();
  cartCount.textContent = count;

  const entries = Object.entries(cart);

  if (entries.length === 0) {
    cartItemsEl.style.display = 'none';
    cartEmptyEl.style.display = 'flex';
    cartSummaryEl.style.display = 'none';
    return;
  }

  cartItemsEl.style.display = 'flex';
  cartEmptyEl.style.display = 'none';
  cartSummaryEl.style.display = 'block';

  cartItemsEl.innerHTML = '';
  entries.forEach(([id, qty]) => {
    const item = foodItems.find(f => f.id === id);
    if (!item) return;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <h5>${item.name}</h5>
        <div class="item-price">₹${item.price * qty}</div>
        <div class="cart-item-qty">
          <button type="button" class="dec" data-id="${id}" aria-label="Decrease quantity">&minus;</button>
          <span>${qty}</span>
          <button type="button" class="inc" data-id="${id}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="cart-item-remove" data-id="${id}">Remove</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  const subtotal = getSubtotal();
  const gst = subtotal * GST_RATE;
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_CHARGE;
  const grandTotal = subtotal + gst + delivery;

  subtotalEl.textContent = `₹${subtotal.toFixed(0)}`;
  gstEl.textContent = `₹${gst.toFixed(0)}`;
  deliveryEl.textContent = delivery === 0 ? 'Free' : `₹${delivery.toFixed(0)}`;
  grandTotalEl.textContent = `₹${grandTotal.toFixed(0)}`;
}

cartItemsEl.addEventListener('click', (e) => {
  const inc = e.target.closest('.inc');
  const dec = e.target.closest('.dec');
  const remove = e.target.closest('.cart-item-remove');

  if (inc) changeCartQty(inc.dataset.id, 1);
  if (dec) changeCartQty(dec.dataset.id, -1);
  if (remove) removeFromCart(remove.dataset.id);
});

/* ---------- 8. CART PANEL OPEN/CLOSE ---------- */
function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('active');
}
function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('active');
}
cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

/* ---------- 9. CHECKOUT ---------- */
checkoutBtn.addEventListener('click', () => {
  if (getCartCount() === 0) {
    showToast('Your cart is empty — add a dish first');
    return;
  }
  showToast('Order placed! Your food is on its way 🍽️');
  cart = {};
  updateCartUI();
  setTimeout(closeCart, 900);
});

/* ---------- 10. LIVE SEARCH ---------- */
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = foodItems.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query)
  );
  renderMenu(filtered);
});

/* ---------- 11. MOBILE NAV ---------- */
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ---------- 12. TOAST ---------- */
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- 13. SCROLL FADE-IN ANIMATION ---------- */
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      scrollObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => scrollObserver.observe(el));

/* ---------- 14. HERO IMAGES ---------- */
// Hero graphic images are set here (rather than inline in HTML) so they
// share the same embedded base64 source as the menu cards.
document.getElementById('heroOrbit1').src = foodImages['tomato-dal'];
document.getElementById('heroOrbit2').src = foodImages['bhindi-masala'];
document.getElementById('heroOrbit3').src = foodImages['dal-tadka'];
document.getElementById('heroOrbit4').src = foodImages['matar-paneer-roti'];
document.getElementById('heroCenter').src = foodImages['egg-bhurji'];

/* ---------- 15. INIT ---------- */
renderMenu(foodItems);
updateCartUI();
