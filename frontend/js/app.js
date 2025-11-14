/**
 * KaziConnect - Main Application Script
 * Global application initialization and utilities
 */

// Application state
const AppState = {
    initialized: false,
    user: null,
    notifications: [],
    jobsCache: [],
    applicationsCache: []
};

/**
 * Initialize application
 */
function initApp() {
    if (AppState.initialized) return;

    // Check authentication status
    if (isAuthenticated()) {
        AppState.user = getCurrentUser();
        loadNotifications();
    }

    // Setup global event listeners
    setupGlobalEventListeners();

    // Initialize mobile navigation
    initMobileNav();

    AppState.initialized = true;
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Handle all form submissions with loading states
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.tagName === 'FORM' && !form.hasAttribute('data-no-auto-submit')) {
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.setAttribute('data-original-text', originalText);
                submitBtn.textContent = 'Processing...';

                // Re-enable after 5 seconds as fallback
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 5000);
            }
        }
    });

    // Handle all external links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="http"]');
        if (link && !link.hasAttribute('target')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        if (!alert.hasAttribute('data-no-auto-dismiss')) {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        }
    });
}

/**
 * Load user notifications
 */
async function loadNotifications() {
    try {
        const response = await KaziAPI.Notification.getNotifications();
        if (response.success) {
            AppState.notifications = response.notifications;
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Update notification badge
 */
function updateNotificationBadge() {
    const unreadCount = AppState.notifications.filter(n => !n.isRead).length;
    const badges = document.querySelectorAll('[data-notification-count]');

    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.setAttribute('data-count', unreadCount);
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User confirmation
 */
function confirmAction(message) {
    return new Promise((resolve) => {
        const confirmed = confirm(message);
        resolve(confirmed);
    });
}

/**
 * Show modal
 * @param {string} modalId - Modal element ID
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide modal
 * @param {string} modalId - Modal element ID
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Setup modal close handlers
 */
function setupModalHandlers() {
    // Close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    // Close on close button click
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });
}

/**
 * Format and display user profile information
 * @param {object} user - User object
 * @param {string} containerId - Container element ID
 */
function displayUserProfile(user, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const initials = getInitials(user.fullName || user.username);
    const profileColor = stringToColor(user.email);

    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-avatar" style="background-color: ${profileColor}">
                ${user.profilePicture ? `<img src="${user.profilePicture}" alt="Profile">` : initials}
            </div>
            <h3 class="profile-name">${user.fullName || user.username}</h3>
            <p class="profile-title">${user.role}</p>
            <p>${user.email}</p>
            ${user.phone ? `<p>${user.phone}</p>` : ''}
        </div>
    `;
}

/**
 * Handle file upload with preview
 * @param {HTMLInputElement} input - File input element
 * @param {string} previewId - Preview element ID
 */
function handleFileUpload(input, previewId) {
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const preview = document.getElementById(previewId);
        if (!preview) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be less than 5MB', 'error');
            input.value = '';
            return;
        }

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `<p>File selected: ${file.name} (${formatFileSize(file.size)})</p>`;
        }
    });
}

/**
 * Refresh page data
 */
async function refreshPageData() {
    showLoading(true);

    try {
        // Reload user data
        if (isAuthenticated()) {
            const response = await KaziAPI.Profile.getProfile();
            if (response.success) {
                setUserData(response.user);
                AppState.user = response.user;
            }
        }

        // Reload page-specific data
        if (typeof loadPageData === 'function') {
            await loadPageData();
        }

        showToast('Data refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing data:', error);
        showToast('Failed to refresh data', 'error');
    } finally {
        showLoading(false);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initApp();
        setupModalHandlers();
    });
} else {
    initApp();
    setupModalHandlers();
}

// Export app functions
window.KaziApp = {
    AppState,
    initApp,
    loadNotifications,
    updateNotificationBadge,
    confirmAction,
    showModal,
    hideModal,
    displayUserProfile,
    handleFileUpload,
    refreshPageData
};
