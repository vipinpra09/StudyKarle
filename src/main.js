import { getUser, clearUser, isLoggedIn } from './auth.js';
import { initRouter, navigate } from './router.js';
import { initDarkMode, setTheme } from './ui.js';
import { RESOURCES_DATA } from './data.js';

function updateHeaderAuth() {
  const loginButton = document.getElementById('auth-login-btn');
  const accountWrap = document.getElementById('auth-account');
  const name = document.getElementById('auth-user-name');

  const user = getUser();
  if (user) {
    if (loginButton) loginButton.hidden = true;
    if (accountWrap) accountWrap.hidden = false;
    if (name) name.textContent = user.name;
  } else {
    if (loginButton) loginButton.hidden = false;
    if (accountWrap) accountWrap.hidden = true;
  }
}

function initNav() {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    const path = el.getAttribute('data-nav');
    if (!path) return;
    el.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(path);
    });
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
