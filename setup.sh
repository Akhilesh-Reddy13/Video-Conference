#!/bin/bash

echo "========================================="
echo "Video Conferencing Platform Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v16 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB not found. Please ensure MongoDB is installed and running.${NC}"
else
    echo -e "${GREEN}✓ MongoDB found${NC}"
fi

echo ""
echo "========================================="
echo "Installing Dependencies"
echo "========================================="
echo ""

# Install root dependencies
echo -e "${YELLOW}Installing root dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Root dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi

# Install server dependencies
echo -e "${YELLOW}Installing server dependencies...${NC}"
cd server
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Server dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install server dependencies${NC}"
    exit 1
fi
cd ..

# Install client dependencies
echo -e "${YELLOW}Installing client dependencies...${NC}"
cd client
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Client dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install client dependencies${NC}"
    exit 1
fi
cd ..

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo -e "${GREEN}✓ All dependencies installed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure MongoDB is running on port 27017"
echo "2. Review and update .env files if needed:"
echo "   - server/.env"
echo "   - client/.env"
echo "3. Start the application:"
echo ""
echo -e "   ${YELLOW}npm run dev${NC}          (Start both client and server)"
echo -e "   ${YELLOW}npm run dev:server${NC}   (Start server only)"
echo -e "   ${YELLOW}npm run dev:client${NC}   (Start client only)"
echo ""
echo "Access the application at: http://localhost:3000"
echo ""
