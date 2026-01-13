import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStripeMode = () => {
  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      // Try to fetch from public endpoint without auth requirement
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .single();

      if (!error && data) {
        setMode(data.value as 'test' | 'live');
      }
    } catch (error) {
      console.error("Error loading stripe mode:", error);
    } finally {
      setLoading(false);
    }
  };

  return { mode, loading };
};
