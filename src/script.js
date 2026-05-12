/* ============================================================
   StudyKarle — Main Application Script
   Author: Nitish Kumar
   ============================================================ */

/* ============================================================
   STATE
   ============================================================ */

const State = {
  currentPage: 'home',
  currentYear: null,
  currentSem: null,
  currentSubject: null,
  currentResource: null,
  searchQuery: '',
  theme: localStorage.getItem('sk-theme') || 'light',
};

/* ============================================================
   HELPERS
   ============================================================ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function labelify(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/(\d+)/, ' $1');
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

function uniqueSubjects(year, sem) {
  const set = new Set();
  return RESOURCES_DATA
    .filter(r => r.year === year && r.semester === sem)
    .filter(r => { if (set.has(r.subject)) return false; set.add(r.subject); return true; });
}

function getResourceBySlug(slug) {
  return RESOURCES_DATA.find(r => r.slug === slug) || null;
}

function fileTypeIcon(type) {
  return type === 'pdf' ? '📄' : '🖼️';
}

function toast(msg, icon = '✓') {
  const container = $('#toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ============================================================
   THEME
   ============================================================ */

function applyTheme(t) {
  State.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('sk-theme', t);

  const icon = t === 'dark' ? '☀️' : '🌙';
  $$('.theme-toggle-btn').forEach(btn => { btn.textContent = icon; btn.title = t === 'dark' ? 'Light mode' : 'Dark mode'; });

  const toggle = $('#settings-dark-toggle');
  if (toggle) toggle.checked = t === 'dark';
}

function toggleTheme() {
  applyTheme(State.theme === 'dark' ? 'light' : 'dark');
}

/* ============================================================
   ROUTER / PAGES
   ============================================================ */

