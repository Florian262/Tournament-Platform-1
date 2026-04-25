import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Users, Trophy, Award, DollarSign, 
  Check, UserPlus, Clock, Shield,
  Settings, ExternalLink, Gamepad2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Team, TeamMember, TeamStatistics } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useInviteMutations } from '../hooks/useTeamInvites';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

interface TeamProfilePageProps {
  teamId: string;
  onNavigate: (page: string, data?: any) => void;
}

export default function TeamProfilePage({ teamId, onNavigate }: TeamProfilePageProps) {
  const { profile, user } = useAuth();
  const { requestToJoin } = useInviteMutations();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .select('*, owner:user_profiles(*), game:games(*)')
        .eq('id', teamId)
        .maybeSingle();

      if (teamErr) throw teamErr;
      if (teamData) setTeam(teamData);

      const { data: membersData, error: membersErr } = await supabase
        .from('team_members')
        .select('*, user:user_profiles(*)')
        .eq('team_id', teamId)
        .order('role', { ascending: true });

      if (membersErr) throw membersErr;
      if (membersData) setMembers(membersData);

      const { data: statsData } = await supabase
        .from('team_statistics')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();
      
      if (statsData) setStats(statsData);

      const { data: invitesData } = await supabase
        .from('team_invites')
        .select('*, invited:user_profiles!invited_user_id(*), inviter:user_profiles!inviter_id(*)')
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (invitesData) setInvites(invitesData);
    } catch (err: any) {
      console.error('fetchTeamData error', err);
      toast.error('Tactical Intel Fetch Failed');
    } finally {
      setLoading(false);
    }
  };

  const isUserMember = () => profile && members.some(m => m.user_id === profile.id);
  const isUserCaptain = () => profile && members.some(m => m.user_id === profile.id && m.role === 'captain');
  const hasPendingRequest = () => profile && invites.some(inv => inv.invited_user_id === profile.id);

  const handleJoinRequest = async () => {
    if (!user) {
      toast.error('Please sign in to join a team');
      return;
    }
    if (!team) return;
    try {
      await requestToJoin.mutateAsync({ teamId: team.id, userId: user.id });
      await fetchTeamData();
    } catch (err) { /* handled by mutation */ }
  };

  const respondInvite = async (inviteId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase.from('team_invites').update({ status, responded_at: new Date().toISOString() }).eq('id', inviteId);
      if (error) throw error;
      if (status === 'accepted') {
        const { data: inv } = await supabase.from('team_invites').select('*').eq('id', inviteId).single();
        await supabase.from('team_members').upsert({ team_id: teamId, user_id: inv.invited_user_id, role: inv.role }, { onConflict: 'team_id, user_id' });
        // update stats
        const { data: s } = await supabase.from('team_statistics').select('member_count').eq('team_id', teamId).single();
        await supabase.from('team_statistics').update({ member_count: (s?.member_count || 0) + 1 }).eq('team_id', teamId);
      }
      toast.success(status === 'accepted' ? 'Contract Finalized' : 'Draft Rejected');
      await fetchTeamData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading && !team) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Cinematic Team Header */}
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay z-10" />
          <img 
            src={team.logo_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200'} 
            className="w-full h-full object-cover blur-sm opacity-40 scale-110" 
            alt="" 
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
          <button
            onClick={() => onNavigate('teams')}
            className="absolute top-24 left-4 sm:left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Return to Base</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-8">
               <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                  <div className="relative w-32 h-32 md:w-40 md:h-40 bg-slate-900 border-2 border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                    {team.logo_url ? (
                      <img src={team.logo_url} className="w-full h-full object-cover" alt={team.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                        <Users size={64} className="text-slate-700" />
                      </div>
                    )}
                  </div>
               </div>

               <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest italic rounded-lg shadow-lg shadow-blue-500/20">
                      {team.tag}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {team.game?.name} • {team.region || 'GLOBAL'}
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none text-white drop-shadow-2xl">
                    {team.name}
                  </h1>
               </div>
            </div>

            <div className="flex items-center gap-4">
               {user && !isUserMember() && (
                <button
                  onClick={handleJoinRequest}
                  disabled={hasPendingRequest() || requestToJoin.isPending}
                  className={`group px-8 py-4 rounded-2xl font-black uppercase tracking-widest italic text-xs transition-all active:scale-95 flex items-center gap-3 ${
                    hasPendingRequest() 
                      ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/40'
                  }`}
                >
                  {hasPendingRequest() ? <><Clock size={18} /> Awaiting Briefing</> : <><UserPlus size={18} /> Draft Request</>}
                </button>
              )}
              {isUserCaptain() && (
                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                  <Settings size={20} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Operations', value: stats?.total_tournaments || 0, icon: Gamepad2, color: 'text-blue-500' },
                 { label: 'Victories', value: stats?.total_wins || 0, icon: Award, color: 'text-emerald-500' },
                 { label: 'Efficiency', value: `${((stats?.win_rate || 0) * 100).toFixed(1)}%`, icon: Trophy, color: 'text-amber-500' },
                 { label: 'Earnings', value: `$${(stats?.total_prizes || 0).toLocaleString()}`, icon: DollarSign, color: 'text-blue-400' },
               ].map((s, i) => (
                 <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 group hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-3">
                       <s.icon className={s.color} size={18} />
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{s.label}</span>
                    </div>
                    <p className="text-2xl font-black uppercase italic text-white leading-none">{s.value}</p>
                 </div>
               ))}
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Shield size={120} />
               </div>
               <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 italic">
                 <span className="w-8 h-px bg-blue-500/30" /> Franchise Manifesto
               </h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-loose max-w-2xl relative z-10">
                 {team.description || "NO OFFICIAL MANIFESTO HAS BEEN REGISTERED FOR THIS FRANCHISE. EXPECT PURE COMPETITIVE EXCELLENCE ON THE FIELD OF BATTLE."}
               </p>
            </div>

            {/* Members Section */}
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                    <span className="w-8 h-px bg-blue-500/30" /> Active Roster
                  </h2>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{members.length} / 12 PERSONNEL</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map(member => (
                    <div key={member.id} className="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <Avatar src={member.user?.avatar_url} username={member.user?.username} size={48} />
                          <div>
                             <h4 className="text-sm font-black uppercase italic text-white group-hover:text-blue-400 transition-colors leading-none mb-1">{member.user?.username}</h4>
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{member.user?.region || 'GLOBAL'} • ACTING {member.role}</span>
                          </div>
                       </div>
                       {member.role === 'captain' && <Shield size={16} className="text-amber-500" />}
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sidebar / Personnel Management */}
          <div className="space-y-8">
             {/* Pending Personnel Requests */}
             {(isUserCaptain() || profile?.role === 'admin') && (
               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
                  <div className="flex items-center gap-2 mb-8">
                     <Shield className="text-blue-500" size={16} />
                     <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Personnel Intake</h3>
                  </div>

                  {invites.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No Active Applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {invites.map(inv => (
                         <div key={inv.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-3 mb-4">
                               <Avatar src={inv.invited?.avatar_url} username={inv.invited?.username} size={32} />
                               <div>
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest italic">{inv.invited?.username}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Applying for {inv.role}</p>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => respondInvite(inv.id, 'accepted')}
                                 className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                               >
                                 Approve
                               </button>
                               <button 
                                 onClick={() => respondInvite(inv.id, 'rejected')}
                                 className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                               >
                                 Deny
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
             )}

             {/* Team Intel */}
             <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <Shield className="text-blue-500" size={16} />
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Franchise Intel</h3>
                </div>
                
                {[
                  { label: 'Established', value: new Date(team.created_at).getFullYear() },
                  { label: 'Base Region', value: team.region || 'GLOBAL' },
                  { label: 'Contract Type', value: 'PROFESSIONAL' },
                  { label: 'Verified Status', value: 'CONFIRMED', icon: Check, iconColor: 'text-blue-500' }
                ].map((intel, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4">
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{intel.label}</span>
                     <div className="flex items-center gap-2">
                        {intel.icon && <intel.icon size={12} className={intel.iconColor} />}
                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{intel.value}</span>
                     </div>
                  </div>
                ))}

                <button className="w-full py-4 mt-4 bg-white border border-white text-slate-950 rounded-2xl font-black uppercase tracking-widest italic text-[10px] transition-all hover:bg-blue-500 hover:text-white hover:border-blue-500 flex items-center justify-center gap-2">
                   <ExternalLink size={14} /> Official Profile
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
