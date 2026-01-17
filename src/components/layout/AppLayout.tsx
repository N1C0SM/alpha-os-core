import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { useToast } from '@/hooks/use-toast';

export const AppLayout: React.FC = () => {
  const { toast } = useToast();

  // Show welcome toast on first launch of installed app
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      const hasShownWelcome = localStorage.getItem('pwa_welcome_shown');
      
      if (!hasShownWelcome) {
        localStorage.setItem('pwa_welcome_shown', 'true');
        
        // Small delay to let the app render first
        setTimeout(() => {
          toast({
            title: '⚡ ¡Bienvenido a AUTOPILOT!',
            description: 'Tu app está lista. Entrena sin excusas.',
          });
        }, 1000);
      }
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      
      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};
