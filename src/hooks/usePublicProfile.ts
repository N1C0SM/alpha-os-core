import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  fitness_goal: string | null;
  experience_level: string | null;
  show_habits: boolean;
  show_supplements: boolean;
  show_hydration: boolean;
  show_schedule: boolean;
  show_goals: boolean;
}

export function usePublicProfile(userId: string | null) {
  return useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, fitness_goal, experience_level, show_habits, show_supplements, show_hydration, show_schedule, show_goals')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as PublicProfile;
    },
    enabled: !!userId,
  });
}

export function useFollowersCount(userId: string | null) {
  return useQuery({
    queryKey: ['followers-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}

export function useFollowingCount(userId: string | null) {
  return useQuery({
    queryKey: ['following-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}

export function useFollowersList(userId: string | null) {
  return useQuery({
    queryKey: ['followers-list', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) throw error;

      const followerIds = data?.map(f => f.follower_id) || [];
      if (followerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', followerIds);

      return profiles || [];
    },
    enabled: !!userId,
  });
}

export function useFollowingList(userId: string | null) {
  return useQuery({
    queryKey: ['following-list', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;

      const followingIds = data?.map(f => f.following_id) || [];
      if (followingIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', followingIds);

      return profiles || [];
    },
    enabled: !!userId,
  });
}

export function useIsFollowing(targetUserId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-following', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId || user.id === targetUserId) return false;

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
}

export function useUserPosts(userId: string | null) {
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useUserWorkoutPlans(userId: string | null) {
  return useQuery({
    queryKey: ['user-workout-plans', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_plan_days (
            *,
            workout_plan_exercises (
              *,
              exercises (*)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useUserWorkoutSessions(userId: string | null) {
  return useQuery({
    queryKey: ['user-workout-sessions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_plan_days (name, focus)
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useUserHabits(userId: string | null, showHabits: boolean) {
  return useQuery({
    queryKey: ['user-habits', userId],
    queryFn: async () => {
      if (!userId || !showHabits) return [];

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && showHabits,
  });
}

export function useUserSupplements(userId: string | null, showSupplements: boolean) {
  return useQuery({
    queryKey: ['user-supplements', userId],
    queryFn: async () => {
      if (!userId || !showSupplements) return [];

      const { data, error } = await supabase
        .from('supplement_plans')
        .select(`
          *,
          supplements (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && showSupplements,
  });
}

export function useUserSchedule(userId: string | null, showSchedule: boolean) {
  return useQuery({
    queryKey: ['user-schedule-public', userId],
    queryFn: async () => {
      if (!userId || !showSchedule) return null;

      const { data, error } = await supabase
        .from('user_schedules')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && showSchedule,
  });
}
