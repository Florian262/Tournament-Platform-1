import { useState } from 'react';
import { 
  Search, UserPlus, Shield, 
  Star, Users, Plus, X,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserTeams } from '../../hooks/useTeams';
import { useInviteMutations } from '../../hooks/useTeamInvites';
import { useScoutingPosts, useScoutingMutations } from '../../hooks/useProScouting';
import { useGames } from '../../hooks/useGames';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

interface ScoutingHubProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function ScoutingHub({ onNavigate }: ScoutingHubProps) {
  const { user } = useAuth();
  const { data: ownedTeams = [] } = useUserTeams(user?.id);
  const { data: games = [] } = useGames();
  const { requestToJoin } = useInviteMutations();
  const { createPost, deletePost } = useScoutingMutations();
  
  const [activeTab, setActiveTab] = useState<'players' | 'vacancies'>('players');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: posts = [], isLoading: loadingPosts } = useScoutingPosts(
    activeTab === 'players' ? 'player_looking' : 'team_vacancy',
    selectedGame
  );

  const [newPost, setNewPost] = useState({
    type: 'player_looking' as any,
    game_id: '',
    team_id: '',
    description: '',
    roles: [] as string[]
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createPost.mutateAsync({
        ...newPost,
        team_id: newPost.type === 'team_vacancy' ? newPost.team_id : null,
        user_id: user.id,
        status: 'active'
      });
      setShowCreateModal(false);
      setNewPost({ type: 'player_looking', game_id: '', team_id: '', description: '', roles: [] });
    } catch (err) {}
  };

  const toggleRole = (role: string) => {
    setNewPost(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const filteredPosts = posts.filter((p: any) => 
    p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.team?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 selection:bg-blue-500/30">
      {/* Hero Header */}
      <div className="relative pt-12 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <Search size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Player Scouting</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
                Find your <span className="text-blue-500 text-glow-blue">Next Team</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4 max-w-md leading-relaxed">
                Connect with professional players and teams looking to complete their rosters.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-tighter italic text-sm transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Plus size={20} />
                Create Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
             <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 sticky top-28">
                <div className="space-y-8">
                   <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setActiveTab('players')}
                        className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                          activeTab === 'players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Users size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Available Players</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('vacancies')}
                        className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                          activeTab === 'vacancies' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Shield size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Team Openings</span>
                      </button>
                   </div>

                   <div className="h-px bg-white/5" />

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Discipline</label>
                      <select
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="">All games</option>
                        {games.map((g: any) => (
                          <option key={g.id} value={g.id}>{g.short_name}</option>
                        ))}
                      </select>
                   </div>

                   <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>
             </div>
          </aside>

          {/* Main Content Feed */}
          <main className="flex-1">
            {loadingPosts ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-48 bg-white/5 rounded-[2.5rem] animate-pulse" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-32 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <AlertCircle size={64} className="text-slate-800 mx-auto mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-500">No posts found</h2>
                <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mt-2">Adjust your filters or try a different search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="group relative bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 transition-all hover:border-blue-500/30 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -z-10" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          {activeTab === 'players' ? (
                            <Avatar src={post.user?.avatar_url} username={post.user?.username} size={80} />
                          ) : (
                            <div className="w-20 h-20 bg-slate-950 rounded-[1.5rem] border border-white/10 overflow-hidden">
                              {post.team?.logo_url ? (
                                <img src={post.team.logo_url} className="w-full h-full object-cover" />
                              ) : <Users className="w-full h-full p-6 text-slate-700" />}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest italic">
                                {post.game?.short_name}
                             </span>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">• {post.user?.region || 'Global'}</span>
                          </div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white group-hover:text-blue-400 transition-colors">
                            {activeTab === 'players' ? post.user?.username : post.team?.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.roles.map((role: any, i: number) => (
                              <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 max-w-md">
                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-3 italic">
                           "{post.description || 'No additional information provided.'}"
                         </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {user && user.id === post.user_id ? (
                           <button 
                             onClick={() => deletePost.mutate(post.id)}
                             className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white transition-all"
                           >
                             Remove post
                           </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (activeTab === 'players') {
                                toast('Scouting direct link coming soon');
                              } else if (post.team_id) {
                                requestToJoin.mutate({ teamId: post.team_id, userId: user!.id });
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                          >
                            {activeTab === 'players' ? <><Star size={14} /> Recruit player</> : <><Shield size={14} /> Apply to join</>}
                          </button>
                        )}
                        <button 
                          onClick={() => activeTab === 'players' ? onNavigate('player-profile', post.user_id) : onNavigate('team-profile', post.team_id)}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                        >
                          View profile <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] p-4 flex items-center justify-center animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
           <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-xl w-full p-10 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all hover:rotate-90">
                <X size={24} />
              </button>

              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                  <Star size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">New post</span>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Share your <span className="text-blue-500">Status</span></h2>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                 <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, type: 'player_looking'})}
                      className={`p-4 rounded-2xl border transition-all text-center ${
                        newPost.type === 'player_looking' ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <UserPlus size={20} className="mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">I'm a player</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, type: 'team_vacancy'})}
                      className={`p-4 rounded-2xl border transition-all text-center ${
                        newPost.type === 'team_vacancy' ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <Users size={20} className="mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">I'm a team</span>
                    </button>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Game *</label>
                    <select
                      required
                      value={newPost.game_id}
                      onChange={(e) => setNewPost({...newPost, game_id: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select game</option>
                      {games.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                 </div>

                 {newPost.type === 'team_vacancy' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Team *</label>
                      <select
                        required
                        value={newPost.team_id}
                        onChange={(e) => setNewPost({...newPost, team_id: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select team</option>
                        {ownedTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                 )}

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Roles</label>
                    <div className="flex flex-wrap gap-2">
                       {['IGL', 'AWP', 'SUPPORT', 'ENTRY', 'CONTROLLER', 'FLEX'].map(role => (
                         <button
                           key={role}
                           type="button"
                           onClick={() => toggleRole(role)}
                           className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                             newPost.roles.includes(role) ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                           }`}
                         >
                           {role}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      value={newPost.description}
                      onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                      maxLength={200}
                      rows={3}
                      className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-800"
                      placeholder="Tell us what you're looking for..."
                    />
                 </div>

                 <button
                   type="submit"
                   disabled={createPost.isPending}
                   className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest italic text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                 >
                   Publish post
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
