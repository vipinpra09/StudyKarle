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
   AUTH / SESSION
   ============================================================ */

// ── Storage keys ──────────────────────────────────────────────
const AUTH_STORAGE_KEY = 'users';       // Array of registered users
const LOGGED_IN_KEY    = 'loggedInUser'; // Currently logged-in user object
const REDIRECT_KEY     = 'postLoginRedirect'; // Where to send user after login

// ── EmailJS credentials ───────────────────────────────────────
// SERVICE_ID and TEMPLATE_ID must match your EmailJS dashboard.
// The OTP template must include a variable called {{otp_code}}.
const SERVICE_ID  = 'service_jz2ub13';
const TEMPLATE_ID = 'template_zplb77e'; // Should output: "Your OTP is {{otp_code}}"
const PUBLIC_KEY  = 'uXIo2Ei6s0b5ceKAa';

// ── OTP settings ──────────────────────────────────────────────
const OTP_TTL_MS    = 5 * 60 * 1000; // OTP valid for 5 minutes
const OTP_LENGTH    = 6;             // 6-digit numeric OTP
const OTP_SESSION_KEY = 'sk_pending_otp'; // sessionStorage key for pending OTP data
const OTP_RATE_LIMIT_KEY = 'lastOtpTime';

// ── Internal OTP countdown handle ────────────────────────────
let _otpCountdownInterval = null;

/* ----------------------------------------------------------
   USER STORAGE HELPERS
   ---------------------------------------------------------- */

/**
 * Returns the array of all registered users from localStorage.
 * Users are stored as: { name, email, password (SHA-256 hash) }
 */
function getStoredUsers() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse stored users', err);
    return [];
  }
}

/**
 * Saves the updated users array back to localStorage.
 * Call this ONLY after OTP is verified — never before.
 */
function saveStoredUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

/* ----------------------------------------------------------
   SESSION HELPERS
   ---------------------------------------------------------- */

/** Gets the currently logged-in user object, or null if logged out. */
function getLoggedInUser() {
  try {
    const raw = localStorage.getItem(LOGGED_IN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed to parse logged in user', err);
    return null;
  }
}

/** Saves the logged-in user to localStorage (only safe fields: name + email). */
function setLoggedInUser(user) {
  localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(user));
}

/** Removes the logged-in user from localStorage (used on logout). */
function clearLoggedInUser() {
  localStorage.removeItem(LOGGED_IN_KEY);
}

/* ----------------------------------------------------------
   VALIDATION HELPERS
   ---------------------------------------------------------- */

/** Returns first 1–2 uppercase initials from a name string. */
function getUserInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(p => p[0]).join('');
  return initials ? initials.toUpperCase() : 'SK';
}

/** Basic email format check. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password strength check.
 * Rule: at least 8 characters.
 * Extend this function to add uppercase/digit/symbol rules as needed.
 */
function isStrongPassword(password) {
  return password.length >= 8;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Returns true only if both strings are identical, character by character.
 */
function timingSafeEqual(a = '', b = '') {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Hashes a password with SHA-256, salted with the user's email.
 * Salt = email ensures two users with the same password get different hashes.
 * IMPORTANT: Passwords are NEVER stored or compared in plain text.
 * @param {string} password - The raw password entered by the user
 * @param {string} salt     - The user's email address (used as salt)
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
async function hashPassword(password, salt = '') {
  const payload = salt ? `${salt}:${password}` : password;
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/* ----------------------------------------------------------
   OTP GENERATION & EMAILJS
   ---------------------------------------------------------- */

/**
 * Generates a random numeric OTP of OTP_LENGTH digits.
 * Uses crypto.getRandomValues for cryptographic randomness.
 * @returns {string} e.g. "482931"
 */
function generateOTP() {
  const digits = new Uint32Array(1);
  // Generate a random number, then take the last OTP_LENGTH digits
  crypto.getRandomValues(digits);
  const raw = digits[0].toString().padStart(10, '0');
  return raw.slice(-OTP_LENGTH);
}

/** Initializes EmailJS with the public key. Called once on page load. */
function initEmailJS() {
  if (!window.emailjs || typeof emailjs.init !== 'function') return;
  try {
    emailjs.init(PUBLIC_KEY);
  } catch (err) {
    console.warn('EmailJS init failed', err);
  }
}

/**
 * Sends the OTP to the user's email via EmailJS.
 * The EmailJS template must include {{otp_code}}, {{user_name}}, {{user_email}}.
 *
 * @param {string} name     - User's display name
 * @param {string} email    - Destination email address
 * @param {string} otpCode  - The 6-digit OTP to include in the email
 * @returns {Promise<boolean>} true if sent, false if EmailJS failed
 */
async function sendOTPEmail(name, email, otpCode) {
  if (!window.emailjs || typeof emailjs.send !== 'function') {
    console.warn('EmailJS not available — OTP cannot be emailed.');
    return false;
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      user_name:  name,
      user_email: email,
      otp_code:   otpCode,   // ← your EmailJS template must use {{otp_code}}
    });
    return true;
  } catch (err) {
    console.warn('EmailJS send failed:', err);
    return false;
  }
}

/* ----------------------------------------------------------
   OTP PENDING STATE  (stored in sessionStorage, not localStorage)
   sessionStorage is cleared automatically when the tab/browser closes,
   so stale OTPs don't linger. Plain text OTP is only kept temporarily
   in session memory — it is NOT saved to localStorage with the user.
   ---------------------------------------------------------- */

/**
 * Saves the pending OTP data to sessionStorage.
 * @param {{ name, email, hashedPassword, otpCode, expiresAt }} data
 */
function savePendingOTP(data) {
  sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(data));
}

