import User from '../models/User.js';
import Room from '../models/Room.js';
import Participant from '../models/Participant.js';
import Message from '../models/Message.js';
import { verifyToken } from '../utils/jwt.js';

// Store active connections
const activeConnections = new Map(); // socketId -> { userId, roomId, peerId }
const roomParticipants = new Map(); // roomId -> Set of socketIds

export const initializeSocketHandlers = (io) => {
  
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userAvatar = user.avatar;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.id})`);

    // Join room
    socket.on('join-room', async ({ roomCode, peerId }) => {
      try {
        const room = await Room.findOne({ roomCode, isActive: true });
        
        if (!room) {
          socket.emit('error', { message: 'Room not found or has ended' });
          return;
        }

        const roomId = room._id.toString();
        
        // Check room capacity
        const currentParticipants = await Participant.countDocuments({
          roomId: room._id,
          leftAt: null
        });

        if (currentParticipants >= room.maxParticipants) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Check if user is already in room
        let participant = await Participant.findOne({
          userId: socket.userId,
          roomId: room._id,
          leftAt: null
        });

        if (participant) {
          // Update socket ID for reconnection
          participant.socketId = socket.id;
          participant.peerId = peerId;
        } else {
          // Determine role
          const isHost = room.hostId.toString() === socket.userId;
          
          // Create new participant
          participant = await Participant.create({
            userId: socket.userId,
            roomId: room._id,
            socketId: socket.id,
            peerId,
            role: isHost ? 'host' : 'participant',
            isAudioMuted: room.settings.muteOnEntry || false
          });
        }

        await participant.save();

        // Join socket room
        socket.join(roomCode);
        socket.currentRoom = roomCode;
        socket.currentRoomId = roomId;

        // Store connection info
        activeConnections.set(socket.id, {
          userId: socket.userId,
          roomId,
          peerId
        });

        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Set());
        }
        roomParticipants.get(roomId).add(socket.id);

        // Get all participants in room
        const participants = await Participant.find({
          roomId: room._id,
          leftAt: null
        }).populate('userId', 'name email avatar');

        const participantsData = participants.map(p => ({
          id: p._id,
          userId: p.userId._id,
          name: p.userId.name,
          avatar: p.userId.avatar,
          socketId: p.socketId,
          peerId: p.peerId,
          role: p.role,
          isAudioMuted: p.isAudioMuted,
          isVideoOff: p.isVideoOff,
          isHandRaised: p.isHandRaised,
          isScreenSharing: p.isScreenSharing,
          connectionQuality: p.connectionQuality
        }));

        // Send current participants to the new user
        socket.emit('room-joined', {
          roomId,
          participants: participantsData,
          roomSettings: room.settings
        });

        // Notify others about new user
        socket.to(roomCode).emit('user-joined', {
          userId: socket.userId,
          name: socket.userName,
          avatar: socket.userAvatar,
          socketId: socket.id,
          peerId,
          role: participant.role,
          isAudioMuted: participant.isAudioMuted,
          isVideoOff: participant.isVideoOff
        });

        // Send system message
        const systemMessage = await Message.create({
          roomId: room._id,
          userId: socket.userId,
          message: `${socket.userName} joined the meeting`,
          messageType: 'system'
        });

        io.to(roomCode).emit('new-message', {
          id: systemMessage._id,
          userId: socket.userId,
          userName: socket.userName,
          message: systemMessage.message,
          messageType: 'system',
          timestamp: systemMessage.createdAt
        });

        console.log(`📹 ${socket.userName} joined room: ${roomCode}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC Signaling: Offer
    socket.on('offer', ({ offer, to }) => {
      socket.to(to).emit('offer', {
        offer,
        from: socket.id,
        fromPeerId: activeConnections.get(socket.id)?.peerId
      });
    });

    // WebRTC Signaling: Answer
    socket.on('answer', ({ answer, to }) => {
      socket.to(to).emit('answer', {
        answer,
        from: socket.id
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', {
        candidate,
        from: socket.id
      });
    });

    // Toggle audio
    socket.on('toggle-audio', async ({ isAudioMuted }) => {
      try {
        const participant = await Participant.findOne({
          socketId: socket.id,
          leftAt: null
        });

        if (participant) {
          participant.isAudioMuted = isAudioMuted;
          await participant.save();

          socket.to(socket.currentRoom).emit('user-audio-toggled', {
            userId: socket.userId,
            socketId: socket.id,
            isAudioMuted
          });
        }
      } catch (error) {
        console.error('Error toggling audio:', error);
      }
    });

    // Toggle video
    socket.on('toggle-video', async ({ isVideoOff }) => {
      try {
        const participant = await Participant.findOne({
          socketId: socket.id,
          leftAt: null
        });

        if (participant) {
          participant.isVideoOff = isVideoOff;
          await participant.save();

          socket.to(socket.currentRoom).emit('user-video-toggled', {
            userId: socket.userId,
            socketId: socket.id,
            isVideoOff
          });
        }
      } catch (error) {
        console.error('Error toggling video:', error);
      }
    });

    // Screen sharing
    socket.on('start-screen-share', async () => {
      try {
        const participant = await Participant.findOne({
          socketId: socket.id,
          leftAt: null
        });

        if (participant) {
          participant.isScreenSharing = true;
          await participant.save();

          socket.to(socket.currentRoom).emit('user-started-screen-share', {
            userId: socket.userId,
            socketId: socket.id,
            userName: socket.userName
          });
        }
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    });

    socket.on('stop-screen-share', async () => {
      try {
        const participant = await Participant.findOne({
          socketId: socket.id,
          leftAt: null
        });

        if (participant) {
          participant.isScreenSharing = false;
          await participant.save();

          socket.to(socket.currentRoom).emit('user-stopped-screen-share', {
            userId: socket.userId,
            socketId: socket.id
          });
        }
      } catch (error) {
        console.error('Error stopping screen share:', error);
      }
    });

    // Raise hand
    socket.on('toggle-hand', async ({ isHandRaised }) => {
      try {
        const participant = await Participant.findOne({
          socketId: socket.id,
          leftAt: null
        });

        if (participant) {
          participant.isHandRaised = isHandRaised;
          await participant.save();

          socket.to(socket.currentRoom).emit('user-hand-toggled', {
            userId: socket.userId,
            socketId: socket.id,
            userName: socket.userName,
            isHandRaised
          });
        }
      } catch (error) {
        console.error('Error toggling hand:', error);
      }
    });

    // Chat messages
    socket.on('send-message', async ({ message }) => {
      try {
        if (!socket.currentRoomId) return;

        const newMessage = await Message.create({
          roomId: socket.currentRoomId,
          userId: socket.userId,
          message,
          messageType: 'text'
        });

        io.to(socket.currentRoom).emit('new-message', {
          id: newMessage._id,
          userId: socket.userId,
          userName: socket.userName,
          userAvatar: socket.userAvatar,
          message: newMessage.message,
          messageType: 'text',
          timestamp: newMessage.createdAt
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Typing indicator
    socket.on('typing', ({ isTyping }) => {
      socket.to(socket.currentRoom).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      });
    });

    // Connection quality update
    socket.on('connection-quality', async ({ quality }) => {
      try {
        const participant = await Participant.findOne({
          socketId: socket.id,
          leftAt: null
        });

        if (participant) {
          participant.connectionQuality = quality;
          await participant.save();

          socket.to(socket.currentRoom).emit('user-connection-quality', {
            userId: socket.userId,
            socketId: socket.id,
            quality
          });
        }
      } catch (error) {
        console.error('Error updating connection quality:', error);
      }
    });

    // Leave room
    socket.on('leave-room', async () => {
      await handleUserLeave(socket, io);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userName} (${socket.id})`);
      await handleUserLeave(socket, io);
    });
  });
};

// Helper function to handle user leaving
async function handleUserLeave(socket, io) {
  try {
    if (!socket.currentRoom) return;

    const participant = await Participant.findOne({
      socketId: socket.id,
      leftAt: null
    });

    if (participant) {
      participant.leftAt = new Date();
      await participant.save();

      // Notify others
      socket.to(socket.currentRoom).emit('user-left', {
        userId: socket.userId,
        socketId: socket.id,
        userName: socket.userName
      });

      // Send system message
      const systemMessage = await Message.create({
        roomId: participant.roomId,
        userId: socket.userId,
        message: `${socket.userName} left the meeting`,
        messageType: 'system'
      });

      io.to(socket.currentRoom).emit('new-message', {
        id: systemMessage._id,
        userId: socket.userId,
        userName: socket.userName,
        message: systemMessage.message,
        messageType: 'system',
        timestamp: systemMessage.createdAt
      });

      console.log(`👋 ${socket.userName} left room: ${socket.currentRoom}`);
    }

    // Cleanup
    activeConnections.delete(socket.id);
    if (socket.currentRoomId) {
      const roomSockets = roomParticipants.get(socket.currentRoomId);
      if (roomSockets) {
        roomSockets.delete(socket.id);
        if (roomSockets.size === 0) {
          roomParticipants.delete(socket.currentRoomId);
        }
      }
    }

    socket.leave(socket.currentRoom);
  } catch (error) {
    console.error('Error handling user leave:', error);
  }
}

export { activeConnections, roomParticipants };
