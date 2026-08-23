(function () {
  'use strict';

  var LOADER_SEEN_KEY = 'ag-atelier-loader-seen';
  try {
    if (sessionStorage.getItem(LOADER_SEEN_KEY)) {
      document.documentElement.classList.add('skip-loader');
    } else {
      sessionStorage.setItem(LOADER_SEEN_KEY, 'true');
    }
  } catch (error) {
    // Keep the initial loader visible when browser storage is unavailable.
  }
}());
