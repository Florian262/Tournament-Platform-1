import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ProScoutingPost, ScoutingPostType } from '../types';
import toast from 'react-hot-toast';

export function useScoutingPosts(type?: ScoutingPostType, gameId?: string) {
  return useQuery({
    queryKey: ['scouting-posts', type, gameId],
    queryFn: async () => {
      let query = supabase
        .from('scouting_posts')
        .select('*, user:user_profiles(*), team:teams(*), game:games(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (type) query = query.eq('type', type);
      if (gameId) query = query.eq('game_id', gameId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProScoutingPost[];
    },
  });
}

export function useScoutingMutations() {
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async (post: Partial<ProScoutingPost>) => {
      const { data, error } = await supabase
        .from('scouting_posts')
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouting-posts'] });
      toast.success('Listing published to hub');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to publish listing');
    }
  });

  const resolvePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scouting_posts')
        .update({ status: 'fulfilled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouting-posts'] });
      toast.success('Listing marked as fulfilled');
    }
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scouting_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouting-posts'] });
      toast.success('Listing removed');
    }
  });

  return { createPost, resolvePost, deletePost };
}
