import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trophy, User, LogOut, Plus, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface NavbarProps {
  onNavigate: (page: string, data?: unknown) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authRole, setAuthRole] = useState<'competitor' | 'organizer'>('competitor');

  const openAuthModal = (mode: 'signin' | 'signup', role: 'competitor' | 'organizer') => {
    setAuthMode(mode);
    setAuthRole(role);
    setShowAuthModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-blue-500/20 shadow-lg shadow-blue-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
              >
                <Trophy size={28} className="text-blue-500" />
                <span className="font-bold text-xl">Arena</span>
              </button>

              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => onNavigate('home')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'home'
                      ? 'text-blue-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => onNavigate('tournaments')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'tournaments'
                      ? 'text-blue-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Tournaments
                </button>
                <button
                  onClick={() => onNavigate('teams')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'teams'
                      ? 'text-blue-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Teams
                </button>
                <button
                  onClick={() => onNavigate('player-search')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'player-search'
                      ? 'text-blue-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Find Players
                </button>
                {profile?.role === 'organizer' && (
                  <button
                    onClick={() => onNavigate('create-tournament')}
                    className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                    Create Tournament
                  </button>
                )}
                {profile?.role === 'admin' && (
                  <button
                    onClick={() => onNavigate('admin-dashboard')}
                    className="flex items-center gap-1 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Shield size={16} />
                    Admin
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openAuthModal('signup', 'competitor')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/30 text-sm"
                  >
                    Play
                  </button>
                  <button
                    onClick={() => openAuthModal('signup', 'organizer')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-500/30 text-sm"
                  >
                    Organize
                  </button>
                  <button
                    onClick={() => openAuthModal('signin', 'competitor')}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('player-profile', profile?.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg hover:opacity-95 transition-all"
                    title="View profile"
                  >
                    <User size={16} className="text-blue-400" />
                    <span className="text-sm text-white font-medium">
                      {profile?.username}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      profile?.role === 'organizer'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {profile?.role}
                    </span>
                  </button>
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => onNavigate('admin-dashboard')}
                      className="p-2 ml-1 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-all"
                      title="Admin"
                    >
                      <Shield size={16} />
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      try {
                          await signOut();
                        } catch (err: any) {
                          console.error('Sign out error', err);
                          toast.error(err?.message || 'Sign out failed');
                        } finally {
                        // ensure redirect to homepage immediately
                        try {
                          onNavigate('home');
                        } catch (_) {}
                        // hard redirect as a fallback
                        try { window.location.href = '/'; } catch (_) {}
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </>
  );
}
