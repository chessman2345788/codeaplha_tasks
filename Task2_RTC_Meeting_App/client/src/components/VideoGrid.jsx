import { useEffect, useRef } from 'react';
import { VideoOff } from 'lucide-react';

const VideoParticipant = ({ stream, name, muted, mirrored }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-card">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="video-element"
          style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        <div className="video-placeholder">
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '2px dashed rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <VideoOff size={22} color="var(--text-muted)" />
          </div>
          <span>{name}</span>
        </div>
      )}
      <div className="video-badge">{name}</div>
    </div>
  );
};

const VideoGrid = ({ myStream, participants, username }) => {
  return (
    <div className="video-area">
      <div className="video-grid">
        {}
        <VideoParticipant
          stream={myStream}
          name={`${username} (You)`}
          muted={true}
          mirrored={true}
        />

        {}
        {participants.map((peer) => (
          <VideoParticipant
            key={peer.id}
            stream={peer.stream}
            name={peer.name || 'Participant'}
            muted={false}
            mirrored={false}
          />
        ))}

        {}
        {participants.length === 0 && (
          <VideoParticipant
            stream={null}
            name="Waiting for others to join..."
            muted={true}
            mirrored={false}
          />
        )}
      </div>
    </div>
  );
};

export default VideoGrid;
