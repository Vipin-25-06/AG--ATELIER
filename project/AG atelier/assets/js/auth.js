(function () {
  'use strict';

  var ACCOUNT_KEY = 'ag-atelier-account';
  var SESSION_KEY = 'ag-atelier-session';
  var CART_KEY = 'ag-atelier-cart';
  var ORDERS_KEY = 'ag-atelier-orders';

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (error) { return null; }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showError(form, message) {
    var error = form.querySelector('.auth-error');
    if (!error) {
      error = document.createElement('p');
      error.className = 'auth-error';
      error.setAttribute('role', 'alert');
      error.style.color = '#ba1a1a';
      error.style.marginTop = '0.75rem';
      form.appendChild(error);
    }
    error.textContent = message;
  }

  function valid(form) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    var captcha = form.querySelector('#captcha-input');
    var code = form.querySelector('#captcha-text');
    if (captcha && code && captcha.value.trim().toUpperCase() !== code.textContent.trim().toUpperCase()) {
      showError(form, 'Please enter the security code exactly as shown.');
      return false;
    }
    return true;
  }

  function accounts() {
    var saved = read(ACCOUNT_KEY);
    if (Array.isArray(saved)) {
      return saved.filter(function (account) {
        return account && typeof account.name === 'string' &&
          typeof account.email === 'string' && typeof account.password === 'string';
      });
    }
    return saved && typeof saved.name === 'string' &&
      typeof saved.email === 'string' && typeof saved.password === 'string' ? [saved] : [];
  }

  function cartItems() {
    var items = read(CART_KEY);
    return Array.isArray(items) ? items.filter(function (item) {
      return item && typeof item.name === 'string' &&
        Number.isFinite(Number(item.price)) && Number.isFinite(Number(item.quantity));
    }) : [];
  }

  function orderItems() {
    var items = read(ORDERS_KEY);
    return Array.isArray(items) ? items : [];
  }

  function hasPreviousOrder(email) {
    var normalizedEmail = String(email || '').trim().toLowerCase();
    return orderItems().some(function (order) {
      return String(order.email || '').trim().toLowerCase() === normalizedEmail && String(order.status || '').toLowerCase() !== 'cancelled';
    });
  }

  function initials(name) {
    return name.trim().charAt(0).toUpperCase();
  }

  function setLoggedInNav() {
    var session = read(SESSION_KEY);
    if (!session || typeof session.name !== 'string' || typeof session.email !== 'string') return;
    document.body.classList.add('logged-in');
    var userInitials = initials(session.name);
    document.querySelectorAll('#nav-auth-guest').forEach(function (guest) {
      var nav = document.createElement('div');
      nav.className = 'nav-user';
      nav.id = 'nav-auth-loggedin';
      var accountLink = document.createElement('a');
      accountLink.href = 'account.html#profile';
      accountLink.className = 'nav-user-name';
      accountLink.id = 'nav-user-account';
      accountLink.textContent = 'Account';
      var avatar = document.createElement('span');
      avatar.className = 'nav-user-avatar';
      avatar.textContent = userInitials;
      var name = document.createElement('span');
      name.className = 'nav-user-name';
      name.id = 'nav-user-name';
      name.textContent = session.name;
      var logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'btn-logout';
      logout.id = 'btn-logout';
      logout.textContent = 'Logout';
      nav.appendChild(accountLink);
      nav.appendChild(avatar);
      nav.appendChild(name);
      nav.appendChild(logout);
      guest.replaceWith(nav);
    });
    document.querySelectorAll('#nav-user-name').forEach(function (node) { node.textContent = session.name; });
    document.querySelectorAll('#account-avatar, #nav-user-avatar').forEach(function (node) { node.textContent = userInitials; });
    document.querySelectorAll('#account-user-name, #profile-name').forEach(function (node) {
      if ('value' in node) node.value = session.name;
      node.textContent = session.name;
    });
    document.querySelectorAll('#account-user-email, #profile-email').forEach(function (node) {
      if ('value' in node) node.value = session.email;
      node.textContent = session.email;
    });
  }

  function renderOrders() {
    var list = document.getElementById('orders-list');
    if (!list) return;
    var session = read(SESSION_KEY);
    var orders = session ? orderItems().filter(function (order) {
      return order.email === session.email;
    }) : [];
    list.textContent = '';
    orders.slice().reverse().forEach(function (order) {
      var row = document.createElement('tr');
      var itemCount = order.items.reduce(function (count, item) {
        return count + Number(item.quantity || 0);
      }, 0);
      [
        '#' + order.id,
        new Date(order.createdAt).toLocaleDateString(),
        itemCount + (itemCount === 1 ? ' item' : ' items'),
        money(order.total)
      ].forEach(function (value) {
        var cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      var status = document.createElement('td');
      var badge = document.createElement('span');
      var isCancelled = order.status === 'Cancelled';
      badge.className = 'status-badge ' + (isCancelled ? 'status-cancelled' : 'status-processing');
      badge.textContent = isCancelled ? 'Cancelled' : (order.status || 'Processing');
      status.appendChild(badge);
      row.appendChild(status);
      var action = document.createElement('td');
      var link = document.createElement('a');
      link.href = 'order-confirmation.html';
      link.className = 'order-view-link';
      link.textContent = 'View order';
      action.appendChild(link);
      if (!isCancelled) {
        var cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'order-cancel-button';
        cancel.setAttribute('data-cancel-order', order.id);
        cancel.textContent = 'Cancel';
        action.appendChild(cancel);
      }
      row.appendChild(action);
      list.appendChild(row);
    });
    var empty = document.getElementById('orders-empty');
    if (empty) empty.hidden = orders.length > 0;
    var table = document.getElementById('orders-table');
    if (table) table.hidden = orders.length === 0;
  }

  function renderCheckout() {
    var container = document.getElementById('checkout-order-items');
    if (!container) return;
    var items = cartItems();
    var count = items.reduce(function (total, item) { return total + Number(item.quantity); }, 0);
    var subtotal = items.reduce(function (total, item) {
      return total + Number(item.price) * Number(item.quantity);
    }, 0);
    var shipping = items.length ? 9.99 : 0;
    var session = read(SESSION_KEY);
    var firstOrderDiscount = session && !hasPreviousOrder(session.email) ? Math.min(15, subtotal) : 0;
    var tax = Math.round((subtotal - firstOrderDiscount) * 0.08 * 100) / 100;
    container.textContent = '';
    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'checkout-order-item';
      var imageContainer = document.createElement('div');
      imageContainer.className = 'checkout-item-image';
      if (item.image) {
        var image = document.createElement('img');
        image.src = item.image;
        image.alt = item.name;
        imageContainer.appendChild(image);
      }
      var info = document.createElement('div');
      info.className = 'checkout-item-info';
      var name = document.createElement('p');
      name.className = 'checkout-item-name';
      name.textContent = item.name;
      var meta = document.createElement('p');
      meta.className = 'checkout-item-meta';
      meta.textContent = 'Size: ' + (item.size || 'OS') + ' | Qty: ' + item.quantity;
      info.appendChild(name);
      info.appendChild(meta);
      var price = document.createElement('p');
      price.className = 'checkout-item-price';
      price.textContent = money(Number(item.price) * Number(item.quantity));
      row.appendChild(imageContainer);
      row.appendChild(info);
      row.appendChild(price);
      container.appendChild(row);
    });
    if (!items.length) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Your cart is empty.';
      container.appendChild(empty);
    }
    var subtotalLabel = document.getElementById('checkout-subtotal-label');
    if (subtotalLabel) subtotalLabel.textContent = 'Subtotal (' + count + ' items)';
    document.getElementById('checkout-subtotal').textContent = money(subtotal);
    document.getElementById('checkout-shipping').textContent = money(shipping);
    document.getElementById('checkout-tax').textContent = money(tax);
    var discountRow = document.getElementById('checkout-first-order-discount-row');
    if (discountRow) discountRow.hidden = firstOrderDiscount <= 0;
    var discountAmount = document.getElementById('checkout-first-order-discount');
    if (discountAmount) discountAmount.textContent = '-' + money(firstOrderDiscount);
    document.getElementById('checkout-total').textContent = money(subtotal - firstOrderDiscount + shipping + tax);
    document.querySelectorAll('#btn-place-order, #checkout-summary-submit').forEach(function (button) {
      button.disabled = items.length === 0;
    });
    var session = read(SESSION_KEY);
    if (session) {
      var nameField = document.getElementById('checkout-fullname');
      var emailField = document.getElementById('checkout-email');
      if (nameField && !nameField.value) nameField.value = session.name;
      if (emailField && !emailField.value) emailField.value = session.email;
    }
  }

  function renderConfirmation() {
    var number = document.getElementById('order-number');
    if (!number) return;
    var session = read(SESSION_KEY);
    var order = session && orderItems().slice().reverse().find(function (item) {
      return item.email === session.email;
    });
    if (!order) return;
    number.textContent = '#' + order.id;
    var cancelButton = document.getElementById('btn-cancel-order');
    if (cancelButton) {
      cancelButton.hidden = order.status === 'Cancelled';
      cancelButton.setAttribute('data-cancel-order', order.id);
    }
    var confirmationTitle = document.getElementById('confirmation-title');
    if (order.status === 'Cancelled' && confirmationTitle) confirmationTitle.textContent = 'Order Cancelled';
    document.getElementById('order-date').textContent = new Date(order.createdAt).toLocaleDateString();
    document.getElementById('order-total').textContent = money(order.total);
    document.getElementById('order-payment').textContent = order.paymentMethod;
    document.getElementById('order-address').textContent = order.shippingAddress;
  }

  function placeOrder(form) {
    var session = read(SESSION_KEY);
    var items = cartItems();
    if (!items.length) {
      showError(form, 'Your cart is empty. Add products before placing an order.');
      return false;
    }
    if (!session || typeof session.email !== 'string') {
      showError(form, 'Please sign in before placing an order.');
      return false;
    }
    var subtotal = items.reduce(function (total, item) {
      return total + Number(item.price) * Number(item.quantity);
    }, 0);
    var shipping = 9.99;
    var firstOrderDiscount = hasPreviousOrder(session.email) ? 0 : Math.min(15, subtotal);
    var tax = Math.round((subtotal - firstOrderDiscount) * 0.08 * 100) / 100;
    var createdAt = new Date().toISOString();
    var id = 'AGA-' + createdAt.slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-6);
    var country = document.getElementById('checkout-country');
    var payment = document.querySelector('input[name="payment"]:checked');
    var order = {
      id: id,
      email: session.email,
      createdAt: createdAt,
      items: items,
      subtotal: subtotal,
      discount: firstOrderDiscount,
      shipping: shipping,
      tax: tax,
      total: subtotal - firstOrderDiscount + shipping + tax,
      status: 'Processing',
      paymentMethod: payment ? ({
        card: 'Card',
        paypal: 'PayPal',
        cod: 'Cash on Delivery'
      }[payment.value] || 'Not specified') : 'Not specified',
      shippingAddress: [
        document.getElementById('checkout-fullname').value.trim(),
        document.getElementById('checkout-address').value.trim(),
        document.getElementById('checkout-city').value.trim(),
        document.getElementById('checkout-state').value.trim(),
        document.getElementById('checkout-zip').value.trim(),
        country ? country.options[country.selectedIndex].text : ''
      ].filter(Boolean).join(', ')
    };
    try {
      var orders = orderItems();
      orders.push(order);
      write(ORDERS_KEY, orders);
      localStorage.removeItem(CART_KEY);
    } catch (error) {
      showError(form, 'Unable to save your order in this browser. Please check your browser storage settings.');
      return false;
    }
    window.location.href = 'order-confirmation.html';
    return true;
  }

  function refreshCaptcha() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var index = 0; index < 5; index += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
    var text = document.getElementById('captcha-text');
    if (text) text.textContent = code;
    var display = document.getElementById('captcha-code-display');
    if (display) display.setAttribute('aria-label', 'CAPTCHA code: ' + code);
  }

  document.addEventListener('click', function (event) {
    var logout = event.target.closest('#btn-logout, #sidebar-logout');
    if (logout) {
      event.preventDefault();
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'index.html';
      return;
    }

    var cancelOrderButton = event.target.closest('[data-cancel-order]');
    if (cancelOrderButton) {
      event.preventDefault();
      var session = read(SESSION_KEY);
      var orderId = cancelOrderButton.getAttribute('data-cancel-order');
      var orders = orderItems();
      var target = orders.find(function (order) {
        return order.id === orderId && session && order.email === session.email;
      });
      if (!target || target.status === 'Cancelled') return;
      if (!window.confirm('Cancel order #' + target.id + '?')) return;
      target.status = 'Cancelled';
      target.cancelledAt = new Date().toISOString();
      try {
        write(ORDERS_KEY, orders);
        renderOrders();
        renderConfirmation();
      } catch (error) {
        window.alert('Unable to cancel this order. Please try again.');
      }
      return;
    }
    var action = event.target.closest('#btn-signup-submit, #btn-login-submit');
    if (!action) return;
    event.preventDefault();
    var form = action.closest('form');
    if (!valid(form)) return;

    if (action.id === 'btn-signup-submit') {
      var password = document.getElementById('signup-password').value;
      var confirm = document.getElementById('signup-confirm-password').value;
      if (password !== confirm) { showError(form, 'Passwords do not match.'); return; }
      var newAccount = {
        name: document.getElementById('signup-name').value.trim(),
        email: document.getElementById('signup-email').value.trim().toLowerCase(),
        password: password
      };
      var savedAccounts = accounts();
      if (savedAccounts.some(function (saved) { return saved.email.toLowerCase() === newAccount.email; })) {
        showError(form, 'An account with this email already exists. Please sign in instead.');
        return;
      }
      savedAccounts.push(newAccount);
      try {
        write(ACCOUNT_KEY, savedAccounts);
      } catch (error) {
        showError(form, 'Unable to save your account in this browser. Please check your browser storage settings.');
        return;
      }
      window.location.href = 'login.html';
      return;
    }

    var email = document.getElementById('login-email').value.trim().toLowerCase();
    var passwordInput = document.getElementById('login-password').value;
    var saved = accounts().find(function (candidate) {
      return candidate.email.toLowerCase() === email && candidate.password === passwordInput;
    });
    if (!saved) {
      showError(form, 'Incorrect email or password.');
      return;
    }
    try {
      write(SESSION_KEY, { name: saved.name, email: saved.email });
    } catch (error) {
      showError(form, 'Unable to sign in because browser storage is unavailable.');
      return;
    }
    window.location.href = 'index.html';
  });

  document.addEventListener('keydown', function (event) {
    var search = event.target.closest('#nav-search-input');
    if (!search || event.key !== 'Enter') return;
    event.preventDefault();
    var query = search.value.trim();
    window.location.href = 'shop.html' + (query ? '?search=' + encodeURIComponent(query) : '');
  });

  document.addEventListener('DOMContentLoaded', function () {
    setLoggedInNav();
    renderOrders();
    renderCheckout();
    renderConfirmation();
    refreshCaptcha();
    var refresh = document.getElementById('captcha-refresh-btn');
    if (refresh) refresh.addEventListener('click', refreshCaptcha);

    var checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!checkoutForm.checkValidity()) {
          checkoutForm.reportValidity();
          return;
        }
        placeOrder(checkoutForm);
      });
    }
  });
}());
