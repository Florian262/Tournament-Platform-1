import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useLiveMatches() {
  return useQuery({
    queryKey: ['live-matches'],
    queryFn: async () => {
      // Fetch matches in progress
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          participant1_id,
          participant2_id,
          tournament:tournaments(name),
          participant1:tournament_participants!participant1_id(
            team:teams(name, tag),
            user:user_profiles(username)
          ),
          participant2:tournament_participants!participant2_id(
            team:teams(name, tag),
            user:user_profiles(username)
          ),
          match_results(
            participant_id,
            score
          )
        `)
        .eq('status', 'in_progress');

      if (error) throw error;

      // Format for the ticker
      return (matches || []).map(m => {
        // Supabase might return arrays for joins depending on schema/version
        const p1 = Array.isArray(m.participant1) ? m.participant1[0] : m.participant1;
        const p2 = Array.isArray(m.participant2) ? m.participant2[0] : m.participant2;
        const tournament = Array.isArray(m.tournament) ? m.tournament[0] : m.tournament;

        const getParticipantName = (p: any) => {
          const team = Array.isArray(p?.team) ? p.team[0] : p?.team;
          const user = Array.isArray(p?.user) ? p.user[0] : p?.user;
          return team?.name || user?.username || 'TBD';
        };

        const p1Name = getParticipantName(p1);
        const p2Name = getParticipantName(p2);
        
        const p1Score = m.match_results?.find(r => r.participant_id === m.participant1_id)?.score || 0;
        const p2Score = m.match_results?.find(r => r.participant_id === m.participant2_id)?.score || 0;

        return {
          id: m.id,
          summary: `${p1Name} [${p1Score}] vs [${p2Score}] ${p2Name}`,
          tournament: tournament?.name
        };
      });
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
