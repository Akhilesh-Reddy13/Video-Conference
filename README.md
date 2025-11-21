# Video Conferencing Platform

A complete real-time video conferencing platform built with React, Node.js, WebRTC, and Socket.io - similar to Zoom/Google Meet.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based secure authentication system
- **Create/Join Meetings**: Instant meetings or scheduled with room codes
- **Audio/Video Streaming**: WebRTC-powered real-time communication
- **Screen Sharing**: Share your screen with participants
- **Chat System**: Real-time text chat with typing indicators
- **Participant Management**: View all participants with status indicators

### Advanced Features
- **Media Device Management**: Switch between multiple cameras/microphones
- **Dynamic Video Grid**: Automatically adjusts based on participant count
- **Raise Hand**: Non-verbal communication feature
- **Mute/Unmute Controls**: Toggle audio and video on/off
- **Connection Quality Indicators**: Real-time connection status
- **Password-Protected Rooms**: Optional room security
- **Responsive Design**: Works on desktop and tablet devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **TailwindCSS** for styling
- **Zustand** for state management
- **Socket.io-client** for real-time communication
- **WebRTC API** for peer-to-peer connections
- **React Router** for navigation
- **React Icons** for UI icons
- **date-fns** for date formatting

### Backend
- **Node.js** with Express
- **Socket.io** for WebSocket communication
- **MongoDB** with Mongoose for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
cd video-app
```

### 2. Install Dependencies

#### Install root dependencies
```bash
npm install
```

#### Install client dependencies
```bash
cd client
npm install
cd ..
```

#### Install server dependencies
```bash
cd server
npm install
cd ..
```

### 3. Environment Configuration

#### Server Environment (.env)
Create a `.env` file in the `server` directory:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/video-conferencing

# JWT Secrets (Change these in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_change_this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:3000

# STUN/TURN Server Configuration
STUN_SERVER=stun:stun.l.google.com:19302
# For production, add your own TURN server:
# TURN_SERVER=turn:your-turn-server.com:3478
# TURN_USERNAME=username
# TURN_CREDENTIAL=password
```

#### Client Environment (.env)
Create a `.env` file in the `client` directory:
```bash
cp client/.env.example client/.env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux with systemd
sudo systemctl start mongod

# Or run directly
mongod
```

### 5. Run the Application

#### Development Mode (Both client and server)
From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend client on `http://localhost:3000`

#### Or run separately:

**Backend Only:**
```bash
npm run dev:server
```

**Frontend Only:**
```bash
npm run dev:client
```

## 📁 Project Structure

```
video-app/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── meeting/   # Meeting-specific components
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── auth/      # Authentication pages
│   │   │   ├── Dashboard.jsx
│   │   │   └── Meeting.jsx
│   │   ├── store/         # Zustand state management
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.io handlers
│   │   ├── utils/         # Utility functions
│   │   └── index.js       # Server entry point
│   └── package.json
│
└── package.json           # Root package.json
```

## 🎯 Usage Guide

### Creating an Account
1. Navigate to `http://localhost:3000`
2. Click "Sign up" to create a new account
3. Enter your name, email, and password
4. Click "Create Account"

### Starting a Meeting
1. After logging in, you'll see the dashboard
2. Click "Instant Meeting" to start immediately, or
3. Click "Create Meeting" to configure room settings
4. Share the room code with participants

### Joining a Meeting
1. Click "Join Meeting" on the dashboard
2. Enter the meeting code
3. If protected, enter the room password
4. Click "Join"

### During a Meeting
- **Toggle Audio**: Click microphone button
- **Toggle Video**: Click camera button
- **Share Screen**: Click screen share button
- **Raise Hand**: Click hand button
- **Open Chat**: Click chat button
- **View Participants**: Click participants button
- **Settings**: Click more options (...) then Settings
- **Leave Meeting**: Click the red "Leave" button

## 🔐 Security Considerations

### For Production Deployment:

1. **Change JWT Secrets**: Use strong, random secrets
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Use HTTPS**: Enable SSL/TLS certificates

3. **Configure TURN Server**: For NAT traversal in production
   - Use a service like Twilio, Xirsys, or self-host Coturn

4. **Set Environment Variables**: Never commit `.env` files

5. **Enable Rate Limiting**: Add rate limiting middleware

6. **Database Security**: Use MongoDB authentication and encryption

## 🌐 STUN/TURN Server Setup

For production, you'll need a TURN server for NAT traversal:

### Option 1: Use a Service
- [Twilio Network Traversal Service](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)
- [Metered TURN](https://www.metered.ca/turn-server)

### Option 2: Self-host with Coturn
```bash
# Install Coturn
sudo apt-get install coturn

# Configure in /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=yourdomain.com
```

Update your server `.env`:
```env
TURN_SERVER=turn:yourdomain.com:3478
TURN_USERNAME=username
TURN_CREDENTIAL=password
```

## 🐛 Troubleshooting

### Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS is enabled (required for WebRTC)
- Try a different browser (Chrome/Firefox recommended)

### Connection Issues
- Verify MongoDB is running
- Check firewall settings
- Ensure STUN/TURN servers are configured correctly

### Socket Connection Errors
- Verify server is running on port 5000
- Check CORS configuration
- Ensure client URL matches server settings

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/profile` - Update user profile

### Rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:roomCode` - Get room details
- `POST /api/rooms/:roomCode/verify-password` - Verify room password
- `POST /api/rooms/:roomCode/end` - End room (host only)
- `GET /api/rooms/my-rooms` - Get user's rooms

## 🔌 Socket Events

### Client → Server
- `join-room` - Join a meeting room
- `leave-room` - Leave current room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `toggle-audio` - Toggle microphone
- `toggle-video` - Toggle camera
- `start-screen-share` - Start screen sharing
- `stop-screen-share` - Stop screen sharing
- `toggle-hand` - Raise/lower hand
- `send-message` - Send chat message
- `typing` - Typing indicator

### Server → Client
- `room-joined` - Successfully joined room
- `user-joined` - New user joined
- `user-left` - User left room
- `offer` - Received WebRTC offer
- `answer` - Received WebRTC answer
- `ice-candidate` - Received ICE candidate
- `user-audio-toggled` - User muted/unmuted
- `user-video-toggled` - User camera on/off
- `user-started-screen-share` - User started sharing
- `user-stopped-screen-share` - User stopped sharing
- `user-hand-toggled` - User raised/lowered hand
- `new-message` - New chat message
- `user-typing` - User typing status
- `error` - Error occurred

## 🚀 Deployment

### Backend Deployment (e.g., Heroku, DigitalOcean)
1. Set environment variables
2. Ensure MongoDB is accessible
3. Configure TURN server
4. Deploy using your platform's method

### Frontend Deployment (e.g., Vercel, Netlify)
1. Build the client: `cd client && npm run build`
2. Set environment variables
3. Deploy the `dist` folder

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## 🎉 Acknowledgments

- WebRTC API documentation
- Socket.io team
- React and Node.js communities
- All open-source contributors

---

Built with ❤️ using React, Node.js, WebRTC, and Socket.io
