import { User, Trophy, Activity, Clock } from 'lucide-react';
import { Match } from '../../types';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const p1 = match.participant1;
  const p2 = match.participant2;

  const results = match.match_results || [];
  const p1Score = results.find((r: any) => r.participant_id === match.participant1_id)?.score || 0;
  const p2Score = results.find((r: any) => r.participant_id === match.participant2_id)?.score || 0;

  const getStatusDisplay = () => {
    switch (match.status) {
      case 'completed':
        return { label: 'Final', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Trophy };
      case 'in_progress':
        return { label: 'Live', color: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse', icon: Activity };
      default:
        return { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock };
    }
  };

  const status = getStatusDisplay();

  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 transition-all group ${
        onClick ? 'hover:border-blue-500/30 hover:bg-white/5 active:scale-[0.98]' : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
           Match {match.match_number} • Round {match.round}
        </span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${status.color}`}>
           <status.icon size={10} />
           {status.label}
        </div>
      </div>

      <div className="space-y-3">
        {/* Participant 1 */}
        <div className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all ${
          match.winner_id === p1?.id ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-white/5 border border-transparent'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-slate-950">
                {p1?.team?.logo_url ? (
                   <img src={p1.team.logo_url} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <User size={14} />
                   </div>
                )}
             </div>
             <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase italic truncate ${match.winner_id === p1?.id ? 'text-white' : 'text-slate-400'}`}>
                   {p1?.team?.name || p1?.user?.username || 'TBD'}
                </p>
                <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">
                   {p1?.team?.tag ? `[${p1.team.tag}]` : 'Participant'}
                </p>
             </div>
          </div>
          {match.status === 'completed' && (
             <span className="text-sm font-black italic text-white pr-2">{p1Score}</span>
          )}
        </div>

        <div className="flex items-center justify-center -my-1">
           <span className="text-[8px] font-black text-slate-700 italic">VS</span>
        </div>

        {/* Participant 2 */}
        <div className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all ${
          match.winner_id === p2?.id ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-white/5 border border-transparent'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-slate-950">
                {p2?.team?.logo_url ? (
                   <img src={p2.team.logo_url} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <User size={14} />
                   </div>
                )}
             </div>
             <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase italic truncate ${match.winner_id === p2?.id ? 'text-white' : 'text-slate-400'}`}>
                   {p2?.team?.name || p2?.user?.username || 'TBD'}
                </p>
                <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">
                   {p2?.team?.tag ? `[${p2.team.tag}]` : 'Participant'}
                </p>
             </div>
          </div>
          {match.status === 'completed' && (
             <span className="text-sm font-black italic text-white pr-2">{p2Score}</span>
          )}
        </div>
      </div>
    </button>
  );
}
