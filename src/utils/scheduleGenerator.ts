import { Match } from '../types';

export interface ScheduleOptions {
  matchDurationMinutes: number;
  concurrentMatches: number;
  bufferMinutes?: number;
}

export function generateTournamentSchedule(
  matches: Match[],
  tournamentStartTime: string,
  options: ScheduleOptions,
): Match[] {
  const { matchDurationMinutes, concurrentMatches, bufferMinutes = 0 } = options;

  // Group matches by round
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

  const scheduled: Match[] = matches.map(m => ({ ...m }));

  let currentRoundStart = new Date(tournamentStartTime);

  for (const round of rounds) {
    const roundMatches = scheduled.filter(m => m.round === round).sort((a, b) => a.match_number - b.match_number);

    // For this round, schedule matches in batches according to concurrency
    const batches = Math.ceil(roundMatches.length / concurrentMatches);

    for (let i = 0; i < roundMatches.length; i++) {
      const batchIndex = Math.floor(i / concurrentMatches);
      const start = new Date(currentRoundStart.getTime() + batchIndex * (matchDurationMinutes + bufferMinutes) * 60000);
      const end = new Date(start.getTime() + matchDurationMinutes * 60000);

      roundMatches[i].scheduled_at = start.toISOString();
      // attach end time into `completed_at` as a scheduling placeholder (UI reads scheduled_at)
      (roundMatches[i] as any).end_time = end.toISOString();
    }

    // compute duration for the whole round to start next round after
    const roundDurationMinutes = batches * (matchDurationMinutes + bufferMinutes);
    currentRoundStart = new Date(currentRoundStart.getTime() + roundDurationMinutes * 60000);
  }

  return scheduled;
}

export default generateTournamentSchedule;
