import { create } from 'zustand';

export const useMeetingStore = create((set, get) => ({
  // Room info
  roomId: null,
  roomCode: null,
  roomSettings: {},

  // Participants
  participants: [],
  localParticipant: null,

  // Media states
  isAudioMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isHandRaised: false,

  // Streams
  localStream: null,
  screenStream: null,
  remoteStreams: new Map(), // socketId -> MediaStream

  // Peer connections
  peerConnections: new Map(), // socketId -> RTCPeerConnection

  // Chat
  messages: [],
  unreadCount: 0,
  typingUsers: new Set(),

  // UI states
  isChatOpen: false,
  isParticipantsOpen: false,
  isSettingsOpen: false,
  selectedView: 'grid', // 'grid' or 'speaker'
  pinnedParticipant: null,

  // Connection
  connectionQuality: 'good',
  isConnecting: false,
  error: null,

  // Set room info
  setRoomInfo: (roomId, roomCode, roomSettings) =>
    set({ roomId, roomCode, roomSettings }),

  // Set local participant
  setLocalParticipant: (participant) =>
    set({ localParticipant: participant }),

  // Add participant
  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),

  // Remove participant
  removeParticipant: (socketId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.socketId !== socketId),
    })),

  // Update participant
  updateParticipant: (socketId, updates) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.socketId === socketId ? { ...p, ...updates } : p
      ),
    })),

  // Set participants (bulk)
  setParticipants: (participants) => set({ participants }),

  // Toggle audio
  toggleAudio: () =>
    set((state) => ({ isAudioMuted: !state.isAudioMuted })),

  // Toggle video
  toggleVideo: () =>
    set((state) => ({ isVideoOff: !state.isVideoOff })),

  // Toggle screen share
  toggleScreenShare: () =>
    set((state) => ({ isScreenSharing: !state.isScreenSharing })),

  // Toggle hand
  toggleHand: () =>
    set((state) => ({ isHandRaised: !state.isHandRaised })),

  // Set local stream
  setLocalStream: (stream) => set({ localStream: stream }),

  // Set screen stream
  setScreenStream: (stream) => set({ screenStream: stream }),

  // Add remote stream
  addRemoteStream: (socketId, stream) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.set(socketId, stream);
      return { remoteStreams: newStreams };
    }),

  // Remove remote stream
  removeRemoteStream: (socketId) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.delete(socketId);
      return { remoteStreams: newStreams };
    }),

  // Add peer connection
  addPeerConnection: (socketId, pc) =>
    set((state) => {
      const newPCs = new Map(state.peerConnections);
      newPCs.set(socketId, pc);
      return { peerConnections: newPCs };
    }),

  // Remove peer connection
  removePeerConnection: (socketId) =>
    set((state) => {
      const pc = state.peerConnections.get(socketId);
      if (pc) {
        pc.close();
      }
      const newPCs = new Map(state.peerConnections);
      newPCs.delete(socketId);
      return { peerConnections: newPCs };
    }),

  // Add message
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: state.isChatOpen ? state.unreadCount : state.unreadCount + 1,
    })),

  // Clear unread count
  clearUnreadCount: () => set({ unreadCount: 0 }),

  // Add typing user
  addTypingUser: (userName) =>
    set((state) => {
      const newTyping = new Set(state.typingUsers);
      newTyping.add(userName);
      return { typingUsers: newTyping };
    }),

  // Remove typing user
  removeTypingUser: (userName) =>
    set((state) => {
      const newTyping = new Set(state.typingUsers);
      newTyping.delete(userName);
      return { typingUsers: newTyping };
    }),

  // Toggle UI panels
  toggleChat: () =>
    set((state) => {
      const newState = { isChatOpen: !state.isChatOpen };
      if (newState.isChatOpen) {
        newState.unreadCount = 0;
      }
      return newState;
    }),

  toggleParticipants: () =>
    set((state) => ({
      isParticipantsOpen: !state.isParticipantsOpen,
    })),

  toggleSettings: () =>
    set((state) => ({
      isSettingsOpen: !state.isSettingsOpen,
    })),

  // Set view mode
  setViewMode: (mode) => set({ selectedView: mode }),

  // Pin participant
  pinParticipant: (socketId) => set({ pinnedParticipant: socketId }),

  // Set connection quality
  setConnectionQuality: (quality) => set({ connectionQuality: quality }),

  // Set connecting state
  setConnecting: (isConnecting) => set({ isConnecting }),

  // Set error
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),

  // Reset meeting state
  resetMeeting: () =>
    set({
      roomId: null,
      roomCode: null,
      roomSettings: {},
      participants: [],
      localParticipant: null,
      isAudioMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isHandRaised: false,
      localStream: null,
      screenStream: null,
      remoteStreams: new Map(),
      peerConnections: new Map(),
      messages: [],
      unreadCount: 0,
      typingUsers: new Set(),
      isChatOpen: false,
      isParticipantsOpen: false,
      isSettingsOpen: false,
      selectedView: 'grid',
      pinnedParticipant: null,
      connectionQuality: 'good',
      isConnecting: false,
      error: null,
    }),
}));
