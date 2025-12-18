import { useEffect, useState } from 'react';
import { Filter, Gamepad2, Users, Calendar, MapPin, Trophy, Search, X } from 'lucide-react';
import { getGameImage } from '../utils/gameImages';
import { supabase } from '../lib/supabase';
import { Game, Tournament } from '../types';

interface TournamentListingsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function TournamentListings({ onNavigate }: TournamentListingsProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    gameId: '',
    platform: '',
    region: '',
    status: '',
    search: '',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [filters]);

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) setGames(data);
  };

  const fetchTournaments = async () => {
    setLoading(true);

    let query = supabase
      .from('tournaments')
      .select('*, game:games(*), organizer:user_profiles(*)');

    if (filters.gameId) {
      query = query.eq('game_id', filters.gameId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data } = await query.order('start_date', { ascending: false });

    if (data) {
      let filtered = data;

      if (filters.platform && data) {
        filtered = data.filter(t => t.game?.platform === filters.platform);
      }

      setTournaments(filtered);
    }

    setLoading(false);
  };

  const clearFilters = () => {
    setFilters({
      gameId: '',
      platform: '',
      region: '',
      status: '',
      search: '',
    });
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

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Trophy size={36} className="text-blue-500" />
            Browse Tournaments
          </h1>
          <p className="text-slate-300">
            Find and join tournaments across all your favorite games
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-xl text-white hover:bg-slate-800/50 transition-colors"
        >
          <Filter size={20} />
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        <div className="flex gap-6">
          <aside className={`${showMobileFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter size={20} />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Game
                  </label>
                  <select
                    value={filters.gameId}
                    onChange={(e) => setFilters({ ...filters, gameId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Games</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Platforms</option>
                    <option value="PC">PC</option>
                    <option value="Console">Console</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Cross-Platform">Cross-Platform</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Region
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Regions</option>
                    <option value="NA">North America</option>
                    <option value="EU">Europe</option>
                    <option value="ASIA">Asia</option>
                    <option value="OCE">Oceania</option>
                    <option value="SA">South America</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="running">Live Now</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Upcoming</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-slate-400 mt-4">Loading tournaments...</p>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl">
                <Trophy size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No tournaments found</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => onNavigate('tournament-detail', tournament.id)}
                    className="group bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-left"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={tournament.banner_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={tournament.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tournament.status)}`}>
                          {formatStatus(tournament.status)}
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <img
                          src={tournament.game?.icon_url || getGameImage(tournament.game?.name || tournament.game?.short_name)}
                          alt={tournament.game?.name}
                          className="w-12 h-12 rounded-lg border-2 border-white/20 object-cover"
                        />
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {tournament.name}
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Gamepad2 size={16} />
                          <span className="truncate">{tournament.game?.name}</span>
                        </div>
                        {tournament.region && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{tournament.region}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{tournament.current_participants}/{tournament.max_participants}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {tournament.prize_pool && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-yellow-400 font-semibold flex items-center gap-2">
                            <Trophy size={16} />
                            {tournament.prize_pool}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
