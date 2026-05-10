// theme.js — data-theme attribute based (matches CSS [data-theme="dark"])
// Runs IIFE immediately to prevent flash of wrong theme

(function () {
  // Migrate old key if present
  var old = localStorage.getItem('socialapp-theme');
  if (old) {
    localStorage.setItem('theme', old);
    localStorage.removeItem('socialapp-theme');
  }

  var saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {
  var buttons = document.querySelectorAll(
    '#theme-toggle, #theme-toggle-mobile, .theme-toggle'
  );

  function applyTheme(theme) {
    // 1. Set attribute on <html> — matches [data-theme="dark"] in CSS
    document.documentElement.setAttribute('data-theme', theme);
    // 2. Persist
    localStorage.setItem('theme', theme);
    // 3. Sync all button icons
    buttons.forEach(function (btn) {
      var icon = btn.querySelector('i');
      if (!icon) return;
      icon.className = theme === 'dark'
        ? 'fa-solid fa-sun'
        : 'fa-solid fa-moon';
    });
  }

  // Sync icons on load
  applyTheme(localStorage.getItem('theme') || 'light');

  // Wire toggle buttons
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark');
    });
  });
});
