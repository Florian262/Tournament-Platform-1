import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: 'competitor' | 'organizer';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin', initialRole = 'competitor' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<'competitor' | 'organizer'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await signUp(email, password, username, role);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 overflow-y-auto flex items-start sm:items-center justify-center">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-md w-full p-8 relative shadow-2xl shadow-blue-500/20 max-h-[calc(100vh-96px)] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2">
          {mode === 'signin' ? 'Welcome Back' : 'Join the Arena'}
        </h2>
        <p className="text-slate-400 mb-6">
          {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
        </p>

        {mode === 'signup' && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole('competitor')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                role === 'competitor'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Competitor
            </button>
            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                role === 'organizer'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Organizer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4">
          <div className="text-center text-slate-400 mb-2">or continue with</div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signInWithOAuth({ provider: 'google' });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'OAuth error');
                }
              }}
              className="w-full px-4 py-2 bg-white text-slate-900 rounded-lg flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/devrel-devsite/prod/vb5e1b3a0a3db8a6a6f0e6b3f7f6b3ceb9b2a2c3b6f4a1b2c3d4e5f6/logo-goog.png" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
