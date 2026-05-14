/**
 * src/router.js
 * Routing logic and navigation between pages
 */

import { getUser } from './auth.js';
import { showToast } from './ui.js';

const REDIRECT_KEY = 'postLoginRedirect';

/**
 * Builds a safe redirect path from current URL (for pre-login redirects).
 */
function buildSafeRedirectPath() {
  const path   = location.pathname;
  const params = new URLSearchParams(location.search);
  const query  = params.get('q');
  return query ? `${path}?q=${encodeURIComponent(query)}` : path;
}

/**
 * Sanitizes a redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with "/" and without external URLs.
 */
function sanitizeRedirectPath(path) {
  if (!path || typeof path !== 'string') return '';
  if (!path.startsWith('/'))    return '';
  if (path.startsWith('//'))    return '';
  if (path.includes('://'))     return '';
  if (path.includes('login.html')) return '';
  return path;
}

/**
 * Redirects to index.html or the saved pre-login URL after successful login.
 */
export function redirectToPostLogin() {
  const redirectTo = sanitizeRedirectPath(localStorage.getItem(REDIRECT_KEY));
  if (redirectTo) localStorage.removeItem(REDIRECT_KEY);
  window.location.href = redirectTo || 'index.html';
}

/**
 * Checks if user is logged in and redirects to login.html if not on protected routes.
 * Returns true if redirect happened (caller should stop rendering).
 */
export function redirectIfLoggedOut() {
  // Don't check auth on the auth-body pages (login.html)
  if (document.body.classList.contains('auth-body')) return false;
  
  // User is logged in, allow access to all pages
  if (getUser()) return false;

  // List of unprotected routes that don't require login
  const unprotectedRoutes = ['/', '/index.html'];
  const currentPath = location.pathname;
  
  // Check if current path is unprotected
  if (unprotectedRoutes.includes(currentPath)) return false;
  
  // User is NOT logged in and trying to access a protected route
  const redirectPath = buildSafeRedirectPath();
  localStorage.setItem(REDIRECT_KEY, redirectPath);
  window.location.replace('login.html');
  return true;
}

/**
 * Builds a URL for a given page and options.
 */
export function buildURL(page, opts = {}) {
  switch (page) {
    case 'home':     return '/';
    case 'year':     return `/${opts.year}${opts.sem ? '/' + opts.sem : ''}`;
    case 'subject':  return `/${opts.year}/${opts.sem}/${opts.subject}`;
    case 'resource': return `/resource/${opts.slug}`;
    case 'search':   return `/search${opts.query ? '?q=' + encodeURIComponent(opts.query) : ''}`;
    case 'settings': return '/settings';
    default:         return '/';
  }
}

/**
 * Routes the application based on the current URL pathname.
 * Called on page load and after history changes.
 */
export function routeFromCurrentURL() {
  const path = location.pathname;
  const parts = path.split('/').filter(Boolean);

  // Import render functions (will be available when modules are loaded)
  const { renderHome, renderYearPage, renderResourcePage, renderSettingsPage, renderSearchPage } = window.__renderFunctions || {};

  if (path === '/' || parts.length === 0) {
    navigate('home');
  } else if (parts[0] === 'settings') {
    navigate('settings');
  } else if (parts[0] === 'search') {
    const q = new URLSearchParams(location.search).get('q') || '';
    navigate('search', { query: q });
  } else if (parts[0] === 'resource' && parts[1]) {
    const resource = getResourceBySlug(parts[1]);
    navigate(resource ? 'resource' : '404', { slug: parts[1] });
  } else if (parts.length >= 3) {
    const subjectResources = resourcesBySubject(parts[0], parts[1], parts[2]);
    navigate(subjectResources.length > 0 ? 'subject' : '404', { year: parts[0], sem: parts[1], subject: parts[2] });
  } else if (parts.length === 2) {
    const validSem = parts[1] === 'sem-1' || parts[1] === 'sem-2';
    const hasYearResources = resourcesByYear(parts[0]).length > 0;
    navigate(validSem && hasYearResources ? 'year' : '404', { year: parts[0], sem: parts[1] });
  } else if (parts.length === 1) {
    navigate(resourcesByYear(parts[0]).length > 0 ? 'year' : '404', { year: parts[0], sem: 'sem-1' });
  } else {
    navigate('404');
  }
}

// ───────────────────────────────────────────────────────────
// Helper functions needed by router
// ───────────────────────────────────────────────────────────

function getResourceBySlug(slug) {
  return RESOURCES_DATA.find(r => r.slug === slug) || null;
}

function resourcesByYear(year) {
  return RESOURCES_DATA.filter(r => r.year === year);
}

function resourcesBySem(year, sem) {
  return RESOURCES_DATA.filter(r => r.year === year && r.semester === sem);
}

function resourcesBySubject(year, sem, subject) {
  return RESOURCES_DATA.filter(r => r.year === year && r.semester === sem && r.subject === subject);
}

function updateBottomNav(pageName) {
  document.querySelectorAll('.bnav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Main navigate function - changes pages and updates history.
 */
export function navigate(page, opts = {}) {
  // Get render functions from global scope
  const {
    renderHome, renderYearPage, renderSubjectPage, renderResourcePage,
    renderSearchPage, renderSettingsPage, render404Page
  } = window.__renderFunctions || {};

  // Hide all pages
  $$('.page').forEach(p => p.classList.remove('active'));

  // Update state
  if (typeof State !== 'undefined') {
    State.currentPage = page;
    
    switch (page) {
      case 'year':
        State.currentYear = opts.year;
        State.currentSem = opts.sem || 'sem-1';
        break;
      case 'subject':
        State.currentYear = opts.year;
        State.currentSem = opts.sem;
        State.currentSubject = opts.subject;
        break;
      case 'resource':
        State.currentResource = opts.slug;
        break;
      case 'search':
        State.searchQuery = opts.query || '';
        break;
    }
  }

  // Render page
  switch (page) {
    case 'home':
      if (renderHome) renderHome();
      break;
    case 'year':
      if (renderYearPage) renderYearPage();
      break;
    case 'subject':
      if (renderSubjectPage) renderSubjectPage();
      break;
    case 'resource':
      if (renderResourcePage) renderResourcePage();
      break;
    case 'search':
      if (renderSearchPage) renderSearchPage(opts.query || '');
      break;
    case 'settings':
      if (renderSettingsPage) renderSettingsPage();
      break;
    case '404':
      if (render404Page) render404Page();
      break;
    default:
      if (typeof State !== 'undefined') State.currentPage = '404';
      if (render404Page) render404Page();
      page = '404';
      opts = {};
      break;
  }

  // Update history
  try {
    const url = buildURL(page, opts);
    window.history.pushState({ page, opts }, '', url);
  } catch(_) {}

  updateBottomNav(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let _routerListenersBound = false;

/**
 * Initializes the router by setting up event listeners for history changes.
 */
export function initRouter() {
  if (_routerListenersBound) return;
  _routerListenersBound = true;

  window.addEventListener('popstate', (e) => {
    if (e.state) {
      navigate(e.state.page, e.state.opts || {});
    } else {
      routeFromCurrentURL();
    }
  });

  window.addEventListener('hashchange', () => {
    routeFromCurrentURL();
  });
}
