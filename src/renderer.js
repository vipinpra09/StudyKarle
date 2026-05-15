import { RESOURCES_DATA, CATEGORY_META, SUBJECTS_META, YEARS_META } from './data.js';
import { searchResources } from './search.js';
import { getUser, clearUser } from './auth.js';
import { setTheme } from './ui.js';

const CATEGORY_ORDER = ['all', 'notes', 'pyq', 'assignment', 'tutorial', 'paper'];

function getRoot() {
  return document.getElementById('app-root');
}

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function titleFromSlug(value = '') {
  return String(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getYearMeta(year) {
  return YEARS_META.find((item) => item.id === year) || {
    id: year,
    label: titleFromSlug(year),
    short: titleFromSlug(year),
    semesters: ['sem-1', 'sem-2'],
    desc: ''
  };
}

function resourcesByYear(year) {
  return RESOURCES_DATA.filter((resource) => resource?.year === year);
}

function resourcesBySem(year, sem) {
  return RESOURCES_DATA.filter((resource) => resource?.year === year && resource?.semester === sem);
}

function resourcesBySubject(year, sem, subject) {
  return RESOURCES_DATA.filter(
    (resource) => resource?.year === year && resource?.semester === sem && resource?.subject === subject
  );
}

function uniqueSubjects(year, sem) {
  const seen = new Set();
  const unique = [];
  for (const resource of resourcesBySem(year, sem)) {
    if (!resource?.subject || seen.has(resource.subject)) continue;
    seen.add(resource.subject);
    unique.push(resource.subject);
  }
  return unique;
}

function categoryLabel(category) {
  return CATEGORY_META[category]?.label || titleFromSlug(category);
}

function fileIcon(type) {
  return type === 'pdf' ? '📄' : '🖼️';
}

function setupNavLink(link, path) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (window.studykarleNavigate) window.studykarleNavigate(path);
  });
}

function setupButtonNav(button, path) {
  button.addEventListener('click', () => {
    if (window.studykarleNavigate) window.studykarleNavigate(path);
  });
}

function createPageHeader(eyebrow, title, meta) {
  const header = createElement('header', 'page-header');
  if (eyebrow) header.appendChild(createElement('p', 'page-header-eyebrow', eyebrow));
  header.appendChild(createElement('h1', 'page-header-title', title));
  if (meta) header.appendChild(createElement('p', 'page-header-meta', meta));
  return header;
}

export function createResourceCard(resource) {
  if (!resource || typeof resource !== 'object') {
    console.warn('[StudyKarle] Skipping malformed resource entry:', resource);
    return null;
  }

  if (!resource.path || !resource.slug || !resource.title) {
    console.warn('[StudyKarle] Skipping malformed resource entry:', resource);
    return null;
  }

  const card = createElement('a', 'resource-card');
  card.href = `/resource/${resource.slug}`;
  setupNavLink(card, `/resource/${resource.slug}`);

  const icon = createElement('div', 'resource-card-icon', fileIcon(resource.type));
  const body = createElement('div', 'resource-card-body');
  const title = createElement('h3', 'resource-card-title', resource.title);
  const meta = createElement('div', 'resource-card-meta');

  const badge = createElement('span', 'resource-card-badge', categoryLabel(resource.category || 'notes'));
  badge.dataset.category = String(resource.category || 'notes').toLowerCase();

  const subjectMeta = SUBJECTS_META[resource.subject] || { label: titleFromSlug(resource.subject || '') };
  const subject = createElement('span', '', subjectMeta.label);

  meta.append(badge, subject);
  body.append(title, meta);
  card.append(icon, body);

  return card;
}

function renderSkeletonCards(container) {
  container.textContent = '';
  for (let i = 0; i < 4; i += 1) {
    const card = createElement('div', 'skeleton skeleton-card');
    container.appendChild(card);
  }
}

