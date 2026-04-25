import { useLiveMatches } from '../hooks/useLiveMatches';
import { Trophy, Activity } from 'lucide-react';

export default function LiveTicker() {
  const { data: matches = [], isLoading } = useLiveMatches();

  if (isLoading || matches.length === 0) return null;

  // Double the matches to ensure a seamless infinite scroll
  const displayMatches = [...matches, ...matches];

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/80 backdrop-blur-md border-b border-white/5 h-8 overflow-hidden pointer-events-auto">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
        {/* Fixed "LIVE" Indicator */}
        <div className="flex items-center gap-2 px-3 bg-red-600 h-full relative z-10 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
           <Activity size={12} className="text-white animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Live</span>
        </div>

        {/* Scrolling Content */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-ticker">
            {displayMatches.map((match, idx) => (
              <div 
                key={`${match.id}-${idx}`}
                className="flex items-center gap-6 px-8 border-r border-white/5"
              >
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic whitespace-nowrap">
                  {match.tournament}
                </span>
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.1em] whitespace-nowrap">
                  {match.summary}
                </span>
                <Trophy size={12} className="text-amber-500/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
