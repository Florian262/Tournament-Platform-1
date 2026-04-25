import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Game } from '../types';

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Game[];
    },
  });
}
