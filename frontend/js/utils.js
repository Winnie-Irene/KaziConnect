/**
 * KaziConnect - Utility Functions
 * Common helper functions used throughout the application
 */

// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'kaziconnect_auth_token',
    USER_DATA: 'kaziconnect_user_data',
    REMEMBER_ME: 'kaziconnect_remember_me'
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'relative')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);

    if (format === 'relative') {
        return getRelativeTime(d);
    }

    const options = format === 'long'
        ? { year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };

    return d.toLocaleDateString('en-KE', options);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date} date - Date to calculate from
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return formatDate(date, 'short');
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: KES)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'KES') {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function to limit execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate Kenyan phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
    const re = /^(\+?254|0)[17]\d{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number to standard format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    phone = phone.replace(/\s/g, '');

    if (phone.startsWith('0')) {
        return '+254' + phone.substring(1);
    } else if (phone.startsWith('254')) {
        return '+' + phone;
    } else if (phone.startsWith('+254')) {
        return phone;
    }

    return phone;
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Generate random color based on string
 * @param {string} str - String to generate color from
 * @returns {string} Hex color code
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = Math.floor(Math.abs((Math.sin(hash) * 16777215) % 1) * 16777215);
    return '#' + color.toString(16).padStart(6, '0');
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading spinner
 * @param {boolean} show - Whether to show or hide
 * @param {string} containerId - Container element ID
 */
function showLoading(show, containerId = 'loadingContainer') {
    let container = document.getElementById(containerId);

    if (show) {
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'loading';
            container.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
            document.body.appendChild(container);
        }
        container.style.display = 'block';
    } else {
        if (container) {
            container.style.display = 'none';
        }
    }
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set query parameter in URL
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

/**
 * Handle mobile navigation toggle
 */
function initMobileNav() {
    const toggle = document.getElementById('navbarToggle');
    const menu = document.getElementById('navbarMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', function() {
            menu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    }
}

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 */
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== null;
}

/**
 * Get current user data
 * @returns {object|null} User data or null
 */
function getCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    window.location.href = 'login.html';
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

/**
 * Get auth token
 * @returns {string|null} Auth token
 */
function getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Set auth token
 * @param {string} token - Auth token
 */
function setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

/**
 * Set user data
 * @param {object} user - User data
 */
function setUserData(user) {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
}

// Initialize mobile navigation on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
    initMobileNav();
}

// Export functions for use in other modules
window.KaziUtils = {
    API_CONFIG,
    STORAGE_KEYS,
    formatDate,
    getRelativeTime,
    formatCurrency,
    truncateText,
    debounce,
    isValidEmail,
    isValidPhone,
    formatPhoneNumber,
    getInitials,
    stringToColor,
    copyToClipboard,
    showToast,
    showLoading,
    sanitizeHTML,
    getQueryParam,
    setQueryParam,
    smoothScrollTo,
    formatFileSize,
    isAuthenticated,
    getCurrentUser,
    logout,
    requireAuth,
    getAuthToken,
    setAuthToken,
    setUserData
};
