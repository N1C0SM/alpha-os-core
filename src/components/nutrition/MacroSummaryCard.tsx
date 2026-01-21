import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useDailyMacros } from '@/hooks/useMealLog';
import { useHydrationLog } from '@/hooks/useNutrition';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useNavigate } from 'react-router-dom';
import { Droplets, Utensils, ChevronRight, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const MacroSummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { isPremium, features } = useSubscriptionLimits();
  const { data: profile } = useProfile();
  const dailyMacros = useDailyMacros(today);
  const { data: hydrationLog } = useHydrationLog(today);

  // Calculate targets
  const proteinTarget = Math.round((profile?.weight_kg || 75) * 2);
  const hydrationTarget = hydrationLog?.target_ml || 3000;

  // Calculate progress
  const proteinProgress = Math.min(100, ((dailyMacros?.consumedProtein || 0) / proteinTarget) * 100);
  const hydrationProgress = Math.min(100, ((hydrationLog?.consumed_ml || 0) / hydrationTarget) * 100);

  // For free users, show simplified view
  if (!isPremium && !features.macroTracking) {
    return (
      <div 
        onClick={() => navigate('/nutricion')}
        className="group bg-card hover:bg-card/80 rounded-2xl p-4 border border-border/50 cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">Nutrición básica</h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Simplified protein and hydration bars */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Utensils className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Proteína</span>
                <span className="text-foreground font-medium">
                  {dailyMacros?.consumedProtein || 0}g / {proteinTarget}g
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Agua</span>
                <span className="text-foreground font-medium">
                  {((hydrationLog?.consumed_ml || 0) / 1000).toFixed(1)}L / {(hydrationTarget / 1000).toFixed(1)}L
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${hydrationProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium upsell */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            <Lock className="w-3 h-3 inline mr-1" />
            Tracking completo con <span className="text-primary font-medium">Premium</span>
          </p>
        </div>
      </div>
    );
  }

  // Premium users get full macro view
  return (
    <div 
      onClick={() => navigate('/nutricion')}
      className="group bg-card hover:bg-card/80 rounded-2xl p-4 border border-border/50 cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">Macros del día</h3>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {/* Protein */}
        <div className="text-center p-2 bg-orange-500/10 rounded-xl">
          <div className="text-lg font-bold text-orange-500">
            {dailyMacros?.consumedProtein || 0}
          </div>
          <div className="text-[10px] text-muted-foreground">
            / {proteinTarget}g
          </div>
          <div className="text-xs font-medium text-foreground mt-1">Prot</div>
        </div>

        {/* Carbs */}
        <div className="text-center p-2 bg-green-500/10 rounded-xl">
          <div className="text-lg font-bold text-green-500">
            {dailyMacros?.consumedCarbs || 0}
          </div>
          <div className="text-[10px] text-muted-foreground">g</div>
          <div className="text-xs font-medium text-foreground mt-1">Carbs</div>
        </div>

        {/* Fat */}
        <div className="text-center p-2 bg-yellow-500/10 rounded-xl">
          <div className="text-lg font-bold text-yellow-500">
            {dailyMacros?.consumedFat || 0}
          </div>
          <div className="text-[10px] text-muted-foreground">g</div>
          <div className="text-xs font-medium text-foreground mt-1">Grasa</div>
        </div>

        {/* Water */}
        <div className="text-center p-2 bg-blue-500/10 rounded-xl">
          <div className="text-lg font-bold text-blue-500">
            {((hydrationLog?.consumed_ml || 0) / 1000).toFixed(1)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            / {(hydrationTarget / 1000).toFixed(1)}L
          </div>
          <div className="text-xs font-medium text-foreground mt-1">Agua</div>
        </div>
      </div>

      {/* Protein progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Proteína</span>
          <span className={cn(
            "font-medium",
            proteinProgress >= 80 ? "text-green-500" : "text-foreground"
          )}>
            {proteinProgress >= 100 ? '✓ Objetivo cumplido' : `${Math.round(proteinProgress)}%`}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              proteinProgress >= 80 
                ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                : "bg-gradient-to-r from-orange-500 to-yellow-500"
            )}
            style={{ width: `${proteinProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MacroSummaryCard;
