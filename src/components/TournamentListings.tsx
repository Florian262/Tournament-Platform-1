import { Filter, Users, Calendar, MapPin, Trophy, Search, X, ChevronRight, LayoutGrid } from 'lucide-react';
import { getGameImage } from '../utils/gameImages';
import { useTournaments } from '../hooks/useTournaments';
import { useGames } from '../hooks/useGames';
import { useTournamentStore } from '../store/useTournamentStore';

interface TournamentListingsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function TournamentListings({ onNavigate }: TournamentListingsProps) {
  const { 
    filters, 
    setFilter, 
    clearFilters, 
    showMobileFilters, 
    setShowMobileFilters 
  } = useTournamentStore();

  const { data: games = [] } = useGames();
  const { data: tournaments = [], isLoading: loading } = useTournaments({
    gameId: filters.gameId,
    status: filters.status,
    region: filters.region,
    platform: filters.platform,
    searchQuery: filters.search,
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilter(key, value);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'running':
        return 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
      case 'completed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const formatStatus = (status: string) => {
    switch(status) {
      case 'registration_open': return 'Open';
      case 'running': return 'Live';
      case 'completed': return 'Finished';
      default: return 'Upcoming';
    }
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 selection:bg-blue-500/30">
      {/* Hero Header */}
      <div className="relative pt-12 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <Trophy size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Competition Hub</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
                Active <span className="text-blue-500 text-glow-blue">Tournaments</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4 max-w-md leading-relaxed">
                Compete with the best players and teams globally in premier professional events.
              </p>
            </div>

            <div className="flex-1 max-w-xl">
               <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden mb-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] italic hover:bg-white/10 transition-all"
        >
          <Filter size={18} />
          {showMobileFilters ? 'Hide filters' : 'Show filters'}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`${showMobileFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 sticky top-28 overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 italic">
                  <LayoutGrid size={16} className="text-blue-500" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <X size={12} />
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Game</label>
                  <select
                    value={filters.gameId}
                    onChange={(e) => handleFilterChange('gameId', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">All games</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Platform</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">All platforms</option>
                    {['PC', 'Console', 'Mobile', 'Cross-Platform'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Status</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'registration_open', label: 'Open' },
                      { id: 'running', label: 'Live' },
                      { id: 'pending', label: 'Upcoming' },
                      { id: 'completed', label: 'Finished' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleFilterChange('status', filters.status === s.id ? '' : s.id)}
                        className={`text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          filters.status === s.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Tournament Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-80 bg-white/5 rounded-[2.5rem] animate-pulse" />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-32 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <Trophy size={64} className="text-slate-800 mx-auto mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-500">No events found</h2>
                <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mt-2">Adjust your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => onNavigate('tournament-detail', tournament.id)}
                    className="group relative bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 text-left flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={tournament.banner_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={tournament.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      
                      {/* Status Badge */}
                      <div className="absolute top-6 right-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border backdrop-blur-md shadow-2xl ${getStatusStyle(tournament.status)}`}>
                          {formatStatus(tournament.status)}
                        </span>
                      </div>

                      {/* Game Icon */}
                      <div className="absolute bottom-6 left-6 flex items-center gap-4">
                        <div className="p-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                          <img
                            src={tournament.game?.icon_url || getGameImage(tournament.game?.name || tournament.game?.short_name)}
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest italic">
                              {tournament.game?.short_name}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-tight">
                            {tournament.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Region</span>
                          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                            <MapPin size={14} className="text-blue-500" />
                            {tournament.region || 'Global'}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Participants</span>
                          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                            <Users size={14} className="text-blue-500" />
                            {tournament.current_participants} / {tournament.max_participants}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Starts</span>
                          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                            <Calendar size={14} className="text-blue-500" />
                            {new Date(tournament.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Prize Pool</span>
                          <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase italic">
                            <Trophy size={14} />
                            {tournament.prize_pool || 'No prize'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between group/btn">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/btn:text-blue-400 transition-colors italic">View details</span>
                         <ChevronRight size={20} className="text-slate-700 group-hover/btn:text-blue-500 group-hover/btn:translate-x-2 transition-all" />
                      </div>
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
