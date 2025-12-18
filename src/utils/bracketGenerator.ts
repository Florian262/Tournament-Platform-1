import { TournamentParticipant, Match } from '../types';

function seededPairs(participants: TournamentParticipant[]) {
  const n = participants.length;
  const pairs: Array<[TournamentParticipant | null, TournamentParticipant | null]> = [];

  for (let i = 0; i < Math.ceil(n / 2); i++) {
    const a = participants[i] ?? null;
    const b = participants[n - 1 - i] ?? null;
    pairs.push([a, b]);
  }

  return pairs;
}

export function generateSingleElimination(participants: TournamentParticipant[], tournamentId?: string): Match[] {
  // ensure participants ordered by seed ascending (1 = highest seed)
  const ordered = [...participants].sort((a, b) => {
    const sa = a.seed ?? 9999;
    const sb = b.seed ?? 9999;
    return sa - sb;
  });

  const pairs = seededPairs(ordered);

  const matches: Match[] = [];
  let matchNumber = 1;

  // Round 1
  pairs.forEach(([p1, p2]) => {
    const isBye = !p2 || !p1;
    const status = isBye ? 'completed' : 'pending';
    const winner_id = isBye ? (p1 ? p1.id : p2 ? p2.id : null) : null;

    matches.push({
      id: `g-${1}-${matchNumber}`,
      tournament_id: tournamentId ?? '',
      round: 1,
      match_number: matchNumber,
      bracket_position: null,
      participant1_id: p1 ? p1.id : null,
      participant2_id: p2 ? p2.id : null,
      winner_id: winner_id ?? null,
      status: status as any,
      scheduled_at: null,
      started_at: null,
      completed_at: null,
      stream_url: null,
      created_at: new Date().toISOString(),
      participant1: p1 ?? undefined,
      participant2: p2 ?? undefined,
      winner: undefined,
    });
    matchNumber++;
  });

  // Generate subsequent empty rounds
  let matchesThisRound = pairs.length;
  let round = 2;
  while (matchesThisRound > 1) {
    const nextMatches = Math.ceil(matchesThisRound / 2);
    for (let i = 0; i < nextMatches; i++) {
      matches.push({
        id: `g-${round}-${i + 1}`,
        tournament_id: tournamentId ?? '',
        round,
        match_number: i + 1,
        bracket_position: null,
        participant1_id: null,
        participant2_id: null,
        winner_id: null,
        status: 'pending',
        scheduled_at: null,
        started_at: null,
        completed_at: null,
        stream_url: null,
        created_at: new Date().toISOString(),
      });
    }

    matchesThisRound = nextMatches;
    round++;
  }

  return matches;
}

export default generateSingleElimination;

export const generateSingleEliminationBracket = generateSingleElimination;

export function generateDoubleEliminationBracket(participants: TournamentParticipant[], tournamentId?: string) {
  // For now, return the winners bracket layout; full double-elimination support can be added later.
  return generateSingleElimination(participants, tournamentId);
}

export function generateRoundRobinMatches(participants: TournamentParticipant[]) {
  const results: Match[] = [];
  let matchNumber = 1;
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const p1 = participants[i];
      const p2 = participants[j];
      results.push({
        id: `rr-1-${matchNumber}`,
        tournament_id: p1.tournament_id ?? '',
        round: 1,
        match_number: matchNumber,
        bracket_position: null,
        participant1_id: p1.id,
        participant2_id: p2.id,
        winner_id: null,
        status: 'pending',
        scheduled_at: null,
        started_at: null,
        completed_at: null,
        stream_url: null,
        created_at: new Date().toISOString(),
        participant1: p1,
        participant2: p2,
      });
      matchNumber++;
    }
  }
  return results;
}
