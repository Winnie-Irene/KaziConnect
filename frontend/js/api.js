/**
 * KaziConnect - API Communication Layer
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = 'https://kazi-connect-phi.vercel.app/api';

/**
 * Make HTTP request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const {
        method = 'GET',
        body = null,
        headers = {},
        requiresAuth = false
    } = options;

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    // Add auth token if required
    if (requiresAuth) {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Add body if present
    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Authentication APIs
 */
const AuthAPI = {
    /**
     * Login user
     * @param {string} email - Email or phone
     * @param {string} password - Password
     * @param {boolean} rememberMe - Remember user
     * @returns {Promise} Login response
     */
    login: async function(email, password, rememberMe = false) {
        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: { email, password, rememberMe }
            });
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Register new user
     * @param {object} userData - User registration data
     * @returns {Promise} Registration response
     */
    register: async function(userData) {
        try {
            const data = await apiRequest('/auth/register', {
                method: 'POST',
                body: userData
            });
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Forgot password
     * @param {string} email - User email
     * @returns {Promise} Response
     */
    forgotPassword: async function(email) {
        try {
            const data = await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: { email }
            });
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Reset password
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise} Response
     */
    resetPassword: async function(token, newPassword) {
        try {
            const data = await apiRequest('/auth/reset-password', {
                method: 'POST',
                body: { token, newPassword }
            });
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Verify email
     * @param {string} token - Verification token
     * @returns {Promise} Response
     */
    verifyEmail: async function(token) {
        try {
            const data = await apiRequest('/auth/verify-email', {
                method: 'POST',
                body: { token }
            });
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

/**
 * User Profile APIs
 */
const ProfileAPI = {
    /**
     * Get user profile
     * @returns {Promise} User profile data
     */
    getProfile: async function() {
        return await apiRequest('/profile', {
            requiresAuth: true
        });
    },

    /**
     * Update user profile
     * @param {object} profileData - Profile data to update
     * @returns {Promise} Updated profile
     */
    updateProfile: async function(profileData) {
        return await apiRequest('/profile', {
            method: 'PUT',
            body: profileData,
            requiresAuth: true
        });
    },

    /**
     * Upload profile picture
     * @param {File} file - Image file
     * @returns {Promise} Upload response
     */
    uploadProfilePicture: async function(file) {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/profile/picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        return await response.json();
    },

    /**
     * Upload CV
     * @param {File} file - CV file
     * @returns {Promise} Upload response
     */
    uploadCV: async function(file) {
        const formData = new FormData();
        formData.append('cv', file);

        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/profile/cv`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        return await response.json();
    }
};

/**
 * Job APIs
 */
const JobAPI = {
    /**
     * Get all jobs with filters
     * @param {object} filters - Search filters
     * @returns {Promise} Job listings
     */
    getJobs: async function(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await apiRequest(`/jobs?${queryString}`);
    },

    /**
     * Get single job by ID
     * @param {number} jobId - Job ID
     * @returns {Promise} Job details
     */
    getJobById: async function(jobId) {
        return await apiRequest(`/jobs/${jobId}`);
    },

    /**
     * Create new job posting
     * @param {object} jobData - Job data
     * @returns {Promise} Created job
     */
    createJob: async function(jobData) {
        return await apiRequest('/jobs', {
            method: 'POST',
            body: jobData,
            requiresAuth: true
        });
    },

    /**
     * Update job posting
     * @param {number} jobId - Job ID
     * @param {object} jobData - Updated job data
     * @returns {Promise} Updated job
     */
    updateJob: async function(jobId, jobData) {
        return await apiRequest(`/jobs/${jobId}`, {
            method: 'PUT',
            body: jobData,
            requiresAuth: true
        });
    },

    /**
     * Delete job posting
     * @param {number} jobId - Job ID
     * @returns {Promise} Delete response
     */
    deleteJob: async function(jobId) {
        return await apiRequest(`/jobs/${jobId}`, {
            method: 'DELETE',
            requiresAuth: true
        });
    },

    /**
     * Search jobs
     * @param {string} query - Search query
     * @param {object} filters - Additional filters
     * @returns {Promise} Search results
     */
    searchJobs: async function(query, filters = {}) {
        return await apiRequest('/jobs/search', {
            method: 'POST',
            body: { query, filters }
        });
    }
};

/**
 * Application APIs
 */
const ApplicationAPI = {
    /**
     * Submit job application
     * @param {object} applicationData - Application data
     * @returns {Promise} Application response
     */
    applyForJob: async function(applicationData) {
        return await apiRequest('/applications', {
            method: 'POST',
            body: applicationData,
            requiresAuth: true
        });
    },

    /**
     * Get user's applications
     * @returns {Promise} User applications
     */
    getMyApplications: async function() {
        return await apiRequest('/applications/my-applications', {
            requiresAuth: true
        });
    },

    /**
     * Get applications for a job (employer)
     * @param {number} jobId - Job ID
     * @returns {Promise} Job applications
     */
    getJobApplications: async function(jobId) {
        return await apiRequest(`/applications/job/${jobId}`, {
            requiresAuth: true
        });
    },

    /**
     * Update application status
     * @param {number} applicationId - Application ID
     * @param {string} status - New status
     * @returns {Promise} Update response
     */
    updateApplicationStatus: async function(applicationId, status) {
        return await apiRequest(`/applications/${applicationId}/status`, {
            method: 'PUT',
            body: { status },
            requiresAuth: true
        });
    },

    /**
     * Withdraw application
     * @param {number} applicationId - Application ID
     * @returns {Promise} Response
     */
    withdrawApplication: async function(applicationId) {
        return await apiRequest(`/applications/${applicationId}`, {
            method: 'DELETE',
            requiresAuth: true
        });
    }
};

/**
 * Admin APIs
 */
const AdminAPI = {
    /**
     * Get all users
     * @param {object} filters - Filter options
     * @returns {Promise} User list
     */
    getUsers: async function(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await apiRequest(`/admin/users?${queryString}`, {
            requiresAuth: true
        });
    },

    /**
     * Update user status
     * @param {number} userId - User ID
     * @param {string} status - New status
     * @returns {Promise} Update response
     */
    updateUserStatus: async function(userId, status) {
        return await apiRequest(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: { status },
            requiresAuth: true
        });
    },

    /**
     * Approve employer
     * @param {number} employerId - Employer ID
     * @returns {Promise} Approval response
     */
    approveEmployer: async function(employerId) {
        return await apiRequest(`/admin/employers/${employerId}/approve`, {
            method: 'PUT',
            requiresAuth: true
        });
    },

    /**
     * Get pending employers
     * @returns {Promise} Pending employers list
     */
    getPendingEmployers: async function() {
        return await apiRequest('/admin/employers/pending', {
            requiresAuth: true
        });
    },

    /**
     * Get system statistics
     * @returns {Promise} System stats
     */
    getStats: async function() {
        return await apiRequest('/admin/stats', {
            requiresAuth: true
        });
    },

    /**
     * Generate report
     * @param {string} reportType - Type of report
     * @param {object} params - Report parameters
     * @returns {Promise} Report data
     */
    generateReport: async function(reportType, params = {}) {
        return await apiRequest('/admin/reports', {
            method: 'POST',
            body: { reportType, params },
            requiresAuth: true
        });
    }
};

/**
 * Notification APIs
 */
const NotificationAPI = {
    /**
     * Get user notifications
     * @returns {Promise} Notifications list
     */
    getNotifications: async function() {
        return await apiRequest('/notifications', {
            requiresAuth: true
        });
    },

    /**
     * Mark notification as read
     * @param {number} notificationId - Notification ID
     * @returns {Promise} Response
     */
    markAsRead: async function(notificationId) {
        return await apiRequest(`/notifications/${notificationId}/read`, {
            method: 'PUT',
            requiresAuth: true
        });
    },

    /**
     * Mark all notifications as read
     * @returns {Promise} Response
     */
    markAllAsRead: async function() {
        return await apiRequest('/notifications/read-all', {
            method: 'PUT',
            requiresAuth: true
        });
    },

    /**
     * Delete notification
     * @param {number} notificationId - Notification ID
     * @returns {Promise} Response
     */
    deleteNotification: async function(notificationId) {
        return await apiRequest(`/notifications/${notificationId}`, {
            method: 'DELETE',
            requiresAuth: true
        });
    }
};

// Export APIs
window.KaziAPI = {
    Auth: AuthAPI,
    Profile: ProfileAPI,
    Job: JobAPI,
    Application: ApplicationAPI,
    Admin: AdminAPI,
    Notification: NotificationAPI
};
