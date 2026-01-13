import React, { useState } from 'react';
import { Check, Utensils, Droplets, AlertCircle, Coffee, UtensilsCrossed, Cookie, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHydrationLog, useUpdateHydration } from '@/hooks/useNutrition';
import { useProfile } from '@/hooks/useProfile';
import { getHydrationRecommendation } from '@/services/decision-engine/habit-recommendations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Simple meal recommendations based on time of day
const getMealRecommendations = () => {
  return [
    {
      id: 'breakfast',
      name: 'Desayuno',
      icon: Coffee,
      time: '07:00 - 09:00',
      suggestion: 'Huevos, tostadas integrales, fruta',
    },
    {
      id: 'lunch',
      name: 'Almuerzo',
      icon: Utensils,
      time: '12:00 - 14:00',
      suggestion: 'Proteína, arroz/pasta, verduras',
    },
    {
      id: 'snack',
      name: 'Merienda',
      icon: Cookie,
      time: '16:00 - 18:00',
      suggestion: 'Yogur, frutos secos, fruta',
    },
    {
      id: 'dinner',
      name: 'Cena',
      icon: Moon,
      time: '20:00 - 22:00',
      suggestion: 'Proteína ligera, ensalada, verduras',
    },
  ];
};

const NutritionPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [completedMeals, setCompletedMeals] = useState<string[]>([]);
  const [ateOutsidePlan, setAteOutsidePlan] = useState(false);

  const { data: profile } = useProfile();
  const { data: hydrationLog } = useHydrationLog(today);
  const updateHydration = useUpdateHydration();
  const { toast } = useToast();

  // Get personalized hydration recommendation
  const hydration = getHydrationRecommendation(
    profile?.weight_kg || 75,
    profile?.height_cm || 175,
    profile?.fitness_goal || 'muscle_gain'
  );

  const meals = getMealRecommendations();
  const hydrationProgress = hydrationLog 
    ? Math.round((hydrationLog.consumed_ml / (hydration.dailyLiters * 1000)) * 100) 
    : 0;

  const handleToggleMeal = (mealId: string) => {
    setCompletedMeals(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const handleAddWater = (amount: number) => {
    updateHydration.mutate({ date: today, amount });
  };

  const handleAteOutsidePlan = () => {
    setAteOutsidePlan(true);
    toast({ 
      title: 'Registrado', 
      description: 'No pasa nada, mañana seguimos. Tu cuerpo se adapta.' 
    });
  };

  return (
    <div className="px-4 py-6 safe-top pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-6">Nutrición</h1>

      {/* Hydration - Simple */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-foreground">Hidratación</h3>
          </div>
          <span className="text-blue-400 font-bold">
            {((hydrationLog?.consumed_ml || 0) / 1000).toFixed(1)}L / {hydration.dailyLiters.toFixed(1)}L
          </span>
        </div>
        
        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-blue-400 transition-all duration-500"
            style={{ width: `${Math.min(hydrationProgress, 100)}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          💧 {hydration.tips[0]}
        </p>

        <div className="flex gap-2">
          {[250, 500].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => handleAddWater(amount)}
              disabled={updateHydration.isPending}
              className="flex-1 border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
            >
              +{amount}ml
            </Button>
          ))}
        </div>
      </div>

      {/* Meals - Simple recommendations */}
      <h3 className="font-semibold text-foreground mb-3">Comidas del día</h3>
      <div className="space-y-3 mb-6">
        {meals.map((meal) => {
          const completed = completedMeals.includes(meal.id);
          const Icon = meal.icon;
          return (
            <div 
              key={meal.id} 
              className={cn(
                "bg-card rounded-xl p-4 border flex items-center gap-4",
                completed ? "border-success/30 bg-success/5" : "border-border"
              )}
            >
              <button
                onClick={() => handleToggleMeal(meal.id)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  completed ? "bg-success" : "bg-secondary"
                )}
              >
                {completed ? (
                  <Check className="w-5 h-5 text-success-foreground" />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{meal.name}</p>
                  <span className="text-xs text-muted-foreground">{meal.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {meal.suggestion}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ate outside plan button */}
      <Button
        variant="outline"
        onClick={handleAteOutsidePlan}
        disabled={ateOutsidePlan}
        className={cn(
          "w-full h-14 border-2",
          ateOutsidePlan 
            ? "border-warning/30 bg-warning/10 text-warning" 
            : "border-dashed border-muted-foreground/30"
        )}
      >
        {ateOutsidePlan ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Registrado - ¡No pasa nada!
          </>
        ) : (
          <>
            <UtensilsCrossed className="w-5 h-5 mr-2" />
            Hoy comí fuera del plan
          </>
        )}
      </Button>

      {ateOutsidePlan && (
        <p className="text-center text-sm text-muted-foreground mt-3">
          La consistencia importa más que la perfección. Mañana volvemos a la rutina 💪
        </p>
      )}
    </div>
  );
};

export default NutritionPage;
