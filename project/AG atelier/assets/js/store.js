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

  function filterProducts(searchTerm) {
    var grid = document.getElementById('shop-product-grid');
    if (!grid) return;
    var query = searchTerm.trim().toLocaleLowerCase();
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
    var visibleCount = 0;
    cards.forEach(function (card) {
      var name = card.querySelector('.product-card-name');
      var image = card.querySelector('img');
      var searchableText = [
        name ? name.textContent : '',
        image ? image.alt : ''
      ].join(' ').toLocaleLowerCase();
      var matches = !query || searchableText.indexOf(query) !== -1;
      var originFilter = document.querySelector('input[name=origin]:checked');
      if (originFilter && originFilter.value !== 'all') matches = matches && (card.dataset.origin || 'atelier') === originFilter.value;
      card.hidden = !matches;
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });
    var count = document.getElementById('results-count');
    if (count) count.textContent = query
      ? 'Showing ' + visibleCount + ' of ' + cards.length + ' products'
      : 'Showing ' + cards.length + ' products';
    var empty = document.getElementById('product-search-empty');
    if (!empty) {
      empty = document.createElement('p');
      empty.id = 'product-search-empty';
      empty.className = 'empty-state';
      empty.hidden = true;
      grid.parentNode.insertBefore(empty, grid.nextSibling);
    }
    empty.textContent = 'No products found for "' + searchTerm.trim() + '".';
    empty.hidden = !query || visibleCount > 0;
  }

  function initializeProductSearch() {
    var input = document.getElementById('nav-search-input');
    if (!input) return;
    var parameters = new URLSearchParams(window.location.search || '');
    var initialQuery = parameters.get('search') || '';
    if (initialQuery) input.value = initialQuery;
    filterProducts(initialQuery);
    var sort = document.getElementById('sort-select');
    if (sort) sort.addEventListener('change', sortProducts);
    document.querySelectorAll('input[name=origin]').forEach(function (input) { input.addEventListener('change', function () { filterProducts(document.getElementById('nav-search-input').value); }); });
    input.addEventListener('input', function () {
      filterProducts(input.value);
    });
  }


  var SELLER_PRODUCTS_KEY = 'ag-atelier-seller-products';

  function sellerProducts() {
    var items = read(SELLER_PRODUCTS_KEY, []);
    return items.filter(function (item) {
      return item && typeof item.id === 'string' && typeof item.name === 'string' &&
        Number(item.price) > 0 && typeof item.image === 'string';
    });
  }

  function renderSellerProducts() {
    var grid = document.getElementById('shop-product-grid');
    if (!grid) return;
    sellerProducts().forEach(function (product) {
      if (grid.querySelector('[data-product-id="' + product.id + '"]')) return;
      var card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.origin = product.origin === 'artist' ? 'artist' : 'atelier';
      card.dataset.createdAt = product.createdAt || '';
      var imageWrap = document.createElement('div');
      imageWrap.className = 'product-card-image';
      var image = document.createElement('img');
      image.src = product.image;
      image.alt = product.name;
      imageWrap.appendChild(image);
      var badge = document.createElement('span');
      badge.className = 'product-card-badge badge-tag badge-new';
      badge.textContent = product.origin === 'artist' ? 'LOCAL ARTIST' : 'AG ATELIER';
      imageWrap.appendChild(badge);
      var body = document.createElement('div');
      body.className = 'product-card-body';
      var title = document.createElement('h3');
      title.className = 'product-card-name';
      title.textContent = product.name;
      body.appendChild(title);
      var creator = document.createElement('p');
      creator.className = 'product-card-creator';
      creator.textContent = product.origin === 'artist' ? 'By ' + product.artist : 'By AG ATELIER';
      body.appendChild(creator);
      var priceWrap = document.createElement('div');
      priceWrap.className = 'product-card-price';
      var price = document.createElement('span');
      price.className = 'price';
      price.textContent = money(product.price);
      priceWrap.appendChild(price);
      body.appendChild(priceWrap);
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn-add-cart';
      add.dataset.action = 'add-to-cart';
      add.dataset.productId = product.id;
      add.textContent = 'Add to Cart';
      body.appendChild(add);
      card.appendChild(imageWrap);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function sortProducts() {
    var grid = document.getElementById('shop-product-grid');
    var select = document.getElementById('sort-select');
    if (!grid || !select) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
    cards.forEach(function (card, index) {
      if (!card.dataset.featuredOrder) card.dataset.featuredOrder = String(index);
      if (!card.dataset.origin) card.dataset.origin = 'atelier';
    });
    var mode = select.value;
    cards.sort(function (a, b) {
      if (mode === 'featured') return Number(a.dataset.featuredOrder) - Number(b.dataset.featuredOrder);
      if (mode === 'newest') return (Date.parse(b.dataset.createdAt || '') || 0) - (Date.parse(a.dataset.createdAt || '') || 0);
      var aPrice = Number((a.querySelector('.price-current, .price') || {}).textContent.replace(/[^0-9.]/g, '')) || 0;
      var bPrice = Number((b.querySelector('.price-current, .price') || {}).textContent.replace(/[^0-9.]/g, '')) || 0;
      if (mode === 'price-asc') return aPrice - bPrice;
      if (mode === 'price-desc') return bPrice - aPrice;
      if (mode === 'rating') {
        var aRatingNode = a.querySelector('.rating-value');
        var bRatingNode = b.querySelector('.rating-value');
        return (Number(bRatingNode ? bRatingNode.textContent : 0) || 0) - (Number(aRatingNode ? aRatingNode.textContent : 0) || 0);
      }
      return 0;
    });
    cards.forEach(function (card) { grid.appendChild(card); });
  }

  function saveSellerProduct(name, price, image, origin, creator) {
    var products = sellerProducts();
    products.push({ id: 'seller-' + Date.now().toString(36), name: name, price: price, image: image, origin: origin, artist: creator, createdAt: new Date().toISOString() });
    try {
      write(SELLER_PRODUCTS_KEY, products);
      window.location.href = 'shop.html';
    } catch (error) {
      var message = document.getElementById('seller-error');
      if (message) {
        message.textContent = 'Could not save this product. Try a smaller image or check browser storage.';
        message.hidden = false;
      }
    }
  }

  function submitSellerProduct(form) {
    var name = document.getElementById('seller-product-name').value.trim();
    var price = Number(document.getElementById('seller-product-price').value);
    var imageUrl = document.getElementById('seller-product-image').value.trim();
    var imageFile = document.getElementById('seller-product-file').files[0];
    var origin = document.getElementById('seller-product-origin').value;
    var creator = document.getElementById('seller-product-creator').value.trim();
    var message = document.getElementById('seller-error');
    if (!name || !Number.isFinite(price) || price <= 0 || (!imageUrl && !imageFile) || (origin === 'artist' && !creator)) {
      if (message) {
        message.textContent = 'Enter product details and provide an image URL or choose an image file.';
        message.hidden = false;
      }
      return;
    }
    if (imageFile) {
      if (!imageFile.type || imageFile.type.indexOf('image/') !== 0) {
        if (message) { message.textContent = 'Choose a valid image file.'; message.hidden = false; }
        return;
      }
      if (imageFile.size > 1572864) {
        if (message) { message.textContent = 'Please choose an image smaller than 1.5 MB.'; message.hidden = false; }
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { saveSellerProduct(name, price, reader.result, origin, creator); };
      reader.onerror = function () {
        if (message) { message.textContent = 'Could not read that image. Please try another file.'; message.hidden = false; }
      };
      reader.readAsDataURL(imageFile);
      return;
    }
    saveSellerProduct(name, price, imageUrl, origin, creator);
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

  var originSelect = document.getElementById('seller-product-origin');
  var creatorInput = document.getElementById('seller-product-creator');
  if (originSelect && creatorInput) {
    var updateCreatorRequirement = function () { creatorInput.required = originSelect.value === 'artist'; };
    originSelect.addEventListener('change', updateCreatorRequirement);
    updateCreatorRequirement();
  }

  document.addEventListener('submit', function (event) {
    if (event.target && event.target.id === 'seller-product-form') {
      event.preventDefault();
      if (event.target.checkValidity()) submitSellerProduct(event.target);
      else event.target.reportValidity();
    }
  });

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
    renderSellerProducts();
    registerCatalog();
    initializeProductSearch();
    sortProducts();
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
