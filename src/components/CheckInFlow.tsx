import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tournament, TournamentParticipant, CheckIn } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CheckInFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  participant: TournamentParticipant;
  onCheckInComplete: () => void;
}

export default function CheckInFlow({
  isOpen,
  onClose,
  tournament,
  participant,
  onCheckInComplete,
}: CheckInFlowProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckIn | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<'pending' | 'open' | 'closed'>('pending');
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkCheckInStatus();
      const interval = setInterval(checkCheckInStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, tournament]);

  useEffect(() => {
    if (isOpen && tournament) {
      const interval = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, tournament]);

  const checkCheckInStatus = async () => {
    const startTime = new Date(tournament.start_date);
    const now = new Date();
    const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);

    const checkInWindowMinutes = tournament.checkin_window_minutes || 30;

    if (minutesUntilStart > checkInWindowMinutes) {
      setCheckInStatus('pending');
    } else if (minutesUntilStart > 0) {
      setCheckInStatus('open');
    } else {
      setCheckInStatus('closed');
    }

    const { data: existingCheckIn } = await supabase
      .from('check_ins')
      .select('*')
      .eq('tournament_id', tournament.id)
      .eq('participant_id', participant.id)
      .maybeSingle();

    if (existingCheckIn) {
      setCheckInData(existingCheckIn);
      setSuccess(true);
    }
  };

  const updateTimeRemaining = () => {
    const startTime = new Date(tournament.start_date);
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Check-in window closed');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('check_ins')
        .insert({
          tournament_id: tournament.id,
          participant_id: participant.id,
          checked_in_by: user.id,
        });

      if (insertError) throw insertError;

      await supabase
        .from('tournament_participants')
        .update({ status: 'checked_in' })
        .eq('id', participant.id);

      setSuccess(true);
      onCheckInComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const participantName = participant.team?.name || participant.user?.username || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-xl max-w-md w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          {success ? (
            <>
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Check-In Confirmed!</h2>
              <p className="text-slate-400">You're all set for the tournament.</p>
            </>
          ) : checkInStatus === 'closed' ? (
            <>
              <AlertCircle size={56} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Check-In Closed</h2>
              <p className="text-slate-400">The check-in window has ended.</p>
            </>
          ) : checkInStatus === 'pending' ? (
            <>
              <Clock size={56} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Check-In Not Available Yet</h2>
              <p className="text-slate-400">Check-in opens 30 minutes before the tournament.</p>
            </>
          ) : (
            <>
              <Clock size={56} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Check In?</h2>
              <p className="text-slate-400">Confirm your participation in the tournament.</p>
            </>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-blue-500/20">
          <div className="mb-3">
            <p className="text-sm text-slate-400 mb-1">Team/Player</p>
            <p className="text-lg font-bold text-white">{participantName}</p>
          </div>
          <div className="mb-3">
            <p className="text-sm text-slate-400 mb-1">Tournament</p>
            <p className="text-lg font-bold text-white">{tournament.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Start Time</p>
            <p className="text-lg font-bold text-white">
              {new Date(tournament.start_date).toLocaleString()}
            </p>
          </div>
        </div>

        {(checkInStatus === 'open' || checkInStatus === 'pending') && (
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-400">
              {checkInStatus === 'open'
                ? `⏰ ${timeRemaining}`
                : 'Check-in window not yet open'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {checkInData && (
          <div className="mb-6 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Checked in at:</p>
            <p>{new Date(checkInData.checked_in_at).toLocaleString()}</p>
          </div>
        )}

        <div className="flex gap-3">
          {success || checkInStatus === 'closed' ? (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          ) : checkInStatus === 'pending' ? (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/40"
              >
                {loading ? 'Checking In...' : 'Check In Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
