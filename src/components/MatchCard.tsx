import { User } from 'lucide-react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const p1 = match.participant1;
  const p2 = match.participant2;

  const statusColor = match.status === 'completed' ? 'bg-green-500/20 text-green-400' : match.status === 'in_progress' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/10 text-slate-400';

  return (
    <div className="bg-slate-800/50 border border-blue-500/10 rounded-xl p-3 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">Match {match.match_number}</div>
        <div className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>{match.status.replace('_', ' ')}</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {p1?.team?.logo_url ? (
            <img src={p1.team.logo_url} className="w-8 h-8 rounded-md object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center"><User size={12} /></div>
          )}
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{p1?.team?.name || p1?.user?.username || 'TBD'}</div>
            {typeof (p1 as any)?.seed === 'number' && <div className="text-xs text-slate-400">Seed {(p1 as any).seed}</div>}
          </div>
          <div className="text-white font-bold">{/* score placeholder */}</div>
        </div>

        <div className="flex items-center gap-3">
          {p2?.team?.logo_url ? (
            <img src={p2.team.logo_url} className="w-8 h-8 rounded-md object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center"><User size={12} /></div>
          )}
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{p2?.team?.name || p2?.user?.username || 'TBD'}</div>
            {typeof (p2 as any)?.seed === 'number' && <div className="text-xs text-slate-400">Seed {(p2 as any).seed}</div>}
          </div>
          <div className="text-white font-bold">{/* score placeholder */}</div>
        </div>
      </div>
    </div>
  );
}
