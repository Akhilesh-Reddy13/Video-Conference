# Development Tips & Best Practices

## 🎯 Development Workflow

### Starting Development
1. **Always start MongoDB first**
   ```bash
   # Check status
   sudo systemctl status mongod
   
   # Start if not running
   sudo systemctl start mongod
   ```

2. **Run in development mode**
   ```bash
   npm run dev  # Starts both client and server with hot reload
   ```

3. **Watch the console**
   - Backend logs: Terminal running server
   - Frontend logs: Browser console (F12)
   - Socket events: Both terminals

### Code Organization

#### Backend
- **Models**: Database schema and validation
- **Controllers**: Business logic for routes
- **Routes**: API endpoint definitions
- **Middleware**: Request processing (auth, validation, errors)
- **Socket**: Real-time event handlers
- **Utils**: Reusable helper functions

#### Frontend
- **Pages**: Route-level components
- **Components**: Reusable UI elements
- **Store**: Global state management
- **Hooks**: Reusable logic
- **Utils**: Helper functions and managers

## 🔧 Common Development Tasks

### Adding a New Feature

#### Backend Example: Add "Meeting Recording"
1. **Update Model** (`server/src/models/Room.js`)
   ```javascript
   isRecording: {
     type: Boolean,
     default: false
   }
   ```

2. **Add Socket Event** (`server/src/socket/socketHandlers.js`)
   ```javascript
   socket.on('start-recording', async () => {
     // Logic here
     socket.to(socket.currentRoom).emit('recording-started', {...});
   });
   ```

3. **Update Frontend Store** (`client/src/store/meetingStore.js`)
   ```javascript
   isRecording: false,
   toggleRecording: () => set((state) => ({ 
     isRecording: !state.isRecording 
   })),
   ```

4. **Add UI Control** (`client/src/components/meeting/ControlBar.jsx`)

#### Frontend Example: Add "Participant Search"
1. **Add state** to component
2. **Create filter function**
3. **Update UI rendering**
4. **Test with multiple participants**

### Debugging Tips

#### WebRTC Issues
```javascript
// In webrtc.js, add detailed logging
pc.onconnectionstatechange = () => {
  console.log('Connection State:', pc.connectionState);
  console.log('ICE State:', pc.iceConnectionState);
  console.log('Signaling State:', pc.signalingState);
};
```

#### Socket Events
```javascript
// Log all socket events
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});
```

#### State Management
```javascript
// Monitor Zustand store changes
import { useEffect } from 'react';
const participants = useMeetingStore(state => state.participants);

useEffect(() => {
  console.log('Participants changed:', participants);
}, [participants]);
```

## 🎨 Styling Guidelines

### TailwindCSS Classes
```javascript
// Prefer utility classes
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">

// Use custom classes for repeated patterns (in index.css)
<button className="btn btn-primary">
```

### Responsive Design
```javascript
// Mobile-first approach
<div className="w-full md:w-1/2 lg:w-1/3">
```

## 🧪 Testing Strategies

### Manual Testing Checklist
- [ ] Register new user
- [ ] Login existing user
- [ ] Create instant meeting
- [ ] Create protected meeting
- [ ] Join meeting with code
- [ ] Join protected meeting (wrong password)
- [ ] Toggle audio/video
- [ ] Share screen
- [ ] Send chat messages
- [ ] View participants list
- [ ] Change camera/microphone
- [ ] Raise/lower hand
- [ ] Leave meeting
- [ ] Rejoin meeting

### Testing with Multiple Users
1. **Option 1**: Multiple browsers
   - Chrome (normal)
   - Chrome (incognito)
   - Firefox
   - Safari

2. **Option 2**: Multiple devices
   - Desktop + Laptop
   - Desktop + Mobile (requires HTTPS)

3. **Option 3**: ngrok for remote testing
   ```bash
   ngrok http 3000
   ```

## 🚀 Performance Optimization

