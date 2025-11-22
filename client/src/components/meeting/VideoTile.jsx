import { useEffect, useRef } from 'react';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaHandPaper,
  FaDesktop,
  FaUser,
} from 'react-icons/fa';
import { useMeetingStore } from '../../store/meetingStore';

const VideoTile = ({
  videoRef,
  stream,
  name,
  isLocal,
  isMuted,
  isVideoOff,
  isHandRaised,
  isScreenSharing,
  connectionQuality,
  avatar,
  socketId,
}) => {
  const remoteVideoRef = useRef(null);
  const { pinParticipant, pinnedParticipant } = useMeetingStore();

  const isPinned = pinnedParticipant === socketId;

  // Set stream for remote videos
  useEffect(() => {
    if (!isLocal && stream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      // Force video to play
      remoteVideoRef.current.play().catch(err => {
        console.log('Remote video play error:', err);
      });
    }
  }, [stream, isLocal]);

  const handlePin = () => {
    if (!isLocal && socketId) {
      pinParticipant(isPinned ? null : socketId);
    }
  };

  return (
    <div
      className={`video-tile relative group ${isPinned ? 'ring-4 ring-primary-500' : ''}`}
      onClick={handlePin}
    >
      {/* Video Element */}
      {!isVideoOff ? (
        <video
          ref={isLocal ? videoRef : remoteVideoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full mx-auto mb-3"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaUser className="text-gray-400 text-4xl" />
              </div>
            )}
            <p className="text-white font-medium">{name}</p>
          </div>
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Name Badge */}
      <div className="absolute bottom-3 left-3 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
        <span className="truncate max-w-[150px]">{name}</span>
        {isMuted ? (
          <FaMicrophoneSlash className="text-red-400 flex-shrink-0" />
        ) : (
          <FaMicrophone className="text-green-400 flex-shrink-0" />
        )}
      </div>

      {/* Status Indicators */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {/* Hand Raised */}
        {isHandRaised && (
          <div className="bg-yellow-500 text-white p-2 rounded-full shadow-lg animate-pulse">
            <FaHandPaper className="text-sm" />
          </div>
        )}

        {/* Screen Sharing */}
        {isScreenSharing && (
          <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg">
            <FaDesktop className="text-sm" />
          </div>
        )}

        {/* Connection Quality */}
        {!isLocal && connectionQuality && (
          <div className="bg-black bg-opacity-75 p-2 rounded-full">
            <div className="connection-indicator">
              <div
                className={`connection-bar ${
                  ['excellent', 'good', 'poor'].includes(connectionQuality)
                    ? 'active ' + connectionQuality
                    : ''
                }`}
              />
              <div
                className={`connection-bar ${
                  ['excellent', 'good'].includes(connectionQuality)
                    ? 'active ' + connectionQuality
                    : ''
                }`}
              />
              <div
                className={`connection-bar ${
                  connectionQuality === 'excellent' ? 'active excellent' : ''
                }`}
              />
            </div>
          </div>
        )}

        {/* Pin Indicator */}
        {isPinned && (
          <div className="bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
            Pinned
          </div>
        )}
      </div>

      {/* Video Off Indicator */}
      {isVideoOff && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <FaVideoSlash className="text-xs" />
          <span>Camera Off</span>
        </div>
      )}
    </div>
  );
};

export default VideoTile;
