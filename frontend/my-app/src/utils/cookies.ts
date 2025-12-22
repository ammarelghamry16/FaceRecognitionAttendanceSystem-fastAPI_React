/**
 * Cookie Utilities for Multi-Server Deployment
 * 
 * Provides functions for reading, writing, and deleting cookies.
 * Used for accessing non-HTTP-only cookies (user data, theme, remember me).
 * HTTP-only cookies (access_token, refresh_token) are handled automatically by the browser.
 */

import type { User } from '@/services/authService';

/**
 * Get a cookie value by name
 * @param name - The cookie name
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
        try {
            return decodeURIComponent(match[2]);
        } catch {
            return match[2];
        }
    }
    return null;
}

/**
 * Set a cookie with the given name, value, and expiration
 * @param name - The cookie name
 * @param value - The cookie value
 * @param days - Number of days until expiration (default: 30)
 * @param path - Cookie path (default: '/')
 */
export function setCookie(name: string, value: string, days: number = 30, path: string = '/'): void {
    if (typeof document === 'undefined') return;

    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}; expires=${expires}; path=${path}; SameSite=Lax`;
}

/**
 * Delete a cookie by name
 * @param name - The cookie name
 * @param path - Cookie path (default: '/')
 */
export function deleteCookie(name: string, path: string = '/'): void {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

/**
 * Get the current user from the user cookie
 * @returns The user object or null if not found/invalid
 */
export function getUser(): User | null {
    const userCookie = getCookie('user');
    if (!userCookie) return null;

    try {
        const user = JSON.parse(userCookie) as User;
        // Parse full_name into first/last if needed
        if (user && !user.first_name && user.full_name) {
            const parts = user.full_name.split(' ');
            user.first_name = parts[0];
            user.last_name = parts.slice(1).join(' ') || '';
        }
        return user;
    } catch {
        // Invalid JSON, clear the cookie
        deleteCookie('user');
        return null;
    }
}

/**
 * Get remember me credentials from cookies
 * @returns Object with email and password, or null if not found
 */
export function getRememberMeCredentials(): { email: string; password: string } | null {
    const email = getCookie('remember_email');
    const password = getCookie('remember_password');

    if (email && password) {
        return { email, password };
    }
    return null;
}

/**
 * Clear all legacy localStorage/sessionStorage auth data
 * Called on app initialization to migrate to cookie-based auth
 */
export function clearLegacyStorage(): void {
    if (typeof window === 'undefined') return;

    // Clear localStorage auth data
    const localStorageKeys = [
        'access_token',
        'refresh_token',
        'user',
        'remember_me'
    ];

    localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    // Clear sessionStorage auth data
    const sessionStorageKeys = [
        'access_token',
        'refresh_token',
        'user'
    ];

    sessionStorageKeys.forEach(key => {
        sessionStorage.removeItem(key);
    });
}

/**
 * Check if user is authenticated (has user cookie)
 * Note: This only checks the user cookie, not the HTTP-only access_token
 * The actual authentication is validated by the backend
 */
export function isAuthenticated(): boolean {
    return getUser() !== null;
}

/**
 * Get theme preference from cookie
 * @returns The theme preference or null if not set
 */
export function getThemeCookie(): 'dark' | 'light' | 'system' | null {
    const theme = getCookie('attendance-theme');
    if (theme === 'dark' || theme === 'light' || theme === 'system') {
        return theme;
    }
    return null;
}

/**
 * Set theme preference in cookie
 * @param theme - The theme preference
 */
export function setThemeCookie(theme: 'dark' | 'light' | 'system'): void {
    setCookie('attendance-theme', theme, 365); // 1 year
}
