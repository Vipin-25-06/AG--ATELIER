(function () {
  'use strict';

  var ACCOUNT_KEY = 'ag-atelier-account';
  var SESSION_KEY = 'ag-atelier-session';
  var ADMIN = { name: 'Admin', email: 'admin@agatelier.com', password: 'Admin@123' };

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

  function account() {
    return read(ACCOUNT_KEY) || ADMIN;
  }

  function setLoggedInNav() {
    var session = read(SESSION_KEY);
    if (!session) return;
    document.body.classList.add('logged-in');
    document.querySelectorAll('#nav-auth-guest').forEach(function (guest) {
      guest.outerHTML = '<div class="nav-user" id="nav-auth-loggedin"><a href="account.html#profile" class="nav-user-name" id="nav-user-account">Account</a><span class="nav-user-avatar">' + session.name.charAt(0).toUpperCase() + '</span><span class="nav-user-name" id="nav-user-name">' + session.name + '</span><button type="button" class="btn-logout" id="btn-logout">Logout</button></div>';
    });
    document.querySelectorAll('#nav-user-name').forEach(function (node) { node.textContent = session.name; });
    document.querySelectorAll('#account-user-name, #profile-name').forEach(function (node) { node.value = session.name; node.textContent = session.name; });
    document.querySelectorAll('#account-user-email, #profile-email').forEach(function (node) { node.value = session.email; node.textContent = session.email; });
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

    var action = event.target.closest('#btn-signup-submit, #btn-login-submit');
    if (!action) return;
    event.preventDefault();
    var form = action.closest('form');
    if (!valid(form)) return;

    if (action.id === 'btn-signup-submit') {
      var password = document.getElementById('signup-password').value;
      var confirm = document.getElementById('signup-confirm-password').value;
      if (password !== confirm) { showError(form, 'Passwords do not match.'); return; }
      write(ACCOUNT_KEY, {
        name: document.getElementById('signup-name').value.trim(),
        email: document.getElementById('signup-email').value.trim().toLowerCase(),
        password: password
      });
      window.location.href = 'login.html';
      return;
    }

    var email = document.getElementById('login-email').value.trim().toLowerCase();
    var passwordInput = document.getElementById('login-password').value;
    var saved = account();
    if (email !== saved.email.toLowerCase() || passwordInput !== saved.password) {
      showError(form, 'Incorrect email or password.');
      return;
    }
    write(SESSION_KEY, { name: saved.name, email: saved.email });
    window.location.href = 'index.html';
  });

  document.addEventListener('DOMContentLoaded', function () {
    setLoggedInNav();
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
        window.location.href = 'order-confirmation.html';
      });
    }
  });
}());