function renderResourceGrid(container, resources) {
  const cards = resources
    .map((resource) => createResourceCard(resource))
    .filter(Boolean);

  container.textContent = '';

  if (cards.length === 0) {
    const empty = createElement('div', 'empty-state');
    empty.appendChild(createElement('p', 'empty-state-title', 'No resources found.'));
    empty.appendChild(
      createElement('p', 'empty-state-subtitle', 'No valid resources are available for this section yet.')
    );
    container.appendChild(empty);
    return;
  }

  cards.forEach((card) => container.appendChild(card));
}

function renderResourceSection(resources) {
  const wrap = createElement('section');
  const filterBar = createElement('div', 'filter-bar');
  const grid = createElement('div', 'resource-grid');

  const validResources = resources.filter((resource) => {
    if (!resource || typeof resource !== 'object') return false;
    if (!resource.path || !resource.slug || !resource.title) {
      console.warn('[StudyKarle] Skipping malformed resource entry:', resource);
      return false;
    }
    return true;
  });

  const presentCategories = new Set(validResources.map((resource) => resource.category || 'notes'));
  const categories = CATEGORY_ORDER.filter((category) => category === 'all' || presentCategories.has(category));

  let activeCategory = 'all';

  function rerender() {
    const filtered =
      activeCategory === 'all'
        ? validResources
        : validResources.filter((resource) => (resource.category || 'notes') === activeCategory);
    renderSkeletonCards(grid);
    requestAnimationFrame(() => renderResourceGrid(grid, filtered));
  }

  categories.forEach((category) => {
    const button = createElement('button', `filter-pill${category === 'all' ? ' active' : ''}`);
    button.type = 'button';
    button.textContent = category === 'all' ? 'All' : categoryLabel(category);
    button.addEventListener('click', () => {
      activeCategory = category;
      filterBar.querySelectorAll('.filter-pill').forEach((pill) => pill.classList.remove('active'));
      button.classList.add('active');
      rerender();
    });
    filterBar.appendChild(button);
  });

  wrap.append(filterBar, grid);
  rerender();
  return wrap;
}

export function renderHome() {
  const root = getRoot();
  if (!root) return;

  root.textContent = '';

  const hero = createElement('section', 'hero');
  const inner = createElement('div', 'hero-inner');

  inner.appendChild(
    createElement('span', 'hero-badge', 'Engineering Students · AKTU / GTU / Mumbai University')
  );
  inner.appendChild(createElement('h1', 'hero-title', 'Your study resources, finally organized.'));
  inner.appendChild(
    createElement(
      'p',
      'hero-subtitle',
      'Access notes, PYQs, assignments, and tutorials — organized by year, semester, and subject. Find anything in under 10 seconds.'
    )
  );

  const actions = createElement('div', 'hero-actions');
  const browse = createElement('a', 'btn btn-primary', 'Browse Resources');
  browse.href = '/year-1';
  setupNavLink(browse, '/year-1');
  const search = createElement('a', 'btn btn-ghost', 'Search resources →');
  search.href = '/search';
  setupNavLink(search, '/search');
  actions.append(browse, search);

  inner.appendChild(actions);
  hero.appendChild(inner);
  root.appendChild(hero);

  const years = createElement('section');
  years.appendChild(createPageHeader('Browse', 'Choose your year', 'Select a year to continue.'));

  const grid = createElement('div', 'resource-grid');
  YEARS_META.forEach((year) => {
    const card = createElement('a', 'resource-card');
    card.href = `/${year.id}`;
    setupNavLink(card, `/${year.id}`);

    const icon = createElement('div', 'resource-card-icon', year.short);
    const body = createElement('div', 'resource-card-body');
    body.appendChild(createElement('h3', 'resource-card-title', year.label));
    body.appendChild(createElement('p', 'resource-card-meta', `${resourcesByYear(year.id).length} resources`));

    card.append(icon, body);
    grid.appendChild(card);
  });

  years.appendChild(grid);
  root.appendChild(years);
}

export function renderYearPage(year) {
  renderSemPage(year, 'sem-1');
}

