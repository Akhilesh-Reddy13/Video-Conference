import { create } from 'zustand';
import api from '../utils/api';

export const useRoomStore = create((set, get) => ({
  currentRoom: null,
  rooms: [],
  isLoading: false,
  error: null,

  // Create room
  createRoom: async (roomData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/rooms', roomData);
      const { room } = response.data.data;

      set({
        currentRoom: room,
        isLoading: false,
      });

      return { success: true, room };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create room';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Get room by code
  getRoomByCode: async (roomCode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/rooms/${roomCode}`);
      const { room } = response.data.data;

      set({
        currentRoom: room,
        isLoading: false,
      });

      return { success: true, room };
    } catch (error) {
      const message = error.response?.data?.message || 'Room not found';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Verify room password
  verifyRoomPassword: async (roomCode, password) => {
    try {
      const response = await api.post(`/rooms/${roomCode}/verify-password`, {
        password,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Incorrect password';
      return { success: false, error: message };
    }
  },

  // End room
  endRoom: async (roomCode) => {
    try {
      await api.post(`/rooms/${roomCode}/end`);
      set({ currentRoom: null });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to end room';
      return { success: false, error: message };
    }
  },

  // Get user rooms
  fetchUserRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rooms/my-rooms');
      const { rooms } = response.data.data;

      set({
        rooms,
        isLoading: false,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch rooms';
      set({ error: message, isLoading: false });
    }
  },

  // Get recent meetings
  getRecentMeetings: async () => {
    try {
      const response = await api.get('/rooms/recent-meetings');
      const { meetings } = response.data.data;
      return { success: true, meetings };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch recent meetings';
      return { success: false, error: message, meetings: [] };
    }
  },

  // Clear current room
  clearCurrentRoom: () => set({ currentRoom: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));
