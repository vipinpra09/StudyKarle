import { getUser, setUser, getRegisteredUsers, saveRegisteredUsers } from './auth.js';
import { initDarkMode, setTheme, showToast } from './ui.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const SERVICE_ID = 'service_jz2ub13';
const TEMPLATE_ID = 'template_zplb77e';
const PUBLIC_KEY = 'uXIo2Ei6s0b5ceKAa';

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

function clearFormInputs(container) {
  container.querySelectorAll('input').forEach((input) => {
    input.value = '';
    input.disabled = false;
  });
}

async function sendOTPEmail(name, email, otpCode) {
  if (!window.emailjs || typeof window.emailjs.send !== 'function') return false;
  try {
    window.emailjs.init(PUBLIC_KEY);
    await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      user_name: name,
      user_email: email,
      otp_code: otpCode
    });
    return true;
  } catch {
    return false;
  }
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.auth-tab'));
  const loginPanel = document.getElementById('login-form-panel');
  const signupPanel = document.getElementById('signup-form-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((item) => item.classList.toggle('active', item === tab));

      const showLogin = target === 'login';
      loginPanel.hidden = !showLogin;
      signupPanel.hidden = showLogin;
      clearFormInputs(loginPanel);
      clearFormInputs(signupPanel);
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

function initSignupFlow() {
  (() => {
    const signupForm = document.getElementById('signup-form');
    const otpSection = document.getElementById('otp-section');
    const otpForm = document.getElementById('otp-form');
    const otpInput = document.getElementById('otp-input');
    const verifyButton = document.getElementById('verify-otp-btn');
    const otpCountdown = document.getElementById('otp-countdown');
    const otpTargetEmail = document.getElementById('otp-target-email');
    const otpExpiryMessage = document.getElementById('otp-expiry-message');

    if (!signupForm || !otpForm || !otpSection || !otpInput || !verifyButton) return;

    let pendingSignup = null;
    let otpExpired = false;
    let timerId = null;

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function resetOtpState() {
      otpExpired = false;
      otpInput.disabled = false;
      verifyButton.disabled = false;
      otpExpiryMessage.hidden = true;
      otpExpiryMessage.textContent = '';
    }

    function startTimer(expiresAt) {
      stopTimer();
      const update = () => {
        const remaining = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        otpCountdown.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;

        if (remaining === 0) {
          stopTimer();
          otpExpired = true;
          verifyButton.disabled = true;
          otpInput.disabled = true;
          otpExpiryMessage.hidden = false;
          otpExpiryMessage.textContent = 'OTP expired. Please request a new one.';
        }
      };
      update();
      timerId = setInterval(update, 1000);
    }

    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = String(document.getElementById('signup-name')?.value || '').trim();
      const email = String(document.getElementById('signup-email')?.value || '').trim().toLowerCase();
      const password = String(document.getElementById('signup-password')?.value || '').trim();

      if (!name || !email || !password) {
        showToast('Fill all signup fields.', 'error');
        return;
      }

      const users = getRegisteredUsers();
      if (users.some((user) => user.email === email)) {
        showToast('This email is already registered.', 'error');
        return;
      }

      const otpCode = generateOTP();
      const sent = await sendOTPEmail(name, email, otpCode);
      if (!sent) {
        showToast('Could not send OTP. Try again.', 'error');
        return;
      }

      pendingSignup = {
        name,
        email,
        passwordHash: await hashPassword(password, email),
        otpCode,
        expiresAt: Date.now() + OTP_TTL_MS
      };

      resetOtpState();
      otpSection.hidden = false;
      otpTargetEmail.textContent = email;
      otpInput.value = '';
      startTimer(pendingSignup.expiresAt);
      showToast('OTP sent successfully.', 'success');
    });

    otpForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (otpExpired) {
        showToast('OTP expired. Please request a new one.', 'error');
        return;
      }

      if (!pendingSignup) {
        showToast('Send OTP first.', 'error');
        return;
      }

      const entered = String(otpInput.value || '').trim();
      if (!/^\d{6}$/.test(entered)) {
        showToast('Enter a valid 6-digit OTP.', 'error');
        return;
      }

      if (entered !== pendingSignup.otpCode) {
        showToast('Invalid OTP.', 'error');
        return;
      }

      const users = getRegisteredUsers();
      users.push({
        name: pendingSignup.name,
        email: pendingSignup.email,
        password: pendingSignup.passwordHash,
        createdAt: new Date().toISOString()
      });
      saveRegisteredUsers(users);

      setUser({
        name: pendingSignup.name,
        email: pendingSignup.email,
        createdAt: new Date().toISOString()
      });

      stopTimer();
      showToast('Account created successfully.', 'success');
      window.location.replace('/');
    });
  })();
}

function initLoginFlow() {
  (() => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = String(document.getElementById('login-email')?.value || '').trim().toLowerCase();
      const password = String(document.getElementById('login-password')?.value || '').trim();

      if (!email || !password) {
        showToast('Enter email and password.', 'error');
        return;
      }

      const users = getRegisteredUsers();
      const match = users.find((user) => user.email === email);
      if (!match) {
        showToast('Invalid credentials.', 'error');
        return;
      }

      const attemptedHash = await hashPassword(password, email);
      if (attemptedHash !== match.password) {
        showToast('Invalid credentials.', 'error');
        return;
      }

      setUser({ name: match.name, email: match.email, createdAt: match.createdAt || new Date().toISOString() });
      showToast('Login successful.', 'success');
      window.location.replace('/');
    });
  })();
}

function init() {
  if (getUser()) {
    window.location.replace('/');
    return;
  }

  initDarkMode();
  initThemeToggle();
  initTabs();
  initSignupFlow();
  initLoginFlow();
}

document.addEventListener('DOMContentLoaded', init);
