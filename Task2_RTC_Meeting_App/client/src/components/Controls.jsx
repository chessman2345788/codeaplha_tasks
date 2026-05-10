import {
  Mic, MicOff, Video as VideoIcon, VideoOff,
  MonitorUp, PhoneOff, MessageSquare, PenTool, Hand, Users
} from 'lucide-react';

const Controls = ({
  isAudioMuted, toggleAudio,
  isVideoMuted, toggleVideo,
  isScreenSharing, toggleScreenShare,
  isWhiteboardOpen, toggleWhiteboard,
  isHandRaised, raiseHand,
  leaveRoom, toggleChat,
  roomId, participantCount,
}) => {
  return (
    <div className="controls-bar">
      {}
      <div className="room-info">
        <span className="room-info-label">Room ID</span>
        <span className="room-info-id">{roomId?.toUpperCase() || '—'}</span>
      </div>

      {}
      <div className="control-group">
        <button
          id="toggle-audio"
          className={`icon-btn ${isAudioMuted ? 'danger' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          id="toggle-video"
          className={`icon-btn ${isVideoMuted ? 'danger' : ''}`}
          onClick={toggleVideo}
          title={isVideoMuted ? 'Start Video' : 'Stop Video'}
        >
          {isVideoMuted ? <VideoOff size={22} /> : <VideoIcon size={22} />}
        </button>

        <div className="control-divider" />

        <button
          id="toggle-screen"
          className={`icon-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <MonitorUp size={22} />
        </button>

        <button
          id="toggle-whiteboard"
          className={`icon-btn ${isWhiteboardOpen ? 'active' : ''}`}
          onClick={toggleWhiteboard}
          title={isWhiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard'}
        >
          <PenTool size={22} />
        </button>

        <button
          id="raise-hand"
          className={`icon-btn ${isHandRaised ? 'active' : ''}`}
          onClick={raiseHand}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          style={isHandRaised ? { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)' } : undefined}
        >
          <Hand size={22} />
        </button>

        <div className="control-divider" />

        <button
          id="leave-room"
          className="icon-btn leave-btn"
          onClick={leaveRoom}
          title="Leave Meeting"
        >
          <PhoneOff size={22} />
        </button>
      </div>

      {}
      <div className="control-group">
        {participantCount !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.9rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}>
            <Users size={14} />
            {participantCount + 1}
          </div>
        )}
        <button
          id="toggle-chat"
          className="icon-btn"
          onClick={toggleChat}
          title="Toggle Chat"
        >
          <MessageSquare size={22} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
