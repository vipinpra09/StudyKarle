import { getUser, setUser, getRegisteredUsers, saveRegisteredUsers } from './auth.js';
import { initDarkMode, setTheme } from './ui.js';

const EMAILJS_SERVICE_ID = 'service_jz2ub13';
const EMAILJS_TEMPLATE_ID = 'template_zplb77e';
const EMAILJS_PUBLIC_KEY = 'uXIo2Ei6s0b5ceKAa';

let pendingSignup = null;
let countdownId = null;
let emailJsInitialized = false;

async function hashPassword(password, salt) {
  const payload = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateOTP() {
  const data = new Uint32Array(1);
  crypto.getRandomValues(data);
  return String(data[0]).slice(-6).padStart(6, '0');
}

function initEmailJs() {
  if (emailJsInitialized) return true;
  if (!window.emailjs || typeof window.emailjs.init !== 'function' || typeof window.emailjs.send !== 'function') {
    return false;
  }
  window.emailjs.init(EMAILJS_PUBLIC_KEY);
  emailJsInitialized = true;
  return true;
}

async function sendOTPEmail(name, email, otpCode) {
  if (!initEmailJs()) return false;
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      user_name: name,
      user_email: email,
      otp_code: otpCode
    });
    return true;
  } catch {
    return false;
  }
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
    updateThemeIcon();
  });
}

function setStep(step) {
  const step1 = document.getElementById('signup-step-1');
  const step2 = document.getElementById('signup-step-2');
  if (!step1 || !step2) return;
  step1.hidden = step !== 1;
  step2.hidden = step !== 2;
}

function stopCountdown() {
  if (countdownId) {
    clearInterval(countdownId);
    countdownId = null;
  }
}

function clearPanelInputs(panel) {
  panel.querySelectorAll('input').forEach((input) => {
    input.value = '';
    input.disabled = false;
  });
}

function initAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  const panels = document.querySelectorAll('.auth-panel');

  function switchTo(id) {
    tabs.forEach((tab) => {
      const on = tab.dataset.target === id;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const hidden = panel.id !== id;
      panel.hidden = hidden;
      if (hidden) clearPanelInputs(panel);
    });

    if (id !== 'panel-signup') {
      stopCountdown();
      pendingSignup = null;
      setStep(1);
    }
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => switchTo(tab.dataset.target)));
  document.querySelectorAll('.auth-link[data-switch-to]').forEach((link) => {
    link.addEventListener('click', () => switchTo(link.dataset.switchTo));
  });

  const sendBtn = document.getElementById('send-otp-btn');
  const cancelBtn = document.getElementById('cancel-otp-btn');
  const verifyBtn = document.getElementById('verify-otp-btn');
  const resendBtn = document.getElementById('resend-otp-btn');
  const otpInput = document.getElementById('otp-input');
  const timerEl = document.getElementById('otp-timer');
  const otpTarget = document.getElementById('otp-target');

  function startCountdown() {
    if (!timerEl || !verifyBtn || !resendBtn || !otpInput) return;
    let secs = 300;

    stopCountdown();
    verifyBtn.disabled = false;
    otpInput.disabled = false;
    resendBtn.disabled = true;
    timerEl.classList.remove('expired');
    timerEl.textContent = 'Expires in 05:00';

    countdownId = setInterval(() => {
      secs -= 1;
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      timerEl.textContent = `Expires in ${m}:${s}`;
      if (secs <= 0) {
        stopCountdown();
        timerEl.textContent = 'OTP expired';
        timerEl.classList.add('expired');
        verifyBtn.disabled = true;
        otpInput.disabled = true;
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const name = String(document.getElementById('signup-name')?.value || '').trim();
      const email = String(document.getElementById('signup-email')?.value || '').trim().toLowerCase();
      const password = String(document.getElementById('signup-password')?.value || '').trim();

      if (!name || !email || !password) return;

      const users = getRegisteredUsers();
      if (users.some((user) => user.email === email)) return;

      const otpCode = generateOTP();
      sendBtn.disabled = true;
      const sent = await sendOTPEmail(name, email, otpCode);
      sendBtn.disabled = false;
      if (!sent) return;

      pendingSignup = {
        name,
        email,
        otpCode,
        passwordHash: await hashPassword(password, email),
        createdAt: new Date().toISOString()
      };

      if (otpTarget) otpTarget.textContent = email;
      setStep(2);
      if (otpInput) otpInput.value = '';
      startCountdown();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      stopCountdown();
      setStep(1);
      if (otpInput) {
        otpInput.value = '';
        otpInput.disabled = false;
      }
      if (verifyBtn) verifyBtn.disabled = false;
      if (resendBtn) resendBtn.disabled = true;
      if (timerEl) {
        timerEl.classList.remove('expired');
        timerEl.textContent = 'Expires in 5:00';
      }
    });
  }

  resendBtn?.addEventListener('click', async () => {
    if (!pendingSignup) return;
    const otpCode = generateOTP();
    resendBtn.disabled = true;
    const sent = await sendOTPEmail(pendingSignup.name, pendingSignup.email, otpCode);
    if (!sent) {
      resendBtn.disabled = false;
      return;
    }
    pendingSignup.otpCode = otpCode;
    startCountdown();
  });

  verifyBtn?.addEventListener('click', () => {
    if (!pendingSignup || !otpInput) return;
    if (verifyBtn.disabled || otpInput.disabled) return;
    const otpValue = otpInput.value.trim();
    if (!/^\d{6}$/.test(otpValue)) return;
    if (otpValue !== pendingSignup.otpCode) return;

    const users = getRegisteredUsers();
    users.push({
      name: pendingSignup.name,
      email: pendingSignup.email,
      password: pendingSignup.passwordHash,
      createdAt: pendingSignup.createdAt
    });
    saveRegisteredUsers(users);
    setUser({ name: pendingSignup.name, email: pendingSignup.email, createdAt: pendingSignup.createdAt });
    window.location.replace('/');
  });

  document.getElementById('login-btn')?.addEventListener('click', async () => {
    const email = String(document.getElementById('login-email')?.value || '').trim().toLowerCase();
    const password = String(document.getElementById('login-password')?.value || '').trim();
    if (!email || !password) return;

    const users = getRegisteredUsers();
    const user = users.find((candidate) => candidate.email === email);
    if (!user) return;

    const attemptedHash = await hashPassword(password, email);
    if (attemptedHash !== user.password) return;

    setUser({ name: user.name, email: user.email, createdAt: user.createdAt || new Date().toISOString() });
    window.location.replace('/');
  });
}

function init() {
  if (window.location.pathname !== '/login.html') return;
  if (getUser()) {
    window.location.replace('/');
    return;
  }
  initDarkMode();
  updateThemeIcon();
  initThemeToggle();
  initAuthTabs();
}

document.addEventListener('DOMContentLoaded', init);
