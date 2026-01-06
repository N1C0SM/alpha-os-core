import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, Loader2, Dumbbell, Camera, BarChart3, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: 'routines' | 'history' | 'photos' | 'general';
}

const triggerMessages = {
  routines: 'Has alcanzado el límite de 3 rutinas del plan gratuito.',
  history: 'El historial completo está disponible en Premium.',
  photos: 'Las fotos de progreso avanzadas están en Premium.',
  general: 'Desbloquea todo el potencial de GymBro.',
};

const features = [
  { icon: Dumbbell, text: 'Rutinas ilimitadas' },
  { icon: History, text: 'Historial completo' },
  { icon: Camera, text: 'Fotos de progreso ilimitadas' },
  { icon: BarChart3, text: 'Estadísticas avanzadas' },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  open, 
  onOpenChange,
  trigger = 'general'
}) => {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Error al iniciar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl">GymBro Premium</DialogTitle>
          <DialogDescription className="text-base">
            {triggerMessages[trigger]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="mb-3 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">4,99€</span>
              <span className="text-muted-foreground">/mes</span>
            </div>
            
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <feature.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{feature.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Button 
            onClick={handleUpgrade} 
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            Suscribirse a Premium
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            Cancela cuando quieras. Sin compromiso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
