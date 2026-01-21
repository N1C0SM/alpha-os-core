import React from 'react';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Lock, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumGateProps {
  feature: keyof ReturnType<typeof useSubscriptionLimits>['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  className?: string;
  message?: string;
}

/**
 * Component to gate premium features
 * Shows content for premium users, shows lock/upgrade for free users
 */
const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = true,
  className,
  message,
}) => {
  const { canUseFeature, isPremium } = useSubscriptionLimits();
  const { openCheckout } = useSubscription();

  // Premium users see the content
  if (isPremium || canUseFeature(feature)) {
    return <>{children}</>;
  }

  // Free users see fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10",
      className
    )}>
      {/* Blurred children preview */}
      <div className="blur-sm opacity-30 pointer-events-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 rounded-full bg-primary/10 mb-3">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1">Función Premium</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {message || 'Desbloquea esta función con AlphaSupps Premium'}
        </p>
        
        {showUpgrade && (
          <Button 
            onClick={openCheckout}
            className="bg-primary text-primary-foreground"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Desbloquear Premium
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Simple lock icon for inline premium features
 */
export const PremiumBadge: React.FC<{ 
  feature?: keyof ReturnType<typeof useSubscriptionLimits>['features'];
  size?: 'sm' | 'md';
}> = ({ feature, size = 'sm' }) => {
  const { isPremium } = useSubscriptionLimits();
  
  if (isPremium) return null;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full",
      size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <Lock className={size === 'sm' ? "w-3 h-3" : "w-4 h-4"} />
      Premium
    </span>
  );
};

export default PremiumGate;