/** Returns the pending OTP data object, or null. */
function getPendingOTP() {
  try {
    const raw = sessionStorage.getItem(OTP_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clears the pending OTP from sessionStorage. */
function clearPendingOTP() {
  sessionStorage.removeItem(OTP_SESSION_KEY);
}

/* ----------------------------------------------------------
   OTP COUNTDOWN TIMER
   ---------------------------------------------------------- */

/**
 * Starts a visible countdown timer in the OTP step UI.
 * Updates every second and adds an "urgent" class when < 60 s remain.
 * Stops when time runs out and shows an expired message.
 * @param {number} expiresAt - Timestamp (ms) when the OTP expires
 */
function startOTPCountdown(expiresAt) {
  // Clear any previous interval
  if (_otpCountdownInterval) clearInterval(_otpCountdownInterval);

  const countdownEl = document.getElementById('otp-countdown');
  const timerEl     = document.getElementById('otp-timer');
  const resendBtn   = document.getElementById('resend-otp-btn');

  function tick() {
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      // OTP has expired
      clearInterval(_otpCountdownInterval);
      clearPendingOTP();
      if (countdownEl) countdownEl.textContent = '0:00';
      if (timerEl)     timerEl.classList.add('urgent');
      if (resendBtn)   resendBtn.disabled = false; // allow resend
      toast('OTP expired. Please request a new one.', '⏰');
      return;
    }

    const totalSec = Math.ceil(remaining / 1000);
    const mins     = Math.floor(totalSec / 60);
    const secs     = totalSec % 60;
    if (countdownEl) countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Turn red when under 60 seconds
    if (timerEl) timerEl.classList.toggle('urgent', remaining < 60_000);
  }

  tick(); // run immediately, then every second
  _otpCountdownInterval = setInterval(tick, 1000);
}

/** Stops the OTP countdown (called on cancel / success). */
function stopOTPCountdown() {
  if (_otpCountdownInterval) {
    clearInterval(_otpCountdownInterval);
    _otpCountdownInterval = null;
  }
}

/* ----------------------------------------------------------
   SIGNUP FLOW — Step 1: Validate & Send OTP
   ---------------------------------------------------------- */

/**
 * Handles the signup form submission (Step 1).
 * Validates input, generates OTP, sends it via EmailJS,
 * and transitions the UI to the OTP verification step.
 * The account is NOT created yet — only after OTP is verified.
 */
async function handleSignupStep1(e) {
  e.preventDefault();

  const name     = (document.getElementById('signup-name')?.value     || '').trim();
  const email    = (document.getElementById('signup-email')?.value    || '').trim().toLowerCase();
  const password = (document.getElementById('signup-password')?.value || '').trim();

  // ── Validation ───────────────────────────────────────────
  if (!name || !email || !password) {
    toast('Please fill in all signup fields.', '⚠️');
    return;
  }
  if (!isValidEmail(email)) {
    toast('Please enter a valid email address.', '⚠️');
    return;
  }
  if (password.length < 8) {
    toast('Password must be at least 8 characters.', '⚠️');
    return;
  }
  if (!isStrongPassword(password)) {
    toast('Password must be at least 8 characters long.', '⚠️');
    return;
  }

  // ── Check for duplicate email ─────────────────────────────
  const users = getStoredUsers();
  if (users.some(u => u.email === email)) {
    toast('This email is already registered. Please log in.', '⚠️');
    return;
  }

  // ── Hash password now (never store plain text) ────────────
  const hashedPassword = await hashPassword(password, email);

  // ── Generate and send OTP ─────────────────────────────────
  // Rate-limit: prevent sending more than 1 OTP per 60 seconds
  const lastOtpTime = parseInt(sessionStorage.getItem(OTP_RATE_LIMIT_KEY) || '0', 10);
  const now = Date.now();
  if (now - lastOtpTime < 60000) {
    const remaining = Math.ceil((60000 - (now - lastOtpTime)) / 1000);
    toast(`Please wait ${remaining}s before requesting another OTP.`, '⚠️');
    return;
  }
  sessionStorage.setItem(OTP_RATE_LIMIT_KEY, now.toString());

  const otpCode   = generateOTP();
  const expiresAt = Date.now() + OTP_TTL_MS;

  // Disable the send button while we email the OTP
  const sendBtn = document.getElementById('send-otp-btn');
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending OTP…'; }

  const sent = await sendOTPEmail(name, email, otpCode);

  if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send OTP to Email'; }

  if (!sent) {
    toast('Could not send OTP. Check your email and try again.', '❌');
    return;
  }

  // ── Save pending OTP to sessionStorage (NOT localStorage) ─
  // Account is NOT written to localStorage yet.
  savePendingOTP({ name, email, hashedPassword, otpCode, expiresAt });

  // ── Switch UI to OTP step ─────────────────────────────────
  const step1 = document.getElementById('signup-step-1');
  const step2 = document.getElementById('signup-step-2');
  const emailLabel = document.getElementById('otp-target-email');

  if (step1) step1.hidden = true;
  if (step2) step2.hidden = false;
  if (emailLabel) emailLabel.textContent = email;
  document.getElementById('otp-input')?.focus();

  startOTPCountdown(expiresAt);
  toast('OTP sent successfully! Check your inbox.', '📧');
}

/* ----------------------------------------------------------
   SIGNUP FLOW — Step 2: Verify OTP & Create Account
   ---------------------------------------------------------- */

/**
 * Handles OTP form submission (Step 2).
 * Verifies OTP against the pending session data.
 * Only if correct and not expired: saves the user to localStorage.
 */
// NOTE: This OTP verification is client-side only and is NOT cryptographically secure.
// A determined user could bypass it via DevTools. For production security,
// move OTP generation and verification to a server (Firebase Functions, Supabase, etc.)
async function handleOTPVerification(e) {
  e.preventDefault();

  const enteredOTP = (document.getElementById('otp-input')?.value || '').trim();
  const pending    = getPendingOTP();

  // ── Guard: no pending OTP session ────────────────────────
  if (!pending) {
    toast('OTP session not found. Please start signup again.', '⚠️');
    resetSignupToStep1();
    return;
  }

  // ── Guard: OTP expired ────────────────────────────────────
  if (Date.now() > pending.expiresAt) {
    toast('OTP expired. Please request a new one.', '⏰');
    clearPendingOTP();
    stopOTPCountdown();
    // Enable resend button
    const resendBtn = document.getElementById('resend-otp-btn');
    if (resendBtn) resendBtn.disabled = false;
    return;
  }

  // ── Guard: empty OTP input ────────────────────────────────
  if (!enteredOTP) {
    toast('OTP verification required before signup can complete.', '⚠️');
    return;
  }

  // ── Compare OTP (timing-safe to prevent brute-force guessing) ─
  if (!timingSafeEqual(enteredOTP, pending.otpCode)) {
    toast('Incorrect OTP. Please check your email and try again.', '❌');
    // Clear the input so the user re-types
    const otpInput = document.getElementById('otp-input');
    if (otpInput) { otpInput.value = ''; otpInput.focus(); }
    return;
  }

  // ── OTP is correct — now save the account ────────────────
  // This is the ONLY place where a user is written to localStorage.
  const users = getStoredUsers();

  // Double-check for race condition (same email registered in another tab)
  if (users.some(u => u.email === pending.email)) {
    toast('This email was already registered. Please log in.', '⚠️');
    clearPendingOTP();
    stopOTPCountdown();
    resetSignupToStep1();
    return;
  }

  // Push new verified user — password is already hashed
  users.push({
    name:     pending.name,
    email:    pending.email,
    password: pending.hashedPassword, // SHA-256 hash, never plain text
  });
  saveStoredUsers(users);

  // Clean up OTP session and timer
  clearPendingOTP();
  stopOTPCountdown();

  toast('Account created successfully! Please log in.', '✅');
  resetSignupToStep1();
  // Auto-focus the login email field to guide the user
  document.getElementById('login-email')?.focus();
}

/**
 * Resets the signup card back to Step 1 (form visible, OTP step hidden).
 * Called after successful signup, cancel, or error recovery.
 */
function resetSignupToStep1() {
  const step1 = document.getElementById('signup-step-1');
  const step2 = document.getElementById('signup-step-2');
  if (step1) step1.hidden = false;
  if (step2) step2.hidden = true;

  // Clear all signup inputs
  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.reset();

  // Clear OTP input
  const otpInput = document.getElementById('otp-input');
  if (otpInput) otpInput.value = '';

  stopOTPCountdown();
}

/**
 * Handles the "Resend OTP" button.
 * Re-generates the OTP and re-sends it to the same email.
 */
async function handleResendOTP() {
  const pending = getPendingOTP();
  if (!pending) {
    toast('Session expired. Please fill the signup form again.', '⚠️');
    resetSignupToStep1();
    return;
  }

  const resendBtn = document.getElementById('resend-otp-btn');
  if (resendBtn) { resendBtn.disabled = true; }

  const newOTP       = generateOTP();
  const newExpiresAt = Date.now() + OTP_TTL_MS;

  const sent = await sendOTPEmail(pending.name, pending.email, newOTP);

  if (!sent) {
    toast('Could not resend OTP. Check your connection.', '❌');
    if (resendBtn) resendBtn.disabled = false;
    return;
  }

  // Update pending OTP with new code and expiry
  savePendingOTP({ ...pending, otpCode: newOTP, expiresAt: newExpiresAt });

  // Clear the OTP input field
  const otpInput = document.getElementById('otp-input');
  if (otpInput) { otpInput.value = ''; otpInput.focus(); }

  startOTPCountdown(newExpiresAt);
  toast('New OTP sent! Check your inbox.', '📧');
}

/* ----------------------------------------------------------
   LOGIN FLOW
   ---------------------------------------------------------- */

/**
 * Handles login form submission.
 * Checks: email exists → password hash matches → log in.
 * Fails with a generic "invalid credentials" message (no hints
 * about whether it's the email or password that's wrong).
 */
async function handleLogin(e) {
  e.preventDefault();

  const email    = (document.getElementById('login-email')?.value    || '').trim().toLowerCase();
  const password = (document.getElementById('login-password')?.value || '').trim();

  if (!email || !password) {
    toast('Please enter your email and password.', '⚠️');
    return;
  }

  // Hash the entered password the same way it was hashed on signup
  const hashedPassword = await hashPassword(password, email);

  // Look up user by email in localStorage["users"]
  const users = getStoredUsers();
  const user  = users.find(u => u.email === email);

  // Timing-safe comparison:
  // If user not found, compare with the hash itself (always false)
  // so timing is consistent (prevents email enumeration via timing)
  const storedHash = user ? user.password : hashedPassword;
  const match      = timingSafeEqual(hashedPassword, storedHash);

  if (!user || !match) {
    // Generic message — do NOT say "email not found" or "wrong password"
    toast('Invalid credentials. Please check your email and password.', '⚠️');
    return;
  }

  // Only name and email are stored in session — never the password hash
  setLoggedInUser({ name: user.name, email: user.email });
  toast('Login successful! Welcome back.', '✅');
  redirectToPostLogin();
}

/* ----------------------------------------------------------
   AUTH UI  (header: Login button vs. user menu)
   ---------------------------------------------------------- */

/**
 * Updates the top-right header based on login state.
 *
 * Logged OUT → shows "Login / Signup" button
 * Logged IN  → shows avatar + name + Logout button
 *
 * No duplicate links, no confusing extra options.
 */
function updateAuthUI() {
  const loginBtn  = document.getElementById('auth-login-btn');
  const userMenu  = document.getElementById('auth-user-menu');
  const nameEl    = document.getElementById('auth-user-name');
  const avatarEl  = document.getElementById('auth-user-avatar');
  const user      = getLoggedInUser();

  if (user) {
    // User is logged in — show their name/avatar and logout button
    if (loginBtn)  loginBtn.hidden  = true;
    if (userMenu)  userMenu.hidden  = false;
    if (nameEl)    nameEl.textContent   = user.name  || 'Student';
    if (avatarEl)  avatarEl.textContent = getUserInitials(user.name || 'Student');
  } else {
    // User is logged out — show the login/signup button
    if (loginBtn)  loginBtn.hidden  = false;
    if (userMenu)  userMenu.hidden  = true;
  }
}

/* ----------------------------------------------------------
   REDIRECT HELPERS
   ---------------------------------------------------------- */

/** Builds a safe path from the current URL (used before redirecting to login). */
function buildSafeRedirectPath() {
  const path   = location.pathname;
  const params = new URLSearchParams(location.search);
  const query  = params.get('q');
  return query ? `${path}?q=${encodeURIComponent(query)}` : path;
}

/**
 * Validates a redirect path — prevents open redirect attacks.
 * Only allows relative paths that start with "/" and don't contain
 * "://" (external URLs) or "login.html" (redirect loops).
 */
function sanitizeRedirectPath(path) {
  if (!path || typeof path !== 'string') return '';
  if (!path.startsWith('/'))    return '';
  if (path.startsWith('//'))    return '';
  if (path.includes('://'))     return '';
  if (path.includes('login.html')) return '';
  return path;
}

/** Redirects to index.html (or the saved pre-login URL) after successful login. */
function redirectToPostLogin() {
  const redirectTo = sanitizeRedirectPath(localStorage.getItem(REDIRECT_KEY));
  if (redirectTo) localStorage.removeItem(REDIRECT_KEY);
  window.location.href = redirectTo || 'index.html';
}

/**
 * If the user is not logged in, saves the current URL and redirects to login.html.
 * Called on every page load of index.html.
 * Returns true if redirect happened (caller should stop rendering).
 */
function redirectIfLoggedOut() {
  if (document.body.classList.contains('auth-body')) return false;
  if (getLoggedInUser()) return false;

  const currentPath = buildSafeRedirectPath();
  localStorage.setItem(REDIRECT_KEY, currentPath);
  window.location.href = 'login.html';
  return true;
}

/** Logs the user out, clears their session, and returns to login.html. */
function logout() {
  clearLoggedInUser();
  updateAuthUI();
  toast('Logged out successfully.', '👋');
  if (!document.body.classList.contains('auth-body')) {
    localStorage.setItem(REDIRECT_KEY, buildSafeRedirectPath());
    window.location.href = 'login.html';
  }
}

/* ----------------------------------------------------------
   SETUP FUNCTIONS  (called from init())
   ---------------------------------------------------------- */

/** Wires up the Logout button and refreshes the header auth UI. */
function setupAuthUI() {
  updateAuthUI();
}

/**
 * Wires up all auth form event listeners:
 *  - Signup Step 1 form   → handleSignupStep1
 *  - OTP verification form → handleOTPVerification
 *  - Resend OTP button    → handleResendOTP
 *  - Cancel OTP button    → resetSignupToStep1 + clearPendingOTP
 *  - Login form           → handleLogin
 */
function setupAuthForms() {
  // ── Signup Step 1 ──────────────────────────────────────────
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignupStep1);
  }

  // ── OTP Step 2 ─────────────────────────────────────────────
  const otpForm = document.getElementById('otp-form');
  if (otpForm) {
    otpForm.addEventListener('submit', handleOTPVerification);
  }

  // ── Resend OTP ─────────────────────────────────────────────
  const resendBtn = document.getElementById('resend-otp-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', handleResendOTP);
  }

  // ── Cancel OTP (go back to Step 1) ─────────────────────────
  const cancelBtn = document.getElementById('cancel-otp-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      clearPendingOTP();
      stopOTPCountdown();
      resetSignupToStep1();
      toast('Signup cancelled. Fill the form again to retry.', 'ℹ️');
    });
  }

  // ── Login form ─────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
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

