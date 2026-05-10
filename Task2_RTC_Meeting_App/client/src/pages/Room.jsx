import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoGrid from '../components/VideoGrid';
import ChatSidebar from '../components/ChatSidebar';
import Controls from '../components/Controls';
import Whiteboard from '../components/Whiteboard';

const SERVER_URL = 'http://localhost:5000';

const Room = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username || 'Guest';
  const token = location.state?.token;

  const socketRef = useRef(null);
  const myStreamRef = useRef(null);
  const peersRef = useRef({}); // Store active RTCPeerConnections mapped by their socket ID

  const [myStream, setMyStream] = useState(null);
  const [participants, setParticipants] = useState([]); // [{ id, stream, name }]
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'System', text: `Welcome to room ${roomId}, ${username}!` }
  ]);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  
  const createPeerConnection = (targetUserId, socket, remoteName) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, myStreamRef.current);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetUserId,
          candidate: event.candidate
        });
      }
    };

    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setParticipants(prev => {
        if (prev.find(p => p.id === targetUserId)) return prev;
        return [...prev, { id: targetUserId, stream: remoteStream, name: remoteName }];
      });
    };

    peersRef.current[targetUserId] = peer;
    return peer;
  };

  const initializeSocketAndWebRTC = () => {
    socketRef.current = io(SERVER_URL, {
      auth: { token }
    });
    const socket = socketRef.current;

    socket.on("connect_error", (err) => {
      console.error(err.message);
      alert(err.message);
      navigate('/');
    });

    socket.emit('join-room');

    socket.on('user-connected', async ({ userId, username: remoteName }) => {
      console.log(`User connected: ${remoteName} (${userId})`);
      const peer = createPeerConnection(userId, socket, remoteName);
      
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('offer', {
        targetUserId: userId,
        callerId: socket.id,
        sdp: peer.localDescription
      });
    });

    socket.on('offer', async ({ callerId, sdp, username: callerName }) => {
      console.log(`Received Offer from: ${callerName}`);
      const peer = createPeerConnection(callerId, socket, callerName);
      
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('answer', {
        targetUserId: callerId,
        callerId: socket.id,
        sdp: peer.localDescription
      });
    });

    socket.on('answer', async ({ callerId, sdp }) => {
      console.log(`Received Answer from: ${callerId}`);
      const peer = peersRef.current[callerId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socket.on('ice-candidate', async ({ senderId, candidate }) => {
      const peer = peersRef.current[senderId];
      if (peer && candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on('user-disconnected', ({ userId, username }) => {
      console.log(`User disconnected: ${username}`);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    socket.on('receive-message', ({ sender, text, fileUrl, fileName }) => {
      setMessages(prev => [...prev, { sender, text, fileUrl, fileName }]);
    });

    socket.on('reaction', ({ username: sender }) => {
      setMessages(prev => [...prev, {
        sender: 'System',
        text: `✋ ${sender} raised their hand`
      }]);
    });
  };

  useEffect(() => {
    if (!token) {
      alert("Unauthorized: Please join from the home page.");
      navigate('/');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        myStreamRef.current = stream;
        initializeSocketAndWebRTC();
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
        alert("Camera or Microphone permissions denied.");
      });

    const currentPeers = peersRef.current;
    return () => {
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.keys(currentPeers).forEach(peerId => {
        currentPeers[peerId].close();
      });
    };

  }, [navigate, token]);

  const toggleAudio = () => {
    if (myStreamRef.current) {
      const audioTrack = myStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      const videoTrack = myStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

        const screenVideoTrack = screenStream.getVideoTracks()[0];
        for (let peerId in peersRef.current) {
          const peer = peersRef.current[peerId];
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }
        }

        setMyStream(screenStream);
        myStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        screenVideoTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isAudioMuted });
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];

      if (isVideoMuted) cameraVideoTrack.enabled = false;

      for (let peerId in peersRef.current) {
        const peer = peersRef.current[peerId];
        const sender = peer.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraVideoTrack);
        }
      }

      setMyStream(cameraStream);
      myStreamRef.current = cameraStream;
      setIsScreenSharing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const leaveRoom = () => {
    navigate('/');

  };

  const sendMessage = (payload) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', payload);
    }
  };

  const raiseHand = () => {
    if (socketRef.current) {
      const next = !isHandRaised;
      setIsHandRaised(next);
      socketRef.current.emit('reaction', { type: next ? 'raise-hand' : 'lower-hand' });
    }
  };

  return (
    <div className="room-container">
      <div className="main-content">
        <VideoGrid 
          myStream={myStream} 
          participants={participants} 
          username={username} 
        />
        
        <Controls 
          isAudioMuted={isAudioMuted} toggleAudio={toggleAudio}
          isVideoMuted={isVideoMuted} toggleVideo={toggleVideo}
          isScreenSharing={isScreenSharing} toggleScreenShare={toggleScreenShare}
          isWhiteboardOpen={isWhiteboardOpen} toggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          isHandRaised={isHandRaised} raiseHand={raiseHand}
          leaveRoom={leaveRoom} toggleChat={() => setIsChatOpen(!isChatOpen)}
          roomId={roomId}
          participantCount={participants.length}
        />
      </div>

      {isWhiteboardOpen && (
        <Whiteboard 
          socket={socketRef.current} 
          onClose={() => setIsWhiteboardOpen(false)} 
        />
      )}

      {isChatOpen && (
        <ChatSidebar 
          messages={messages} 
          sendMessage={sendMessage} 
          currentUser={username}
          token={token}
        />
      )}
    </div>
  );
};

export default Room;