### Frontend
1. **Lazy Loading**
   ```javascript
   const Meeting = lazy(() => import('./pages/Meeting'));
   ```

2. **Memoization**
   ```javascript
   const MemoizedVideoTile = memo(VideoTile);
   ```

3. **Optimize Re-renders**
   ```javascript
   // Use specific selectors
   const isAudioMuted = useMeetingStore(state => state.isAudioMuted);
   // Instead of
   const { isAudioMuted } = useMeetingStore();
   ```

### Backend
1. **Database Indexing** (already implemented)
2. **Connection Pooling** (MongoDB default)
3. **Caching** (add Redis for sessions)

### WebRTC
1. **Use TURN server** for NAT traversal
2. **Optimize video constraints**
   ```javascript
   {
     video: {
       width: { ideal: 1280 },
       height: { ideal: 720 },
       frameRate: { ideal: 30 }
     }
   }
   ```

## 🔒 Security Best Practices

### Environment Variables
```bash
# Never commit .env files
# Use different secrets for each environment
# Rotate secrets regularly
```

### Input Validation
```javascript
// Already implemented in middleware
// Add custom validation as needed
```

### Rate Limiting (Add for production)
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📱 Mobile Considerations

### Browser Compatibility
- ✅ Chrome (Desktop/Mobile)
- ✅ Firefox (Desktop/Mobile)
- ✅ Safari (Desktop/Mobile - requires HTTPS)
- ⚠️ Edge (Desktop - test thoroughly)

### HTTPS Requirement
WebRTC requires HTTPS on mobile devices:
```bash
# Use ngrok for development
ngrok http 3000

# Or use local SSL
# Configure Vite for HTTPS
```

## 🐛 Common Issues & Solutions

### Issue: Camera/Mic Permission Denied
**Solution**: Check browser settings, use HTTPS, grant permissions

### Issue: Peer Connection Failed
**Solution**: Configure TURN server, check firewall

### Issue: Socket Disconnects
**Solution**: Check server logs, verify token validity

### Issue: MongoDB Connection Error
**Solution**: Ensure MongoDB is running, check connection string

### Issue: Port Already in Use
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## 📊 Monitoring & Logging

### Development Logging
```javascript
// Backend (already implemented)
console.log(`✅ User connected: ${socket.userName}`);

// Frontend
console.log('Room joined:', roomId);
```

### Production Logging
Consider adding:
- Winston for structured logging
- Sentry for error tracking
- Analytics for usage metrics

## 🎓 Learning Resources

### WebRTC
- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)

### Socket.io
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io Client API](https://socket.io/docs/v4/client-api/)

### React
- [React Documentation](https://react.dev/)
- [React Patterns](https://reactpatterns.com/)

### TailwindCSS
- [Tailwind Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Update all environment variables
- [ ] Change JWT secrets
- [ ] Configure TURN server
- [ ] Enable HTTPS
- [ ] Build frontend: `cd client && npm run build`
- [ ] Test production build locally
- [ ] Set up MongoDB Atlas (or production DB)
- [ ] Configure CORS for production domain
- [ ] Add rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets

### Deployment Platforms

#### Backend
- Heroku
- DigitalOcean
- AWS EC2
- Google Cloud Run

#### Frontend
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Firebase Hosting

#### Database
- MongoDB Atlas (recommended)
- Self-hosted MongoDB

## 💡 Pro Tips

1. **Use Git Hooks**: Add pre-commit hooks for linting
2. **Environment Switching**: Use .env.development and .env.production
3. **Component Library**: Consider Shadcn UI for consistent design
4. **Type Safety**: Consider migrating to TypeScript
5. **Testing**: Add Jest for unit tests, Cypress for E2E
6. **Documentation**: Keep API docs updated with changes
7. **Version Control**: Use semantic versioning
8. **Code Reviews**: Review all changes before merging
9. **Backups**: Regular database backups
10. **Monitoring**: Set up uptime monitoring

---

Happy Coding! 🎉

