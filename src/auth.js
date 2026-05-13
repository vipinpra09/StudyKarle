/* ============================================================
   StudyKarle — Auth Script (localStorage + EmailJS)
   ============================================================ */

const USERS_KEY = 'sk-users';
const CURRENT_USER_KEY = 'sk-current-user';
const EMAILJS_PUBLIC_KEY = 'uXIo2Ei6s0b5ceKAa';
const EMAILJS_SERVICE_ID = 'service_jz2ub13';
const EMAILJS_TEMPLATE_ID = 'template_88cv17l';

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const themeToggle = document.getElementById('auth-theme-toggle');

/* ============================================================
   HELPERS
   ============================================================ */

function toast(msg, icon = '✓') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch (_) {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  if (!window.crypto?.subtle) return null;
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function setButtonBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

/* ============================================================
   THEME
   ============================================================ */

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('sk-theme', nextTheme);
  if (themeToggle) {
    themeToggle.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = nextTheme === 'dark' ? 'Light mode' : 'Dark mode';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = localStorage.getItem('sk-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

applyTheme(localStorage.getItem('sk-theme') || 'light');

/* ============================================================
   EMAILJS
   ============================================================ */

function initEmailJS() {
  if (!window.emailjs) return;
  try {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  } catch (_) {
    // ignore initialization errors
  }
}

async function sendSignupEmail({ name, email }) {
  if (!window.emailjs) return;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      name,
      email,
      user_name: name,
      user_email: email,
      signup_time: new Date().toLocaleString(),
    });
  } catch (_) {
    toast('Signup saved, but email failed to send.', '⚠️');
  }
}

initEmailJS();

/* ============================================================
   SIGNUP
   ============================================================ */

async function handleSignup(event) {
  event.preventDefault();
  const button = signupForm.querySelector('button[type="submit"]');
  setButtonBusy(button, true, 'Creating...');

  const name = signupForm.name.value.trim();
  const email = normalizeEmail(signupForm.email.value);
  const password = signupForm.password.value;

  if (!name || !email || !password) {
    toast('Please fill in all signup fields.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  if (!isValidEmail(email)) {
    toast('Enter a valid email address.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  const users = getUsers();
  if (users[email]) {
    toast('An account with this email already exists.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  const passwordHash = await hashPassword(password);
  if (!passwordHash) {
    toast('Secure hashing is not supported in this browser.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  users[email] = {
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  saveUsers(users);
  localStorage.setItem(CURRENT_USER_KEY, email);

  signupForm.reset();
  toast('Signup successful! You can log in now.');
  await sendSignupEmail({ name, email });
  setButtonBusy(button, false);
}

/* ============================================================
   LOGIN
   ============================================================ */

async function handleLogin(event) {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  setButtonBusy(button, true, 'Checking...');

  const email = normalizeEmail(loginForm.email.value);
  const password = loginForm.password.value;

  if (!email || !password) {
    toast('Please enter your email and password.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  const users = getUsers();
  const user = users[email];
  if (!user) {
    toast('No account found for this email.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  const passwordHash = await hashPassword(password);
  if (!passwordHash) {
    toast('Secure hashing is not supported in this browser.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  if (passwordHash !== user.passwordHash) {
    toast('Incorrect password. Try again.', '⚠️');
    setButtonBusy(button, false);
    return;
  }

  localStorage.setItem(CURRENT_USER_KEY, email);
  toast(`Welcome back, ${user.name.split(' ')[0]}!`);
  setTimeout(() => {
    window.location.href = '/';
  }, 700);
  setButtonBusy(button, false);
}

if (signupForm) signupForm.addEventListener('submit', handleSignup);
if (loginForm) loginForm.addEventListener('submit', handleLogin);
