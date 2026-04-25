import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Shield, Users, Mail, Lock, User as UserIcon, ArrowRight, Trophy } from 'lucide-react';
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-4 flex items-center justify-center animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-lg w-full relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Background Accent Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Header Controls */}
        <div className="relative z-20 p-6 sm:p-8 flex items-center justify-end border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-all hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div className="p-8 sm:p-12 pt-4 sm:pt-4">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <Shield size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Secure access</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
                {mode === 'signin' ? <>Sign in to <span className="text-blue-500">Arena</span></> : <>Join the <span className="text-blue-500">League</span></>}
              </h2>
            </div>

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                  type="button"
                  onClick={() => setRole('competitor')}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
                    role === 'competitor'
                      ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Users size={20} className={role === 'competitor' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${role === 'competitor' ? 'text-white' : 'text-slate-400'}`}>Player</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
                    role === 'organizer'
                      ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Trophy size={20} className={role === 'organizer' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${role === 'organizer' ? 'text-white' : 'text-slate-400'}`}>Organizer</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="Username"
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="Email address"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest italic text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? 'Processing...' : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">or continue with</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signInWithOAuth({ provider: 'google' });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'OAuth error');
                  }
                }}
                className="w-full px-4 py-4 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] italic hover:scale-[1.02] transition-all active:scale-95"
              >
                <img src="https://www.gstatic.com/devrel-devsite/prod/vb5e1b3a0a3db8a6a6f0e6b3f7f6b3ceb9b2a2c3b6f4a1b2c3d4e5f6/logo-goog.png" alt="Google" className="w-5 h-5" />
                Google login
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                }}
                className="text-slate-500 hover:text-blue-400 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
