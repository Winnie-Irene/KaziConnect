-- ========================================
-- KaziConnect Database Schema
-- MySQL Database Design
-- ========================================

-- Drop existing database if exists (USE WITH CAUTION IN PRODUCTION)
DROP DATABASE IF EXISTS kaziconnect;

-- Create database
CREATE DATABASE kaziconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kaziconnect;

-- ========================================
-- 1. USERS TABLE (Base table for all user types)
-- ========================================
CREATE TABLE users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL, -- Will store bcrypt hashed password
    role ENUM('job-seeker', 'employer', 'admin', 'trainer') NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    isEmailVerified BOOLEAN DEFAULT FALSE,
    emailVerificationToken VARCHAR(255),
    passwordResetToken VARCHAR(255),
    passwordResetExpiry DATETIME,
    registrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ========================================
-- 2. JOB SEEKERS TABLE
-- ========================================
CREATE TABLE job_seekers (
    seekerID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT UNIQUE NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    dateOfBirth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    nationality VARCHAR(50) DEFAULT 'Kenyan',
    county VARCHAR(50),
    town VARCHAR(50),
    address TEXT,

    -- Education
    educationLevel ENUM('Primary', 'Secondary', 'Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD'),
    fieldOfStudy VARCHAR(100),
    institution VARCHAR(150),
    graduationYear YEAR,

    -- Professional Info
    skills TEXT, -- JSON array of skills
    experience TEXT, -- JSON array of work experience
    yearsOfExperience INT DEFAULT 0,

    -- Documents
    resumePath VARCHAR(255),
    profilePicturePath VARCHAR(255),

    -- Preferences
    desiredJobTitle VARCHAR(100),
    desiredSalaryMin DECIMAL(10, 2),
    desiredSalaryMax DECIMAL(10, 2),
    preferredLocations TEXT, -- JSON array

    -- Statistics
    profileViews INT DEFAULT 0,
    profileCompleteness INT DEFAULT 0, -- Percentage

    isAvailable BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
    INDEX idx_fullname (fullName),
    INDEX idx_skills (skills(100)),
    INDEX idx_available (isAvailable)
) ENGINE=InnoDB;

-- ========================================
-- 3. EMPLOYERS TABLE
-- ========================================
CREATE TABLE employers (
    employerID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT UNIQUE NOT NULL,
    companyName VARCHAR(150) NOT NULL,
    industry VARCHAR(100),
    companySize ENUM('1-10', '11-50', '51-200', '201-500', '500+'),

    -- Contact Info
    contactPerson VARCHAR(100),
    businessEmail VARCHAR(100),
    businessPhone VARCHAR(20),
    website VARCHAR(255),

    -- Location
    county VARCHAR(50),
    town VARCHAR(50),
    address TEXT,

    -- Company Details
    description TEXT,
    foundedYear YEAR,
    registrationNumber VARCHAR(50),
    taxID VARCHAR(50),

    -- Documents
    logoPath VARCHAR(255),
    businessLicensePath VARCHAR(255),

    -- Verification
    isApproved BOOLEAN DEFAULT FALSE,
    approvedBy INT, -- Admin userID
    approvedDate DATETIME,
    rejectionReason TEXT,

    -- Statistics
    totalJobsPosted INT DEFAULT 0,
    activeJobsCount INT DEFAULT 0,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
    FOREIGN KEY (approvedBy) REFERENCES users(userID) ON DELETE SET NULL,
    INDEX idx_company (companyName),
    INDEX idx_approved (isApproved),
    INDEX idx_industry (industry)
) ENGINE=InnoDB;

