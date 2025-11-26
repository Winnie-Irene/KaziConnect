#!/bin/bash

# KaziConnect Startup Script
# This script helps you start both frontend and backend

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║  🔗  KaziConnect - Quick Start                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo -e "${BLUE}[1/5]${NC} Checking MySQL status..."
if ! systemctl is-active --quiet mysql; then
    echo -e "${YELLOW}⚠️  MySQL is not running. Starting MySQL...${NC}"
    sudo systemctl start mysql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MySQL started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start MySQL. Please start it manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ MySQL is already running${NC}"
fi
echo ""

# Check if backend dependencies are installed
echo -e "${BLUE}[2/5]${NC} Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Check if .env exists
echo -e "${BLUE}[3/5]${NC} Checking backend configuration..."
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your MySQL password!${NC}"
    echo -e "${YELLOW}   Run: nano backend/.env${NC}"
    read -p "Press Enter after editing .env file..."
fi
echo -e "${GREEN}✅ Configuration file exists${NC}"
echo ""

# Ask user which mode to start
echo -e "${BLUE}[4/5]${NC} Choose startup mode:"
echo "  1) Start backend only"
echo "  2) Start frontend only"
echo "  3) Start both (separate terminals)"
echo "  4) Initialize database and exit"
echo "  5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting backend...${NC}"
        cd backend
        npm run dev
        ;;
    2)
        echo -e "${GREEN}🚀 Starting frontend...${NC}"
        cd frontend
        python3 -m http.server 8000
        ;;
    3)
        echo -e "${GREEN}🚀 Starting both services...${NC}"
        echo -e "${YELLOW}⚠️  Please open TWO terminal windows:${NC}"
        echo ""
        echo -e "${BLUE}Terminal 1 (Backend):${NC}"
        echo "  cd $(pwd)/backend && npm run dev"
        echo ""
        echo -e "${BLUE}Terminal 2 (Frontend):${NC}"
        echo "  cd $(pwd)/frontend && python3 -m http.server 8000"
        echo ""
        echo -e "${YELLOW}Copy and paste these commands in separate terminals${NC}"
        ;;
    4)
        echo -e "${GREEN}🗄️  Initializing database...${NC}"
        cd backend
        npm run init-db
        echo ""
        echo -e "${GREEN}✅ Database initialized!${NC}"
        echo -e "${BLUE}Default admin credentials:${NC}"
        echo "  Email: admin@kaziconnect.co.ke"
        echo "  Password: admin123"
        ;;
    5)
        echo -e "${YELLOW}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}[5/5]${NC} Done!"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:8000                          ║${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:3000                          ║${NC}"
echo -e "${GREEN}║  API Docs: http://localhost:3000/api                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
