import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  isProtected: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null,
    select: false
  },
  maxParticipants: {
    type: Number,
    default: 50,
    min: 2,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  settings: {
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    waitingRoom: {
      type: Boolean,
      default: false
    },
    muteOnEntry: {
      type: Boolean,
      default: false
    },
    recordSession: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for faster lookups
roomSchema.index({ roomCode: 1 });
roomSchema.index({ hostId: 1 });
roomSchema.index({ isActive: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
