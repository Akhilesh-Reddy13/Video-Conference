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
    if (this.peerConnections.has(socketId)) {
      console.log(`⚠️  Peer connection already exists for: ${socketId}`);
      return this.peerConnections.get(socketId);
    }

    console.log(`🔗 Creating peer connection for: ${socketId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Handle incoming tracks - Set up BEFORE adding local tracks
    pc.ontrack = (event) => {
      console.log(`📹 Received ${event.track.kind} track from ${socketId}`);
      console.log(`📹 Stream ID: ${event.streams[0]?.id}, tracks:`, event.streams[0]?.getTracks().map(t => `${t.kind}(${t.enabled})`));
      if (onTrack) {
        onTrack(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        console.log(`🧊 Sending ICE candidate to: ${socketId}`);
        onIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`🔌 Peer connection state (${socketId}): ${pc.connectionState}`);
      
      if (pc.connectionState === 'failed') {
        console.error(`❌ Peer connection failed for ${socketId}`);
        this.closePeerConnection(socketId);
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state (${socketId}): ${pc.iceConnectionState}`);
    };

    // Add local stream tracks to peer connection AFTER setting up handlers
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log(`➕ Adding ${tracks.length} tracks to peer ${socketId}:`, tracks.map(t => `${t.kind}(enabled: ${t.enabled}, readyState: ${t.readyState})`));
      
      tracks.forEach((track) => {
        const sender = pc.addTrack(track, this.localStream);
        console.log(`✅ Added ${track.kind} track to peer ${socketId}`);
      });
    } else {
      console.warn(`⚠️  No local stream available when creating peer connection for ${socketId}`);
    }

    this.peerConnections.set(socketId, pc);
    return pc;
  }

  // Create and send offer
  async createOffer(socketId, onTrack, onIceCandidate) {
    const pc = this.createPeerConnection(socketId, onTrack, onIceCandidate);

    try {
      // Verify tracks are added
      const senders = pc.getSenders();
      console.log(`📊 Senders for ${socketId} before offer:`, senders.map(s => s.track ? `${s.track.kind}(${s.track.enabled})` : 'null'));

      // Create offer with explicit bidirectional media
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      console.log(`✅ Offer created and set for ${socketId}`);
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
      console.log(`✅ Remote description set for ${socketId}`);

      // Verify local tracks are added before creating answer
      const senders = pc.getSenders();
      console.log(`📊 Senders for ${socketId} before answer:`, senders.map(s => s.track ? `${s.track.kind}(${s.track.enabled})` : 'null'));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`✅ Answer created and set for ${socketId}`);
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
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    
    if (enabled) {
      // Turning video ON
      if (videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
        // Need to get a new video track
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          // Remove old video track if exists
          if (videoTracks.length > 0) {
            this.localStream.removeTrack(videoTracks[0]);
            videoTracks[0].stop();
          }
          
          // Add new video track to local stream
          this.localStream.addTrack(newVideoTrack);
          
          // Add or replace track in all peer connections
          for (const [socketId, pc] of this.peerConnections.entries()) {
            const senders = pc.getSenders();
            const videoSender = senders.find((s) => s.track?.kind === 'video');
            
            if (videoSender) {
              // Replace existing sender
              await videoSender.replaceTrack(newVideoTrack);
            } else {
              // Add new sender if none exists
              pc.addTrack(newVideoTrack, this.localStream);
            }
          }
          
          console.log('✅ Video track started and added to peer connections');
          return true;
        } catch (error) {
          console.error('Error starting video:', error);
          return false;
        }
      } else {
        // Just enable the existing track
        videoTracks[0].enabled = true;
        console.log('✅ Video track enabled');
        return true;
      }
    } else {
      // Turning video OFF
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        
        // Stop the track completely
        videoTrack.stop();
        this.localStream.removeTrack(videoTrack);
        
        // Remove track from all peer connections or replace with null
        for (const [socketId, pc] of this.peerConnections.entries()) {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          
          if (videoSender) {
            await videoSender.replaceTrack(null);
          }
        }
        
        console.log('✅ Video track stopped and removed from peer connections');
        return true;
      }
      return true;
    }
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
