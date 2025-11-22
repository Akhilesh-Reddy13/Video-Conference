import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useMeeting } from '../hooks/useMeeting';
import { useMeetingStore } from '../store/meetingStore';
import { useAuthStore } from '../store/authStore';
import webRTCManager from '../utils/webrtc';
import { v4 as uuidv4 } from 'uuid';

import VideoGrid from '../components/meeting/VideoGrid';
import ControlBar from '../components/meeting/ControlBar';
import ChatSidebar from '../components/meeting/ChatSidebar';
import ParticipantsSidebar from '../components/meeting/ParticipantsSidebar';
import SettingsModal from '../components/meeting/SettingsModal';

const Meeting = () => {
  const { roomCode } = useParams();
  const { user } = useAuthStore();
  const { joinRoom, leaveRoom } = useMeeting(roomCode);
  
  const {
    isConnecting,
    error,
    localStream,
    isAudioMuted,
    isVideoOff,
    setLocalStream,
    setConnecting,
    clearError,
  } = useMeetingStore();

  const [peerId] = useState(uuidv4());
  const localVideoRef = useRef(null);

  // Initialize media and join room
  useEffect(() => {
    const initializeMeeting = async () => {
      setConnecting(true);

      try {
        // Get user media
        const stream = await webRTCManager.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        setLocalStream(stream);

        // Ensure local video displays immediately
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          // Force video to play
          localVideoRef.current.play().catch(err => console.log('Play error:', err));
        }

        // Join room
        await joinRoom(peerId);

        setConnecting(false);
      } catch (error) {
        console.error('Error initializing meeting:', error);
        setConnecting(false);
      }
    };

    initializeMeeting();

    // Cleanup on unmount
    return () => {
      webRTCManager.cleanup();
    };
  }, [roomCode, peerId, joinRoom, setLocalStream, setConnecting]);

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => console.log('Play error:', err));
    }
  }, [localStream]);

  // Handle audio/video mute
  useEffect(() => {
    webRTCManager.toggleAudio(!isAudioMuted);
  }, [isAudioMuted]);

  useEffect(() => {
    const updateVideo = async () => {
      const success = await webRTCManager.toggleVideo(!isVideoOff);
      if (success && localVideoRef.current) {
        // Refresh video display
        localVideoRef.current.srcObject = webRTCManager.localStream;
      }
    };
    updateVideo();
  }, [isVideoOff]);

  if (isConnecting) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">✕</span>
          </div>
          <p className="text-white text-xl mb-4">{error}</p>
          <button onClick={leaveRoom} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div>
          <h1 className="text-white font-semibold text-lg">Meeting: {roomCode}</h1>
          <p className="text-gray-400 text-sm">{user?.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 relative">
          <VideoGrid localVideoRef={localVideoRef} />
        </div>

        {/* Chat Sidebar */}
        <ChatSidebar />

        {/* Participants Sidebar */}
        <ParticipantsSidebar />
      </div>

      {/* Control Bar */}
      <ControlBar onLeave={leaveRoom} />

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
};

export default Meeting;
