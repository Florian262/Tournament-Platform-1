import { useState, useEffect } from 'react';
import { X, Plus, Users, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Team, Game } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  participantType: 'team' | 'solo';
  onTeamSelected: (teamId: string | null) => void;
}

export default function TeamManagementModal({
  isOpen,
  onClose,
  gameId,
  participantType,
  onTeamSelected,
}: TeamManagementModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen && participantType === 'team') {
      fetchData();
    }
  }, [isOpen, gameId, participantType]);

  const fetchData = async () => {
    setLoading(true);

    const { data: gameData } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();

    if (gameData) setGame(gameData);

    if (user) {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .eq('game_id', gameId);

      if (teamsData) setUserTeams(teamsData);
    }

    setLoading(false);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user || !gameId) {
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
          game_id: gameId,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Safely add the creating user as a team member (upsert to avoid duplicate-key on double submissions)
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

      // Ensure there is a statistics row for the team; ignore duplicates if created concurrently
      const { error: statsError } = await supabase
        .from('team_statistics')
        .upsert(
          {
            team_id: data.id,
            member_count: 1,
          },
          { onConflict: 'team_id', ignoreDuplicates: true }
        );

      if (statsError) throw statsError;

      // Refresh local list of teams so the UI shows the newly-created team and members/stats
      await fetchData();

      onTeamSelected(data.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    onTeamSelected(teamId);
    onClose();
  };

  if (!isOpen) return null;

  if (participantType === 'solo') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-md w-full p-8 relative shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold text-white mb-4">Solo Tournament</h2>
          <p className="text-slate-400 mb-6">
            You're registered as an individual competitor. Your profile will represent your performance.
          </p>

          <button
            onClick={() => onTeamSelected(null)}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/40"
          >
            Proceed to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy size={28} className="text-blue-500" />
          Team Registration
        </h2>
        {game && (
          <p className="text-slate-400 mb-6">{game.name} - Select or create a team</p>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('select')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              mode === 'select'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Select Existing
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              mode === 'create'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Create New
          </button>
        </div>

        {mode === 'select' && (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : userTeams.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/50 rounded-xl border border-blue-500/20">
                <Users size={48} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No teams yet for this game</p>
                <button
                  onClick={() => setMode('create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus size={18} />
                  Create Team
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelectTeam(team.id)}
                    className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-blue-500/20 rounded-xl hover:bg-slate-800/70 hover:border-blue-500/50 transition-all text-left"
                  >
                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{team.name}</h3>
                      <p className="text-sm text-slate-400">{team.tag}</p>
                    </div>
                    <div className="text-blue-400 font-semibold">→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Legendary Lions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Team Tag *
              </label>
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                required
                maxLength={5}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="e.g., LIONS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell others about your team..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/40"
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
