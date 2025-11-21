import Room from '../models/Room.js';
import Participant from '../models/Participant.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Generate unique room code
const generateRoomCode = () => {
  return uuidv4().substring(0, 8).toUpperCase().replace(/-/g, '');
};

// Create new room
export const createRoom = async (req, res) => {
  try {
    const { title, isProtected, password, settings } = req.body;
    
    // Generate unique room code
    let roomCode = generateRoomCode();
    let existingRoom = await Room.findOne({ roomCode });
    
    // Ensure unique room code
    while (existingRoom) {
      roomCode = generateRoomCode();
      existingRoom = await Room.findOne({ roomCode });
    }

    // Hash password if protected
    let hashedPassword = null;
    if (isProtected && password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create room
    const room = await Room.create({
      roomCode,
      hostId: req.user._id,
      title: title || `${req.user.name}'s Meeting`,
      isProtected: isProtected || false,
      password: hashedPassword,
      settings: settings || {}
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          hostId: room.hostId,
          isProtected: room.isProtected,
          settings: room.settings,
          startedAt: room.startedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message
    });
  }
};

// Get room details
export const getRoomByCode = async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const room = await Room.findOne({ roomCode, isActive: true })
      .populate('hostId', 'name email avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or has ended'
      });
    }

    // Get active participants count
    const participantsCount = await Participant.countDocuments({
      roomId: room._id,
      leftAt: null
    });

    res.json({
      success: true,
      data: {
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          host: room.hostId,
          isProtected: room.isProtected,
          participantsCount,
          maxParticipants: room.maxParticipants,
          settings: room.settings,
          startedAt: room.startedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room',
      error: error.message
    });
  }
};

// Verify room password
export const verifyRoomPassword = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { password } = req.body;

    const room = await Room.findOne({ roomCode, isActive: true }).select('+password');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isProtected) {
      return res.json({
        success: true,
        message: 'Room is not protected'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, room.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    res.json({
      success: true,
      message: 'Password verified'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying password',
      error: error.message
    });
  }
};

// End room
export const endRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is host
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the meeting'
      });
    }

    room.isActive = false;
    room.endedAt = new Date();
    await room.save();

    // Mark all participants as left
    await Participant.updateMany(
      { roomId: room._id, leftAt: null },
      { leftAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Room ended successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error ending room',
      error: error.message
    });
  }
};

// Get user's active rooms
export const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      hostId: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message
    });
  }
};

// Get user's recent meetings (participated in)
export const getRecentMeetings = async (req, res) => {
  try {
    // Get recent participations
    const recentParticipations = await Participant.find({
      userId: req.user._id
    })
      .sort({ joinedAt: -1 })
      .limit(10)
      .populate({
        path: 'roomId',
        populate: { path: 'hostId', select: 'name email' }
      });

    // Filter out null rooms and format data
    const meetings = recentParticipations
      .filter(p => p.roomId)
      .map(p => ({
        roomCode: p.roomId.roomCode,
        title: p.roomId.title,
        host: p.roomId.hostId,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        isActive: p.roomId.isActive
      }));

    res.json({
      success: true,
      data: { meetings }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent meetings',
      error: error.message
    });
  }
};
