import { isLoggedIn } from './auth.js';
import {
  renderHome,
  renderYearPage,
  renderSemPage,
  renderSubjectPage,
  renderResourceViewer,
  renderSearchPage,
  renderSettingsPage
} from './renderer.js';

const UNPROTECTED_ROUTES = new Set(['/', '/login.html']);

function isProtectedPath(pathname) {
  return !UNPROTECTED_ROUTES.has(pathname);
}

function animatePageIn() {
  const root = document.getElementById('app-root');
  if (!root) return;
  root.style.cssText = 'opacity:0;transform:translateY(8px);transition:none';

  requestAnimationFrame(() => {
    root.style.cssText =
      'opacity:1;transform:translateY(0);transition:opacity 200ms ease,transform 200ms ease';
  });
}

function syncActiveNav(pathname) {
  document.querySelectorAll('[data-route]').forEach((link) => {
    const route = link.getAttribute('data-route');
    if (!route) return;
    const active = route === pathname;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function renderNotFound() {
  const root = document.getElementById('app-root');
  if (!root) return;
  root.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  const title = document.createElement('p');
  title.className = 'empty-state-title';
  title.textContent = 'Page not found';
  const subtitle = document.createElement('p');
  subtitle.className = 'empty-state-subtitle';
  subtitle.textContent = 'The requested route does not exist.';
  wrap.append(title, subtitle);
  root.appendChild(wrap);
}

function parseRoute(pathname) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/') return { type: 'home' };
  if (cleanPath === '/settings') return { type: 'settings' };
  if (cleanPath === '/search') return { type: 'search' };

  const resourceMatch = cleanPath.match(/^\/resource\/([^/]+)$/);
  if (resourceMatch) return { type: 'resource', slug: resourceMatch[1] };

  const subjectMatch = cleanPath.match(/^\/(year-\d+)\/(sem-[12])\/([^/]+)$/);
  if (subjectMatch) {
    return {
      type: 'subject',
      year: subjectMatch[1],
      sem: subjectMatch[2],
      subject: subjectMatch[3]
    };
  }

  const semMatch = cleanPath.match(/^\/(year-\d+)\/(sem-[12])$/);
  if (semMatch) return { type: 'sem', year: semMatch[1], sem: semMatch[2] };

  const yearMatch = cleanPath.match(/^\/(year-\d+)$/);
  if (yearMatch) return { type: 'year', year: yearMatch[1] };

  return { type: 'not-found' };
}

function renderCurrentLocation() {
  const url = new URL(window.location.href);
  const pathname = url.pathname;

  if (isProtectedPath(pathname) && !isLoggedIn()) {
    window.location.replace('/login.html');
    return;
  }

  const route = parseRoute(pathname);

  switch (route.type) {
    case 'home':
      renderHome();
      break;
    case 'year':
      renderYearPage(route.year);
      break;
    case 'sem':
      renderSemPage(route.year, route.sem);
      break;
    case 'subject':
      renderSubjectPage(route.year, route.sem, route.subject);
      break;
    case 'resource':
      renderResourceViewer(route.slug);
      break;
    case 'search':
      renderSearchPage(url.searchParams.get('q') || '');
      break;
    case 'settings':
      renderSettingsPage();
      break;
    default:
      renderNotFound();
      break;
  }

  syncActiveNav(pathname);
  animatePageIn();
}

export function navigate(path, options = {}) {
  const target = path || '/';
  const shouldReplace = !!options.replace;

  if (shouldReplace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
  }

  renderCurrentLocation();
}

let initialized = false;

export function initRouter() {
  if (initialized) return;
  initialized = true;

  window.addEventListener('popstate', () => renderCurrentLocation());
  window.studykarleNavigate = navigate;

  renderCurrentLocation();
}
