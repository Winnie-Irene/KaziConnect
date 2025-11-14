/**
 * KaziConnect - Authentication Functions
 * Handles user authentication and session management
 */

/**
 * Login user
 * @param {string} email - Email or phone
 * @param {string} password - Password
 * @param {boolean} rememberMe - Remember user
 * @returns {Promise} Login response
 */
async function login(email, password, rememberMe = false) {
    try {
        // Call API
        const response = await KaziAPI.Auth.login(email, password, rememberMe);

        if (response.success && response.token) {
            // Store auth token
            setAuthToken(response.token);

            // Store user data
            setUserData(response.user);

            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            }

            return response;
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'An error occurred during login. Please try again.'
        };
    }
}

/**
 * Register new user
 * @param {object} userData - User registration data
 * @returns {Promise} Registration response
 */
async function register(userData) {
    try {
        // Format phone number
        if (userData.phone) {
            userData.phone = formatPhoneNumber(userData.phone);
        }

        // Call API
        const response = await KaziAPI.Auth.register(userData);

        if (response.success) {
            // Optionally auto-login after registration
            if (response.token) {
                setAuthToken(response.token);
                setUserData(response.user);
            }
        }

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: 'An error occurred during registration. Please try again.'
        };
    }
}

/**
 * Logout current user
 */
function logout() {
    // Clear all stored data
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

    // Clear session storage
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = '/frontend/login.html';
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
    const token = getAuthToken();
    return token !== null && token !== undefined;
}

/**
 * Get current user
 * @returns {object|null} Current user data
 */
function getCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Update current user data
 * @param {object} userData - Updated user data
 */
function updateCurrentUser(userData) {
    const currentUser = getCurrentUser();
    const updatedUser = { ...currentUser, ...userData };
    setUserData(updatedUser);
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role
 */
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

/**
 * Require authentication - redirect if not logged in
 */
function requireAuth() {
    if (!isAuthenticated()) {
        // Store intended destination
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);

        // Redirect to login
        window.location.href = '/frontend/login.html';
        return false;
    }
    return true;
}

/**
 * Require specific role - redirect if unauthorized
 * @param {string|array} allowedRoles - Allowed role(s)
 */
function requireRole(allowedRoles) {
    if (!requireAuth()) {
        return false;
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const user = getCurrentUser();

    if (!user || !roles.includes(user.role)) {
        // Redirect to appropriate dashboard or show error
        showToast('You do not have permission to access this page', 'error');

        setTimeout(() => {
            switch (user?.role) {
                case 'job-seeker':
                    window.location.href = '/frontend/job-seeker/dashboard.html';
                    break;
                case 'employer':
                    window.location.href = '/frontend/employer/dashboard.html';
                    break;
                case 'admin':
                    window.location.href = '/frontend/admin/dashboard.html';
                    break;
                default:
                    window.location.href = '/frontend/index.html';
            }
        }, 2000);

        return false;
    }

    return true;
}

/**
 * Handle redirect after login
 */
function handlePostLoginRedirect() {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');

    if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectPath;
    } else {
        // Redirect based on user role
        const user = getCurrentUser();
        if (user) {
            switch (user.role) {
                case 'job-seeker':
                    window.location.href = '/frontend/job-seeker/dashboard.html';
                    break;
                case 'employer':
                    window.location.href = '/frontend/employer/dashboard.html';
                    break;
                case 'admin':
                    window.location.href = '/frontend/admin/dashboard.html';
                    break;
                default:
                    window.location.href = '/frontend/index.html';
            }
        }
    }
}

/**
 * Forgot password request
 * @param {string} email - User email
 * @returns {Promise} Response
 */
async function forgotPassword(email) {
    try {
        const response = await KaziAPI.Auth.forgotPassword(email);
        return response;
    } catch (error) {
        console.error('Forgot password error:', error);
        return {
            success: false,
            message: 'An error occurred. Please try again.'
        };
    }
}

/**
 * Reset password
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise} Response
 */
async function resetPassword(token, newPassword) {
    try {
        const response = await KaziAPI.Auth.resetPassword(token, newPassword);
        return response;
    } catch (error) {
        console.error('Reset password error:', error);
        return {
            success: false,
            message: 'An error occurred. Please try again.'
        };
    }
}

/**
 * Verify email
 * @param {string} token - Verification token
 * @returns {Promise} Response
 */
async function verifyEmail(token) {
    try {
        const response = await KaziAPI.Auth.verifyEmail(token);
        return response;
    } catch (error) {
        console.error('Email verification error:', error);
        return {
            success: false,
            message: 'An error occurred. Please try again.'
        };
    }
}

/**
 * Initialize authentication state
 */
function initAuth() {
    // Check if remember me is set
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);

    if (!rememberMe) {
        // If remember me is not set, check token age
        const token = getAuthToken();
        if (token) {
            // TODO: Implement token expiry check
            // For now, we'll keep the session active
        }
    }

    // Update UI based on auth state
    updateAuthUI();
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();

    // Update navigation links
    const loginLinks = document.querySelectorAll('[data-auth="guest"]');
    const userLinks = document.querySelectorAll('[data-auth="user"]');

    if (isLoggedIn) {
        loginLinks.forEach(link => link.style.display = 'none');
        userLinks.forEach(link => link.style.display = 'block');

        // Update user name if element exists
        const userNameElements = document.querySelectorAll('[data-user="name"]');
        userNameElements.forEach(el => {
            el.textContent = user?.fullName || user?.username || 'User';
        });

        // Update user role if element exists
        const userRoleElements = document.querySelectorAll('[data-user="role"]');
        userRoleElements.forEach(el => {
            el.textContent = user?.role || '';
        });
    } else {
        loginLinks.forEach(link => link.style.display = 'block');
        userLinks.forEach(link => link.style.display = 'none');
    }
}

/**
 * Setup logout buttons
 */
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });
}

// Initialize authentication when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initAuth();
        setupLogoutButtons();
    });
} else {
    initAuth();
    setupLogoutButtons();
}

// Export authentication functions
window.KaziAuth = {
    login,
    register,
    logout,
    isAuthenticated,
    getCurrentUser,
    updateCurrentUser,
    hasRole,
    requireAuth,
    requireRole,
    handlePostLoginRedirect,
    forgotPassword,
    resetPassword,
    verifyEmail,
    initAuth,
    updateAuthUI
};
