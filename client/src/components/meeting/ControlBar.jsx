import { useState } from 'react';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaHandPaper,
  FaComments,
  FaUsers,
  FaCog,
  FaPhoneSlash,
  FaEllipsisV,
} from 'react-icons/fa';
import { useMeetingStore } from '../../store/meetingStore';
import { getSocket } from '../../utils/socket';
import webRTCManager from '../../utils/webrtc';

const ControlBar = ({ onLeave }) => {
  const {
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    isChatOpen,
    isParticipantsOpen,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHand,
    toggleChat,
    toggleParticipants,
    toggleSettings,
    unreadCount,
  } = useMeetingStore();

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const socket = getSocket();

  const handleToggleAudio = () => {
    toggleAudio();
    socket.emit('toggle-audio', { isAudioMuted: !isAudioMuted });
  };

  const handleToggleVideo = () => {
    toggleVideo();
    socket.emit('toggle-video', { isVideoOff: !isVideoOff });
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await webRTCManager.getScreenShareStream();
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track with screen track
        await webRTCManager.replaceVideoTrack(screenTrack);

        // Listen for screen share stop
        screenTrack.onended = () => {
          handleStopScreenShare();
        };

        socket.emit('start-screen-share');
        toggleScreenShare();
      } else {
        handleStopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleStopScreenShare = async () => {
    webRTCManager.stopScreenShare();

    // Replace back to camera track
    const cameraTrack = webRTCManager.localStream.getVideoTracks()[0];
    await webRTCManager.replaceVideoTrack(cameraTrack);

    socket.emit('stop-screen-share');
    toggleScreenShare();
  };

  const handleToggleHand = () => {
    toggleHand();
    socket.emit('toggle-hand', { isHandRaised: !isHandRaised });
  };

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave the meeting?')) {
      onLeave();
    }
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Controls */}
        <div className="flex items-center gap-3">
          {/* Microphone */}
          <button
            onClick={handleToggleAudio}
            className={`control-btn ${
              isAudioMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? (
              <FaMicrophoneSlash className="text-white" />
            ) : (
              <FaMicrophone className="text-white" />
            )}
          </button>

          {/* Camera */}
          <button
            onClick={handleToggleVideo}
            className={`control-btn ${
              isVideoOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <FaVideoSlash className="text-white" />
            ) : (
              <FaVideo className="text-white" />
            )}
          </button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-3">
          {/* Screen Share */}
          <button
            onClick={handleToggleScreenShare}
            className={`control-btn ${
              isScreenSharing
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <FaDesktop className="text-white" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={handleToggleHand}
            className={`control-btn ${
              isHandRaised
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <FaHandPaper className="text-white" />
          </button>

          {/* Chat */}
          <button
            onClick={toggleChat}
            className={`control-btn relative ${
              isChatOpen
                ? 'bg-primary-500 hover:bg-primary-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Chat"
          >
            <FaComments className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            onClick={toggleParticipants}
            className={`control-btn ${
              isParticipantsOpen
                ? 'bg-primary-500 hover:bg-primary-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Participants"
          >
            <FaUsers className="text-white" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="control-btn bg-gray-700 hover:bg-gray-600"
              title="More options"
            >
              <FaEllipsisV className="text-white" />
            </button>

            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px]">
                <button
                  onClick={() => {
                    toggleSettings();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
                >
                  <FaCog />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div>
          {/* Leave Meeting */}
          <button
            onClick={handleLeave}
            className="control-btn bg-red-500 hover:bg-red-600 px-6"
            title="Leave meeting"
          >
            <FaPhoneSlash className="text-white mr-2" />
            <span className="text-white font-medium">Leave</span>
          </button>
        </div>
      </div>

      {/* Click outside to close more menu */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </div>
  );
};

export default ControlBar;
