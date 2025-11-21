import { useState, useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import webRTCManager from '../../utils/webrtc';
import { FaTimes } from 'react-icons/fa';

const SettingsModal = () => {
  const { isSettingsOpen, toggleSettings } = useMeetingStore();

  const [devices, setDevices] = useState({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });

  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const mediaDevices = await webRTCManager.getMediaDevices();
        setDevices(mediaDevices);

        // Set default devices
        if (mediaDevices.audioInputs.length > 0) {
          setSelectedDevices((prev) => ({
            ...prev,
            audioInput: mediaDevices.audioInputs[0].deviceId,
          }));
        }
        if (mediaDevices.videoInputs.length > 0) {
          setSelectedDevices((prev) => ({
            ...prev,
            videoInput: mediaDevices.videoInputs[0].deviceId,
          }));
        }
        if (mediaDevices.audioOutputs.length > 0) {
          setSelectedDevices((prev) => ({
            ...prev,
            audioOutput: mediaDevices.audioOutputs[0].deviceId,
          }));
        }
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };

    if (isSettingsOpen) {
      loadDevices();
    }
  }, [isSettingsOpen]);

  const handleDeviceChange = async (deviceType, deviceId) => {
    setIsLoading(true);
    try {
      if (deviceType === 'audioInput') {
        await webRTCManager.switchMicrophone(deviceId);
        setSelectedDevices((prev) => ({ ...prev, audioInput: deviceId }));
      } else if (deviceType === 'videoInput') {
        await webRTCManager.switchCamera(deviceId);
        setSelectedDevices((prev) => ({ ...prev, videoInput: deviceId }));
      } else if (deviceType === 'audioOutput') {
        // Audio output change is handled differently
        setSelectedDevices((prev) => ({ ...prev, audioOutput: deviceId }));
      }
    } catch (error) {
      console.error('Error changing device:', error);
      alert('Failed to change device. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={toggleSettings}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Audio Input */}
          <div>
            <h3 className="text-white font-semibold mb-3">Microphone</h3>
            <select
              value={selectedDevices.audioInput}
              onChange={(e) =>
                handleDeviceChange('audioInput', e.target.value)
              }
              disabled={isLoading}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {devices.audioInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
            {devices.audioInputs.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">
                No microphones detected
              </p>
            )}
          </div>

          {/* Audio Output */}
          <div>
            <h3 className="text-white font-semibold mb-3">Speaker</h3>
            <select
              value={selectedDevices.audioOutput}
              onChange={(e) =>
                handleDeviceChange('audioOutput', e.target.value)
              }
              disabled={isLoading}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {devices.audioOutputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
            {devices.audioOutputs.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">
                No speakers detected
              </p>
            )}
          </div>

          {/* Video Input */}
          <div>
            <h3 className="text-white font-semibold mb-3">Camera</h3>
            <select
              value={selectedDevices.videoInput}
              onChange={(e) =>
                handleDeviceChange('videoInput', e.target.value)
              }
              disabled={isLoading}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {devices.videoInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
            {devices.videoInputs.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">No cameras detected</p>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-300 text-sm">
              <strong>Note:</strong> Changes to devices will be applied
              immediately to your current meeting.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button onClick={toggleSettings} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
