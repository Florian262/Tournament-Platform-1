import { useState } from 'react';
import { Match, TournamentParticipant } from '../../types';
import MatchCard from './MatchCard';
import MatchResultSubmission from './MatchResultSubmission';
import { useAuth } from '../../contexts/AuthContext';
import { Clock } from 'lucide-react';

interface ScheduleTabProps {
  matches: Match[];
  participants: TournamentParticipant[];
  onRefresh: () => void;
  isOrganizer?: boolean;
}

function roundLabel(round: number, maxRound: number) {
  if (round === maxRound) return 'Grand Final';
  if (round === maxRound - 1) return 'Semi-Finals';
  if (round === maxRound - 2) return 'Quarter-Finals';
  return `Round ${round}`;
}

export default function ScheduleTab({ matches, participants, onRefresh, isOrganizer }: ScheduleTabProps) {
  const { profile } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const scheduled = matches.slice().sort((a, b) => {
    if (a.scheduled_at && b.scheduled_at) {
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    }
    return a.match_number - b.match_number;
  });

  if (scheduled.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
        <Clock size={48} className="text-slate-800 mx-auto mb-4" />
        <h3 className="text-xl font-black uppercase italic text-slate-500">No Matches Scheduled</h3>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">The tournament grid has not been deployed yet.</p>
      </div>
    );
  }

  const rounds = Array.from(new Set(scheduled.map(m => m.round))).sort((a, b) => a - b);
  const maxRound = Math.max(...rounds);

  const handleMatchClick = (match: Match) => {
    if (isOrganizer || profile?.role === 'admin') {
      setSelectedMatch(match);
    }
  };

  return (
    <div className="space-y-12">
      {rounds.map(round => (
        <div key={round}>
          <div className="flex items-center gap-4 mb-6">
             <div className="h-px flex-1 bg-white/5" />
             <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] italic">{roundLabel(round, maxRound)}</h3>
             <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduled.filter(m => m.round === round).map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onClick={() => handleMatchClick(match)}
              />
            ))}
          </div>
        </div>
      ))}

      {selectedMatch && (
        <MatchResultSubmission
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          match={selectedMatch}
          participants={participants}
          allowParticipantSubmission={false}
          onResultSubmitted={() => {
            setSelectedMatch(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
