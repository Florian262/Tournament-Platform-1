import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Match, TournamentParticipant, MatchResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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
  allowParticipantSubmission,
  onResultSubmitted,
}: MatchResultSubmissionProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);

  const [scores, setScores] = useState({
    participant1Score: '',
    participant2Score: '',
    notes: '',
  });

  const participant1 = participants.find(p => p.id === match.participant1_id);
  const participant2 = participants.find(p => p.id === match.participant2_id);

  const canSubmit =
    profile?.role === 'organizer' ||
    (allowParticipantSubmission && (
      user?.id === participant1?.user_id ||
      user?.id === participant2?.user_id ||
      participant1?.team?.owner_id === user?.id ||
      participant2?.team?.owner_id === user?.id
    ));

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

    if (data) {
      setResults(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !participant1 || !participant2) return;

    setLoading(true);
    setError('');

    try {
      const participant1Score = parseInt(scores.participant1Score, 10);
      const participant2Score = parseInt(scores.participant2Score, 10);

      if (isNaN(participant1Score) || isNaN(participant2Score)) {
        throw new Error('Please enter valid scores');
      }

      const winnerId = participant1Score > participant2Score
        ? participant1.id
        : participant2Score > participant1Score
        ? participant2.id
        : null;

      const resultData = [
        {
          match_id: match.id,
          participant_id: participant1.id,
          score: participant1Score,
          stats: { notes: scores.notes },
          submitted_by: user.id,
        },
        {
          match_id: match.id,
          participant_id: participant2.id,
          score: participant2Score,
          stats: { notes: scores.notes },
          submitted_by: user.id,
        },
      ];

      const { error: resultError } = await supabase
        .from('match_results')
        .insert(resultData);

      if (resultError) throw resultError;

      await supabase
        .from('matches')
        .update({
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      const { error: logError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'match_result_submitted',
          actor_id: user.id,
          resource_type: 'match',
          resource_id: match.id,
          details: {
            participant1_score: participant1Score,
            participant2_score: participant2Score,
            winner_id: winnerId,
          },
        });

      if (logError) {
        console.error('Audit log error:', logError);
        toast.error('Failed to record audit log');
      }

      setSuccess(true);
      onResultSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit result');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !participant1 || !participant2) return null;

  if (!canSubmit) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-md w-full p-8 relative shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center">
            <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Not Authorized</h2>
            <p className="text-slate-400">
              You don't have permission to submit results for this match.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-2xl w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {success ? (
          <div className="text-center">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Result Submitted!</h2>
            <p className="text-slate-400 mb-6">The match result has been recorded and bracket updated in real-time.</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/40"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Submit Match Result</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                  <p className="text-sm text-slate-400 mb-2">
                    {participant1.team?.name || participant1.user?.username}
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={scores.participant1Score}
                    onChange={(e) =>
                      setScores({ ...scores, participant1Score: e.target.value })
                    }
                    className="w-full text-center text-3xl font-bold px-2 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-3xl font-bold text-slate-500">VS</div>
              </div>

              <div className="text-center">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                  <p className="text-sm text-slate-400 mb-2">
                    {participant2.team?.name || participant2.user?.username}
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={scores.participant2Score}
                    onChange={(e) =>
                      setScores({ ...scores, participant2Score: e.target.value })
                    }
                    className="w-full text-center text-3xl font-bold px-2 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={scores.notes}
                onChange={(e) => setScores({ ...scores, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional details about the match..."
              />
            </div>

            {results.length > 0 && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg text-sm">
                Result already submitted. Submitting again will update the previous result.
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/40 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {loading ? 'Submitting...' : 'Submit Result'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
