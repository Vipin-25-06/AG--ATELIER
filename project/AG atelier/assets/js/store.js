(function () {
  'use strict';

  var CART_KEY = 'ag-atelier-cart';
  var WISHLIST_KEY = 'ag-atelier-wishlist';
  var catalog = {};

  function read(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  function productFromElement(element) {
    var card = element.closest('.product-card');
    var image = card && card.querySelector('img');
    var price = card && card.querySelector('.price-current, .price');
    var name = card && card.querySelector('.product-card-name');
    var detailName = document.getElementById('product-title');
    var detailPrice = document.getElementById('product-price');
    var detailImage = document.getElementById('gallery-main-img');
    var id = element.dataset.productId;
    var value = (price ? price.textContent : detailPrice && detailPrice.textContent || '').replace(/[^0-9.]/g, '');

    return {
      id: id,
      name: (name ? name.textContent : detailName && detailName.textContent || 'Product').trim(),
      price: Number(value) || 0,
      image: image ? image.getAttribute('src') : detailImage && detailImage.getAttribute('src') || '',
      quantity: 1,
      size: (document.querySelector('.size-btn.selected') || {}).dataset && document.querySelector('.size-btn.selected').dataset.size || 'OS',
      color: (document.querySelector('.color-btn.selected') || {}).dataset && document.querySelector('.color-btn.selected').dataset.color || ''
    };
  }

  function registerCatalog() {
    document.querySelectorAll('[data-product-id]').forEach(function (element) {
      var id = element.dataset.productId;
      if (!catalog[id] && (element.matches('.btn-add-cart, .btn-add-to-cart, .btn-wishlist, .btn-add-wishlist') || element.closest('.product-card'))) {
        catalog[id] = productFromElement(element);
      }
    });
  }

  function cart() { return read(CART_KEY, []); }
  function wishlist() { return read(WISHLIST_KEY, []); }

  function updateBadges() {
    var cartCount = cart().reduce(function (total, item) { return total + item.quantity; }, 0);
    var wishlistCount = wishlist().length;
    document.querySelectorAll('#cart-badge').forEach(function (badge) {
      badge.textContent = cartCount;
      badge.setAttribute('aria-label', cartCount + ' items in cart');
      badge.hidden = cartCount === 0;
    });
    document.querySelectorAll('#wishlist-badge').forEach(function (badge) {
      badge.textContent = wishlistCount;
      badge.setAttribute('aria-label', wishlistCount + ' items in wishlist');
      badge.hidden = wishlistCount === 0;
    });
  }

  function syncWishlistButtons() {
    var saved = wishlist().map(function (item) { return item.id; });
    document.querySelectorAll('[data-action="toggle-wishlist"]').forEach(function (button) {
      var active = saved.indexOf(button.dataset.productId) !== -1;
      button.classList.toggle('saved', active);
      button.textContent = active ? '♥' : (button.classList.contains('btn-add-wishlist') ? '♡' : '🤍');
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? 'Remove ' : 'Add ') + 'product from wishlist');
    });
  }

  function addToCart(product, quantity) {
    var items = cart();
    var existing = items.find(function (item) { return item.id === product.id; });
    if (existing) {
      existing.quantity += quantity || 1;
    } else {
      product.quantity = quantity || 1;
      items.push(product);
    }
    write(CART_KEY, items);
    updateBadges();
  }

  function toggleWishlist(product) {
    var items = wishlist();
    var index = items.findIndex(function (item) { return item.id === product.id; });
    if (index === -1) items.push(product);
    else items.splice(index, 1);
    write(WISHLIST_KEY, items);
    updateBadges();
    syncWishlistButtons();
    if (document.getElementById('wishlist-grid')) renderWishlist();
  }

  function renderCart() {
    var container = document.getElementById('cart-items');
    if (!container) return;
    var items = cart();
    container.innerHTML = items.length ? items.map(function (item) {
      return '<div class="cart-item" data-product-id="' + item.id + '">' +
        '<div class="cart-item-image"><img src="' + item.image + '" alt="' + item.name + '"></div>' +
        '<div class="cart-item-details"><p class="cart-item-name">' + item.name + '</p>' +
        '<p class="cart-item-meta">Size: ' + (item.size || 'OS') + (item.color ? ' | Color: ' + item.color : '') + '</p>' +
        '<p class="cart-item-unit-price">' + money(item.price) + '</p>' +
        '<div class="cart-qty-stepper"><button type="button" class="cart-qty-btn" data-action="qty-decrease" data-product-id="' + item.id + '" aria-label="Decrease quantity">−</button>' +
        '<span class="cart-qty-display" aria-live="polite">' + item.quantity + '</span>' +
        '<button type="button" class="cart-qty-btn" data-action="qty-increase" data-product-id="' + item.id + '" aria-label="Increase quantity">+</button></div></div>' +
        '<div class="cart-item-right"><span class="cart-item-total">' + money(item.price * item.quantity) + '</span>' +
        '<button type="button" class="btn-remove" data-action="remove-item" data-product-id="' + item.id + '" aria-label="Remove ' + item.name + ' from cart">🗑</button></div></div>';
    }).join('') : '<p class="empty-state">Your cart is empty.</p>';
    var count = items.reduce(function (total, item) { return total + item.quantity; }, 0);
    var subtotal = items.reduce(function (total, item) { return total + item.price * item.quantity; }, 0);
    var label = document.querySelector('.summary-line-label');
    if (label) label.textContent = 'Subtotal (' + count + ' items)';
    ['summary-subtotal', 'summary-total'].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.textContent = money(subtotal);
    });
  }

  function renderWishlist() {
    var grid = document.getElementById('wishlist-grid');
    if (!grid) return;
    var items = wishlist();
    grid.innerHTML = items.length ? items.map(function (item) {
      return '<article class="product-card" id="wl-' + item.id + '"><div class="product-card-image"><img src="' + item.image + '" alt="' + item.name + '">' +
        '<button type="button" class="btn-wishlist-remove" data-action="remove-wishlist" data-product-id="' + item.id + '" aria-label="Remove ' + item.name + ' from wishlist">✕</button></div>' +
        '<div class="product-card-body"><h3 class="product-card-name">' + item.name + '</h3><div class="product-card-price"><span class="price-current">' + money(item.price) + '</span></div>' +
        '<button type="button" class="btn-move-to-cart" data-action="move-to-cart" data-product-id="' + item.id + '">🛍 Move to Cart</button></div></article>';
    }).join('') : '<p class="empty-state">Your wishlist is empty.</p>';
    var count = document.getElementById('wishlist-count');
    if (count) count.textContent = items.length + (items.length === 1 ? ' item' : ' items') + ' saved for later';
  }

  function seed() {
    if (!localStorage.getItem(CART_KEY)) {
      var seededCart = [];
      document.querySelectorAll('#cart-items > .cart-item').forEach(function (row) {
        var id = row.dataset.productId;
        var price = row.querySelector('.cart-item-unit-price').textContent.replace(/[^0-9.]/g, '');
        var quantity = Number(row.querySelector('.cart-qty-display').textContent) || 1;
        var image = row.querySelector('img');
        var name = row.querySelector('.cart-item-name');
        seededCart.push({ id: id, name: name.textContent.trim(), price: Number(price), image: image.src, quantity: quantity });
      });
      if (seededCart.length) write(CART_KEY, seededCart);
    }
    if (!localStorage.getItem(WISHLIST_KEY)) {
      var seededWishlist = [];
      document.querySelectorAll('#wishlist-grid [data-action="remove-wishlist"]').forEach(function (button) {
        var card = button.closest('.product-card');
        var price = card.querySelector('.price-current, .price').textContent.replace(/[^0-9.]/g, '');
        seededWishlist.push({ id: button.dataset.productId, name: card.querySelector('.product-card-name').textContent.trim(), price: Number(price), image: card.querySelector('img').src, quantity: 1 });
      });
      if (seededWishlist.length) write(WISHLIST_KEY, seededWishlist);
    }
  }

  document.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control) return;
    var action = control.dataset.action;
    var id = control.dataset.productId;
    if (action === 'add-to-cart') { addToCart(productFromElement(control), Number(document.getElementById('qty-display') && document.getElementById('qty-display').textContent) || 1); }
    if (action === 'toggle-wishlist') toggleWishlist(productFromElement(control));
    if (action === 'remove-wishlist') toggleWishlist({ id: id });
    if (action === 'clear-wishlist') { write(WISHLIST_KEY, []); renderWishlist(); updateBadges(); }
    if (action === 'move-to-cart') { var wanted = wishlist().find(function (item) { return item.id === id; }); if (wanted) addToCart(wanted, 1); toggleWishlist({ id: id }); }
    if (action === 'remove-item') { write(CART_KEY, cart().filter(function (item) { return item.id !== id; })); renderCart(); updateBadges(); }
    if (action === 'qty-increase' || action === 'qty-decrease') { var items = cart(); var item = items.find(function (entry) { return entry.id === id; }); if (item) { item.quantity = Math.max(1, item.quantity + (action === 'qty-increase' ? 1 : -1)); write(CART_KEY, items); renderCart(); updateBadges(); } }
  });

  document.addEventListener('DOMContentLoaded', function () {
    seed();
    registerCatalog();
    renderCart();
    renderWishlist();
    updateBadges();
    syncWishlistButtons();
    document.querySelectorAll('[data-action="qty-increase"], [data-action="qty-decrease"]').forEach(function (button) {
      if (button.closest('#cart-items')) return;
      button.addEventListener('click', function () {
        var display = document.getElementById('qty-display');
        var value = Number(display.textContent) + (button.dataset.action === 'qty-increase' ? 1 : -1);
        display.textContent = Math.max(1, value);
      });
    });
  });
}());
