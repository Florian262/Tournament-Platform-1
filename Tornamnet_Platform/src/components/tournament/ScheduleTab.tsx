import { Match } from '../../types';
import { formatInUserTZ, formatTimeOnlyInUserTZ, relativeTimeFromNow } from '../../utils/time';
import { Clock } from 'lucide-react';

interface ScheduleTabProps {
  matches: Match[];
}

function roundLabel(round: number, maxRound: number) {
  if (round === maxRound) return 'Final';
  if (round === maxRound - 1) return 'Semi-Finals';
  if (round === maxRound - 2) return 'Quarter-Finals';
  const size = Math.pow(2, maxRound - round + 1);
  return `Round of ${size}`;
}

export default function ScheduleTab({ matches }: ScheduleTabProps) {
  const scheduled = matches.filter(m => m.scheduled_at).slice().sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  if (scheduled.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No matches scheduled yet</p>
      </div>
    );
  }

  const uniqueDays = Array.from(new Set(scheduled.map(m => new Date(m.scheduled_at!).toDateString())));
  const groupByDay = uniqueDays.length > 1;

  if (groupByDay) {
    const byDay: Record<string, Match[]> = {};
    scheduled.forEach(m => {
      const day = new Date(m.scheduled_at!).toDateString();
      byDay[day] = byDay[day] || [];
      byDay[day].push(m);
    });

    return (
      <div className="space-y-6">
        {Object.keys(byDay).map(day => (
          <div key={day}>
            <h3 className="text-xl font-bold text-blue-400 mb-2">{new Date(day).toDateString()}</h3>
            <div className="space-y-2">
              {byDay[day].map(match => {
                const start = match.scheduled_at ? new Date(match.scheduled_at) : null;
                const end = (match as any).end_time ? new Date((match as any).end_time) : null;
                const now = Date.now();
                const isLive = match.status === 'in_progress' || (start && end && now >= start.getTime() && now <= end.getTime());
                const status = isLive ? 'Live' : (match.status === 'completed' ? 'Completed' : 'Upcoming');

                const p1 = match.participant1?.team?.name || match.participant1?.user?.username || 'TBD';
                const p2 = match.participant2?.team?.name || match.participant2?.user?.username || 'TBD';

                return (
                  <div key={match.id} className={`flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border ${isLive ? 'border-red-500/60 shadow-md' : 'border-blue-500/10'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-300">{formatTimeOnlyInUserTZ(match.scheduled_at)}</div>
                      <div>
                        <div className="text-white font-medium">{p1} <span className="text-slate-400">vs</span> {p2}</div>
                        <div className="text-xs text-slate-400">{formatInUserTZ(match.scheduled_at)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isLive && <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
                      <div className={`text-xs px-2 py-0.5 rounded ${status === 'Live' ? 'bg-red-500/20 text-red-400' : status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{status}</div>
                      {status === 'Upcoming' && Math.abs(new Date(match.scheduled_at!).getTime() - Date.now()) < 24 * 3600 * 1000 && (
                        <div className="text-xs text-slate-400">{relativeTimeFromNow(match.scheduled_at)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group by round
  const rounds = Array.from(new Set(scheduled.map(m => m.round))).sort((a, b) => a - b);
  const maxRound = Math.max(...rounds);

  return (
    <div className="space-y-6">
      {rounds.map(round => (
        <div key={round}>
          <h3 className="text-xl font-bold text-blue-400 mb-2">{roundLabel(round, maxRound)}</h3>
          <div className="space-y-2">
            {scheduled.filter(m => m.round === round).map(match => {
              const start = match.scheduled_at ? new Date(match.scheduled_at) : null;
              const end = (match as any).end_time ? new Date((match as any).end_time) : null;
              const now = Date.now();
              const isLive = match.status === 'in_progress' || (start && end && now >= start.getTime() && now <= end.getTime());
              const status = isLive ? 'Live' : (match.status === 'completed' ? 'Completed' : 'Upcoming');

              const p1 = match.participant1?.team?.name || match.participant1?.user?.username || 'TBD';
              const p2 = match.participant2?.team?.name || match.participant2?.user?.username || 'TBD';

              return (
                <div key={match.id} className={`flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border ${isLive ? 'border-red-500/60 shadow-md' : 'border-blue-500/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-slate-300">{formatTimeOnlyInUserTZ(match.scheduled_at)}</div>
                    <div>
                      <div className="text-white font-medium">{p1} <span className="text-slate-400">vs</span> {p2}</div>
                      <div className="text-xs text-slate-400">{formatInUserTZ(match.scheduled_at)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isLive && <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
                    <div className={`text-xs px-2 py-0.5 rounded ${status === 'Live' ? 'bg-red-500/20 text-red-400' : status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{status}</div>
                    {status === 'Upcoming' && Math.abs(new Date(match.scheduled_at!).getTime() - Date.now()) < 24 * 3600 * 1000 && (
                      <div className="text-xs text-slate-400">{relativeTimeFromNow(match.scheduled_at)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
