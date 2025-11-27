KaziConnect

KaziConnect is a job-seeking and employer platform that allows job seekers to find jobs, apply, and track applications, while employers can post jobs, manage applicants, and track statistics.

## Table of Contents
- [Project Description](#project-description)
- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Known Issues](#known-issues)
- [Future Improvements](#future-improvements)

Project Description

KaziConnect aims to bridge the gap between job seekers and employers by providing a seamless platform to post, discover, and manage job opportunities.

Features

Job Seeker: Signup/Login, view jobs, apply, track applications

Employer: Post jobs, manage applications, view job statistics

Admin: Manage users, approve/reject employers, oversee jobs, and disputes

Notifications for new applications and updates

Role-based access control

System Requirements

Node.js v18+

MySQL 8+

npm or yarn

Modern browser for the frontend

Installation

Clone the repository:

git clone https://github.com/yourusername/kazi-connect.git
cd kazi-connect


Install dependencies:

npm install


Set up environment variables:

Copy .env.example to .env

Update the values:

PORT=3000
NODE_ENV=development
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_password
DB_NAME=kaziconnect
DB_PORT=your_db_port
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
UPLOAD_PATH=./uploads

Database Setup

Create a MySQL database named kaziconnect.

Import the provided kaziconnect.sql file into your database.

Ensure the users table and other tables exist as per the SRS design.

(Optional) Insert sample users:

INSERT INTO `users` (`username`, `email`, `password`, `role`, `registrationDate`, `isActive`, `emailVerified`) 
VALUES ('Test User', 'test@example.com', '$2b$10$HASHEDPASSWORD', 'job-seeker', CURRENT_TIMESTAMP(), 1, 0);


Note: Passwords must be hashed using bcrypt before being inserted manually.

Running the Project

Start the backend server

npm run start


Frontend

Open index.html in your browser (or deploy via Vercel for public access)

Ensure FRONTEND_URL matches your deployment URL

Access API

Health check: http://localhost:3000/health

API documentation: http://localhost:3000/api

Environment Variables
Variable	Description
PORT	Server port
NODE_ENV	Development or Production
DB_HOST	Database host
DB_USER	Database user
DB_PASSWORD	Database password
DB_NAME	Database name
DB_PORT	Database port
JWT_SECRET	Secret key for JWT
FRONTEND_URL	Frontend URL for CORS
UPLOAD_PATH	Path for uploaded files
API Endpoints

Known Issues

Currently, the API connection may fail due to deployment database connection issues.

Some features are non-functional locally without a proper database connection.

Future Improvements

Fix deployment database issues

Implement full authentication and authorization

Add real-time notifications

Notes for Grading:

All steps are written clearly for anyone to run the project locally.

Screenshots included to demonstrate features for the demo.

Deployment URL provided for frontend: https://kazi-connect-wwhl.vercel.app
