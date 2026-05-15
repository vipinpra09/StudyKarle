import { getUser, clearUser, isLoggedIn } from './auth.js';
import { initRouter, navigate } from './router.js';
import { initDarkMode, setTheme } from './ui.js';
import { RESOURCES_DATA } from './data.js';

function updateHeaderAuth() {
  const authButton = document.getElementById('nav-auth-btn');

  const user = getUser();
  if (authButton) {
    if (user) {
      authButton.textContent = user.name || 'Account';
      authButton.href = '/settings';
      authButton.setAttribute('data-nav', '/settings');
      authButton.setAttribute('data-route', '/settings');
    } else {
      authButton.textContent = 'Log in';
      authButton.href = '/login.html';
      authButton.removeAttribute('data-nav');
      authButton.removeAttribute('data-route');
    }
  }
}

function initNav() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-nav]');
    if (!target) return;
    const path = target.getAttribute('data-nav');
    if (!path) return;
    event.preventDefault();
    navigate(path);
  });
}

function initThemeToggle() {
  document.querySelectorAll('.theme-toggle-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  });
}

function initLogout() {
  const logoutButton = document.getElementById('auth-logout-btn');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', () => {
    clearUser();
    updateHeaderAuth();
    window.location.replace('/login.html');
  });
}

function runStartupChecks() {
  const slugs = RESOURCES_DATA.map((r) => r.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length > 0) {
    console.error('[StudyKarle] Duplicate slugs detected:', dupes);
  }
}

function init() {
  runStartupChecks();
  initDarkMode();
  initNav();
  initThemeToggle();
  initLogout();
  updateHeaderAuth();

  if (!isLoggedIn() && window.location.pathname !== '/' && window.location.pathname !== '/login.html') {
    window.location.replace('/login.html');
    return;
  }

  initRouter();
}

document.addEventListener('DOMContentLoaded', init);