function setupStaticEventHandlers() {
  const logo = document.querySelector('.logo');
  if (logo && !document.body.classList.contains('auth-body')) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('home');
    });
  }

  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', () => navigate('search', {}));
  }

  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => navigate('settings'));
  }

  document.querySelectorAll('.bnav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) navigate(page, {});
    });
  });

  const logoutBtn = document.getElementById('auth-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

/* ============================================================
   ROUTER / PAGES
   ============================================================ */

function render404Page() {
  const page = document.getElementById('page-404');
  if (!page) return;

  page.innerHTML = `
    <div class="container">
      <div style="text-align:center; padding:4rem 2rem;">
        <h2>404 — Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <button class="btn btn-primary" id="go-home-from-404">Go Home</button>
      </div>
    </div>
  `;
  page.classList.add('active');
  document.getElementById('go-home-from-404')?.addEventListener('click', () => navigate('home'));
}

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
    case '404':
      render404Page();
      break;
    default:
      State.currentPage = '404';
      render404Page();
      page = '404';
      opts = {};
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
  initEmailJS();
  setupStaticEventHandlers();
  setupAuthUI();
  setupAuthForms();

  if (document.body.classList.contains('auth-body')) {
    if (getLoggedInUser()) {
      redirectToPostLogin();
    }
    return;
  }

  if (redirectIfLoggedOut()) return;

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
    navigate(getResourceBySlug(parts[1]) ? 'resource' : '404', { slug: parts[1] });
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

document.addEventListener('DOMContentLoaded', init);
