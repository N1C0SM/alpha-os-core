import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  liked_by_me?: boolean;
  is_following?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number | null;
  target_unit: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  participants_count?: number;
  my_participation?: {
    current_value: number;
    completed: boolean;
  } | null;
}

export interface UserToFollow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
}

// Fetch users the current user is following
export function useFollowing() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;
      return data?.map(f => f.following_id) || [];
    },
    enabled: !!user,
  });
}

// Fetch community feed with follow status
export function useCommunityFeed(filterFollowing: boolean = false) {
  const { user } = useAuth();
  const { data: followingIds } = useFollowing();

  return useQuery({
    queryKey: ['community-feed', user?.id, filterFollowing, followingIds],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by followed users if requested
      if (filterFollowing && followingIds && followingIds.length > 0) {
        query = query.in('user_id', followingIds);
      }

      const { data: posts, error } = await query;

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(posts?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Get likes by current user
      let myLikes: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        myLikes = likes?.map(l => l.post_id) || [];
      }

      // Map posts with author and like status
      return posts?.map(post => ({
        ...post,
        author: profiles?.find(p => p.id === post.user_id) ? {
          ...profiles?.find(p => p.id === post.user_id),
          id: post.user_id,
        } : undefined,
        liked_by_me: myLikes.includes(post.id),
        is_following: followingIds?.includes(post.user_id) || false,
      })) as Post[];
    },
    enabled: true,
  });
}

// Fetch suggested users to follow
export function useSuggestedUsers() {
  const { user } = useAuth();
  const { data: followingIds } = useFollowing();

  return useQuery({
    queryKey: ['suggested-users', user?.id, followingIds],
    queryFn: async () => {
      if (!user) return [];

      // Get users who have posted, excluding current user and already followed
      const { data: posts } = await supabase
        .from('posts')
        .select('user_id')
        .eq('is_public', true)
        .neq('user_id', user.id)
        .limit(100);

      const uniqueUserIds = [...new Set(posts?.map(p => p.user_id) || [])]
        .filter(id => !followingIds?.includes(id))
        .slice(0, 10);

      if (uniqueUserIds.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uniqueUserIds);

      if (error) throw error;

      return profiles?.map(p => ({
        ...p,
        is_following: false,
      })) as UserToFollow[];
    },
    enabled: !!user,
  });
}

// Search users by name
export function useSearchUsers(searchQuery: string) {
  const { user } = useAuth();
  const { data: followingIds } = useFollowing();

  return useQuery({
    queryKey: ['search-users', searchQuery, user?.id, followingIds],
    queryFn: async () => {
      if (!user || !searchQuery.trim()) return [];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user.id)
        .ilike('full_name', `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      return profiles?.map(p => ({
        ...p,
        is_following: followingIds?.includes(p.id) || false,
      })) as UserToFollow[];
    },
    enabled: !!user && searchQuery.trim().length >= 2,
  });
}

// Follow a user
export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
    },
  });
}

// Unfollow a user
export function useUnfollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
    },
  });
}

// Upload image to community-images bucket
export async function uploadPostImage(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('community-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('community-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Create a post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      content: string; 
      imageFile?: File; 
      post_type?: string;
      workoutData?: {
        name: string;
        duration: number;
        exerciseCount: number;
        totalSets: number;
        newPRs?: number;
      };
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      let image_url: string | null = null;
      
      // Upload image if provided
      if (data.imageFile) {
        image_url = await uploadPostImage(user.id, data.imageFile);
      }

      // Build content for workout posts
      let finalContent = data.content;
      if (data.post_type === 'workout' && data.workoutData) {
        const { name, duration, exerciseCount, totalSets, newPRs } = data.workoutData;
        finalContent = `💪 Entreno completado: ${name}\n\n⏱️ ${duration} min\n🏋️ ${exerciseCount} ejercicios\n🔥 ${totalSets} series${newPRs ? `\n🏆 ${newPRs} nuevos PRs!` : ''}\n\n${data.content || ''}`;
      }
      
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: finalContent.trim(),
          image_url,
          post_type: data.post_type || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
}

// Like/unlike a post
export function useToggleLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}

// Fetch comments for a post
export function usePostComments(postId: string | null) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      return comments?.map(comment => ({
        ...comment,
        author: profiles?.find(p => p.id === comment.user_id),
      })) as PostComment[];
    },
    enabled: !!postId,
  });
}

// Add a comment
export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });
}

// Fetch active challenges
export function useActiveChallenges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-challenges', user?.id],
    queryFn: async () => {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;

      // Get participant counts and user's participation
      const result: Challenge[] = [];
      
      for (const challenge of challenges || []) {
        const { count } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        let myParticipation = null;
        if (user) {
          const { data } = await supabase
            .from('challenge_participants')
            .select('current_value, completed')
            .eq('challenge_id', challenge.id)
            .eq('user_id', user.id)
            .maybeSingle();
          myParticipation = data;
        }

        result.push({
          ...challenge,
          participants_count: count || 0,
          my_participation: myParticipation,
        });
      }

      return result;
    },
  });
}

// Join a challenge
export function useJoinChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-challenges'] });
    },
  });
}

// Update challenge progress
export function useUpdateChallengeProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ challengeId, value }: { challengeId: string; value: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenge_participants')
        .update({ current_value: value })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-challenges'] });
    },
  });
}