-- ========================================
-- 4. JOB POSTINGS TABLE
-- ========================================
CREATE TABLE job_postings (
    jobID INT AUTO_INCREMENT PRIMARY KEY,
    employerID INT NOT NULL,

    -- Job Details
    jobTitle VARCHAR(150) NOT NULL,
    jobCategory VARCHAR(50),
    employmentType ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary') NOT NULL,
    experienceLevel ENUM('Entry', 'Mid', 'Senior', 'Executive'),

    -- Description
    description TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    qualifications TEXT,

    -- Skills
    requiredSkills TEXT, -- JSON array
    preferredSkills TEXT, -- JSON array

    -- Compensation
    salaryMin DECIMAL(10, 2),
    salaryMax DECIMAL(10, 2),
    salaryCurrency VARCHAR(10) DEFAULT 'KES',
    salaryPeriod ENUM('Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly') DEFAULT 'Monthly',
    benefits TEXT,

    -- Location
    location VARCHAR(100) NOT NULL,
    county VARCHAR(50),
    isRemote BOOLEAN DEFAULT FALSE,

    -- Application
    applicationDeadline DATE,
    numberOfPositions INT DEFAULT 1,
    applicationEmail VARCHAR(100),
    applicationURL VARCHAR(255),

    -- Status
    isActive BOOLEAN DEFAULT TRUE,
    isFeatured BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'active', 'closed', 'expired', 'flagged') DEFAULT 'active',
    flaggedReason TEXT,

    -- Statistics
    viewsCount INT DEFAULT 0,
    applicationsCount INT DEFAULT 0,

    -- Dates
    postedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiryDate DATE,
    closedDate DATETIME,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employerID) REFERENCES employers(employerID) ON DELETE CASCADE,
    INDEX idx_title (jobTitle),
    INDEX idx_category (jobCategory),
    INDEX idx_location (location),
    INDEX idx_active (isActive),
    INDEX idx_posted (postedDate),
    INDEX idx_employer (employerID)
) ENGINE=InnoDB;

