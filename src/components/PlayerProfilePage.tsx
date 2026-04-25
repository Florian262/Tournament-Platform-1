import { useEffect, useState } from 'react';
import { 
  Trophy, Award, DollarSign, 
  Twitter, Globe, Shield, 
  Star, Users, Edit3, Save, X, Copy, Check,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile, PlayerStatistics, Tournament, Team } from '../types';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

interface PlayerProfilePageProps {
  userId: string;
  onNavigate: (page: string, data?: unknown) => void;
}

interface UserBadge {
  earned_at: string;
  badge: {
    name: string;
    description: string;
    icon_url: string;
    rarity: string;
  };
}

export default function PlayerProfilePage({ userId, onNavigate }: PlayerProfilePageProps) {
  const { profile: currentProfile } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ 
    username: '', 
    full_name: '', 
    bio: '', 
    region: '', 
    avatar_url: '',
    social_links: { twitter: '', twitch: '', discord: '' }
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [userId]);

  const fetchPlayerData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userData && userData.display_stats) {
        setUser(userData);
        setForm({
          username: userData.username || '',
          full_name: userData.full_name || '',
          bio: userData.bio || '',
          region: userData.region || '',
          avatar_url: userData.avatar_url || '',
          social_links: userData.social_links || { twitter: '', twitch: '', discord: '' }
        });
      } else {
        setLoading(false);
        return;
      }

      // Fetch Stats
      const { data: statsData } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (statsData) setStats(statsData);

      // Fetch Badges
      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('earned_at, badge:legacy_badges(*)')
        .eq('user_id', userId);
      if (badgeData) setBadges(badgeData as any);

      // Fetch Teams
      const { data: membershipData } = await supabase
        .from('team_members')
        .select('team:teams(*, game:games(*))')
        .eq('user_id', userId);
      if (membershipData) setTeams(membershipData.map(m => m.team) as any);

      // Fetch Tournament History
      const { data: participationData } = await supabase
        .from('tournament_participants')
        .select('tournament:tournaments(*, game:games(*))')
        .eq('user_id', userId)
        .order('registered_at', { ascending: false })
        .limit(10);
      if (participationData) setTournaments(participationData.map(p => p.tournament) as any);

    } catch (err) {
      console.error('fetchPlayerData error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success('Identity ID copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield size={64} className="text-slate-800 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase italic text-slate-500">Identity Not Found</h2>
          <button onClick={() => onNavigate('home')} className="mt-8 text-blue-500 font-black uppercase tracking-widest text-[10px] italic">Return to Base</button>
        </div>
      </div>
    );
  }

  const isOwner = currentProfile?.id === user.id || currentProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Digital ID Card */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="holo-card group bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:border-blue-500/30">
               <div className="h-32 bg-gradient-to-br from-blue-600 to-blue-900 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
               </div>

               <div className="px-8 pb-10 relative">
                  <div className="absolute -top-16 left-8">
                     <div className="relative group/avatar">
                        <Avatar src={user.avatar_url} username={user.username} size={120} className="border-4 border-slate-900 rounded-[2rem] shadow-2xl" />
                        {editing && (
                           <label className="absolute inset-0 bg-black/60 rounded-[2rem] flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <Camera size={24} />
                              <input type="file" className="hidden" />
                           </label>
                        )}
                     </div>
                  </div>

                  <div className="pt-20">
                     <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{user.username}</h1>
                        <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest">
                           {user.region || 'Global'}
                        </span>
                     </div>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-6">{user.role} personnel</p>

                     <div className="space-y-4 mb-8">
                        <button onClick={handleCopyId} className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-left group/id">
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Digital Signature</span>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-400 truncate max-w-[100px]">{user.id}</span>
                              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-600 group-hover/id:text-white" />}
                           </div>
                        </button>

                        <div className="flex gap-2">
                           {['twitch', 'twitter', 'discord'].map(platform => (
                              <div key={platform} className="flex-1 p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                                 {platform === 'twitter' && <Twitter size={16} className="text-slate-400" />}
                                 {platform === 'twitch' && <Globe size={16} className="text-slate-400" />}
                                 {platform === 'discord' && <Users size={16} className="text-slate-400" />}
                              </div>
                           ))}
                        </div>
                     </div>

                     {isOwner && (
                        <button 
                           onClick={() => setEditing(!editing)}
                           className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest italic text-[10px] transition-all hover:bg-blue-500 hover:text-white active:scale-95 flex items-center justify-center gap-2"
                        >
                           {editing ? <><X size={14} /> Close Editor</> : <><Edit3 size={14} /> Update Identity</>}
                        </button>
                     )}
                  </div>
               </div>
            </div>

            {/* Badges Preview on Card */}
            {badges.length > 0 && (
               <div className="mt-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Legacy Honors</h3>
                  <div className="flex flex-wrap gap-3">
                     {badges.map((b, i) => (
                        <div key={i} title={b.badge.description} className="relative group">
                           <div className={`p-2 rounded-xl border ${
                              b.badge.rarity === 'legendary' ? 'bg-amber-500/10 border-amber-500/30' :
                              b.badge.rarity === 'epic' ? 'bg-purple-500/10 border-purple-500/30' :
                              'bg-white/5 border-white/10'
                           }`}>
                              <img src={b.badge.icon_url} className="w-8 h-8" alt="" />
                           </div>
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-950 border border-white/10 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                              <p className="text-[9px] font-black text-white uppercase italic">{b.badge.name}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>

          {/* Right Column: CV Dashboard */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Professional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Operations', value: stats?.total_tournaments || 0, icon: Star, color: 'text-blue-500' },
                 { label: 'Victories', value: stats?.total_wins || 0, icon: Trophy, color: 'text-amber-500' },
                 { label: 'Win Ratio', value: `${((stats?.win_rate || 0) * 100).toFixed(1)}%`, icon: Award, color: 'text-emerald-500' },
                 { label: 'Career Gains', value: `$${(stats?.total_prizes || 0).toLocaleString()}`, icon: DollarSign, color: 'text-blue-400' },
               ].map((s, i) => (
                 <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-3">
                       <s.icon className={s.color} size={18} />
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{s.label}</span>
                    </div>
                    <p className="text-2xl font-black uppercase italic text-white leading-none">{s.value}</p>
                 </div>
               ))}
            </div>

            {editing ? (
               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-8">Edit <span className="text-blue-500">Profile</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                        <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Real Name" className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Region</label>
                        <input value={form.region} onChange={e => setForm({...form, region: e.target.value})} placeholder="e.g. Europe, NA" className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                     </div>
                     <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Bio / Statement</label>
                        <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={4} placeholder="Tell your story..." className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                     </div>
                  </div>
                  <button onClick={async () => {
                     try {
                        const { error } = await supabase.from('user_profiles').update({
                           full_name: form.full_name,
                           region: form.region,
                           bio: form.bio,
                           social_links: form.social_links
                        }).eq('id', userId);
                        if (error) throw error;
                        toast.success('Identity Updated');
                        await fetchPlayerData();
                        setEditing(false);
                     } catch (err: any) { toast.error(err.message); }
                  }} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic text-xs transition-all flex items-center gap-2">
                     <Save size={16} /> Finalize Changes
                  </button>
               </div>
            ) : (
               <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                     <Star size={120} />
                  </div>
                  <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 italic">
                    <span className="w-8 h-px bg-blue-500/30" /> Personnel Bio
                  </h2>
                  <p className="text-slate-400 font-medium text-sm leading-loose max-w-2xl relative z-10">
                    {user.bio || "No professional statement has been registered for this operative."}
                  </p>
               </div>
            )}

            {/* Tournament History */}
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                    <span className="w-8 h-px bg-blue-500/30" /> Performance History
                  </h2>
               </div>

               {tournaments.length === 0 ? (
                  <div className="py-20 text-center bg-white/5 border border-dashed border-white/5 rounded-[2.5rem]">
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No Official Matches Recorded</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-4">
                     {tournaments.map((t, i) => (
                        <button key={i} onClick={() => onNavigate('tournament-detail', t.id)} className="group bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all flex items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden border border-white/10">
                                 <img src={t.game?.icon_url || ''} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left">
                                 <h4 className="text-sm font-black uppercase italic text-white group-hover:text-blue-400 transition-colors leading-none mb-1">{t.name}</h4>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.game?.short_name} • {new Date(t.start_date).getFullYear()}</span>
                              </div>
                           </div>
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic border ${
                              t.status === 'completed' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                           }`}>
                              {t.status.replace('_', ' ')}
                           </span>
                        </button>
                     ))}
                  </div>
               )}
            </div>

            {/* Franchise Memberships */}
            <div className="space-y-8">
               <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                 <span className="w-8 h-px bg-blue-500/30" /> Active Roster Links
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team, i) => (
                     <button key={i} onClick={() => onNavigate('team-profile', team.id)} className="group bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden border border-white/10">
                           {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Users className="p-3 text-slate-700" />}
                        </div>
                        <div className="text-left">
                           <h4 className="text-sm font-black uppercase italic text-white group-hover:text-blue-400 transition-colors leading-none mb-1">{team.name}</h4>
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team.tag} • {team.game?.short_name}</span>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