export function renderSemPage(year, sem) {
  const root = getRoot();
  if (!root) return;

  root.textContent = '';

  const yearMeta = getYearMeta(year);
  root.appendChild(createPageHeader(yearMeta.short, yearMeta.label, yearMeta.desc));

  const semTabs = createElement('div', 'filter-bar');
  yearMeta.semesters.forEach((semester) => {
    const tab = createElement('button', `filter-pill${semester === sem ? ' active' : ''}`);
    tab.type = 'button';
    tab.textContent = semester.replace('-', ' ').replace('sem', 'Semester');
    setupButtonNav(tab, `/${year}/${semester}`);
    semTabs.appendChild(tab);
  });
  root.appendChild(semTabs);

  const subjects = uniqueSubjects(year, sem);
  if (subjects.length > 0) {
    const subjectGrid = createElement('div', 'resource-grid');
    subjects.forEach((subject) => {
      const meta = SUBJECTS_META[subject] || { label: titleFromSlug(subject), icon: '📚' };
      const card = createElement('a', 'resource-card');
      card.href = `/${year}/${sem}/${subject}`;
      setupNavLink(card, `/${year}/${sem}/${subject}`);

      card.append(
        createElement('div', 'resource-card-icon', meta.icon),
        (() => {
          const body = createElement('div', 'resource-card-body');
          body.appendChild(createElement('h3', 'resource-card-title', meta.label));
          body.appendChild(
            createElement('p', 'resource-card-meta', `${resourcesBySubject(year, sem, subject).length} resources`)
          );
          return body;
        })()
      );

      subjectGrid.appendChild(card);
    });
    root.appendChild(subjectGrid);
  }

  root.appendChild(renderResourceSection(resourcesBySem(year, sem)));
}

export function renderSubjectPage(year, sem, subject) {
  const root = getRoot();
  if (!root) return;

  root.textContent = '';

  const subjectMeta = SUBJECTS_META[subject] || { label: titleFromSlug(subject), icon: '📚' };
  const resources = resourcesBySubject(year, sem, subject);

  root.appendChild(
    createPageHeader(
      `${year.replace('-', ' ')} · ${sem.replace('-', ' ')}`,
      `${subjectMeta.icon} ${subjectMeta.label}`,
      `${resources.length} resources`
    )
  );

  root.appendChild(renderResourceSection(resources));
}

export function renderResourceViewer(slug) {
  const root = getRoot();
  if (!root) return;

  root.textContent = '';

  const resource = RESOURCES_DATA.find((item) => item?.slug === slug);
  if (!resource) {
    const empty = createElement('div', 'empty-state');
    empty.append(
      createElement('p', 'empty-state-title', 'Resource not found.'),
      createElement('p', 'empty-state-subtitle', 'The requested resource does not exist.'),
      (() => {
        const button = createElement('button', 'btn btn-primary', 'Go Home');
        button.type = 'button';
        setupButtonNav(button, '/');
        return button;
      })()
    );
    root.appendChild(empty);
    return;
  }

  root.appendChild(
    createPageHeader(
      `${resource.year.replace('-', ' ')} · ${resource.semester.replace('-', ' ')}`,
      resource.title,
      `${categoryLabel(resource.category)} · ${resource.type.toUpperCase()}`
    )
  );

  const actions = createElement('div', 'hero-actions');
  const download = createElement('a', 'btn btn-secondary', 'Download');
  download.href = resource.path;
  download.target = '_blank';
  download.rel = 'noopener';

  const copy = createElement('button', 'btn btn-ghost', 'Copy link');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    const link = `${window.location.origin}/resource/${resource.slug}`;
    await navigator.clipboard?.writeText(link);
  });

  actions.append(download, copy);
  root.appendChild(actions);

  const viewer = createElement('div', 'viewer');
  if (resource.type === 'pdf') {
    const iframe = createElement('iframe');
    iframe.className = 'resource-viewer';
    iframe.src = resource.path;
    iframe.title = resource.title;
    viewer.appendChild(iframe);
  } else {
    const img = createElement('img', 'resource-viewer-image');
    img.src = resource.path;
    img.alt = resource.title;
    viewer.appendChild(img);
  }

  root.appendChild(viewer);
}

