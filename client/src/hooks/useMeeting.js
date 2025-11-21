import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/meetingStore';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../utils/socket';
import webRTCManager from '../utils/webrtc';

export const useMeeting = (roomCode) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    setRoomInfo,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setParticipants,
    addMessage,
    addTypingUser,
    removeTypingUser,
    addRemoteStream,
    removeRemoteStream,
    setError,
    resetMeeting,
  } = useMeetingStore();

  // Join room
  const joinRoom = useCallback(
    async (peerId) => {
      try {
        const socket = getSocket();
        
        socket.emit('join-room', { roomCode, peerId });

        return { success: true };
      } catch (error) {
        console.error('Error joining room:', error);
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [roomCode, setError]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit('leave-room');
    
    webRTCManager.cleanup();
    resetMeeting();
    navigate('/dashboard');
  }, [navigate, resetMeeting]);

  // Setup socket event listeners
  useEffect(() => {
    const socket = getSocket();

    // Room joined
    socket.on('room-joined', ({ roomId, participants, roomSettings }) => {
      console.log('Joined room:', roomId);
      setRoomInfo(roomId, roomCode, roomSettings);
      setParticipants(participants);
    });

    // User joined
    socket.on('user-joined', async (participant) => {
      console.log('User joined:', participant);
      addParticipant(participant);

      // Create offer for the new user
      try {
        const offer = await webRTCManager.createOffer(
          participant.socketId,
          (stream) => {
            addRemoteStream(participant.socketId, stream);
          },
          (candidate) => {
            socket.emit('ice-candidate', {
              candidate,
              to: participant.socketId,
            });
          }
        );

        socket.emit('offer', { offer, to: participant.socketId });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    // Received offer
    socket.on('offer', async ({ offer, from, fromPeerId }) => {
      console.log('Received offer from:', from);

      try {
        const answer = await webRTCManager.createAnswer(
          from,
          offer,
          (stream) => {
            addRemoteStream(from, stream);
          },
          (candidate) => {
            socket.emit('ice-candidate', {
              candidate,
              to: from,
            });
          }
        );

        socket.emit('answer', { answer, to: from });
      } catch (error) {
        console.error('Error creating answer:', error);
      }
    });

    // Received answer
    socket.on('answer', async ({ answer, from }) => {
      console.log('Received answer from:', from);
      await webRTCManager.handleAnswer(from, answer);
    });

    // Received ICE candidate
    socket.on('ice-candidate', async ({ candidate, from }) => {
      await webRTCManager.handleIceCandidate(from, candidate);
    });

    // User left
    socket.on('user-left', ({ socketId, userName }) => {
      console.log('User left:', userName);
      removeParticipant(socketId);
      removeRemoteStream(socketId);
      webRTCManager.closePeerConnection(socketId);
    });

    // User audio toggled
    socket.on('user-audio-toggled', ({ socketId, isAudioMuted }) => {
      updateParticipant(socketId, { isAudioMuted });
    });

    // User video toggled
    socket.on('user-video-toggled', ({ socketId, isVideoOff }) => {
      updateParticipant(socketId, { isVideoOff });
    });

    // User started screen share
    socket.on('user-started-screen-share', ({ socketId, userName }) => {
      updateParticipant(socketId, { isScreenSharing: true });
    });

    // User stopped screen share
    socket.on('user-stopped-screen-share', ({ socketId }) => {
      updateParticipant(socketId, { isScreenSharing: false });
    });

    // User hand toggled
    socket.on('user-hand-toggled', ({ socketId, userName, isHandRaised }) => {
      updateParticipant(socketId, { isHandRaised });
    });

    // New message
    socket.on('new-message', (message) => {
      addMessage(message);
    });

    // User typing
    socket.on('user-typing', ({ userName, isTyping }) => {
      if (isTyping) {
        addTypingUser(userName);
        // Auto-remove after 3 seconds
        setTimeout(() => {
          removeTypingUser(userName);
        }, 3000);
      } else {
        removeTypingUser(userName);
      }
    });

    // Connection quality
    socket.on('user-connection-quality', ({ socketId, quality }) => {
      updateParticipant(socketId, { connectionQuality: quality });
    });

    // Error
    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
    });

    // Cleanup
    return () => {
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
      socket.off('user-audio-toggled');
      socket.off('user-video-toggled');
      socket.off('user-started-screen-share');
      socket.off('user-stopped-screen-share');
      socket.off('user-hand-toggled');
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-connection-quality');
      socket.off('error');
    };
  }, [
    roomCode,
    setRoomInfo,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setParticipants,
    addMessage,
    addTypingUser,
    removeTypingUser,
    addRemoteStream,
    removeRemoteStream,
    setError,
  ]);

  return { joinRoom, leaveRoom };
};
