import { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Match, TournamentParticipant } from '../../types';
import MatchResultSubmission from './MatchResultSubmission';
import { useAuth } from '../../contexts/AuthContext';

interface MatchNodeData {
  match: Match;
  participants: TournamentParticipant[];
  onMatchClick: (match: Match) => void;
}

const MatchNode = ({ data }: { data: MatchNodeData }) => {
  const { match, participants, onMatchClick } = data;
  
  const p1 = match.participant1 || participants.find(p => p.id === match.participant1_id);
  const p2 = match.participant2 || participants.find(p => p.id === match.participant2_id);

  const results = match.match_results || [];
  const p1Score = results.find(r => r.participant_id === match.participant1_id)?.score || 0;
  const p2Score = results.find(r => r.participant_id === match.participant2_id)?.score || 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'border-slate-500/30 bg-slate-900/50';
      case 'in_progress': return 'border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      default: return 'border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
    }
  };

  return (
    <div 
      onClick={() => onMatchClick(match)}
      className={`px-4 py-3 rounded-2xl border backdrop-blur-xl min-w-[220px] transition-all duration-300 cursor-pointer hover:border-blue-500/50 ${getStatusStyle(match.status)}`}
    >
      <div className="flex flex-col gap-2">
        {/* Participant 1 */}
        <div className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${match.winner_id === p1?.id ? 'bg-blue-500/20 ring-1 ring-blue-500/30' : 'bg-white/5'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-950 border border-white/5">
               {p1?.team?.logo_url ? <img src={p1.team.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-700">?</div>}
            </div>
            <span className={`text-[10px] font-black uppercase italic truncate ${match.winner_id === p1?.id ? 'text-white' : 'text-slate-400'}`}>
              {p1?.team?.name || p1?.user?.username || 'TBD'}
            </span>
          </div>
          {match.status === 'completed' && (
             <span className="text-xs font-black italic text-white">{p1Score}</span>
          )}
        </div>

        <div className="flex items-center justify-center -my-1">
          <span className="text-[8px] font-black italic text-slate-700 uppercase tracking-widest">VS</span>
        </div>

        {/* Participant 2 */}
        <div className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${match.winner_id === p2?.id ? 'bg-blue-500/20 ring-1 ring-blue-500/30' : 'bg-white/5'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-950 border border-white/5">
               {p2?.team?.logo_url ? <img src={p2.team.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-700">?</div>}
            </div>
            <span className={`text-[10px] font-black uppercase italic truncate ${match.winner_id === p2?.id ? 'text-white' : 'text-slate-400'}`}>
              {p2?.team?.name || p2?.user?.username || 'TBD'}
            </span>
          </div>
          {match.status === 'completed' && (
             <span className="text-xs font-black italic text-white">{p2Score}</span>
          )}
        </div>
      </div>
      
      {/* Round/Match Label */}
      <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-slate-950 border border-white/10 rounded-md">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
          M{match.match_number} • R{match.round}
        </span>
      </div>
    </div>
  );
};

const nodeTypes = {
  matchNode: MatchNode,
};

export default function InteractiveBracket({ 
  matches, 
  participants, 
  onRefresh, 
  isOrganizer 
}: { 
  matches: Match[], 
  participants: TournamentParticipant[], 
  onRefresh?: () => void,
  isOrganizer?: boolean
}) {
  const { profile } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { nodes, edges } = useMemo(() => {
    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const X_GAP = 350;
    const Y_GAP = 150;

    const handleNodeClick = (match: Match) => {
       if (isOrganizer || profile?.role === 'admin') {
          setSelectedMatch(match);
       }
    };

    rounds.forEach((round, roundIdx) => {
      const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.match_number - b.match_number);
      const totalRoundMatches = roundMatches.length;
      
      const totalHeight = (totalRoundMatches - 1) * Y_GAP;
      const roundOffset = -totalHeight / 2;

      roundMatches.forEach((match, matchIdx) => {
        const nodeId = match.id;
        
        initialNodes.push({
          id: nodeId,
          type: 'matchNode',
          position: { 
            x: roundIdx * X_GAP, 
            y: roundOffset + (matchIdx * Math.pow(2, roundIdx) * (Y_GAP / Math.pow(2, roundIdx))) 
          },
          data: { match, participants, onMatchClick: handleNodeClick },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        const nextRoundMatchNumber = Math.ceil(match.match_number / 2);
        const nextMatch = matches.find(m => m.round === round + 1 && m.match_number === nextRoundMatchNumber);
        
        if (nextMatch) {
          initialEdges.push({
            id: `e-${match.id}-${nextMatch.id}`,
            source: match.id,
            target: nextMatch.id,
            type: 'step',
            animated: match.status === 'in_progress',
            style: { 
              stroke: match.winner_id ? '#3b82f6' : '#1e293b', 
              strokeWidth: 2,
              opacity: match.winner_id ? 1 : 0.4
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: match.winner_id ? '#3b82f6' : '#1e293b',
            },
          });
        }
      });
    });

    // Refine Y positions
    for (let r = 1; r < rounds.length; r++) {
      const round = rounds[r];
      const currentRoundNodes = initialNodes.filter(n => (n.data as any).match.round === round);
      
      currentRoundNodes.forEach(node => {
        const incomingEdges = initialEdges.filter(e => e.target === node.id);
        if (incomingEdges.length === 2) {
          const parent1 = initialNodes.find(n => n.id === incomingEdges[0].source);
          const parent2 = initialNodes.find(n => n.id === incomingEdges[1].source);
          if (parent1 && parent2) {
            node.position.y = (parent1.position.y + parent2.position.y) / 2;
          }
        }
      });
    }

    return { nodes: initialNodes, edges: initialEdges };
  }, [matches, participants, isOrganizer, profile]);

  return (
    <div className="h-[600px] w-full bg-slate-950/50 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        colorMode="dark"
      >
        <Background color="#1e293b" gap={20} />
        <Controls showInteractive={false} className="bg-slate-900 border-white/10 fill-white" />
      </ReactFlow>
      
      <div className="absolute top-6 left-6 z-10">
        <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-blue-500/20 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic leading-none mb-1">
            Arena Engine
          </p>
          <p className="text-sm font-bold text-white uppercase italic">
            Interactive Bracket
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex gap-2">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live Match</span>
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Completed</span>
         </div>
      </div>

      {selectedMatch && (
        <MatchResultSubmission
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          match={selectedMatch}
          participants={participants}
          allowParticipantSubmission={false}
          onResultSubmitted={() => {
            setSelectedMatch(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
