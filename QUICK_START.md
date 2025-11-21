# Quick Start Guide

## Prerequisites Check
- [ ] Node.js v16+ installed
- [ ] MongoDB v5+ installed and running
- [ ] npm or yarn package manager

## Installation

### Option 1: Using Setup Script (Recommended)
```bash
./setup.sh
```

### Option 2: Manual Installation
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

## Configuration

### 1. Server Environment (.env)
The `server/.env` file is already created with development defaults. 
**Important**: Change JWT secrets before deploying to production!

### 2. Client Environment (.env)
The `client/.env` file is already created and configured for local development.

## Running the Application

### Start Everything
```bash
npm run dev
```
This starts both the backend (port 5000) and frontend (port 3000).

### Start Separately
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

## Access the Application
Open your browser and navigate to: **http://localhost:3000**

## First Time Setup

1. **Create an Account**
   - Click "Sign up"
   - Enter your name, email, and password
   - Click "Create Account"

2. **Start a Meeting**
   - Click "Instant Meeting" or "Create Meeting"
   - Share the room code with others

3. **Join a Meeting**
   - Click "Join Meeting"
   - Enter the meeting code
   - Click "Join"

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list            # macOS

# Start MongoDB
sudo systemctl start mongod   # Linux
brew services start mongodb-community  # macOS
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Camera/Microphone Not Working
- Grant browser permissions for camera and microphone
- Use HTTPS in production (WebRTC requirement)
- Try a different browser (Chrome or Firefox recommended)

## Production Deployment

Before deploying to production:

1. Update JWT secrets in `server/.env`
2. Configure TURN server for NAT traversal
3. Enable HTTPS/SSL
4. Set `NODE_ENV=production`
5. Update MongoDB URI for production database
6. Build the client: `cd client && npm run build`

## Features Overview

✅ User authentication with JWT
✅ Create/join meeting rooms
✅ Real-time audio/video streaming
✅ Screen sharing
✅ Text chat with typing indicators
✅ Participant management
✅ Raise hand feature
✅ Mute/unmute controls
✅ Device selection (camera/mic)
✅ Connection quality indicators
✅ Password-protected rooms

## Getting Help

For detailed documentation, see README.md

For issues:
1. Check the troubleshooting section
2. Review server/client console logs
3. Ensure all prerequisites are met
4. Check MongoDB connection

Enjoy your video conferencing platform! 🎥
