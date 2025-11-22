import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../utils/socket';
import VideoTile from './VideoTile';

const VideoGrid = ({ localVideoRef }) => {
  const { user } = useAuthStore();
  const socket = getSocket();
  const {
    participants,
    remoteStreams,
    localStream,
    isVideoOff,
    isAudioMuted,
    selectedView,
    pinnedParticipant,
  } = useMeetingStore();

  // Filter out self from participants list to prevent duplicate
  const remoteParticipants = participants.filter(p => p.socketId !== socket?.id);
  const totalParticipants = remoteParticipants.length + 1; // +1 for local user

  // Calculate grid layout
  const getGridClass = () => {
    if (selectedView === 'speaker' && pinnedParticipant) {
      return 'grid-cols-1';
    }

    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-3';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const displayParticipants = selectedView === 'speaker' && pinnedParticipant
    ? remoteParticipants.filter(p => p.socketId === pinnedParticipant)
    : remoteParticipants;

  return (
    <div className="h-full w-full p-4">
      <div className={`grid ${getGridClass()} gap-4 h-full auto-rows-fr`}>
        {/* Local Video */}
        <VideoTile
          videoRef={localVideoRef}
          name={user?.name + ' (You)'}
          isLocal={true}
          isMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          avatar={user?.avatar}
        />

        {/* Remote Videos */}
        {displayParticipants.map((participant) => (
          <VideoTile
            key={participant.socketId}
            stream={remoteStreams.get(participant.socketId)}
            name={participant.name}
            isLocal={false}
            isMuted={participant.isAudioMuted}
            isVideoOff={participant.isVideoOff}
            isHandRaised={participant.isHandRaised}
            isScreenSharing={participant.isScreenSharing}
            connectionQuality={participant.connectionQuality}
            avatar={participant.avatar}
            socketId={participant.socketId}
          />
        ))}
      </div>

      {/* Participant count indicator */}
      <div className="absolute top-8 right-8 bg-gray-800 bg-opacity-75 text-white px-4 py-2 rounded-lg">
        <span className="font-medium">{totalParticipants}</span>
        <span className="ml-2 text-gray-300">
          {totalParticipants === 1 ? 'participant' : 'participants'}
        </span>
      </div>
    </div>
  );
};

export default VideoGrid;
