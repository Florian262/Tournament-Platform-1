import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Trophy, Play, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tournament, TournamentParticipant } from '../types';
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

export default function ManageTournament({ tournamentId, onNavigate }: ManageTournamentProps) {
  const { profile } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matchDurationMinutes, setMatchDurationMinutes] = useState<number>(45);
  const [concurrentMatchesOpt, setConcurrentMatchesOpt] = useState<number>(2);
  const [bufferMinutes, setBufferMinutes] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*, game:games(*)')
      .eq('id', tournamentId)
      .maybeSingle();

    if (tournamentData) {
      if (tournamentData.organizer_id !== profile?.id) {
        onNavigate('home');
        return;
      }
      setTournament(tournamentData);
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

  const assignSeeds = async () => {
    for (let i = 0; i < participants.length; i++) {
      await supabase
        .from('tournament_participants')
        .update({ seed: i + 1 })
        .eq('id', participants[i].id);
    }

    fetchData();
  };

  const generateBracket = async () => {
    if (!tournament) return;

    setGenerating(true);

    try {
      let matches: any[];

      switch (tournament.format) {
        case 'single_elimination':
          matches = generateSingleEliminationBracket(participants);
          break;
        case 'double_elimination':
          matches = generateDoubleEliminationBracket(participants);
          break;
        case 'round_robin':
          matches = generateRoundRobinMatches(participants);
          break;
        default:
          matches = [];
      }

      if (matches.length > 0) {
        const matchesWithTournamentId = matches.map(match => ({
          ...match,
          tournament_id: tournament.id,
          status: 'pending' as const,
        }));

          let toInsert = matchesWithTournamentId;
          try {
            if (tournament.start_date) {
              const schedulingOptions = {
                matchDurationMinutes,
                concurrentMatches: concurrentMatchesOpt,
                bufferMinutes,
              };
              toInsert = generateTournamentSchedule(matchesWithTournamentId as any, tournament.start_date, schedulingOptions) as any;
            }
          } catch (e) {
            console.warn('Scheduling failed, inserting unscheduled matches', e);
          }

          const { error } = await supabase
            .from('matches')
            .insert(toInsert);

        if (error) throw error;

        await supabase
          .from('tournaments')
          .update({ status: 'running' })
          .eq('id', tournament.id);

        onNavigate('tournament-detail', tournament.id);
      }
    } catch (error: any) {
      console.error('Error generating bracket:', error);
      toast.error(error?.message || 'Failed to generate bracket');
    } finally {
      setGenerating(false);
    }
  };

  const updateTournamentStatus = async (status: string) => {
    await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', tournamentId);

    fetchData();
  };

  const removeParticipant = async (participantId: string) => {
    await supabase
      .from('tournament_participants')
      .delete()
      .eq('id', participantId);

    if (tournament) {
      await supabase
        .from('tournaments')
        .update({ current_participants: tournament.current_participants - 1 })
        .eq('id', tournament.id);
    }

    fetchData();
  };

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('tournament-detail', tournament.id)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tournament
        </button>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
              <p className="text-slate-400">Tournament Management</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateTournamentStatus('registration_open')}
                disabled={tournament.status === 'registration_open'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Open Registration
              </button>
              <button
                onClick={() => updateTournamentStatus('running')}
                disabled={tournament.status === 'running'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Start Tournament
              </button>
              <button
                onClick={() => updateTournamentStatus('completed')}
                disabled={tournament.status === 'completed'}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Complete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-blue-400" size={24} />
                <h3 className="text-slate-300 font-medium">Participants</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {participants.length}/{tournament.max_participants}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="text-yellow-400" size={24} />
                <h3 className="text-slate-300 font-medium">Status</h3>
              </div>
              <p className="text-2xl font-bold text-white capitalize">
                {tournament.status.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Play className="text-green-400" size={24} />
                <h3 className="text-slate-300 font-medium">Format</h3>
              </div>
              <p className="text-xl font-bold text-white">
                {tournament.format.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Seeding & Bracket</h2>
              <div className="flex gap-3">
                <button
                  onClick={assignSeeds}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  Auto-Assign Seeds
                </button>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-300">Match Min</label>
                    <input
                      type="number"
                      min={5}
                      value={matchDurationMinutes}
                      onChange={(e) => setMatchDurationMinutes(parseInt(e.target.value || '45'))}
                      className="w-20 px-2 py-1 rounded bg-slate-800 text-white border border-blue-500/20 text-sm"
                    />
                    <label className="text-sm text-slate-300">Concurrent</label>
                    <input
                      type="number"
                      min={1}
                      value={concurrentMatchesOpt}
                      onChange={(e) => setConcurrentMatchesOpt(parseInt(e.target.value || '2'))}
                      className="w-16 px-2 py-1 rounded bg-slate-800 text-white border border-blue-500/20 text-sm"
                    />
                    <label className="text-sm text-slate-300">Buffer</label>
                    <input
                      type="number"
                      min={0}
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(parseInt(e.target.value || '10'))}
                      className="w-16 px-2 py-1 rounded bg-slate-800 text-white border border-blue-500/20 text-sm"
                    />
                  </div>

                  <button
                    onClick={generateBracket}
                    disabled={generating || participants.length < 2}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/40 text-sm font-semibold"
                  >
                    {generating ? 'Generating...' : 'Generate Bracket'}
                  </button>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Assign seeds to participants and generate the tournament bracket when ready
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Participants ({participants.length})
            </h2>

            {participants.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-blue-500/20">
                <Users size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No participants registered yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {participant.seed || index + 1}
                        </span>
                      </div>

                      <div>
                        {tournament.participant_type === 'team' && participant.team ? (
                          <>
                            <h3 className="font-bold text-white text-lg">
                              {participant.team.name}
                            </h3>
                            <p className="text-sm text-slate-400">{participant.team.tag}</p>
                          </>
                        ) : participant.user ? (
                          <>
                            <h3 className="font-bold text-white text-lg">
                              {participant.user.username}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {participant.user.region || 'No region'}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        participant.status === 'winner' ? 'bg-yellow-500/20 text-yellow-400' :
                        participant.status === 'checked_in' ? 'bg-green-500/20 text-green-400' :
                        participant.status === 'eliminated' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {participant.status}
                      </span>

                      <button
                        onClick={() => removeParticipant(participant.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
