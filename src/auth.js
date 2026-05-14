/**
 * src/auth.js
 * Authentication module - manages user session and localStorage
 */

const LOGGED_IN_KEY = 'loggedInUser';

/**
 * Retrieves the currently logged-in user object from localStorage.
 * Returns { name, email, createdAt } or null if not logged in.
 */
export function getUser() {
  try {
    const raw = localStorage.getItem(LOGGED_IN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed to parse logged in user', err);
    return null;
  }
}

/**
 * Saves a user object to localStorage (only safe fields: name, email, createdAt).
 * Never stores passwords.
 */
export function setUser(userData) {
  localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(userData));
}

/**
 * Removes the logged-in user from localStorage (used on logout).
 */
export function clearUser() {
  localStorage.removeItem(LOGGED_IN_KEY);
}

/**
 * Checks if a user is currently logged in.
 */
export function isLoggedIn() {
  return !!getUser();
}
