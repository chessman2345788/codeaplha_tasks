import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Lock, LogOut, Plus, ArrowRight, Zap } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const authenticateAndJoin = async (targetRoomId) => {
    if (!password) return setError('Room password is required');
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/join', {
        roomId: targetRoomId,
        password,
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const { sessionToken, role } = response.data;
      navigate(`/room/${targetRoomId}`, {
        state: { token: sessionToken, username: user.username, role },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join or create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = () => {
    setError('');
    if (!password) return setError('Set a password to create a secure room');
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    authenticateAndJoin(newRoomId);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setError('');
    if (!roomId.trim()) return setError('Please enter a Room ID');
    authenticateAndJoin(roomId.trim().toLowerCase());
  };

  return (
    <div className="home-container bg-gradient-to-br from-bg-base via-[#0f121d] to-[#1a1c2e] min-h-screen relative flex items-center justify-center">
      <div className="home-card relative bg-bg-panel/80 backdrop-blur-2xl border border-white/10 shadow-ai hover:shadow-ai-hover transition-all duration-700">
        {}
        <div style={{ marginBottom: '2rem' }}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto mb-5 shadow-ai animate-glow">
            <Video size={28} color="white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300">RTC Dashboard</h1>
          <p style={{ marginTop: '0.4rem' }}>Welcome back, <strong style={{ color: 'var(--accent-bright)' }}>{user.username}</strong></p>
        </div>

        {}
        <button
          id="logout-btn"
          onClick={logout}
          title="Sign Out"
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'var(--danger-subtle)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '50%',
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fca5a5', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-subtle)'; e.currentTarget.style.color = '#fca5a5'; }}
        >
          <LogOut size={15} />
        </button>

        {}
        {error && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.875rem',
          }}>
            ⚠ {error}
          </div>
        )}

        {}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Lock
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            id="room-password"
            type="password"
            placeholder="Set or enter room password"
            className="input-field"
            style={{ paddingLeft: '2.75rem', marginBottom: 0 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {}
        <button
          id="create-room-btn"
          onClick={handleCreateRoom}
          className="btn btn-primary"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          <Plus size={18} />
          Create Secure Meeting
        </button>

        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-bright)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>or join existing</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-bright)' }} />
        </div>

        {}
        <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: '0.6rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Users
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              id="room-id-input"
              type="text"
              placeholder="Room ID (e.g. AB12CD)"
              className="input-field"
              style={{ paddingLeft: '2.75rem', marginBottom: 0, textTransform: 'uppercase' }}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
          <button
            id="join-room-btn"
            type="submit"
            className="btn btn-outline"
            disabled={isLoading}
            style={{ width: 'auto', padding: '0.9rem 1.25rem', marginBottom: 0, flexShrink: 0 }}
          >
            Join <ArrowRight size={16} />
          </button>
        </form>

        {}
        <div className="mt-8 flex justify-center gap-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-500">
          {[
            { icon: '🎥', label: 'HD Video' },
            { icon: '💬', label: 'Live Chat' },
            { icon: '🖊️', label: 'Whiteboard' },
            { icon: '📁', label: 'File Share' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{icon}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
