import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  Menu, X, Trophy, Users, Search, Shield, 
  LogOut, LayoutDashboard, Plus,
  Bell, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import AuthModal from './AuthModal';
import Avatar from './Avatar';

interface NavbarProps {
  onNavigate: (page: string, data?: unknown) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authRole, setAuthRole] = useState<'competitor' | 'organizer'>('competitor');

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup', role: 'competitor' | 'organizer') => {
    setAuthMode(mode);
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const navItems = [
    { name: 'Tournaments', icon: Trophy, id: 'tournaments' },
    { name: 'Teams', icon: Users, id: 'teams' },
    { name: 'Scouting', icon: Search, id: 'players' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
      // Remove the immediate window.location.href = '/' to prevent white flash
    } catch (err: any) {
      toast.error(err?.message || 'Sign out failed');
    }
  };

  const handleNotificationClick = (n: any) => {
    markAsRead.mutate(n.id);
    if (n.link) {
      if (n.link.startsWith('team-profile/')) onNavigate('team-profile', n.link.split('/')[1]);
      else if (n.link.startsWith('tournament-detail/')) onNavigate('tournament-detail', n.link.split('/')[1]);
    }
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invite': return <Users size={14} className="text-blue-400" />;
      case 'match_update': return <Activity size={14} className="text-amber-400" />;
      case 'tournament_update': return <Trophy size={14} className="text-emerald-400" />;
      default: return <Bell size={14} className="text-slate-400" />;
    }
  };

  return (
    <nav className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'py-3' : 'py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative flex items-center justify-between px-6 py-2 rounded-[2rem] transition-all duration-500 ${
          isScrolled 
            ? 'bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl' 
            : 'bg-transparent border border-transparent'
        }`}>
          
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="group flex items-center gap-3 relative focus:outline-none"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all">
                <Trophy className="text-white" size={24} />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none">
                ARENA<span className="text-blue-500">.</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none mt-1">
                Elite Esports
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-6 py-3 rounded-xl flex items-center gap-2 group transition-all ${
                  currentPage === item.id 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {currentPage === item.id && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl animate-in fade-in duration-300" />
                )}
                <item.icon size={16} className={currentPage === item.id ? 'text-blue-400' : 'group-hover:text-blue-400 transition-colors'} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{item.name}</span>
                {currentPage === item.id && (
                  <div className="absolute -bottom-1 left-6 right-6 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    className={`p-3 rounded-2xl border transition-all active:scale-95 ${
                      showNotifications ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                      <div className="p-4 flex items-center justify-between border-b border-white/5 mb-2">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => markAllAsRead.mutate()}
                            className="text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center">
                            <Bell size={32} className="text-slate-800 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {notifications.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`w-full p-4 rounded-2xl transition-all text-left flex items-start gap-4 group ${
                                  n.is_read ? 'opacity-50 hover:bg-white/5' : 'bg-white/5 border border-white/5 hover:border-blue-500/30'
                                }`}
                              >
                                <div className="mt-1 p-2 rounded-lg bg-slate-950 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                  {getNotificationIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-white uppercase italic truncate">{n.title}</p>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-1 line-clamp-2">{n.message}</p>
                                  <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mt-2">{new Date(n.created_at).toLocaleTimeString()}</p>
                                </div>
                                {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {profile?.role === 'organizer' && (
                  <button
                    onClick={() => onNavigate('create-tournament')}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase italic tracking-widest"
                  >
                    <Plus size={16} /> Host
                  </button>
                )}

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group"
                  >
                    <Avatar src={profile?.avatar_url} username={profile?.username || user.email} size={32} />
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-blue-400 transition-colors">
                        {profile?.username || 'Profile'}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${
                        profile?.role === 'admin' ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {profile?.role || 'Guest'}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-4 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                      <div className="p-4 border-b border-white/5 mb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account</p>
                        <p className="text-xs font-bold text-white mt-1 truncate">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => { onNavigate('player-profile', user.id); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-left"
                      >
                        <LayoutDashboard size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">My Profile</span>
                      </button>

                      {profile?.role === 'admin' && (
                        <button
                          onClick={() => { onNavigate('admin-dashboard'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-left"
                        >
                          <Shield size={18} className="text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest italic">Admin Panel</span>
                        </button>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all text-left mt-2"
                      >
                        <LogOut size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAuthModal('signin', 'competitor')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup', 'competitor')}
                  className="group relative flex items-center gap-2 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest italic text-[10px] transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-blue-500/20"
                >
                  Join Now
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 text-slate-400 hover:text-white transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setIsOpen(false); }}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-left"
                >
                  <item.icon size={20} />
                  <span className="text-xs font-black uppercase tracking-[0.2em] italic">{item.name}</span>
                </button>
              ))}
              <div className="h-px bg-white/5 my-4" />
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all text-left"
                >
                  <LogOut size={20} />
                  <span className="text-xs font-black uppercase tracking-[0.2em] italic">Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => { openAuthModal('signin', 'competitor'); setIsOpen(false); }}
                  className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest italic text-xs transition-all active:scale-95"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </nav>
  );
}
