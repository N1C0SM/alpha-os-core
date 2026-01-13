import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { 
  Crown, 
  Check, 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Dumbbell,
  ChevronLeft,
  Loader2,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium: isSubscribed, isLoading, openCheckout, openCustomerPortal } = useSubscription();

  const features = [
    {
      icon: RefreshCw,
      title: '"Máquina ocupada"',
      description: 'Cambia al instante a un ejercicio alternativo sin perder el ritmo',
    },
    {
      icon: TrendingUp,
      title: '"Peso fácil, subí"',
      description: 'Ajusta los pesos en tiempo real y el sistema aprende tus progresiones',
    },
    {
      icon: Zap,
      title: 'Progresión automática',
      description: 'Tus entrenos evolucionan solos según tu rendimiento',
    },
    {
      icon: Dumbbell,
      title: 'Rutinas ilimitadas',
      description: 'Crea todas las rutinas personalizadas que quieras',
    },
  ];

  const handleSubscribe = async () => {
    try {
      await openCheckout();
    } catch (error) {
      console.error('Error starting checkout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Premium</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            AlphaSupps <span className="text-primary">Premium</span>
          </h2>
          <p className="text-muted-foreground">
            Desbloquea todo el potencial de tu entrenamiento
          </p>
        </div>

        {/* Current Status */}
        {isSubscribed && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">¡Ya eres Premium!</p>
                <p className="text-sm text-muted-foreground">Tienes acceso a todas las funciones</p>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-4 mb-8">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className={cn(
                "bg-card rounded-2xl p-4 border flex items-start gap-4",
                isSubscribed ? "border-primary/30 bg-primary/5" : "border-border"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                isSubscribed ? "bg-primary/20" : "bg-secondary"
              )}>
                <feature.icon className={cn(
                  "w-6 h-6",
                  isSubscribed ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              {isSubscribed && (
                <Check className="w-5 h-5 text-primary shrink-0 ml-auto" />
              )}
            </div>
          ))}
        </div>

        {/* Pricing */}
        {!isSubscribed && (
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-6 border border-primary/30 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Solo</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-4xl font-bold text-foreground">4.99€</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground">Cancela cuando quieras</p>
            </div>
          </div>
        )}

        {/* CTA */}
        {isSubscribed ? (
          <Button 
            variant="outline"
            onClick={openCustomerPortal}
            className="w-full h-14 text-base font-semibold"
          >
            Gestionar suscripción
          </Button>
        ) : (
          <Button 
            onClick={handleSubscribe}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-lg font-bold shadow-lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Hacerme Premium
          </Button>
        )}

        {/* Guarantee */}
        {!isSubscribed && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            💳 Pago seguro con Stripe • Cancelación inmediata
          </p>
        )}
      </div>
    </div>
  );
};

export default PremiumPage;