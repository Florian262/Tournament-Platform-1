import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNotifications } from './useNotifications';
import toast from 'react-hot-toast';

export function useTeamInvites(teamId?: string) {
  return useQuery({
    queryKey: ['team-invites', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*, invited:user_profiles!invited_user_id(*)')
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

export function useUserInvites(userId?: string) {
  return useQuery({
    queryKey: ['user-invites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('team_invites')
        .select('*, team:teams(*, game:games(*))')
        .eq('invited_user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useInviteMutations() {
  const queryClient = useQueryClient();
  const { sendNotification } = useNotifications();

  const sendInvite = useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string, userId: string, role?: string }) => {
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      
      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          invited_user_id: userId,
          role: role || 'player',
          inviter_id: currentUserId
        })
        .select('*, team:teams(name)')
        .single();

      if (error) throw error;

      // Trigger Notification
      await sendNotification.mutateAsync({
        user_id: userId,
        type: 'invite',
        title: 'New Roster Draft',
        message: `You have been drafted to join ${data.team.name} as a ${role || 'player'}.`,
        link: `team-profile/${teamId}`
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites'] });
      toast.success('Invitation sent!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send invite');
    }
  });

  const requestToJoin = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string, userId: string }) => {
      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          invited_user_id: userId,
          inviter_id: userId,
          role: 'player',
        })
        .select('*, team:teams(name, owner_id)')
        .single();

      if (error) throw error;

      // Notify the team owner
      await sendNotification.mutateAsync({
        user_id: data.team.owner_id,
        type: 'invite',
        title: 'Draft Request',
        message: `A player has requested to join ${data.team.name}.`,
        link: `team-profile/${teamId}`
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites'] });
      toast.success('Join request sent!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send join request');
    }
  });

  const respondToInvite = useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string, status: 'accepted' | 'rejected' }) => {
      const { data: invite, error: fetchError } = await supabase
        .from('team_invites')
        .select('*, team:teams(name, owner_id)')
        .eq('id', inviteId)
        .single();
      
      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('team_invites')
        .update({ 
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId);

      if (error) throw error;

      if (status === 'accepted') {
        await supabase
          .from('team_members')
          .upsert({
            team_id: invite.team_id,
            user_id: invite.invited_user_id,
            role: invite.role,
          }, { onConflict: 'team_id, user_id' });
      }

      // Notify the inviter/owner about the response
      await sendNotification.mutateAsync({
        user_id: invite.inviter_id || invite.team.owner_id,
        type: 'system',
        title: 'Personnel Update',
        message: `Your draft request to ${invite.team.name} was ${status}.`,
        link: `team-profile/${invite.team_id}`
      });

      return { status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Invitation updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to respond to invite');
    }
  });

  return { sendInvite, respondToInvite, requestToJoin };
}
