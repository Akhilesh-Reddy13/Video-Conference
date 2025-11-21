// ICE servers configuration
const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    // Add TURN servers for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password',
    // },
  ],
};

class WebRTCManager {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.screenStream = null;
    this.socket = null;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  // Get user media (camera and microphone)
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Get screen share stream
  async getScreenShareStream() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: false,
      });
      this.screenStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing screen share:', error);
      throw error;
    }
  }

  // Stop screen sharing
  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  // Create peer connection
  createPeerConnection(socketId, onTrack, onIceCandidate) {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track:', event);
      if (onTrack) {
        onTrack(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state (${socketId}):`, pc.connectionState);
      
      if (pc.connectionState === 'failed') {
        console.error(`Peer connection failed for ${socketId}`);
        this.closePeerConnection(socketId);
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state (${socketId}):`, pc.iceConnectionState);
    };

    this.peerConnections.set(socketId, pc);
    return pc;
  }

  // Create and send offer
  async createOffer(socketId, onTrack, onIceCandidate) {
    const pc = this.createPeerConnection(socketId, onTrack, onIceCandidate);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  // Create and send answer
  async createAnswer(socketId, offer, onTrack, onIceCandidate) {
    const pc = this.createPeerConnection(socketId, onTrack, onIceCandidate);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  // Handle received answer
  async handleAnswer(socketId, answer) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(socketId, candidate) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  // Replace video track (for screen sharing)
  async replaceVideoTrack(newTrack, socketId = null) {
    const connections = socketId
      ? [this.peerConnections.get(socketId)]
      : Array.from(this.peerConnections.values());

    for (const pc of connections) {
      if (pc) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        
        if (videoSender) {
          try {
            await videoSender.replaceTrack(newTrack);
          } catch (error) {
            console.error('Error replacing video track:', error);
          }
        }
      }
    }
  }

  // Toggle audio track
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle video track
  async toggleVideo(enabled) {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      
      if (enabled && videoTracks.length > 0 && videoTracks[0].readyState === 'ended') {
        // If track is ended, we need to get a new stream
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          // Remove old video track
          if (videoTracks.length > 0) {
            this.localStream.removeTrack(videoTracks[0]);
          }
          
          // Add new video track
          this.localStream.addTrack(newVideoTrack);
          
          // Replace track in all peer connections
          await this.replaceVideoTrack(newVideoTrack);
          
          return true;
        } catch (error) {
          console.error('Error restarting video:', error);
          return false;
        }
      } else {
        // Just enable/disable the existing track
        videoTracks.forEach((track) => {
          track.enabled = enabled;
        });
        return true;
      }
    }
    return false;
  }

  // Close specific peer connection
  closePeerConnection(socketId) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }
  }

  // Close all peer connections
  closeAllConnections() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
  }

  // Stop all tracks and cleanup
  cleanup() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Stop screen stream
    this.stopScreenShare();

    // Close all peer connections
    this.closeAllConnections();
  }

  // Get available media devices
  async getMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
      };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      throw error;
    }
  }

  // Switch camera
  async switchCamera(deviceId) {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace video track in local stream
      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      this.localStream.removeTrack(oldVideoTrack);
      this.localStream.addTrack(newVideoTrack);
      oldVideoTrack.stop();

      // Replace video track in all peer connections
      await this.replaceVideoTrack(newVideoTrack);

      return newStream;
    } catch (error) {
      console.error('Error switching camera:', error);
      throw error;
    }
  }

  // Switch microphone
  async switchMicrophone(deviceId) {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { deviceId: { exact: deviceId } },
      });

      const newAudioTrack = newStream.getAudioTracks()[0];
      
      // Replace audio track in local stream
      const oldAudioTrack = this.localStream.getAudioTracks()[0];
      this.localStream.removeTrack(oldAudioTrack);
      this.localStream.addTrack(newAudioTrack);
      oldAudioTrack.stop();

      // Replace audio track in all peer connections
      const connections = Array.from(this.peerConnections.values());
      for (const pc of connections) {
        const senders = pc.getSenders();
        const audioSender = senders.find((s) => s.track?.kind === 'audio');
        
        if (audioSender) {
          await audioSender.replaceTrack(newAudioTrack);
        }
      }

      return newStream;
    } catch (error) {
      console.error('Error switching microphone:', error);
      throw error;
    }
  }
}

// Singleton instance
const webRTCManager = new WebRTCManager();

export default webRTCManager;
