import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  id: string;
  app_name: string;
  primary_color: string;
  logo_url: string | null;
}

export function useAppSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as AppSettings | null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    settings,
    isLoading,
    appName: settings?.app_name || 'EduMaster',
    logoUrl: settings?.logo_url,
    primaryColor: settings?.primary_color || '#4F46E5',
  };
}
