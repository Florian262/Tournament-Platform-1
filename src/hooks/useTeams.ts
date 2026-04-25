import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Team } from '../types';

export function useTeams(gameId?: string) {
  return useQuery({
    queryKey: ['teams', { gameId }],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('*, game:games(*), owner:user_profiles(*)');

      if (gameId) {
        query = query.eq('game_id', gameId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Team[];
    },
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*, game:games(*), owner:user_profiles(*)')
        .eq('id', teamId)
        .maybeSingle();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, user:user_profiles(*)')
        .eq('team_id', teamId);

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

export function useUserTeams(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-owned-teams', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get teams where user is owner
      const { data: ownedTeams, error: ownerError } = await supabase
        .from('teams')
        .select('*, game:games(*)')
        .eq('owner_id', userId);

      if (ownerError) throw ownerError;

      // Get teams where user is a captain in team_members
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select('team:teams(*, game:games(*))')
        .eq('user_id', userId)
        .eq('role', 'captain');

      if (memberError) throw memberError;

      // Combine and unique by ID
      const combined = [
        ...(ownedTeams || []),
        ...(memberTeams?.map(m => m.team) || [])
      ].filter((team, index, self) => 
        team && self.findIndex(t => t?.id === team.id) === index
      );

      return combined as Team[];
    },
    enabled: !!userId,
  });
}
