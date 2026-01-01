import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type MealType = Database['public']['Enums']['meal_type'];

export const useNutritionPlan = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nutrition_plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select(`
          *,
          meals (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateNutritionPlan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: { 
      name?: string; 
      daily_calories?: number; 
      protein_grams?: number;
      carbs_grams?: number;
      fat_grams?: number;
    }) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('nutrition_plans')
        .insert({
          user_id: user.id,
          name: plan.name || 'Mi Plan Nutricional',
          daily_calories: plan.daily_calories,
          protein_grams: plan.protein_grams,
          carbs_grams: plan.carbs_grams,
          fat_grams: plan.fat_grams,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_plan'] });
    },
  });
};

export const useCreateMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: { 
      nutrition_plan_id: string;
      name: string;
      meal_type: MealType;
      calories?: number;
      protein_grams?: number;
      carbs_grams?: number;
      fat_grams?: number;
      scheduled_time?: string;
      ingredients?: any[];
    }) => {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          nutrition_plan_id: meal.nutrition_plan_id,
          name: meal.name,
          meal_type: meal.meal_type,
          calories: meal.calories,
          protein_grams: meal.protein_grams,
          carbs_grams: meal.carbs_grams,
          fat_grams: meal.fat_grams,
          scheduled_time: meal.scheduled_time,
          ingredients: meal.ingredients || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_plan'] });
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string) => {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_plan'] });
    },
  });
};

export const useMealLogs = (date: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meal_logs', user?.id, date],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useToggleMeal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, date, completed }: { mealId: string; date: string; completed: boolean }) => {
      if (!user?.id) throw new Error('No user');

      // Check if log exists
      const { data: existing } = await supabase
        .from('meal_logs')
        .select('id')
        .eq('meal_id', mealId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('meal_logs')
          .update({ 
            completed, 
            completed_at: completed ? new Date().toISOString() : null 
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meal_logs')
          .insert({
            meal_id: mealId,
            user_id: user.id,
            date,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal_logs', user?.id, variables.date] });
    },
  });
};

export const useHydrationLog = (date: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hydration_log', user?.id, date],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateHydration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, amount }: { date: string; amount: number }) => {
      if (!user?.id) throw new Error('No user');

      // Check if log exists
      const { data: existing } = await supabase
        .from('hydration_logs')
        .select('id, consumed_ml')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('hydration_logs')
          .update({ consumed_ml: (existing.consumed_ml || 0) + amount })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hydration_logs')
          .insert({
            user_id: user.id,
            date,
            consumed_ml: amount,
            target_ml: 3000,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hydration_log', user?.id, variables.date] });
    },
  });
};