-- ========================================
-- 5. APPLICATIONS TABLE
-- ========================================
CREATE TABLE applications (
    applicationID INT AUTO_INCREMENT PRIMARY KEY,
    seekerID INT NOT NULL,
    jobID INT NOT NULL,

    -- Application Details
    coverLetter TEXT,
    expectedSalary DECIMAL(10, 2),
    availableFrom DATE,

    -- Status Tracking
    status ENUM('pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'accepted', 'withdrawn') DEFAULT 'pending',
    isShortlisted BOOLEAN DEFAULT FALSE,

    -- Interview
    interviewDate DATETIME,
    interviewLocation VARCHAR(255),
    interviewNotes TEXT,

    -- Employer Notes
    employerNotes TEXT,
    rejectionReason TEXT,

    -- Dates
    applicationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewedDate DATETIME,
    statusUpdatedDate DATETIME,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (seekerID) REFERENCES job_seekers(seekerID) ON DELETE CASCADE,
    FOREIGN KEY (jobID) REFERENCES job_postings(jobID) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_seeker (seekerID),
    INDEX idx_job (jobID),
    INDEX idx_date (applicationDate),
    UNIQUE KEY unique_application (seekerID, jobID) -- Prevent duplicate applications
) ENGINE=InnoDB;

-- ========================================
-- 6. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE notifications (
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    recipientID INT NOT NULL, -- userID

    -- Notification Content
    type ENUM('job_match', 'application_status', 'new_application', 'interview', 'message', 'system', 'approval') NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,

    -- Related Entities
    relatedJobID INT,
    relatedApplicationID INT,
    relatedUserID INT,

    -- Link
    actionURL VARCHAR(255),

    -- Status
    isRead BOOLEAN DEFAULT FALSE,
    readDate DATETIME,

    -- Dates
    sentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiryDate DATETIME,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (recipientID) REFERENCES users(userID) ON DELETE CASCADE,
    FOREIGN KEY (relatedJobID) REFERENCES job_postings(jobID) ON DELETE CASCADE,
    FOREIGN KEY (relatedApplicationID) REFERENCES applications(applicationID) ON DELETE CASCADE,
    FOREIGN KEY (relatedUserID) REFERENCES users(userID) ON DELETE CASCADE,
    INDEX idx_recipient (recipientID),
    INDEX idx_read (isRead),
    INDEX idx_date (sentDate)
) ENGINE=InnoDB;

-- ========================================
-- 7. MESSAGES TABLE
-- ========================================
CREATE TABLE messages (
    messageID INT AUTO_INCREMENT PRIMARY KEY,
    senderID INT NOT NULL,
    recipientID INT NOT NULL,

    -- Message Content
    subject VARCHAR(200),
    messageBody TEXT NOT NULL,

    -- Context
    relatedJobID INT,
    relatedApplicationID INT,

    -- Status
    isRead BOOLEAN DEFAULT FALSE,
    readDate DATETIME,

    -- Dates
    sentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (senderID) REFERENCES users(userID) ON DELETE CASCADE,
    FOREIGN KEY (recipientID) REFERENCES users(userID) ON DELETE CASCADE,
    FOREIGN KEY (relatedJobID) REFERENCES job_postings(jobID) ON DELETE SET NULL,
    FOREIGN KEY (relatedApplicationID) REFERENCES applications(applicationID) ON DELETE SET NULL,
    INDEX idx_sender (senderID),
    INDEX idx_recipient (recipientID),
    INDEX idx_date (sentDate)
) ENGINE=InnoDB;

-- ========================================
-- 8. TRAINING PROGRAMS TABLE
-- ========================================
CREATE TABLE training_programs (
    programID INT AUTO_INCREMENT PRIMARY KEY,
    providerID INT NOT NULL, -- userID of trainer

    -- Program Details
    programName VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    duration VARCHAR(50), -- e.g., "3 months", "2 weeks"
    level ENUM('Beginner', 'Intermediate', 'Advanced'),

    -- Skills Covered
    skillsCovered TEXT, -- JSON array

    -- Logistics
    deliveryMode ENUM('Online', 'In-person', 'Hybrid'),
    location VARCHAR(100),
    schedule VARCHAR(255),

    -- Cost
    cost DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'KES',
    isFree BOOLEAN DEFAULT FALSE,

    -- Enrollment
    maxParticipants INT,
    currentEnrollment INT DEFAULT 0,

    -- Dates
    startDate DATE,
    endDate DATE,
    applicationDeadline DATE,

    -- Status
    isActive BOOLEAN DEFAULT TRUE,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (providerID) REFERENCES users(userID) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_active (isActive)
) ENGINE=InnoDB;

-- ========================================
-- 9. TRAINING ENROLLMENTS TABLE
-- ========================================
CREATE TABLE training_enrollments (
    enrollmentID INT AUTO_INCREMENT PRIMARY KEY,
    programID INT NOT NULL,
    seekerID INT NOT NULL,

    -- Enrollment Status
    status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',

    -- Progress
    completionPercentage INT DEFAULT 0,
    certificateIssued BOOLEAN DEFAULT FALSE,
    certificatePath VARCHAR(255),

    -- Dates
    enrollmentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completionDate DATETIME,

    FOREIGN KEY (programID) REFERENCES training_programs(programID) ON DELETE CASCADE,
    FOREIGN KEY (seekerID) REFERENCES job_seekers(seekerID) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (programID, seekerID)
) ENGINE=InnoDB;

-- ========================================
-- 10. DISPUTES TABLE
-- ========================================
CREATE TABLE disputes (
    disputeID INT AUTO_INCREMENT PRIMARY KEY,
    reporterID INT NOT NULL, -- userID who reported

    -- Dispute Details
    disputeType ENUM('job_posting', 'user', 'application', 'other') NOT NULL,
    category VARCHAR(50),
    description TEXT NOT NULL,

    -- Related Entities
    relatedJobID INT,
    relatedUserID INT,
    relatedApplicationID INT,

    -- Evidence
    evidencePath VARCHAR(255),

    -- Resolution
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
    assignedToAdminID INT,
    resolutionNotes TEXT,
    actionTaken TEXT,

    -- Dates
    filedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolvedDate DATETIME,

    FOREIGN KEY (reporterID) REFERENCES users(userID) ON DELETE CASCADE,
    FOREIGN KEY (relatedJobID) REFERENCES job_postings(jobID) ON DELETE SET NULL,
    FOREIGN KEY (relatedUserID) REFERENCES users(userID) ON DELETE SET NULL,
    FOREIGN KEY (relatedApplicationID) REFERENCES applications(applicationID) ON DELETE SET NULL,
    FOREIGN KEY (assignedToAdminID) REFERENCES users(userID) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_reporter (reporterID)
) ENGINE=InnoDB;

-- ========================================
-- 11. ACTIVITY LOGS TABLE (For Admin Monitoring)
-- ========================================
CREATE TABLE activity_logs (
    logID BIGINT AUTO_INCREMENT PRIMARY KEY,
    userID INT,

    -- Activity Details
    action VARCHAR(100) NOT NULL,
    entityType VARCHAR(50), -- e.g., 'job', 'application', 'user'
    entityID INT,
    ipAddress VARCHAR(45),
    userAgent TEXT,

    -- Details
    description TEXT,
    metadata JSON, -- Additional context

    -- Date
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE SET NULL,
    INDEX idx_user (userID),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- ========================================
-- 12. SAVED JOBS TABLE
-- ========================================
CREATE TABLE saved_jobs (
    savedJobID INT AUTO_INCREMENT PRIMARY KEY,
    seekerID INT NOT NULL,
    jobID INT NOT NULL,
    savedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (seekerID) REFERENCES job_seekers(seekerID) ON DELETE CASCADE,
    FOREIGN KEY (jobID) REFERENCES job_postings(jobID) ON DELETE CASCADE,
    UNIQUE KEY unique_saved_job (seekerID, jobID),
    INDEX idx_seeker (seekerID)
) ENGINE=InnoDB;

-- ========================================
-- 13. SYSTEM SETTINGS TABLE
-- ========================================
CREATE TABLE system_settings (
    settingID INT AUTO_INCREMENT PRIMARY KEY,
    settingKey VARCHAR(100) UNIQUE NOT NULL,
    settingValue TEXT,
    description TEXT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updatedBy INT,

    FOREIGN KEY (updatedBy) REFERENCES users(userID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================
-- INSERT DEFAULT DATA
-- ========================================

-- Default Admin User (Password: Admin@123 - CHANGE IN PRODUCTION!)
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO users (username, email, password, role, isActive, isEmailVerified) VALUES
('admin', 'admin@kaziconnect.co.ke', '$2b$10$rKZWj8z2g5b4vYxH.N2F7.EQJ8HzF5p7N0QZxU9dY8Lx6B3cZKf2m', 'admin', TRUE, TRUE);

-- Default System Settings
INSERT INTO system_settings (settingKey, settingValue, description) VALUES
('site_name', 'KaziConnect', 'Platform name'),
('site_email', 'info@kaziconnect.co.ke', 'Main contact email'),
('max_applications_per_day', '10', 'Maximum job applications per day per user'),
('job_posting_expiry_days', '30', 'Default job posting expiry in days'),
('employer_approval_required', 'true', 'Whether employers need admin approval'),
('maintenance_mode', 'false', 'Site maintenance mode flag');

-- ========================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ========================================

-- Active Jobs with Employer Info
CREATE VIEW v_active_jobs AS
SELECT
    jp.*,
    e.companyName,
    e.logoPath,
    e.industry,
    u.email AS employerEmail
FROM job_postings jp
JOIN employers e ON jp.employerID = e.employerID
JOIN users u ON e.userID = u.userID
WHERE jp.isActive = TRUE AND jp.status = 'active';

-- Job Applications with Details
CREATE VIEW v_applications_details AS
SELECT
    a.*,
    js.fullName AS candidateName,
    js.resumePath,
    js.profilePicturePath,
    jp.jobTitle,
    jp.location,
    e.companyName,
    u.email AS candidateEmail,
    u.phone AS candidatePhone
FROM applications a
JOIN job_seekers js ON a.seekerID = js.seekerID
JOIN users u ON js.userID = u.userID
JOIN job_postings jp ON a.jobID = jp.jobID
JOIN employers e ON jp.employerID = e.employerID;

-- User Statistics
CREATE VIEW v_user_statistics AS
SELECT
    role,
    COUNT(*) AS total_users,
    SUM(CASE WHEN isActive = TRUE THEN 1 ELSE 0 END) AS active_users,
    SUM(CASE WHEN isEmailVerified = TRUE THEN 1 ELSE 0 END) AS verified_users
FROM users
GROUP BY role;

-- ========================================
-- CREATE STORED PROCEDURES
-- ========================================

DELIMITER //

-- Update Job Application Count
CREATE PROCEDURE sp_update_job_application_count(IN p_jobID INT)
BEGIN
    UPDATE job_postings
    SET applicationsCount = (
        SELECT COUNT(*) FROM applications WHERE jobID = p_jobID
    )
    WHERE jobID = p_jobID;
END //

-- Update Employer Active Jobs Count
CREATE PROCEDURE sp_update_employer_jobs_count(IN p_employerID INT)
BEGIN
    UPDATE employers
    SET activeJobsCount = (
        SELECT COUNT(*) FROM job_postings
        WHERE employerID = p_employerID AND isActive = TRUE
    )
    WHERE employerID = p_employerID;
END //

-- Calculate Profile Completeness
CREATE PROCEDURE sp_calculate_profile_completeness(IN p_seekerID INT)
BEGIN
    DECLARE completeness INT DEFAULT 0;

    SELECT
        (CASE WHEN fullName IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN dateOfBirth IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN educationLevel IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN skills IS NOT NULL THEN 20 ELSE 0 END) +
        (CASE WHEN experience IS NOT NULL THEN 20 ELSE 0 END) +
        (CASE WHEN resumePath IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN profilePicturePath IS NOT NULL THEN 10 ELSE 0 END)
    INTO completeness
    FROM job_seekers
    WHERE seekerID = p_seekerID;

    UPDATE job_seekers
    SET profileCompleteness = completeness
    WHERE seekerID = p_seekerID;
END //

DELIMITER ;

-- ========================================
-- CREATE TRIGGERS
-- ========================================

DELIMITER //

-- Auto-update application count when new application is created
CREATE TRIGGER tr_after_application_insert
AFTER INSERT ON applications
FOR EACH ROW
BEGIN
    CALL sp_update_job_application_count(NEW.jobID);
END //

-- Auto-update application count when application is deleted
CREATE TRIGGER tr_after_application_delete
AFTER DELETE ON applications
FOR EACH ROW
BEGIN
    CALL sp_update_job_application_count(OLD.jobID);
END //

-- Update employer job count after job posting insert
CREATE TRIGGER tr_after_job_insert
AFTER INSERT ON job_postings
FOR EACH ROW
BEGIN
    UPDATE employers
    SET totalJobsPosted = totalJobsPosted + 1
    WHERE employerID = NEW.employerID;

    CALL sp_update_employer_jobs_count(NEW.employerID);
END //

-- Update employer job count when job status changes
CREATE TRIGGER tr_after_job_update
AFTER UPDATE ON job_postings
FOR EACH ROW
BEGIN
    IF OLD.isActive != NEW.isActive THEN
        CALL sp_update_employer_jobs_count(NEW.employerID);
    END IF;
END //

DELIMITER ;

-- ========================================
-- GRANT PERMISSIONS (Adjust as needed)
-- ========================================

-- Create application user (for Node.js backend)
-- CREATE USER 'kaziconnect_app'@'localhost' IDENTIFIED BY 'your_secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON kaziconnect.* TO 'kaziconnect_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ========================================
-- END OF SCHEMA
-- ========================================
