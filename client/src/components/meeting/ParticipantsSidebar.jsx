import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import {
  FaTimes,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaHandPaper,
  FaDesktop,
  FaCrown,
  FaUser,
} from 'react-icons/fa';

const ParticipantsSidebar = () => {
  const { user } = useAuthStore();
  const { isParticipantsOpen, participants, toggleParticipants } =
    useMeetingStore();

  if (!isParticipantsOpen) return null;

  const totalParticipants = participants.length + 1; // +1 for local user

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-semibold">
          Participants ({totalParticipants})
        </h3>
        <button
          onClick={toggleParticipants}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        {/* Local User */}
        <div className="px-4 py-3 border-b border-gray-700 hover:bg-gray-750 transition-colors">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {user?.name} (You)
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-400 text-xs">Host</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaCrown className="text-yellow-500" title="Host" />
            </div>
          </div>
        </div>

        {/* Remote Participants */}
        {participants.map((participant) => (
          <div
            key={participant.socketId}
            className="px-4 py-3 border-b border-gray-700 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {participant.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {participant.role === 'host' && (
                    <span className="text-green-400 text-xs">Host</span>
                  )}
                  {participant.role === 'co-host' && (
                    <span className="text-blue-400 text-xs">Co-host</span>
                  )}
                  {participant.connectionQuality && (
                    <span className="text-gray-400 text-xs">
                      {participant.connectionQuality === 'excellent' && '●●●'}
                      {participant.connectionQuality === 'good' && '●●○'}
                      {participant.connectionQuality === 'poor' && '●○○'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {participant.isHandRaised && (
                  <FaHandPaper
                    className="text-yellow-500"
                    title="Hand raised"
                  />
                )}
                {participant.isScreenSharing && (
                  <FaDesktop className="text-blue-500" title="Sharing screen" />
                )}
                {participant.isAudioMuted ? (
                  <FaMicrophoneSlash
                    className="text-red-400"
                    title="Muted"
                  />
                ) : (
                  <FaMicrophone className="text-green-400" title="Unmuted" />
                )}
                {participant.isVideoOff ? (
                  <FaVideoSlash className="text-red-400" title="Camera off" />
                ) : (
                  <FaVideo className="text-green-400" title="Camera on" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-gray-400 text-xs text-center">
          All participants are displayed
        </p>
      </div>
    </div>
  );
};

export default ParticipantsSidebar;
