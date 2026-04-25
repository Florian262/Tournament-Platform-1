import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Match, TournamentParticipant, MatchResult } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface MatchResultSubmissionProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  participants: TournamentParticipant[];
  allowParticipantSubmission: boolean;
  onResultSubmitted: () => void;
}

export default function MatchResultSubmission({
  isOpen,
  onClose,
  match,
  participants,
  onResultSubmitted,
}: MatchResultSubmissionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [scores, setScores] = useState({
    participant1Score: '',
    participant2Score: '',
    notes: '',
  });

  const p1 = participants.find(p => p.id === match.participant1_id);
  const p2 = participants.find(p => p.id === match.participant2_id);

  useEffect(() => {
    if (isOpen) {
      fetchResults();
    }
  }, [isOpen, match.id]);

  const fetchResults = async () => {
    const { data } = await supabase
      .from('match_results')
      .select('*')
      .eq('match_id', match.id);

    if (data && data.length >= 2) {
      setScores({
        participant1Score: data.find((r: MatchResult) => r.participant_id === match.participant1_id)?.score.toString() || '',
        participant2Score: data.find((r: MatchResult) => r.participant_id === match.participant2_id)?.score.toString() || '',
        notes: (data[0].stats as any)?.notes || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !p1 || !p2) return;

    setLoading(true);
    setError('');

    try {
      const s1 = parseInt(scores.participant1Score, 10);
      const s2 = parseInt(scores.participant2Score, 10);

      if (isNaN(s1) || isNaN(s2)) {
        throw new Error('Please enter valid scores for both combatants.');
      }

      const winnerId = s1 > s2 ? p1.id : s2 > s1 ? p2.id : null;

      // Upsert results
      const res1 = { match_id: match.id, participant_id: p1.id, score: s1, stats: { notes: scores.notes }, submitted_by: user.id };
      const res2 = { match_id: match.id, participant_id: p2.id, score: s2, stats: { notes: scores.notes }, submitted_by: user.id };

      const { error: resultError } = await supabase.from('match_results').upsert([res1, res2], { onConflict: 'match_id, participant_id' });
      if (resultError) throw resultError;

      const { error: matchError } = await supabase
        .from('matches')
        .update({
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      if (matchError) throw matchError;

      // Automated Advancement Logic (for Single Elimination)
      try {
        const nextRound = match.round + 1;
        const nextMatchNumber = Math.ceil(match.match_number / 2);
        const isFirstPosition = match.match_number % 2 !== 0;

        // Find the next match in the database
        const { data: nextMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('tournament_id', match.tournament_id)
          .eq('round', nextRound)
          .eq('match_number', nextMatchNumber)
          .maybeSingle();

        if (nextMatch && winnerId) {
          const updateData = isFirstPosition 
            ? { participant1_id: winnerId } 
            : { participant2_id: winnerId };

          await supabase
            .from('matches')
            .update(updateData)
            .eq('id', nextMatch.id);
        }
      } catch (advError) {
        console.warn('Advancement system bypass', advError);
      }

      // Log action
      await supabase.from('audit_logs').insert({
        action: 'finalize_match',
        actor_id: user.id,
        resource_type: 'match',
        resource_id: match.id,
        details: { s1, s2, winnerId }
      });

      setSuccess(true);
      onResultSubmitted();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || !p1 || !p2) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] p-4 flex items-center justify-center animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-2xl w-full p-10 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all hover:rotate-90">
          <X size={24} />
        </button>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
               <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black uppercase italic text-white mb-2">Data Finalized</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-xs leading-loose">
               The match results have been verified and synchronized with the tournament grid.
            </p>
            <button
              onClick={onClose}
              className="mt-10 px-10 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase italic text-xs transition-all hover:scale-105 active:scale-95"
            >
              Return to Base
            </button>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <Trophy size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Result Verification</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Record <span className="text-blue-500">Outcome</span></h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 truncate">
                      {p1.team?.name || p1.user?.username}
                   </p>
                   <input
                    type="number"
                    min="0"
                    value={scores.participant1Score}
                    onChange={(e) => setScores({ ...scores, participant1Score: e.target.value })}
                    className="w-full text-center text-4xl font-black italic bg-slate-950 border border-white/10 rounded-2xl py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                   />
                </div>

                <div className="text-center">
                   <div className="inline-block p-4 rounded-full bg-white/5 border border-white/10">
                      <span className="text-sm font-black italic text-slate-700">VS</span>
                   </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 truncate">
                      {p2.team?.name || p2.user?.username}
                   </p>
                   <input
                    type="number"
                    min="0"
                    value={scores.participant2Score}
                    onChange={(e) => setScores({ ...scores, participant2Score: e.target.value })}
                    className="w-full text-center text-4xl font-black italic bg-slate-950 border border-white/10 rounded-2xl py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                   />
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">After-Action Notes</label>
                 <textarea
                    value={scores.notes}
                    onChange={(e) => setScores({ ...scores, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-800"
                    placeholder="Provide additional context regarding the match execution..."
                 />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic animate-shake">
                  <AlertCircle size={14} className="inline mr-2" />
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                 <button
                   type="button"
                   onClick={onClose}
                   className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-500 rounded-2xl font-black uppercase italic text-xs transition-all"
                 >
                   Abort
                 </button>
                 <button
                   type="submit"
                   disabled={loading}
                   className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic text-xs transition-all shadow-xl shadow-blue-500/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                   <Send size={18} />
                   {loading ? 'Transmitting...' : 'Finalize Result'}
                 </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
