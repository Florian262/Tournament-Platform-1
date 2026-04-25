import { useState, useEffect } from 'react';
import { X, Users, Trophy, Gamepad2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Team } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useGames } from '../../hooks/useGames';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  participantType?: 'team' | 'solo';
  onTeamSelected?: (teamId: string | null) => void;
  onSuccess?: () => void;
}

export default function TeamManagementModal({
  isOpen,
  onClose,
  gameId: initialGameId,
  participantType = 'team',
  onTeamSelected,
  onSuccess,
}: TeamManagementModalProps) {
  const { user } = useAuth();
  const { data: games = [] } = useGames();
  const [mode, setMode] = useState<'select' | 'create'>(initialGameId ? 'select' : 'create');
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedGameId, setSelectedGameId] = useState(initialGameId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen && participantType === 'team' && selectedGameId) {
      fetchUserTeams();
    }
  }, [isOpen, selectedGameId, participantType]);

  const fetchUserTeams = async () => {
    if (!user || !selectedGameId) return;
    setLoading(true);
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)
      .eq('game_id', selectedGameId);

    if (teamsData) setUserTeams(teamsData);
    setLoading(false);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('You must be signed in to create a team.');
      setLoading(false);
      return;
    }

    if (!selectedGameId) {
      setError('Please select a game for your team.');
      setLoading(false);
      return;
    }

    // Check if user has a profile
    const { data: profileCheck, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError || !profileCheck) {
      setError('Your user profile is missing. Please try signing out and back in to sync your account.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: createError } = await supabase
        .from('teams')
        .insert({
          name: formData.name,
          tag: formData.tag,
          description: formData.description,
          owner_id: user.id,
          game_id: selectedGameId,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          throw new Error('A team with this name already exists for this game. Please choose a different name.');
        }
        throw createError;
      }

      // Safely add the creating user as a team member
      const { error: memberError } = await supabase
        .from('team_members')
        .upsert(
          {
            team_id: data.id,
            user_id: user.id,
            role: 'captain',
          },
          { onConflict: 'team_id, user_id', ignoreDuplicates: true }
        );

      if (memberError) throw memberError;

      // Ensure stats row exists
      await supabase
        .from('team_statistics')
        .upsert(
          { team_id: data.id, member_count: 1 },
          { onConflict: 'team_id', ignoreDuplicates: true }
        );

      if (onSuccess) onSuccess();
      if (onTeamSelected) onTeamSelected(data.id);
      onClose();
    } catch (err: any) {
      console.error('Team creation error:', err);
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    if (onTeamSelected) onTeamSelected(teamId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (participantType === 'solo') {
    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-md w-full p-8 relative shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-4">Solo Registration</h2>
          <p className="text-slate-400 mb-6">You are entering this event as an individual competitor.</p>
          <button
            onClick={() => { if(onTeamSelected) onTeamSelected(null); onClose(); }}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] italic rounded-xl transition-all shadow-lg shadow-blue-500/40 active:scale-95"
          >
            Confirm Enrollment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-[2rem] max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Trophy size={14} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Franchise Management</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">
            {initialGameId ? 'Tournament Roster' : 'Establish Franchise'}
          </h2>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        {initialGameId && (
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setMode('select')}
              className={`flex-1 py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                mode === 'select' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Select Roster
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                mode === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              New Franchise
            </button>
          </div>
        )}

        <form onSubmit={handleCreateTeam} className="space-y-6">
          {!initialGameId && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Select Discipline *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {games.map((g: any) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGameId(g.id)}
                    className={`p-4 rounded-2xl border transition-all text-center group ${
                      selectedGameId === g.id 
                        ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Gamepad2 size={24} className={`mx-auto mb-2 ${selectedGameId === g.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedGameId === g.id ? 'text-white' : 'text-slate-400'}`}>
                      {g.short_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'select' ? (
            <div className="space-y-3">
               {loading ? (
                <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : userTeams.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <Users size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">No active rosters for this game</p>
                  <button type="button" onClick={() => setMode('create')} className="text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-300">Create New Instead</button>
                </div>
              ) : (
                userTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSelectTeam(team.id)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
                      {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-600" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black uppercase italic text-white group-hover:text-blue-400 transition-colors">{team.name}</h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{team.tag}</span>
                    </div>
                    <Trophy size={20} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Team Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.G. LEGENDARY LIONS"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Tag *</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                    required
                    maxLength={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="LIONS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Franchise Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="The mission and values of your franchise..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                {initialGameId && (
                   <button type="button" onClick={() => setMode('select')} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all">Cancel</button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                >
                  {loading ? 'Processing...' : 'Establish Franchise'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
