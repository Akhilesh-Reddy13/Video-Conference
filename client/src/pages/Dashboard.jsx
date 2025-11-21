import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { format } from 'date-fns';
import {
  FaVideo,
  FaPlus,
  FaSignInAlt,
  FaSignOutAlt,
  FaUser,
  FaClock,
} from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { createRoom, getRoomByCode, verifyRoomPassword, getRecentMeetings, isLoading, error, clearError } = useRoomStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  const [createFormData, setCreateFormData] = useState({
    title: '',
    isProtected: false,
    password: '',
  });

  // Fetch recent meetings on mount
  useEffect(() => {
    const fetchRecentMeetings = async () => {
      setLoadingMeetings(true);
      const result = await getRecentMeetings();
      if (result.success) {
        setRecentMeetings(result.meetings);
      }
      setLoadingMeetings(false);
    };
    fetchRecentMeetings();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const result = await createRoom(createFormData);
    if (result.success) {
      navigate(`/meeting/${result.room.roomCode}`);
    }
  };

  const handleInstantMeeting = async () => {
    const result = await createRoom({
      title: `${user.name}'s Meeting`,
      isProtected: false,
    });
    if (result.success) {
      navigate(`/meeting/${result.room.roomCode}`);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    clearError();

    // First, get room details
    const result = await getRoomByCode(joinCode.toUpperCase());
    
    if (!result.success) {
      return;
    }

    // If room is protected and we haven't verified password yet
    if (result.room.isProtected && !requiresPassword) {
      setRequiresPassword(true);
      return;
    }

    // Verify password if required
    if (requiresPassword) {
      const verifyResult = await verifyRoomPassword(joinCode.toUpperCase(), roomPassword);
      if (!verifyResult.success) {
        return;
      }
    }

    // Join the room
    navigate(`/meeting/${joinCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <FaVideo className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Video Conference
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-primary-600 text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary flex items-center gap-2"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Video Conference
          </h2>
          <p className="text-xl text-gray-600">
            Start a meeting or join an existing one
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Instant Meeting */}
          <button
            onClick={handleInstantMeeting}
            disabled={isLoading}
            className="card hover:shadow-md transition-shadow text-center group cursor-pointer disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <FaVideo className="text-primary-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Instant Meeting
            </h3>
            <p className="text-gray-600">
              Start a meeting right now
            </p>
          </button>

          {/* Create Meeting */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="card hover:shadow-md transition-shadow text-center group cursor-pointer"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <FaPlus className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Create Meeting
            </h3>
            <p className="text-gray-600">
              Schedule a meeting with options
            </p>
          </button>

          {/* Join Meeting */}
          <button
            onClick={() => setShowJoinModal(true)}
            className="card hover:shadow-md transition-shadow text-center group cursor-pointer"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <FaSignInAlt className="text-blue-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Join Meeting
            </h3>
            <p className="text-gray-600">
              Enter a meeting code
            </p>
          </button>
        </div>

        {/* Recent Meetings */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Meetings
          </h3>
          {loadingMeetings ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading meetings...</p>
            </div>
          ) : recentMeetings.length === 0 ? (
            <div className="card text-center py-12">
              <FaClock className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500">No recent meetings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMeetings.map((meeting, index) => (
                <div
                  key={index}
                  className="card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (meeting.isActive) {
                      navigate(`/meeting/${meeting.roomCode}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FaVideo className="text-primary-600 text-xl" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                        <p className="text-sm text-gray-600">
                          Host: {meeting.host?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(meeting.joinedAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {meeting.isActive ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                          Ended
                        </span>
                      )}
                      <span className="text-sm font-mono text-gray-500">
                        {meeting.roomCode}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create Meeting
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title (Optional)
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, title: e.target.value })
                  }
                  className="input"
                  placeholder="My Meeting"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isProtected"
                  checked={createFormData.isProtected}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      isProtected: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isProtected" className="ml-2 text-sm text-gray-700">
                  Password protect this meeting
                </label>
              </div>

              {createFormData.isProtected && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Password
                  </label>
                  <input
                    type="password"
                    value={createFormData.password}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, password: e.target.value })
                    }
                    className="input"
                    placeholder="Enter password"
                    required={createFormData.isProtected}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({ title: '', isProtected: false, password: '' });
                    clearError();
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Join Meeting
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="input uppercase"
                  placeholder="XXXXXXXX"
                  required
                  maxLength={8}
                />
              </div>

              {requiresPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Password
                  </label>
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    className="input"
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                    setRoomPassword('');
                    setRequiresPassword(false);
                    clearError();
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