function navigate(page, opts = {}) {
  // hide all pages
  $$('.page').forEach(p => p.classList.remove('active'));

  // update state
  const prev = State.currentPage;
  State.currentPage = page;

  // Update bottom nav
  $$('.bnav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // render page
  switch (page) {
    case 'home':
      renderHome();
      break;
    case 'year':
      State.currentYear = opts.year;
      State.currentSem = opts.sem || 'sem-1';
      renderYearPage();
      break;
    case 'subject':
      State.currentYear = opts.year;
      State.currentSem = opts.sem;
      State.currentSubject = opts.subject;
      renderSubjectPage();
      break;
    case 'resource':
      State.currentResource = opts.slug;
      renderResourcePage();
      break;
    case 'search':
      renderSearchPage(opts.query || '');
      break;
    case 'settings':
      renderSettingsPage();
      break;
  }

  // history
  try {
    const url = buildURL(page, opts);
    window.history.pushState({ page, opts }, '', url);
  } catch(_) {}

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildURL(page, opts = {}) {
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

// Back navigation
window.addEventListener('popstate', (e) => {
  if (e.state) {
    navigate(e.state.page, e.state.opts || {});
  } else {
    navigate('home');
  }
});

/* ============================================================
   SEARCH ENGINE
   ============================================================ */

function searchResources(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  return RESOURCES_DATA.filter(r => {
    return (
      r.title.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.year.replace('-', ' ').includes(q) ||
      r.semester.replace('-', ' ').includes(q)
    );
  });
}

/* ============================================================
   BREADCRUMBS
   ============================================================ */

function renderBreadcrumbs(crumbs) {
  return `<nav class="breadcrumbs">
    ${crumbs.map((c, i) => {
      const last = i === crumbs.length - 1;
      return last
        ? `<span class="current">${c.label}</span>`
        : `<a href="#" onclick="return navigate('${c.page}', ${JSON.stringify(c.opts || {})}), false">${c.label}</a>
           <span class="sep">›</span>`;
    }).join('')}
  </nav>`;
}

/* ============================================================
   RESOURCE CARD HTML
   ============================================================ */

function resourceCardHTML(r, showActions = true) {
  const catMeta = CATEGORY_META[r.category] || { label: r.category, color: 'cat-notes' };
  const subjMeta = SUBJECTS_META[r.subject] || { label: labelify(r.subject), icon: '📚' };
  return `
    <div class="resource-card" onclick="navigate('resource', { slug: '${r.slug}' })">
      <div class="rc-file-icon">${fileTypeIcon(r.type)}</div>
      <div class="rc-info">
        <div class="rc-title">${r.title}</div>
        <div class="rc-meta">
          <span class="rc-badge ${catMeta.color}">${catMeta.label}</span>
          <span class="rc-type">${r.type.toUpperCase()}</span>
          <span class="rc-type">${subjMeta.icon} ${subjMeta.label}</span>
        </div>
      </div>
      ${showActions ? `
      <div class="rc-actions">
        <button class="btn btn-sm btn-outline btn-icon" title="Download" onclick="handleDownload(event,'${r.path}','${r.slug}')">⬇</button>
      </div>` : ''}
    </div>`;
}

/* ============================================================
   HOME PAGE
   ============================================================ */

function renderHome() {
  const page = $('#page-home');
  page.innerHTML = `
    <div class="container">
      ${renderBreadcrumbs([{ label: 'StudyKarle' }])}

      <section class="hero fade-up">
        <div class="hero-eyebrow"><span>📚</span> Engineering Resources</div>
        <h1 class="hero-title">Study Resources,<br><em>Organized Properly.</em></h1>
        <p class="hero-sub">Access notes, PYQs, assignments, tutorials, and papers in one simple place.</p>
        <div class="hero-cta">
          <button class="btn btn-primary" onclick="document.getElementById('year-section').scrollIntoView({behavior:'smooth'})">
            📖 Start Studying
          </button>
          <button class="btn btn-outline" onclick="navigate('search', {})">
            🔍 Search Resources
          </button>
        </div>
      </section>

      <div class="feature-strip stagger">
        <div class="feature-item"><span>⚡</span> Instant Access</div>
        <div class="feature-item"><span>📱</span> Mobile Friendly</div>
        <div class="feature-item"><span>📥</span> Free Downloads</div>
        <div class="feature-item"><span>🗂️</span> Well Organized</div>
        <div class="feature-item"><span>🌙</span> Dark Mode</div>
      </div>

      <section id="year-section">
        <div class="section-head">
          <div>
            <div class="section-title">Browse by Year</div>
            <div class="section-sub">Select your year to get started</div>
          </div>
        </div>
        <div class="year-cards stagger">
          ${YEARS_META.map(y => `
            <div class="year-card" onclick="navigate('year', { year: '${y.id}', sem: 'sem-1' })">
              <div class="yc-badge">${y.short}</div>
              <div class="yc-title">${y.label}</div>
              <div class="yc-desc">${y.desc}</div>
              <div class="yc-footer">
                <span class="yc-count">${resourcesByYear(y.id).length} resources</span>
                <span>→</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>`;

  page.classList.add('active');
}

/* ============================================================
   YEAR PAGE
   ============================================================ */

function renderYearPage() {
  const page = $('#page-year');
  const year = State.currentYear;
  const sem  = State.currentSem;
  const yearMeta = YEARS_META.find(y => y.id === year);
  const subjects = uniqueSubjects(year, sem);

  page.innerHTML = `
    <div class="container">
      ${renderBreadcrumbs([
        { label: 'Home', page: 'home', opts: {} },
        { label: yearMeta ? yearMeta.label : labelify(year) }
      ])}

      <div class="page-header fade-up">
        <div class="page-header-title">${yearMeta ? yearMeta.label : labelify(year)}</div>
        <div class="page-header-sub">${yearMeta ? yearMeta.desc : ''}</div>
      </div>

      <div class="sem-tabs">
        ${(yearMeta ? yearMeta.semesters : ['sem-1','sem-2']).map(s => `
          <button class="sem-tab ${s === sem ? 'active' : ''}"
            onclick="navigate('year', { year: '${year}', sem: '${s}' })">
            ${s === 'sem-1' ? 'Semester 1' : 'Semester 2'}
          </button>
        `).join('')}
      </div>

      <div class="section-head">
        <div>
          <div class="section-title">Subjects</div>
          <div class="section-sub">${subjects.length} subject${subjects.length !== 1 ? 's' : ''} available</div>
        </div>
      </div>

      ${subjects.length === 0
        ? `<div class="empty-state fade-up">
             <div class="empty-icon">📂</div>
             <div class="empty-title">No subjects yet</div>
             <div class="empty-desc">No resources have been uploaded for this semester yet. Check back soon!</div>
           </div>`
        : `<div class="subject-grid stagger">
            ${subjects.map(r => {
              const meta  = SUBJECTS_META[r.subject] || { label: labelify(r.subject), icon: '📚' };
              const count = resourcesBySubject(year, sem, r.subject).length;
              return `
                <div class="subject-card" onclick="navigate('subject', { year: '${year}', sem: '${sem}', subject: '${r.subject}' })">
                  <div class="sc-icon">${meta.icon}</div>
                  <div class="sc-title">${meta.label}</div>
                  <div class="sc-count">${count} resource${count !== 1 ? 's' : ''}</div>
                </div>`;
            }).join('')}
          </div>`
      }

      <div class="section-head" style="margin-top:8px">
        <div>
          <div class="section-title">All Resources</div>
          <div class="section-sub">Sem ${sem === 'sem-1' ? '1' : '2'} · ${resourcesBySem(year, sem).length} total</div>
        </div>
      </div>

      ${renderResourceList(resourcesBySem(year, sem))}
    </div>`;

  page.classList.add('active');
}

/* ============================================================
   SUBJECT PAGE
   ============================================================ */

function renderSubjectPage() {
  const page = $('#page-subject');
  const { currentYear: year, currentSem: sem, currentSubject: subject } = State;
  const yearMeta = YEARS_META.find(y => y.id === year);
  const subjMeta = SUBJECTS_META[subject] || { label: labelify(subject), icon: '📚' };
  const resources = resourcesBySubject(year, sem, subject);

  page.innerHTML = `
    <div class="container">
      ${renderBreadcrumbs([
        { label: 'Home', page: 'home', opts: {} },
        { label: yearMeta ? yearMeta.label : labelify(year), page: 'year', opts: { year, sem } },
        { label: 'Sem ' + (sem === 'sem-1' ? '1' : '2'), page: 'year', opts: { year, sem } },
        { label: subjMeta.label }
      ])}

      <div class="page-header fade-up">
        <div class="page-header-title">${subjMeta.icon} ${subjMeta.label}</div>
        <div class="page-header-sub">${resources.length} resource${resources.length !== 1 ? 's' : ''} available</div>
      </div>

      ${renderResourceList(resources)}
    </div>`;

  page.classList.add('active');
}

/* ============================================================
   RESOURCE LIST RENDERER
   ============================================================ */

function renderResourceList(resources, activeFilter = 'all') {
  const categories = ['all', ...new Set(resources.map(r => r.category))];

  if (resources.length === 0) {
    return `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-title">No resources yet</div>
      <div class="empty-desc">Resources for this section haven't been uploaded. Check back soon!</div>
    </div>`;
  }

  return `
    <div class="resource-filters" id="resource-filters">
      ${categories.map(c => `
        <button class="filter-chip ${c === activeFilter ? 'active' : ''}"
          data-filter="${c}"
          onclick="filterResources('${c}')">
          ${c === 'all' ? 'All' : (CATEGORY_META[c] ? CATEGORY_META[c].label : labelify(c))}
        </button>
      `).join('')}
    </div>
    <div class="resource-list stagger" id="resource-list-container">
      ${resources.map(r => resourceCardHTML(r)).join('')}
    </div>`;
}

function filterResources(cat) {
  // Update active chip
  $$('#resource-filters .filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === cat);
  });

  // Filter cards
  const container = $('#resource-list-container');
  if (!container) return;
  const cards = $$('.resource-card', container);

  // Determine which resources to show by re-reading from DOM
  // We regenerate based on current page context
  let source = [];
  if (State.currentPage === 'subject') {
    source = resourcesBySubject(State.currentYear, State.currentSem, State.currentSubject);
  } else if (State.currentPage === 'year') {
    source = resourcesBySem(State.currentYear, State.currentSem);
  }

  const filtered = cat === 'all' ? source : source.filter(r => r.category === cat);
  container.innerHTML = filtered.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No matching resources</div><div class="empty-desc">Try selecting a different filter.</div></div>`
    : filtered.map(r => resourceCardHTML(r)).join('');
}

/* ============================================================
   RESOURCE VIEWER PAGE
   ============================================================ */

function renderResourcePage() {
  const page = $('#page-resource');
  const slug = State.currentResource;
  const r = getResourceBySlug(slug);

  if (!r) {
    page.innerHTML = `
      <div class="container">
        ${renderBreadcrumbs([{ label: 'Home', page: 'home', opts: {} }, { label: 'Resource Not Found' }])}
        <div class="viewer-error" style="margin-top:40px">
          <div class="viewer-error-icon">⚠️</div>
          <h3>Resource Not Found</h3>
          <p>The resource you're looking for doesn't exist or has been removed.</p>
          <button class="btn btn-primary" style="margin-top:12px" onclick="navigate('home')">← Go Home</button>
        </div>
      </div>`;
    page.classList.add('active');
    return;
  }

  const catMeta = CATEGORY_META[r.category] || { label: r.category, color: 'cat-notes' };
  const subjMeta = SUBJECTS_META[r.subject] || { label: labelify(r.subject), icon: '📚' };
  const yearMeta = YEARS_META.find(y => y.id === r.year);

  page.innerHTML = `
    <div class="container">
      ${renderBreadcrumbs([
        { label: 'Home', page: 'home', opts: {} },
        { label: yearMeta ? yearMeta.label : labelify(r.year), page: 'year', opts: { year: r.year, sem: r.semester } },
        { label: subjMeta.label, page: 'subject', opts: { year: r.year, sem: r.semester, subject: r.subject } },
        { label: r.title }
      ])}

      <div class="viewer-header fade-up">
        <div class="viewer-info">
          <div class="viewer-title">${r.title}</div>
          <div class="viewer-meta">
            <span class="rc-badge ${catMeta.color}">${catMeta.label}</span>
            <span class="rc-type">${r.type.toUpperCase()}</span>
            <span class="rc-type">${subjMeta.icon} ${subjMeta.label}</span>
          </div>
        </div>
        <div class="viewer-actions">
          <button class="btn btn-download btn-sm" onclick="handleDownload(event, '${r.path}', '${r.slug}')">
            ⬇ Download
          </button>
          <button class="btn btn-share btn-sm btn-outline" onclick="handleShare('${r.slug}', '${r.title}')">
            🔗 Share
          </button>
        </div>
      </div>

      <div class="viewer-frame-wrap fade-up" id="viewer-frame">
        ${renderViewer(r)}
      </div>
    </div>`;

  page.classList.add('active');
}

function renderViewer(r) {
  if (r.type === 'pdf') {
    return `<iframe class="viewer-iframe"
      src="${r.path}"
      title="${r.title}"
      onerror="showViewerError()"
    ></iframe>`;
  }

  if (r.type === 'jpg' || r.type === 'jpeg' || r.type === 'image') {
    return `<img class="viewer-img"
      src="${r.path}"
      alt="${r.title}"
      onerror="showViewerError()"
    />`;
  }

  return `<div class="viewer-error">
    <div class="viewer-error-icon">⚠️</div>
    <h3>Preview Not Available</h3>
    <p>This file type cannot be previewed. Download it to view.</p>
    <button class="btn btn-primary" style="margin-top:12px" onclick="handleDownload(event,'${r.path}','${r.slug}')">⬇ Download File</button>
  </div>`;
}

function showViewerError() {
  const frame = $('#viewer-frame');
  if (frame) {
    frame.innerHTML = `<div class="viewer-error">
      <div class="viewer-error-icon">❌</div>
      <h3>File Unavailable</h3>
      <p>This file could not be loaded. It may not have been uploaded yet, or the path is incorrect. Please try downloading it directly.</p>
    </div>`;
  }
}

/* ============================================================
   SEARCH PAGE (full)
   ============================================================ */

function renderSearchPage(query = '') {
  const page = $('#page-search');
  const results = query ? searchResources(query) : [];

  page.innerHTML = `
    <div class="container">
      ${renderBreadcrumbs([{ label: 'Home', page: 'home', opts: {} }, { label: 'Search' }])}

      <div class="page-header fade-up">
        <div class="page-header-title">Search Resources</div>
      </div>

      <div class="search-page-bar">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <input
            class="search-input"
            id="search-page-input"
            type="search"
            placeholder="Search notes, PYQs, subjects..."
            value="${query || ''}"
            autofocus
          />
        </div>
      </div>

      <div id="search-page-results">
        ${renderSearchResults(results, query)}
      </div>
    </div>`;

  page.classList.add('active');

  // Wire up search
  const inp = $('#search-page-input');
  if (inp) {
    inp.addEventListener('input', (e) => {
      const q = e.target.value;
      State.searchQuery = q;
      const res = searchResources(q);
      $('#search-page-results').innerHTML = renderSearchResults(res, q);
    });
    inp.focus();
  }
}

function renderSearchResults(results, query) {
  if (!query) return `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Start typing to search</div><div class="empty-desc">Search across all subjects, notes, PYQs, assignments, and more.</div></div>`;
  if (results.length === 0) return `<div class="empty-state"><div class="empty-icon">😕</div><div class="empty-title">No results found</div><div class="empty-desc">No resources matched "<strong>${query}</strong>". Try a different keyword.</div></div>`;

  return `
    <div class="search-stats">${results.length} result${results.length !== 1 ? 's' : ''} for "<strong>${query}</strong>"</div>
    <div class="resource-list stagger">
      ${results.map(r => resourceCardHTML(r)).join('')}
    </div>`;
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */

function renderSettingsPage() {
  const page = $('#page-settings');

  page.innerHTML = `
    <div class="container" style="max-width:640px">
      ${renderBreadcrumbs([{ label: 'Home', page: 'home', opts: {} }, { label: 'Settings' }])}

      <div class="page-header fade-up">
        <div class="page-header-title">Settings</div>
        <div class="page-header-sub">Manage your preferences</div>
      </div>

      <div class="settings-section fade-up">
        <div class="settings-section-head">Appearance</div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Dark Mode</div>
            <div class="settings-row-desc">Switch between light and dark theme</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="settings-dark-toggle" ${State.theme === 'dark' ? 'checked' : ''}
              onchange="applyTheme(this.checked ? 'dark' : 'light')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section fade-up">
        <div class="settings-section-head">Data</div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Clear Local Data</div>
            <div class="settings-row-desc">Reset theme preferences and cached data</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="clearLocalData()">Clear</button>
        </div>
      </div>

      <div class="about-card fade-up">
        <div class="about-logo">SK</div>
        <div class="about-name">StudyKarle</div>
        <div class="about-version">MVP v5 · Built for engineering students</div>
        <div class="about-desc">A fast, organized, clutter-free academic resource platform. Find and open study resources within seconds.</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">Made with ❤️ by <a href="https://www.instagram.com/realnitishkumarr/" target="_blank" rel="noopener">Nitish Kumar</a></div>
      </div>
    </div>`;

  page.classList.add('active');
}

function clearLocalData() {
  localStorage.clear();
  State.theme = 'light';
  applyTheme('light');
  toast('Local data cleared', '🗑️');
}

/* ============================================================
   HEADER SEARCH
   ============================================================ */

function setupHeaderSearch() {
  const input   = $('#header-search-input');
  const dropdown = $('#header-search-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (!q) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }
    const results = searchResources(q).slice(0, 7);
    if (results.length === 0) {
      dropdown.innerHTML = `<div class="search-empty">No results for "${q}"</div>`;
    } else {
      dropdown.innerHTML = results.map(r => {
        const catMeta  = CATEGORY_META[r.category]  || { label: r.category, color: 'cat-notes' };
        const subjMeta = SUBJECTS_META[r.subject] || { label: labelify(r.subject), icon: '📚' };
        return `
          <div class="search-result-item" onclick="navigate('resource', { slug: '${r.slug}' }); closeHeaderSearch()">
            <div class="sri-icon">${fileTypeIcon(r.type)}</div>
            <div class="sri-text">
              <div class="sri-title">${r.title}</div>
              <div class="sri-meta">${subjMeta.icon} ${subjMeta.label} · ${r.semester.replace('-',' ').replace('sem','Sem ')}</div>
            </div>
            <div class="sri-badge"><span class="rc-badge ${catMeta.color}">${catMeta.label}</span></div>
          </div>`;
      }).join('');
    }
    dropdown.classList.add('open');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigate('search', { query: input.value });
      closeHeaderSearch();
    }
    if (e.key === 'Escape') closeHeaderSearch();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search')) closeHeaderSearch();
  });
}

function closeHeaderSearch() {
  const dropdown = $('#header-search-dropdown');
  const input    = $('#header-search-input');
  if (dropdown) { dropdown.classList.remove('open'); dropdown.innerHTML = ''; }
  if (input) input.value = '';
}

/* ============================================================
   DOWNLOAD & SHARE
   ============================================================ */

function handleDownload(event, path, filename) {
  event.stopPropagation();
  const a = document.createElement('a');
  a.href = path;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Download started', '⬇️');
}

function handleShare(slug, title) {
  const url = `${location.origin}/resource/${slug}`;
  if (navigator.share) {
    navigator.share({ title: title, url: url })
      .then(() => toast('Shared successfully', '🔗'))
      .catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => toast('Link copied to clipboard', '📋'))
      .catch(() => toast('Could not copy link', '⚠️'));
  } else {
    prompt('Copy this link:', url);
  }
}

/* ============================================================
   INIT
   ============================================================ */

function init() {
  applyTheme(State.theme);
  setupHeaderSearch();

  // Parse current URL for deep linking
  const path = location.pathname;
  const parts = path.split('/').filter(Boolean);

  if (path === '/' || parts.length === 0) {
    navigate('home');
  } else if (parts[0] === 'settings') {
    navigate('settings');
  } else if (parts[0] === 'search') {
    const q = new URLSearchParams(location.search).get('q') || '';
    navigate('search', { query: q });
  } else if (parts[0] === 'resource' && parts[1]) {
    navigate('resource', { slug: parts[1] });
  } else if (parts.length >= 3) {
    navigate('subject', { year: parts[0], sem: parts[1], subject: parts[2] });
  } else if (parts.length === 2) {
    navigate('year', { year: parts[0], sem: parts[1] });
  } else if (parts.length === 1) {
    navigate('year', { year: parts[0], sem: 'sem-1' });
  } else {
    navigate('home');
  }
}

document.addEventListener('DOMContentLoaded', init);
