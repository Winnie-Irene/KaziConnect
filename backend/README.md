# KaziConnect Backend API

RESTful API for the KaziConnect job matching platform built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database credentials and other settings.

3. **Initialize the database:**
   ```bash
   npm run init-db
   ```
   This will create all necessary tables and a default admin user.

4. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

5. **Server will run on:** `http://localhost:3000`

## 📋 Default Admin Credentials

```
Username: admin
Email: admin@kaziconnect.co.ke
Password: admin123
```

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

## 🗄️ Database Schema

The database includes the following tables:
- `users` - User authentication and basic info
- `job_seekers` - Job seeker profiles
- `employers` - Employer/company profiles
- `job_postings` - Job listings
- `applications` - Job applications
- `notifications` - User notifications
- `disputes` - User disputes/reports
- `saved_jobs` - Saved/bookmarked jobs
- `activity_logs` - System activity logs

## 🛣️ API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `POST /change-password` - Change password (protected)

### Jobs (`/api/jobs`)
- `GET /` - Get all jobs (with filters)
- `GET /:id` - Get single job
- `POST /` - Create job (employer only)
- `PUT /:id` - Update job (employer only)
- `DELETE /:id` - Delete job (employer only)
- `GET /stats/my-stats` - Get job statistics (employer only)

### Applications (`/api/applications`)
- `POST /` - Apply for job (job-seeker only)
- `GET /my-applications` - Get my applications (job-seeker only)
- `GET /job/:jobId` - Get applications for job (employer only)
- `PUT /:id/status` - Update application status (employer only)
- `DELETE /:id` - Withdraw application (job-seeker only)
- `GET /stats` - Get application statistics (protected)

### Profile (`/api/profile`)
- `GET /` - Get own profile (protected)
- `PUT /` - Update profile (protected)
- `GET /:id` - Get public profile

### Notifications (`/api/notifications`)
- `GET /` - Get all notifications (protected)
- `GET /unread-count` - Get unread count (protected)
- `PUT /:id/read` - Mark as read (protected)
- `PUT /read-all` - Mark all as read (protected)
- `DELETE /:id` - Delete notification (protected)

### Admin (`/api/admin`)
- `GET /stats` - System statistics
- `GET /users` - Get all users
- `PUT /users/:id/status` - Activate/deactivate user
- `DELETE /users/:id` - Delete user
- `GET /employers/pending` - Get pending employers
- `PUT /employers/:id/approve` - Approve employer
- `PUT /employers/:id/reject` - Reject employer
- `GET /jobs` - Get all jobs (for moderation)
- `PUT /jobs/:id/deactivate` - Deactivate job
- `GET /disputes` - Get disputes
- `PUT /disputes/:id/resolve` - Resolve dispute

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Using the Token
```bash
GET /api/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📝 Request Examples

### Register Job Seeker
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "job-seeker",
  "fullName": "John Doe",
  "phone": "+254712345678",
  "location": "Nairobi"
}
```

### Register Employer
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "SecurePass123",
  "role": "employer",
  "companyName": "Tech Solutions Ltd",
  "phone": "+254787654321",
  "industry": "Technology",
  "location": "Nairobi"
}
```

### Create Job Posting
```bash
POST /api/jobs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "jobTitle": "Software Developer",
  "description": "We are looking for a skilled software developer...",
  "requirements": "3+ years experience in JavaScript, Node.js...",
  "salary": 120000,
  "salaryPeriod": "monthly",
  "location": "Nairobi",
  "jobType": "full-time",
  "category": "Technology"
}
```

### Apply for Job
```bash
POST /api/applications
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "jobID": 1,
  "coverLetter": "I am writing to express my interest..."
}
```

## 🔍 Query Parameters

### Pagination
Most list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Example: `GET /api/jobs?page=2&limit=20`

### Filters

**Jobs:**
- `search` - Search in title and description
- `location` - Filter by location
- `category` - Filter by category
- `jobType` - Filter by job type
- `salaryMin` - Minimum salary
- `salaryMax` - Maximum salary

Example: `GET /api/jobs?location=Nairobi&jobType=full-time&salaryMin=50000`

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- SQL injection prevention
- XSS protection
- CORS configuration
- Input validation
- Rate limiting (recommended for production)

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check API health
curl http://localhost:3000/health

# View API documentation
curl http://localhost:3000/api
```

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js              # Database connection
│   └── initDatabase.js    # Database initialization
├── controllers/
│   ├── authController.js
│   ├── jobController.js
│   ├── applicationController.js
│   ├── profileController.js
│   ├── adminController.js
│   └── notificationController.js
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── validation.js      # Input validation
│   └── errorHandler.js    # Error handling
├── routes/
│   ├── auth.js
│   ├── jobs.js
│   ├── applications.js
│   ├── profile.js
│   ├── admin.js
│   └── notifications.js
├── server.js              # Main application file
├── package.json
└── .env.example
```

## 🔧 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kaziconnect
DB_PORT=3306

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:8000
```

## 🚨 Common Issues

### Database Connection Error
- Verify MySQL is running: `mysql --version`
- Check credentials in `.env`
- Ensure database exists or run `npm run init-db`

### Port Already in Use
- Change PORT in `.env`
- Or kill process: `kill -9 $(lsof -t -i:3000)`

### JWT Errors
- Verify JWT_SECRET is set in `.env`
- Check token format: `Bearer TOKEN`

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [JWT Documentation](https://jwt.io/)

## 👥 Support

For issues or questions:
- Email: dev@kaziconnect.co.ke
- GitHub Issues: (repository link)

## 📄 License

MIT License - Built for educational purposes.
