import { useState } from 'react';
import { 
  Users, Plus, ChevronRight, Trophy, 
  Gamepad2, Search, Mail, Check, X 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { useGames } from '../../hooks/useGames';
import { useUserInvites, useInviteMutations } from '../../hooks/useTeamInvites';
import TeamManagementModal from './TeamManagementModal';

interface TeamsDashboardProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function TeamsDashboard({ onNavigate }: TeamsDashboardProps) {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: games = [] } = useGames();
  const { data: teams = [], isLoading } = useTeams(selectedGame);
  const { data: userInvites = [] } = useUserInvites(user?.id);
  const { respondToInvite } = useInviteMutations();

  const filteredTeams = teams.filter((t: any) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 selection:bg-blue-500/30">
      {/* Hero Section */}
      <div className="relative pt-12 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <Users size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Global Franchises</span>
              </div>
              <h1 className="text-5xl font-black uppercase tracking-tighter italic">World <span className="text-blue-500">Elite</span> Teams</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Discover, join, or lead the next legendary roster</p>
            </div>

            {user && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-tighter italic text-lg transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-blue-500/20"
              >
                <Plus size={24} />
                Establish Franchise
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pending Invites Section */}
        {user && userInvites.length > 0 && (
          <div className="mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="text-blue-500" size={20} />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Draft Invitations</h2>
              <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full animate-pulse">
                {userInvites.length} NEW
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userInvites.map((invite: any) => (
                <div key={invite.id} className="relative group bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 transition-all hover:bg-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {invite.team?.logo_url ? (
                        <img src={invite.team.logo_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Users size={16} className="text-slate-600" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-black uppercase italic text-sm tracking-tight">{invite.team?.name}</h4>
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{invite.team?.game?.short_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToInvite.mutate({ inviteId: invite.id, status: 'accepted' })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => respondToInvite.mutate({ inviteId: invite.id, status: 'rejected' })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text"
              placeholder="Search teams by name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
            />
          </div>

          <div className="flex gap-4">
             <div className="relative">
                <Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-bold uppercase tracking-widest text-xs text-white"
                >
                  <option value="">All Disciplines</option>
                  {games.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.short_name}</option>
                  ))}
                </select>
             </div>
          </div>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team: any) => (
              <button
                key={team.id}
                onClick={() => onNavigate('team-profile', team.id)}
                className="group relative bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 text-left transition-all duration-300 hover:border-blue-500/30 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-colors" />
                
                <div className="relative flex flex-col h-full gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="w-20 h-20 object-cover rounded-2xl border-2 border-white/10 relative z-10 shadow-2xl"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border-2 border-white/10 flex items-center justify-center relative z-10">
                          <Users size={32} className="text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-black text-blue-400 uppercase tracking-widest italic">
                          {team.tag}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic group-hover:text-blue-400 transition-colors">
                        {team.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4 border-y border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Discipline</span>
                      <span className="text-xs font-bold text-white uppercase">{team.game?.short_name || 'Multi-Game'}</span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Region</span>
                      <span className="text-xs font-bold text-white uppercase">{team.region || 'Global'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                       <Trophy size={16} className="text-amber-500" />
                       <span className="text-xs font-black italic uppercase text-slate-400 group-hover:text-white transition-colors">Elite Status</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && filteredTeams.length === 0 && (
          <div className="text-center py-32 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
            <Users size={64} className="text-slate-800 mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-500">No teams found</h2>
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mt-2">Try adjusting your filters or establish a new franchise</p>
          </div>
        )}
      </div>

      <TeamManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          // Query client will automatically handle refetch via mutation (to be implemented)
        }}
      />
    </div>
  );
}

