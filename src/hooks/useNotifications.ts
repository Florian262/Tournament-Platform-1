import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          queryClient.setQueryData(['notifications', userId], (old: Notification[] = []) => [
            payload.new as Notification,
            ...old,
          ]);
          toast.success((payload.new as Notification).title, {
            icon: '🔔',
            position: 'top-right',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const sendNotification = useMutation({
    mutationFn: async ({ user_id, type, title, message, link }: Partial<Notification>) => {
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('notifications')
        .insert({ 
          user_id, 
          type, 
          title, 
          message, 
          link,
          created_by: currentUserId
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount: notifications.filter(n => !n.is_read).length,
    markAsRead,
    markAllAsRead,
    sendNotification
  };
}
