import { useEffect, useState, useCallback } from 'react';
import { Gamepad2, Trophy, Calendar, Users, ChevronRight, Activity, Flame } from 'lucide-react';
import { getGameImage } from '../../utils/gameImages';
import { supabase } from '../../lib/supabase';
import { Game, Tournament } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';

interface HomePageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [pastTournaments, setPastTournaments] = useState<Tournament[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authRole, setAuthRole] = useState<'competitor' | 'organizer'>('competitor');

  const fetchTournaments = useCallback(async () => {
    let query = supabase
      .from('tournaments')
      .select('*, game:games(*), organizer:user_profiles(*), participants:tournament_participants(*)');

    if (selectedGame) {
      query = query.eq('game_id', selectedGame);
    }

    const { data } = await query;

    if (data) {
      const now = new Date();

      const upcoming = data.filter((t: any) =>
        t.status === 'registration_open' ||
        (t.status === 'pending' && new Date(t.start_date) > now)
      );

      const ongoing = data.filter((t: any) => t.status === 'running');
      const past = data.filter((t: any) => t.status === 'completed');

      setUpcomingTournaments(upcoming.slice(0, 4));
      setOngoingTournaments(ongoing.slice(0, 4));
      setPastTournaments(past.slice(0, 4));
    }
  }, [selectedGame]);

  const fetchGames = useCallback(async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) setGames(data);
  }, []);

  useEffect(() => {
    fetchGames();
    fetchTournaments();
  }, [fetchGames, fetchTournaments]);

  const [teamsSummary, setTeamsSummary] = useState<{ total: number; top: any[] }>({ total: 0, top: [] });

  useEffect(() => {
    const fetchTeamsSummary = async () => {
      const { count } = await supabase.from('teams').select('id', { count: 'exact', head: true });
      const total = typeof count === 'number' ? count : 0;

      const { data: topData } = await supabase.from('team_statistics').select('*, team:teams(*, game:games(*))').order('total_wins', { ascending: false }).limit(3);
      setTeamsSummary({ total, top: topData || [] });
    };

    fetchTeamsSummary();
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup', role: 'competitor' | 'organizer') => {
    setAuthMode(mode);
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'running':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'completed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Epic Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-bounce">
              <Flame size={16} className="text-blue-400 fill-blue-400" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                The Next Generation of Esports
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">
              Compete <span className="text-blue-500">Win</span> <br />
              <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">Dominate</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-medium leading-relaxed">
              Arena is the premier destination for competitive gaming. Join thousands of players, build your legacy, and rise to the top of the leaderboards.
            </p>

            {!user && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button
                  onClick={() => openAuthModal('signup', 'competitor')}
                  className="group relative px-10 py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-tighter italic text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-600/20"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <span className="relative flex items-center gap-3">
                    Start Playing <ChevronRight size={24} />
                  </span>
                </button>
                <button
                  onClick={() => openAuthModal('signup', 'organizer')}
                  className="group px-8 py-4 bg-slate-900 border border-white/10 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95"
                >
                  <span className="relative flex items-center gap-2">
                    <Calendar size={20} className="text-slate-400" />
                    Host a Tournament
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Game Selection Grid */}
        <div className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Gamepad2 size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Choose Your Game</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Select to filter tournaments</p>
              </div>
            </div>
            {selectedGame && (
              <button
                onClick={() => setSelectedGame(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-slate-400 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id === selectedGame ? null : game.id)}
                className={`group relative aspect-[4/5] rounded-2xl overflow-hidden transition-all duration-300 ${
                  selectedGame === game.id
                    ? 'ring-4 ring-blue-500 scale-105 z-10'
                    : 'hover:scale-105 hover:z-10'
                }`}
              >
                <img
                  src={game.icon_url || getGameImage(game.short_name || game.name)}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <p className="text-white font-black uppercase italic text-lg leading-none mb-1">{game.short_name}</p>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{game.platform}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Now Section (High Priority) */}
        <TournamentSection
          title="Live Now"
          subtitle="Watch and follow ongoing battles"
          icon={Activity}
          tournaments={ongoingTournaments}
          onNavigate={onNavigate}
          getStatusColor={getStatusColor}
          formatStatus={formatStatus}
          accent="red"
        />

        {/* Registration Section */}
        <TournamentSection
          title="Join the Fight"
          subtitle="Upcoming tournaments open for registration"
          icon={Trophy}
          tournaments={upcomingTournaments}
          onNavigate={onNavigate}
          getStatusColor={getStatusColor}
          formatStatus={formatStatus}
          accent="blue"
        />

        {/* Top Teams Section */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Users size={24} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Top Franchises</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Global Ranking Leaderboard</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('teams')}
              className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
            >
              <span className="text-sm font-bold text-slate-300">View Rankings</span>
              <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamsSummary.top.map((t: any, index: number) => (
              <div 
                key={t.team.id} 
                className="group relative bg-slate-900/50 border border-white/5 p-6 rounded-3xl hover:border-amber-500/30 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6">
                  <span className="text-6xl font-black text-white/5 italic">#{index + 1}</span>
                </div>
                
                <div className="flex flex-col gap-6 relative">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20" />
                      {t.team.logo_url ? (
                        <img src={t.team.logo_url} className="w-16 h-16 object-cover rounded-2xl border-2 border-white/10 relative z-10" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center relative z-10">
                          <Trophy size={24} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase italic text-white group-hover:text-amber-400 transition-colors">
                        {t.team.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        {t.team.game?.short_name || 'Global'} Team
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Wins</p>
                      <p className="text-2xl font-black text-white italic">{t.total_wins || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Win Rate</p>
                      <p className="text-2xl font-black text-white italic">
                        {((t.win_rate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Events */}
        <div className="mt-32">
          <TournamentSection
            title="Archives"
            subtitle="Relive the greatest moments"
            icon={Calendar}
            tournaments={pastTournaments}
            onNavigate={onNavigate}
            getStatusColor={getStatusColor}
            formatStatus={formatStatus}
            accent="slate"
          />
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </div>
  );
}

interface TournamentSectionProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tournaments: Tournament[];
  onNavigate: (page: string, data?: unknown) => void;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => string;
  accent: 'blue' | 'red' | 'slate';
}

function TournamentSection({ 
  title, 
  subtitle, 
  icon: Icon, 
  tournaments, 
  onNavigate, 
  getStatusColor, 
  formatStatus,
  accent 
}: TournamentSectionProps) {
  if (tournaments.length === 0) return null;

  const accentColors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/20',
    slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20 shadow-slate-500/20'
  };

  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${accentColors[accent].split(' ')[1]} ${accentColors[accent].split(' ')[2]}`}>
            <Icon size={24} className={accentColors[accent].split(' ')[0]} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">{title}</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('tournaments')}
          className="group flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-all"
        >
          <span className="text-sm font-bold text-slate-400 group-hover:text-white">See More</span>
          <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tournaments.map((tournament) => (
          <button
            key={tournament.id}
            onClick={() => onNavigate('tournament-detail', tournament.id)}
            className="group relative bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50 text-left"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={tournament.banner_url || 'https://community.skin.club/wp-content/uploads/2025/09/cs2.jpg.webp'}
                alt={tournament.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${getStatusColor(tournament.status)}`}>
                  {formatStatus(tournament.status)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-black uppercase tracking-tighter italic text-white mb-4 line-clamp-1 group-hover:text-blue-400 transition-colors">
                {tournament.name}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                    <Gamepad2 size={12} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">{tournament.game?.name}</span>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Combatants</span>
                    <span className="text-xs font-black text-white uppercase italic">{tournament.current_participants} / {tournament.max_participants}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Prize</span>
                    <span className="text-xs font-black text-amber-400 uppercase italic">{tournament.prize_pool || 'Trophy'}</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
