import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Video, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
        await login(username, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="home-container bg-gradient-to-br from-bg-base via-[#0f121d] to-[#1a1c2e] min-h-screen relative flex items-center justify-center">
      <div className="home-card relative bg-bg-panel/80 backdrop-blur-2xl border border-white/10 shadow-ai hover:shadow-ai-hover transition-all duration-700">
        {}
        <div style={{ marginBottom: '2rem' }}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto mb-5 shadow-ai animate-glow">
            <Video size={28} color="white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300">RTC Meet</h1>
          <p style={{ marginTop: '0.4rem' }}>
            {isLogin ? 'Welcome back — sign in to continue' : 'Create your account to get started'}
          </p>
        </div>

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
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {}
        <form onSubmit={handleSubmit}>
          {}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <User
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              id="auth-username"
              type="text"
              placeholder="Username"
              className="input-field"
              style={{ paddingLeft: '2.75rem', marginBottom: 0 }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Lock
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 6 characters)"
              className="input-field"
              style={{ paddingLeft: '2.75rem', paddingRight: '3rem', marginBottom: 0 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            id="auth-submit"
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ marginBottom: '1.25rem', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <>
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-bright)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-bright)' }} />
        </div>

        <button
          id="auth-switch"
          type="button"
          className="btn btn-outline"
          onClick={switchMode}
          style={{ marginBottom: 0 }}
        >
          {isLogin ? 'Create Account' : 'Sign In Instead'}
        </button>

        {}
        <p style={{ fontSize: '0.75rem', marginTop: '1.75rem', color: 'var(--text-muted)' }}>
          🔒 End-to-end encrypted &nbsp;·&nbsp; No data stored
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Auth;
