/* ============================================================
   StudyKarle — Main Entry Point (ES Module)
   ============================================================ */

import { getUser, setUser, clearUser, isLoggedIn } from './auth.js';
import { initRouter, navigate, buildURL } from './router.js';
import { searchResources } from './search.js';
import { showToast, setTheme, toggleTheme, initDarkMode } from './ui.js';
import { 
  renderHome, renderYearPage, renderSubjectPage, renderResourceViewer,
  renderSearchPage, renderSettingsPage, render404Page
} from './renderer.js';

// Export for global access (via window)
window.studykarle = {
  getUser, setUser, clearUser, isLoggedIn,
  initRouter, navigate, buildURL,
  searchResources,
  showToast, setTheme, toggleTheme, initDarkMode,
  renderHome, renderYearPage, renderSubjectPage, renderResourceViewer,
  renderSearchPage, renderSettingsPage, render404Page
};

// Initialize the application
function init() {
  // Apply saved theme
  const theme = localStorage.getItem('sk-theme') || 'light';
  setTheme(theme);
  
  // Update auth UI
  if (document.getElementById('auth-user-menu')) {
    updateAuthHeaderUI();
  }
  
  // Setup auth forms if on login page
  if (document.body.classList.contains('auth-body')) {
    if (isLoggedIn()) {
      window.location.href = 'index.html';
    }
    setupAuthForms();
    return;
  }
  
  // Check if user is logged in on main page
  if (!isLoggedIn()) {
    window.location.replace('/login.html');
    return;
  }
  
  // Setup main app
  setupStaticEventHandlers();
  initRouter();
}

function updateAuthHeaderUI() {
  const loginBtn = document.getElementById('auth-login-btn');
  const userMenu = document.getElementById('auth-user-menu');
  const nameEl = document.getElementById('auth-user-name');
  const avatarEl = document.getElementById('auth-user-avatar');
  const user = getUser();
  
  if (user) {
    if (loginBtn) loginBtn.hidden = true;
    if (userMenu) userMenu.hidden = false;
    if (nameEl) nameEl.textContent = user.name || 'Student';
    if (avatarEl) {
      const initials = user.name
        ? user.name.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
        : 'SK';
      avatarEl.textContent = initials;
    }
  } else {
    if (loginBtn) loginBtn.hidden = false;
    if (userMenu) userMenu.hidden = true;
  }
}

function setupStaticEventHandlers() {
  const logo = document.querySelector('.logo');
  if (logo) {
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
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearUser();
      updateAuthHeaderUI();
      showToast('Logged out successfully.', '👋');
      window.location.href = '/login.html';
    });
  }
}

function setupAuthForms() {
  // Signup form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignupStep1);
  }

  // OTP form
  const otpForm = document.getElementById('otp-form');
  if (otpForm) {
    otpForm.addEventListener('submit', handleOTPVerification);
  }

  // Resend OTP
  const resendBtn = document.getElementById('resend-otp-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', handleResendOTP);
  }

  // Cancel OTP
  const cancelBtn = document.getElementById('cancel-otp-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      clearPendingOTP();
      stopOTPCountdown();
      resetSignupToStep1();
      showToast('Signup cancelled. Fill the form again to retry.', 'ℹ️');
    });
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// Auth form handlers (imported from original script.js auth section)
// These will be available through the modules

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
