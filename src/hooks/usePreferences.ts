import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useUpdatePreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      notifications_enabled?: boolean;
      preferred_foods?: string[];
      avoided_foods?: string[];
      dietary_restrictions?: string[];
      preferred_supplements?: string[];
      sleep_quality?: number;
      stress_level?: number;
    }) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences'] });
    },
  });
};
