import { useEffect, useState } from 'react';
import { Gamepad2, Trophy, Calendar, Users, ChevronRight, MapPin } from 'lucide-react';
import { getGameImage } from '../utils/gameImages';
import { formatInUserTZ, relativeTimeFromNow } from '../utils/time';
import { supabase } from '../lib/supabase';
import { Game, Tournament } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

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

  useEffect(() => {
    fetchGames();
    fetchTournaments();
  }, [selectedGame]);

  const [teamsSummary, setTeamsSummary] = useState<{ total: number; top: any[] }>({ total: 0, top: [] });

  useEffect(() => {
    fetchTeamsSummary();
  }, []);

  const fetchTeamsSummary = async () => {
    const { count } = await supabase.from('teams').select('id', { count: 'exact', head: true });
    const total = typeof count === 'number' ? count : 0;

    const { data: topData } = await supabase.from('team_statistics').select('*, team:teams(*, game:games(*))').order('total_wins', { ascending: false }).limit(3);
    setTeamsSummary({ total, top: topData || [] });
  };

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) setGames(data);
  };

  const fetchTournaments = async () => {
    let query = supabase
      .from('tournaments')
      .select('*, game:games(*), organizer:user_profiles(*), participants:tournament_participants(*)');

    if (selectedGame) {
      query = query.eq('game_id', selectedGame);
    }

    const { data } = await query;

    if (data) {
      const now = new Date();

      const upcoming = data.filter(t =>
        t.status === 'registration_open' ||
        (t.status === 'pending' && new Date(t.start_date) > now)
      );

      const ongoing = data.filter(t => t.status === 'running');

      const past = data.filter(t => t.status === 'completed');

      setUpcomingTournaments(upcoming.slice(0, 4));
      setOngoingTournaments(ongoing.slice(0, 4));
      setPastTournaments(past.slice(0, 4));
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup', role: 'competitor' | 'organizer') => {
    setAuthMode(mode);
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'running':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'completed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Compete in the
              <span className="block bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Ultimate Arena
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join tournaments, compete with the best, and claim victory in your favorite esports titles
            </p>

            {!user && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => openAuthModal('signup', 'competitor')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/40 flex items-center gap-2"
                >
                  <Trophy size={20} />
                  Start Competing
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => openAuthModal('signup', 'organizer')}
                  className="group px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/40 flex items-center gap-2"
                >
                  <Calendar size={20} />
                  Organize Events
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gamepad2 size={28} className="text-blue-500" />
                Select Your Game
              </h2>
              {selectedGame && (
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id === selectedGame ? null : game.id)}
                  className={`group relative aspect-square rounded-xl overflow-hidden transition-all ${
                    selectedGame === game.id
                      ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/50'
                      : 'hover:ring-2 hover:ring-blue-400/50'
                  }`}
                >
                  <img
                    src={game.icon_url || getGameImage(game.short_name || game.name)}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center p-3">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{game.short_name}</p>
                      <p className="text-xs text-slate-300">{game.platform}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <TournamentSection
            title="Registration Open"
            icon={Users}
            tournaments={upcomingTournaments}
            onNavigate={onNavigate}
            getStatusColor={getStatusColor}
            formatStatus={formatStatus}
          />

          <TournamentSection
            title="Live Now"
            icon={Trophy}
            tournaments={ongoingTournaments}
            onNavigate={onNavigate}
            getStatusColor={getStatusColor}
            formatStatus={formatStatus}
          />

          <TournamentSection
            title="Past Tournaments"
            icon={Calendar}
            tournaments={pastTournaments}
            onNavigate={onNavigate}
            getStatusColor={getStatusColor}
            formatStatus={formatStatus}
          />

          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users size={28} className="text-blue-500" />
                All Teams
              </h2>
              <button
                onClick={() => onNavigate('teams')}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                View All Teams
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-500/20">
              <p className="text-slate-300 mb-4">Total teams: <span className="font-bold text-white">{teamsSummary.total}</span></p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teamsSummary.top.map((t) => (
                  <div key={t.team.id} className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {t.team.logo_url ? (
                        <img src={t.team.logo_url} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-lg" />
                      )}
                      <div>
                        <div className="font-bold text-white">{t.team.name}</div>
                        <div className="text-slate-400 text-sm">Wins: {t.total_wins || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
  icon: React.ElementType;
  tournaments: Tournament[];
  onNavigate: (page: string, data?: unknown) => void;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => string;
}

function TournamentSection({ title, icon: Icon, tournaments, onNavigate, getStatusColor, formatStatus }: TournamentSectionProps) {
  if (tournaments.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon size={28} className="text-blue-500" />
          {title}
        </h2>
        <button
          onClick={() => onNavigate('tournaments')}
          className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tournaments.map((tournament) => (
          <button
            key={tournament.id}
            onClick={() => onNavigate('tournament-detail', tournament.id)}
            className="group bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-left"
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={tournament.banner_url || 'https://community.skin.club/wp-content/uploads/2025/09/cs2.jpg.webp'}
                alt={tournament.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tournament.status)}`}>
                  {formatStatus(tournament.status)}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                {tournament.name}
              </h3>

              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Gamepad2 size={14} />
                  <span>{tournament.game?.name}</span>
                </div>
                {tournament.region && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{tournament.region}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{(tournament as any).participants?.length ?? tournament.current_participants}/{tournament.max_participants} Participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{formatInUserTZ(tournament.start_date)}</span>
                </div>
                  <div className="text-sm text-slate-400">{relativeTimeFromNow(tournament.start_date)}</div>
                </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
