import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FoodPreferences {
  id: string;
  user_id: string;
  preference: string;
  liked_foods: string | null;
  disliked_foods: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateFoodPreferencesData {
  preference: string;
  liked_foods?: string;
  disliked_foods?: string;
  allergies?: string;
}

export const useFoodPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['food_preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('food_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as FoodPreferences | null;
    },
    enabled: !!user?.id,
  });
};

export const useCreateFoodPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFoodPreferencesData) => {
      if (!user?.id) throw new Error('No user');
      
      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('food_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data: updated, error } = await supabase
          .from('food_preferences')
          .update({
            preference: data.preference,
            liked_foods: data.liked_foods || null,
            disliked_foods: data.disliked_foods || null,
            allergies: data.allergies || null,
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return updated;
      } else {
        // Create new
        const { data: created, error } = await supabase
          .from('food_preferences')
          .insert({
            user_id: user.id,
            preference: data.preference,
            liked_foods: data.liked_foods || null,
            disliked_foods: data.disliked_foods || null,
            allergies: data.allergies || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food_preferences'] });
    },
  });
};

export const useUpdateFoodPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<CreateFoodPreferencesData>) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('food_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food_preferences'] });
    },
  });
};