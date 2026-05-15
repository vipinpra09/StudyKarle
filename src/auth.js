const LOGGED_IN_KEY = 'loggedInUser';
const USERS_KEY = 'users';

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getUser() {
  const parsed = safeParse(localStorage.getItem(LOGGED_IN_KEY), null);
  if (!parsed || typeof parsed !== 'object') return null;
  if (!parsed.name || !parsed.email) return null;
  return {
    name: String(parsed.name),
    email: String(parsed.email),
    createdAt: parsed.createdAt || null
  };
}

export function setUser(userData) {
  const payload = {
    name: String(userData?.name || 'Student').trim(),
    email: String(userData?.email || '').trim().toLowerCase(),
    createdAt: userData?.createdAt || new Date().toISOString()
  };
  localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(payload));
}

export function clearUser() {
  localStorage.removeItem(LOGGED_IN_KEY);
}

export function isLoggedIn() {
  return !!getUser();
}

export function getRegisteredUsers() {
  const users = safeParse(localStorage.getItem(USERS_KEY), []);
  return Array.isArray(users) ? users : [];
}

export function saveRegisteredUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(Array.isArray(users) ? users : []));
}
