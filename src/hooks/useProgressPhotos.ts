import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  date: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  notes: string | null;
  photo_type: string;
  created_at: string;
}

export const useProgressPhotos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['progress_photos', user?.id],
    queryFn: async (): Promise<ProgressPhoto[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as ProgressPhoto[];
    },
    enabled: !!user?.id,
  });
};

export const useAddProgressPhoto = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: {
      file: File;
      date: string;
      weight_kg?: number;
      body_fat_percentage?: number;
      notes?: string;
      photo_type?: string;
    }) => {
      if (!user?.id) throw new Error('No user');

      // Upload file to storage
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, photo.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Insert record
      const { data, error } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          date: photo.date,
          weight_kg: photo.weight_kg,
          body_fat_percentage: photo.body_fat_percentage,
          notes: photo.notes,
          photo_type: photo.photo_type || 'front',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress_photos'] });
    },
  });
};

export const useDeleteProgressPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress_photos'] });
    },
  });
};
