# API Testing Guide

Test the API endpoints using curl, Postman, or your preferred HTTP client.

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 5. Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Update Profile
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe"
  }'
```

## Room Endpoints

### 1. Create Room
```bash
curl -X POST http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "isProtected": false
  }'
```

**With Password Protection:**
```bash
curl -X POST http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Private Meeting",
    "isProtected": true,
    "password": "secret123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": {
      "id": "...",
      "roomCode": "ABC12345",
      "title": "Team Meeting",
      "hostId": "...",
      "isProtected": false,
      "settings": {},
      "startedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get Room by Code
```bash
curl -X GET http://localhost:5000/api/rooms/ABC12345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Verify Room Password
```bash
curl -X POST http://localhost:5000/api/rooms/ABC12345/verify-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "secret123"
  }'
```

### 4. End Room
```bash
curl -X POST http://localhost:5000/api/rooms/ABC12345/end \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Get My Rooms
```bash
curl -X GET http://localhost:5000/api/rooms/my-rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Socket.io Events Testing

You can test Socket.io events using the frontend application or tools like Socket.io client tester.

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_TOKEN_HERE'
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### Join Room
```javascript
socket.emit('join-room', {
  roomCode: 'ABC12345',
  peerId: 'unique-peer-id'
});

socket.on('room-joined', (data) => {
  console.log('Joined room:', data);
});
```

### Send Message
```javascript
socket.emit('send-message', {
  message: 'Hello everyone!'
});

socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

### Toggle Audio
```javascript
socket.emit('toggle-audio', {
  isAudioMuted: true
});
```

### Toggle Video
```javascript
socket.emit('toggle-video', {
  isVideoOff: true
});
```

## Health Check

```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": ["Email is required", "Password must be at least 6 characters"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token. Authorization denied."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Room not found or has ended"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

## Testing Workflow

1. **Register a new user** → Save the token
2. **Login** → Confirm token works
3. **Create a room** → Save the room code
4. **Get room details** → Verify room exists
5. **Join room via Socket.io** → Test WebRTC signaling
6. **Send chat messages** → Test real-time messaging
7. **Leave room** → Cleanup

## Using Postman

1. Import the API endpoints as a collection
2. Set up environment variables:
   - `BASE_URL`: http://localhost:5000
   - `TOKEN`: (will be set after login)
3. Use Pre-request Scripts to auto-set token:
   ```javascript
   pm.environment.set("TOKEN", pm.response.json().data.token);
   ```

## Testing with Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create requests following the examples above
3. Use environment variables for BASE_URL and TOKEN
4. Save requests in collections for reuse

---

Happy Testing! 🧪
