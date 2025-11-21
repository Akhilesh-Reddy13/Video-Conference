import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'co-host', 'participant'],
    default: 'participant'
  },
  peerId: {
    type: String,
    default: null
  },
  isAudioMuted: {
    type: Boolean,
    default: false
  },
  isVideoOff: {
    type: Boolean,
    default: false
  },
  isHandRaised: {
    type: Boolean,
    default: false
  },
  isScreenSharing: {
    type: Boolean,
    default: false
  },
  connectionQuality: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'disconnected'],
    default: 'good'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
participantSchema.index({ roomId: 1, userId: 1 });
participantSchema.index({ socketId: 1 });

const Participant = mongoose.model('Participant', participantSchema);

export default Participant;
