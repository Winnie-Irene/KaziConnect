# 🚀 KaziConnect - Quick Start Guide

This guide will help you start both the frontend and backend of KaziConnect.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js (v14+) installed: `node --version`
- ✅ MySQL (v8.0+) installed and running: `mysql --version`
- ✅ npm installed: `npm --version`

---

## 🗄️ Step 1: Database Setup

### Start MySQL (if not running)
```bash
# On Linux/Ubuntu
sudo systemctl start mysql
# OR
sudo service mysql start

# On macOS (with Homebrew)
brew services start mysql

# On Windows
# Start MySQL from Services or MySQL Workbench
```

### Create Database and Configure
```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL console:
CREATE DATABASE kaziconnect;
EXIT;
```

---

## ⚙️ Step 2: Backend Setup

Open a **NEW TERMINAL** and run:

```bash
# Navigate to backend directory
cd /home/kret/ir/kaziconnect/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your MySQL credentials
nano .env  # or use any text editor
```

### Configure .env file:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=kaziconnect
DB_PORT=3306

JWT_SECRET=kaziconnect_super_secret_key_2025
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8000
```

### Initialize Database Tables
```bash
# This creates all tables and default admin user
npm run init-db
```

### Start Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

**✅ Backend should now be running on: http://localhost:3000**

Test it: Open browser and go to `http://localhost:3000/health`

---

## 🎨 Step 3: Frontend Setup

Open **ANOTHER NEW TERMINAL** and run:

```bash
# Navigate to frontend directory
cd /home/kret/ir/kaziconnect/frontend

# Start frontend server
python3 -m http.server 8000
```

**✅ Frontend should now be running on: http://localhost:8000**

---

## 🎯 Quick Start Commands (All in One)

### Option A: Using 3 Separate Terminals

**Terminal 1 - MySQL:**
```bash
# Make sure MySQL is running
sudo systemctl status mysql
```

**Terminal 2 - Backend:**
```bash
cd /home/kret/ir/kaziconnect/backend
npm install
cp .env.example .env
# Edit .env with your MySQL password
npm run init-db
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd /home/kret/ir/kaziconnect/frontend
python3 -m http.server 8000
```

### Option B: Using tmux/screen (Advanced)

```bash
# Install tmux if not installed
sudo apt install tmux

# Start tmux session
tmux new -s kaziconnect

# Split terminal horizontally
Ctrl+b then "

# In first pane (Backend):
cd /home/kret/ir/kaziconnect/backend && npm run dev

# Switch to second pane
Ctrl+b then arrow down

# In second pane (Frontend):
cd /home/kret/ir/kaziconnect/frontend && python3 -m http.server 8000

# Detach from tmux: Ctrl+b then d
# Reattach later: tmux attach -t kaziconnect
```

---

## 🧪 Test Your Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"success":true,"message":"KaziConnect API is running"...}`

2. **Frontend Access:**
   Open browser: http://localhost:8000

3. **API Documentation:**
   Open browser: http://localhost:3000/api

4. **Login with Admin:**
   - Email: `admin@kaziconnect.co.ke`
   - Password: `admin123`

---

## 🔍 Verify Everything is Working

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "role": "job-seeker",
    "fullName": "Test User",
    "phone": "+254712345678"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kaziconnect.co.ke",
    "password": "admin123"
  }'
```

---

## 📊 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:8000 | Main website |
| **Backend API** | http://localhost:3000/api | API endpoints |
| **API Docs** | http://localhost:3000/api | Documentation |
| **Health Check** | http://localhost:3000/health | Server status |

---

## 🎭 Default User Accounts

### Admin Account
- **Email:** admin@kaziconnect.co.ke
- **Password:** admin123
- **Access:** http://localhost:8000/admin/dashboard.html

### Test Accounts (Create via Registration)
- Job Seeker: Register at http://localhost:8000/register.html?role=job-seeker
- Employer: Register at http://localhost:8000/register.html?role=employer

---

## 🛑 Stopping the Servers

### Stop Backend
In the backend terminal, press: `Ctrl + C`

### Stop Frontend
In the frontend terminal, press: `Ctrl + C`

### Stop MySQL (if needed)
```bash
sudo systemctl stop mysql
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i:3000)

# Check MySQL connection
mysql -u root -p -e "SHOW DATABASES;"
```

### Frontend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 $(lsof -t -i:8000)

# Try different port
python3 -m http.server 8080
```

### Database errors
```bash
# Reset database
cd /home/kret/ir/kaziconnect/backend
npm run init-db

# Check MySQL is running
sudo systemctl status mysql
```

### CORS errors
Make sure `.env` has correct FRONTEND_URL:
```env
FRONTEND_URL=http://localhost:8000
```

---

## 🔄 Development Workflow

1. **Start servers** (see above)
2. **Make changes** to code
3. **Backend:** Server auto-reloads (nodemon)
4. **Frontend:** Refresh browser (F5)

---

## 📚 Next Steps

1. ✅ Change admin password after first login
2. ✅ Create test job seeker account
3. ✅ Create test employer account
4. ✅ Approve employer (as admin)
5. ✅ Post test job (as employer)
6. ✅ Apply for job (as job seeker)

---

## 🆘 Need Help?

- **Backend logs:** Check terminal running `npm run dev`
- **Frontend errors:** Check browser console (F12)
- **Database issues:** Check MySQL logs
- **API testing:** Use Postman or curl

---

## 🎉 You're Ready!

Both frontend and backend should now be running successfully!

Visit: **http://localhost:8000** to start using KaziConnect!

