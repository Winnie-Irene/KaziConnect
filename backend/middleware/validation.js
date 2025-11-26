/**
 * Input Validation Middleware
 * Uses express-validator for request validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Registration validation
 */
const validateRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    body('role')
        .isIn(['job-seeker', 'employer'])
        .withMessage('Invalid role'),
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage('Full name must be at least 3 characters'),
    body('companyName')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Company name is required for employers'),
    body('phone')
        .optional()
        .matches(/^(\+?254|0)[17]\d{8}$/)
        .withMessage('Invalid Kenyan phone number'),
    handleValidationErrors
];

/**
 * Login validation
 */
const validateLogin = [
    body('email')
        .notEmpty()
        .withMessage('Email or phone is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Job posting validation
 */
const validateJobPosting = [
    body('jobTitle')
        .trim()
        .isLength({ min: 5, max: 150 })
        .withMessage('Job title must be 5-150 characters'),
    body('description')
        .trim()
        .isLength({ min: 50 })
        .withMessage('Description must be at least 50 characters'),
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required'),
    body('salary')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number'),
    body('jobType')
        .optional()
        .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote'])
        .withMessage('Invalid job type'),
    body('category')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category cannot be empty'),
    handleValidationErrors
];

/**
 * Application validation
 */
const validateApplication = [
    body('jobID')
        .isInt({ min: 1 })
        .withMessage('Valid job ID is required'),
    body('coverLetter')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Cover letter too long (max 2000 characters)'),
    handleValidationErrors
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be 3-100 characters'),
    body('phoneNumber')
        .optional()
        .matches(/^(\+?254|0)[17]\d{8}$/)
        .withMessage('Invalid Kenyan phone number'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location too long'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio too long (max 1000 characters)'),
    handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateId = (paramName = 'id') => [
    param(paramName)
        .isInt({ min: 1 })
        .withMessage(`Valid ${paramName} is required`),
    handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateJobPosting,
    validateApplication,
    validateProfileUpdate,
    validateId,
    validatePagination,
    handleValidationErrors
};
