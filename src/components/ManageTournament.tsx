import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Users, Trophy, Play, X, Shield, 
  Edit3, Save, LayoutGrid 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tournament, TournamentParticipant, Game } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket,
  generateRoundRobinMatches,
} from '../utils/bracketGenerator';
import { generateTournamentSchedule } from '../utils/scheduleGenerator';
import toast from 'react-hot-toast';

interface ManageTournamentProps {
  tournamentId: string;
  onNavigate: (page: string, data?: unknown) => void;
}

type ManageTab = 'overview' | 'participants' | 'edit' | 'bracket';

export default function ManageTournament({ tournamentId, onNavigate }: ManageTournamentProps) {
  const { profile } = useAuth();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<ManageTab>('overview');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Scheduling options
  const [matchDuration, setMatchDuration] = useState(45);
  const [concurrentMatches, setConcurrentMatches] = useState(2);
  const [bufferTime, setBufferTime] = useState(10);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    rules: '',
    prize_pool: '',
    banner_url: '',
    stream_url: '',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    game_id: '',
  });

  useEffect(() => {
    fetchData();
    fetchGames();
  }, [tournamentId]);

  const fetchGames = async () => {
    const { data } = await supabase.from('games').select('*').eq('active', true);
    if (data) setGames(data);
  };

  const fetchData = async () => {
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*, game:games(*)')
      .eq('id', tournamentId)
      .maybeSingle();

    if (tournamentData) {
      if (tournamentData.organizer_id !== profile?.id && profile?.role !== 'admin') {
        onNavigate('home');
        return;
      }
      setTournament(tournamentData);
      setEditForm({
        name: tournamentData.name || '',
        description: tournamentData.description || '',
        rules: tournamentData.rules || '',
        prize_pool: tournamentData.prize_pool || '',
        banner_url: tournamentData.banner_url || '',
        stream_url: tournamentData.stream_url || '',
        start_date: tournamentData.start_date?.substring(0, 16) || '',
        end_date: tournamentData.end_date?.substring(0, 16) || '',
        registration_start: tournamentData.registration_start?.substring(0, 16) || '',
        registration_end: tournamentData.registration_end?.substring(0, 16) || '',
        game_id: tournamentData.game_id || '',
      });
    }

    const { data: participantsData } = await supabase
      .from('tournament_participants')
      .select('*, team:teams(*), user:user_profiles(*)')
      .eq('tournament_id', tournamentId)
      .order('registered_at', { ascending: true });

    if (participantsData) {
      setParticipants(participantsData);
    }

    setLoading(false);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update(editForm)
        .eq('id', tournamentId);

      if (error) throw error;
      toast.success('Tournament details updated');
      fetchData();
      setActiveTab('overview');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const assignSeeds = async () => {
    for (let i = 0; i < participants.length; i++) {
      await supabase
        .from('tournament_participants')
        .update({ seed: i + 1 })
        .eq('id', participants[i].id);
    }
    toast.success('Seeds assigned successfully');
    fetchData();
  };

  const updateTournamentStatus = async (status: string) => {
    const { error } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', tournamentId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Status updated to ${status}`);
      fetchData();
    }
  };

  const generateBracket = async () => {
    if (!tournament) return;
    setGenerating(true);
    try {
      let matches: any[] = [];
      if (tournament.format === 'single_elimination') matches = generateSingleEliminationBracket(participants);
      else if (tournament.format === 'double_elimination') matches = generateDoubleEliminationBracket(participants);
      else if (tournament.format === 'round_robin') matches = generateRoundRobinMatches(participants);

      if (matches.length > 0) {
        const matchesWithTournamentId = matches.map(m => ({ ...m, tournament_id: tournament.id, status: 'pending' }));
        const scheduledMatches = generateTournamentSchedule(matchesWithTournamentId as any, tournament.start_date, {
          matchDurationMinutes: matchDuration,
          concurrentMatches,
          bufferMinutes: bufferTime
        });

        const { error } = await supabase.from('matches').insert(scheduledMatches);
        if (error) throw error;

        await supabase.from('tournaments').update({ status: 'running' }).eq('id', tournament.id);
        toast.success('Brackets deployed and scheduled');
        onNavigate('tournament-detail', tournament.id);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase.from('tournament_participants').delete().eq('id', participantId);
      if (error) throw error;
      if (tournament) {
        await supabase.from('tournaments').update({ current_participants: Math.max(0, tournament.current_participants - 1) }).eq('id', tournament.id);
      }
      toast.success('Participant removed');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <button
            onClick={() => onNavigate('tournament-detail', tournament.id)}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Return to details</span>
          </button>

          <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'participants', label: 'Participants', icon: Users },
              { id: 'edit', label: 'Edit Info', icon: Edit3 },
              { id: 'bracket', label: 'Brackets', icon: Trophy },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ManageTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all border whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {activeTab === 'overview' && (
            <div className="space-y-12">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <Shield size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tournament Control</span>
                  </div>
                  <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none mb-2">{tournament.name}</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Current Status: <span className="text-blue-500">{tournament.status.replace('_', ' ')}</span></p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Status', value: tournament.status.replace('_', ' '), color: 'text-blue-500' },
                    { label: 'Participants', value: `${participants.length} / ${tournament.max_participants}`, color: 'text-blue-400' },
                    { label: 'Format', value: tournament.format.replace('_', ' '), color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-8">
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{stat.label}</p>
                       <p className={`text-2xl font-black uppercase italic leading-none ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
               </div>

               <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 italic">Quick Actions</h3>
                  <div className="flex flex-wrap gap-4">
                     <button
                        onClick={() => updateTournamentStatus('registration_open')}
                        disabled={tournament.status === 'registration_open'}
                        className="px-8 py-4 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all"
                     >
                        Open Registration
                     </button>
                     <button
                        onClick={() => updateTournamentStatus('pending')}
                        disabled={tournament.status === 'pending'}
                        className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all"
                     >
                        Set to Pending
                     </button>
                     <button
                        onClick={() => updateTournamentStatus('completed')}
                        disabled={tournament.status === 'completed'}
                        className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all"
                     >
                        Complete Tournament
                     </button>
                     <button
                        onClick={() => updateTournamentStatus('cancelled')}
                        disabled={tournament.status === 'cancelled'}
                        className="px-8 py-4 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all"
                     >
                        Cancel Event
                     </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Roster <span className="text-blue-500">Management</span></h2>
                  <button onClick={assignSeeds} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 rounded-xl font-black uppercase tracking-widest text-[10px] italic transition-all">Auto-Seed All</button>
               </div>

               {participants.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                     <Users size={48} className="text-slate-800 mx-auto mb-4" />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No participants yet</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {participants.map((p, i) => (
                        <div key={p.id} className="group bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/10 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                 <span className="text-white font-black italic text-lg">{p.seed || i + 1}</span>
                              </div>
                              <div>
                                 <h3 className="font-black uppercase italic text-white group-hover:text-blue-400 transition-colors leading-none mb-1">
                                    {tournament.participant_type === 'team' ? p.team?.name : p.user?.username}
                                 </h3>
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                    {tournament.participant_type === 'team' ? p.team?.tag : (p.user?.region || 'GLOBAL')}
                                 </p>
                              </div>
                           </div>
                           <button onClick={() => removeParticipant(p.id)} className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                              <X size={18} />
                           </button>
                        </div>
                     ))}
                  </div>
               )}
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleUpdateDetails} className="space-y-8">
               <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Update <span className="text-blue-500">Information</span></h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Tournament Name</label>
                        <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" placeholder="e.g. Pro Season 1" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Description</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" placeholder="Details about the event" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Prize Pool</label>
                        <input value={editForm.prize_pool} onChange={e => setEditForm({...editForm, prize_pool: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" placeholder="e.g. $5,000" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Game Discipline</label>
                        <select value={editForm.game_id} onChange={e => setEditForm({...editForm, game_id: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500">
                           {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Start Date</label>
                           <input type="datetime-local" value={editForm.start_date} onChange={e => setEditForm({...editForm, start_date: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">End Date</label>
                           <input type="datetime-local" value={editForm.end_date} onChange={e => setEditForm({...editForm, end_date: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Reg. Opens</label>
                           <input type="datetime-local" value={editForm.registration_start} onChange={e => setEditForm({...editForm, registration_start: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Reg. Closes</label>
                           <input type="datetime-local" value={editForm.registration_end} onChange={e => setEditForm({...editForm, registration_end: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Banner Image URL</label>
                        <input value={editForm.banner_url} onChange={e => setEditForm({...editForm, banner_url: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" placeholder="URL to banner image" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Rules & Regulations</label>
                        <textarea value={editForm.rules} onChange={e => setEditForm({...editForm, rules: e.target.value})} rows={4} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" placeholder="Participant rules" />
                     </div>
                  </div>
               </div>
               <div className="pt-8 border-t border-white/5">
                  <button type="submit" disabled={saving} className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-3">
                     <Save size={18} /> {saving ? 'Saving...' : 'Update Tournament'}
                  </button>
               </div>
            </form>
          )}

          {activeTab === 'bracket' && (
            <div className="space-y-12">
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-2">Bracket <span className="text-blue-500">Settings</span></h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Configure match timing and resource allocation</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Avg. Match Time (Min)</label>
                     <input type="number" min={5} value={matchDuration} onChange={e => setMatchDuration(parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Max Concurrent Games</label>
                     <input type="number" min={1} value={concurrentMatches} onChange={e => setConcurrentMatches(parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Buffer Between Games</label>
                     <input type="number" min={0} value={bufferTime} onChange={e => setBufferTime(parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500" />
                  </div>
               </div>

               <div className="p-8 bg-blue-600/10 border border-blue-600/20 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                     <Trophy className="text-blue-500" size={32} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                     <p className="text-lg font-black uppercase italic text-white leading-none mb-2">Finalize and Deploy</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">This will generate the official tournament bracket and schedule all matches. <span className="text-red-500">Cannot be undone.</span></p>
                  </div>
                  <button
                     onClick={generateBracket}
                     disabled={generating || participants.length < 2}
                     className="w-full md:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest text-[10px] italic transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                  >
                     {generating ? 'Processing...' : <>Deploy Bracket <Play size={14} /></>}
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
