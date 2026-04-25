import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';

export function useTournaments(filters?: {
  gameId?: string;
  status?: string;
  region?: string;
  platform?: string;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select('*, game:games(*), organizer:user_profiles(*)')
        .order('start_date', { ascending: true });

      if (filters?.gameId) {
        query = query.eq('game_id', filters.gameId);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.region && filters.region !== 'all') {
        query = query.eq('region', filters.region);
      }
      if (filters?.platform && filters.platform !== 'all') {
        query = query.filter('game.platform', 'eq', filters.platform);
      }
      if (filters?.searchQuery) {
        query = query.ilike('name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Tournament[];
    },
  });
}
