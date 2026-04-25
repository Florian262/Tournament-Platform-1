import { useState, useEffect } from 'react';
import { X, Users, CheckCircle2, Shield, ArrowRight, Zap } from 'lucide-react';
import { useUserTeams } from '../../hooks/useTeams';
import { supabase } from '../../lib/supabase';
import { Team, Tournament, TeamMember } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';

interface QuickJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  user: any;
  onSuccess: () => void;
}

export default function QuickJoinModal({ isOpen, onClose, tournament, user, onSuccess }: QuickJoinModalProps) {
  const queryClient = useQueryClient();
  const { data: ownedTeams = [] } = useUserTeams(user?.id);
  const { sendNotification } = useNotifications();
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Filter teams by game
  const eligibleTeams = ownedTeams.filter((t: any) => t.game_id === tournament.game_id);

  useEffect(() => {
    if (eligibleTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(eligibleTeams[0]);
    }
  }, [eligibleTeams, selectedTeam]);

  useEffect(() => {
    if (selectedTeam) {
      fetchMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchMembers = async (teamId: string) => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from('team_members')
      .select('*, user:user_profiles(*)')
      .eq('team_id', teamId);
    
    if (data) setMembers(data);
    setLoadingMembers(false);
  };

  const handleDeploy = async () => {
    if (!selectedTeam || !user) return;
    setDeploying(true);

    try {
      // 1. Register the Team
      const { error: regError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournament.id,
          team_id: selectedTeam.id,
          status: 'registered'
        });

      if (regError) throw regError;

      // 2. Notify Teammates
      const otherMembers = members.filter(m => m.user_id !== user.id);
      for (const member of otherMembers) {
        await sendNotification.mutateAsync({
          user_id: member.user_id,
          type: 'tournament_update',
          title: 'Squad Deployed',
          message: `Your team "${selectedTeam.name}" has been registered for ${tournament.name}. Get ready!`,
          link: `tournament-detail/${tournament.id}`
        });
      }

      toast.success('Squad successfully deployed');
      
      // Force refresh all tournament data
      await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] p-4 flex items-center justify-center animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-xl w-full p-10 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all hover:rotate-90">
          <X size={24} />
        </button>

        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 mx-auto">
            <Zap size={14} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Quick-Join Protocol</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Deploy <span className="text-blue-500">Squad</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4">Initialize registration for {tournament.name}</p>
        </div>

        {eligibleTeams.length === 0 ? (
           <div className="flex-1 text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 px-8">
              <Users size={48} className="text-slate-800 mx-auto mb-6" />
              <h3 className="text-xl font-black uppercase italic text-slate-500 mb-2">No Eligible Rosters</h3>
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">You need to establish a team for this game before joining.</p>
           </div>
        ) : (
          <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Select Franchise</label>
                <div className="grid grid-cols-1 gap-2">
                   {eligibleTeams.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTeam(t)}
                        className={`w-full flex items-center gap-4 p-4 border rounded-2xl transition-all text-left ${
                          selectedTeam?.id === t.id ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-400'
                        }`}
                      >
                        <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                           {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover" /> : <Users className="p-3 text-slate-700" />}
                        </div>
                        <div className="flex-1">
                           <h4 className={`font-black uppercase italic ${selectedTeam?.id === t.id ? 'text-white' : 'text-slate-300'}`}>{t.name}</h4>
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t.tag} • {members.length} Members</span>
                        </div>
                        {selectedTeam?.id === t.id && <CheckCircle2 size={20} className="text-white" />}
                      </button>
                   ))}
                </div>
             </div>

             {selectedTeam && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                   <div className="flex items-center gap-2 mb-6">
                      <Shield size={14} className="text-blue-500" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Roster Verification</h3>
                   </div>
                   
                   {loadingMembers ? (
                      <div className="h-20 flex items-center justify-center animate-pulse text-slate-700 font-black uppercase tracking-widest text-[10px]">Scanning identities...</div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 p-2 bg-slate-950/50 rounded-xl border border-white/5">
                               <Avatar src={m.user?.avatar_url} username={m.user?.username} size={28} />
                               <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-white uppercase italic truncate">{m.user?.username}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{m.role}</p>
                               </div>
                               <div className="w-1.5 h-1.2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             )}

             <button
               onClick={handleDeploy}
               disabled={deploying || !selectedTeam}
               className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest italic text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
             >
               {deploying ? 'Deploying Squad...' : <>Confirm Deployment <ArrowRight size={16} /></>}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
