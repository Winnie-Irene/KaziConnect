/**
 * KaziConnect Backend Server
 * Main Express application entry point
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Import database connection
const { pool } = require('./config/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'KaziConnect API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'KaziConnect API v1.0',
        documentation: {
            authentication: '/api/auth',
            jobs: '/api/jobs',
            applications: '/api/applications',
            profile: '/api/profile',
            admin: '/api/admin',
            notifications: '/api/notifications'
        },
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                getCurrentUser: 'GET /api/auth/me (protected)',
                changePassword: 'POST /api/auth/change-password (protected)'
            },
            jobs: {
                getAll: 'GET /api/jobs',
                getById: 'GET /api/jobs/:id',
                create: 'POST /api/jobs (employer only)',
                update: 'PUT /api/jobs/:id (employer only)',
                delete: 'DELETE /api/jobs/:id (employer only)',
                getStats: 'GET /api/jobs/stats/my-stats (employer only)'
            },
            applications: {
                apply: 'POST /api/applications (job-seeker only)',
                getMyApplications: 'GET /api/applications/my-applications (job-seeker only)',
                getJobApplications: 'GET /api/applications/job/:jobId (employer only)',
                updateStatus: 'PUT /api/applications/:id/status (employer only)',
                withdraw: 'DELETE /api/applications/:id (job-seeker only)',
                getStats: 'GET /api/applications/stats (protected)'
            },
            profile: {
                getProfile: 'GET /api/profile (protected)',
                updateProfile: 'PUT /api/profile (protected)',
                getPublicProfile: 'GET /api/profile/:id'
            },
            notifications: {
                getAll: 'GET /api/notifications (protected)',
                getUnreadCount: 'GET /api/notifications/unread-count (protected)',
                markAsRead: 'PUT /api/notifications/:id/read (protected)',
                markAllAsRead: 'PUT /api/notifications/read-all (protected)',
                delete: 'DELETE /api/notifications/:id (protected)'
            },
            admin: {
                getStats: 'GET /api/admin/stats (admin only)',
                getUsers: 'GET /api/admin/users (admin only)',
                updateUserStatus: 'PUT /api/admin/users/:id/status (admin only)',
                deleteUser: 'DELETE /api/admin/users/:id (admin only)',
                getPendingEmployers: 'GET /api/admin/employers/pending (admin only)',
                approveEmployer: 'PUT /api/admin/employers/:id/approve (admin only)',
                rejectEmployer: 'PUT /api/admin/employers/:id/reject (admin only)',
                getAllJobs: 'GET /api/admin/jobs (admin only)',
                deactivateJob: 'PUT /api/admin/jobs/:id/deactivate (admin only)',
                getDisputes: 'GET /api/admin/disputes (admin only)',
                resolveDispute: 'PUT /api/admin/disputes/:id/resolve (admin only)'
            }
        }
    });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database connection pool closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database connection pool closed');
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🔗  KaziConnect API Server                              ║
║                                                           ║
║  📡  Server running on port ${PORT}                          ║
║  🌍  Environment: ${process.env.NODE_ENV || 'development'}                        ║
║  📊  API Docs: http://localhost:${PORT}/api                  ║
║  ❤️   Health Check: http://localhost:${PORT}/health          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
