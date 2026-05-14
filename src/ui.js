/**
 * src/ui.js
 * UI utilities - DOM helpers, toast notifications, theme management
 */

// DOM query helpers
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Shows a toast notification message.
 * Auto-dismisses after 3.2 seconds.
 */
export function showToast(message, type = '✓') {
  const container = $('#toast-container');
  if (!container) return;
  
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${type}</span><span>${message}</span>`;
  container.appendChild(el);
  
  setTimeout(() => el.remove(), 3200);
}

/**
 * Applies a theme to the application.
 * Updates State.theme, DOM attributes, localStorage, and button text.
 */
export function setTheme(theme) {
  // Update State (if available in global scope)
  if (typeof State !== 'undefined') {
    State.theme = theme;
  }
  
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sk-theme', theme);
  
  // Update theme toggle buttons
  const icon = theme === 'dark' ? '☀️' : '🌙';
  $$('.theme-toggle-btn').forEach(btn => {
    btn.textContent = icon;
    btn.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
  });
  
  // Update settings toggle
  const toggle = $('#settings-dark-toggle');
  if (toggle) toggle.checked = theme === 'dark';
}

/**
 * Toggles between light and dark themes.
 */
export function toggleTheme() {
  const currentTheme = localStorage.getItem('sk-theme') || 'light';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/**
 * Initializes dark mode based on localStorage or system preference.
 * Called on page load to set up initial theme.
 */
export function initDarkMode() {
  const theme = localStorage.getItem('sk-theme') || 'light';
  setTheme(theme);
}