function renderSearchResultsBlock(results, query) {
  const block = createElement('section');
  const count = createElement('p', 'search-count');
  count.textContent = `Showing ${results.length} results for '${query}'`;
  block.appendChild(count);

  if (results.length === 0) {
    const empty = createElement('div', 'empty-state');
    empty.append(
      createElement('p', 'empty-state-title', 'No matching resources'),
      createElement('p', 'empty-state-subtitle', 'Try another keyword or subject name.')
    );
    block.appendChild(empty);
    return block;
  }

  const grid = createElement('div', 'resource-grid');
  results.map((resource) => createResourceCard(resource)).filter(Boolean).forEach((card) => grid.appendChild(card));
  block.appendChild(grid);
  return block;
}

export function renderSearchPage(query = '') {
  const root = getRoot();
  if (!root) return;

  root.textContent = '';
  root.appendChild(createPageHeader('Search', 'Find your resources', 'Search by title, subject, or category'));

  const wrapper = createElement('div', 'search-wrapper');
  const icon = createElement('span', 'search-icon', '⌕');
  const input = createElement('input', 'search-input');
  input.type = 'search';
  input.value = query;
  input.placeholder = 'Search resources';
  wrapper.append(icon, input);
  root.appendChild(wrapper);

  const resultsWrap = createElement('div');
  const initial = query.trim() ? searchResources(query) : [];
  resultsWrap.appendChild(renderSearchResultsBlock(initial, query.trim()));
  root.appendChild(resultsWrap);

  input.addEventListener('input', () => {
    const nextQuery = input.value.trim();
    const results = nextQuery ? searchResources(nextQuery) : [];
    resultsWrap.textContent = '';
    if (!nextQuery) {
      const empty = createElement('div', 'empty-state');
      empty.append(
        createElement('p', 'empty-state-title', 'Start typing to search'),
        createElement('p', 'empty-state-subtitle', 'Results will appear instantly as you type.')
      );
      resultsWrap.appendChild(empty);
      if (window.studykarleNavigate) {
        window.history.replaceState({}, '', '/search');
      }
      return;
    }

    resultsWrap.appendChild(renderSearchResultsBlock(results, nextQuery));
    window.history.replaceState({}, '', `/search?q=${encodeURIComponent(nextQuery)}`);
  });
}

export function renderSettingsPage() {
  const root = getRoot();
  if (!root) return;

  root.textContent = '';
  root.appendChild(createPageHeader('Settings', 'Preferences', 'Manage theme and session'));

  const section = createElement('section', 'settings-card');

  const rowTheme = createElement('div', 'settings-row');
  const rowThemeText = createElement('div');
  rowThemeText.append(
    createElement('p', 'settings-row-title', 'Dark mode'),
    createElement('p', 'settings-row-subtitle', 'Switch between light and dark appearance')
  );

  const themeToggle = createElement('button', 'btn btn-secondary', 'Toggle');
  themeToggle.type = 'button';
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  rowTheme.append(rowThemeText, themeToggle);

  const rowSession = createElement('div', 'settings-row');
  const rowSessionText = createElement('div');
  const user = getUser();
  rowSessionText.append(
    createElement('p', 'settings-row-title', user ? `Logged in as ${user.name}` : 'Not logged in'),
    createElement('p', 'settings-row-subtitle', 'Clear your local session')
  );

  const logoutButton = createElement('button', 'btn btn-danger', 'Logout');
  logoutButton.type = 'button';
  logoutButton.disabled = !user;
  logoutButton.addEventListener('click', () => {
    clearUser();
    if (window.studykarleNavigate) window.studykarleNavigate('/login.html', { replace: true });
  });

  rowSession.append(rowSessionText, logoutButton);
  section.append(rowTheme, rowSession);
  root.appendChild(section);
}
