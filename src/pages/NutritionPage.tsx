import React, { useState } from 'react';
import { Check, Droplets, UtensilsCrossed, Flame, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHydrationLog, useUpdateHydration } from '@/hooks/useNutrition';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { getHydrationRecommendation, getMacroRecommendation } from '@/services/decision-engine/habit-recommendations';
import { useDailyMacros, useLogMeal, useMealLogs, useDeleteMealLog } from '@/hooks/useMealLog';
import FoodBlockLogger from '@/components/nutrition/FoodBlockLogger';
import SmartHydrationReminder from '@/components/nutrition/SmartHydrationReminder';
import MealSuggestions from '@/components/nutrition/MealSuggestions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const NutritionPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[dayOfWeek];
  
  const [ateOutsidePlan, setAteOutsidePlan] = useState(false);

  const { data: profile } = useProfile();
  const { data: schedule } = useUserSchedule();
  const { data: foodPreferences } = useFoodPreferences();
  const { data: hydrationLog } = useHydrationLog(today);
  const updateHydration = useUpdateHydration();
  const { toast } = useToast();
  
  // Meal logging
  const logMeal = useLogMeal();
  const deleteMealLog = useDeleteMealLog();
  const { data: mealLogs } = useMealLogs(today);
  const dailyMacros = useDailyMacros(today);

  // Get personalized hydration recommendation
  const hydration = getHydrationRecommendation(
    profile?.weight_kg || 75,
    profile?.height_cm || 175,
    profile?.fitness_goal || 'muscle_gain'
  );

  // Determine if today is a training day based on user schedule
  const preferredDays = schedule?.preferred_workout_days || ['monday', 'tuesday', 'thursday', 'friday'];
  const isTrainingDay = preferredDays.includes(todayDayName);

  // Get personalized macro recommendation
  const macros = getMacroRecommendation(
    profile?.weight_kg || 75,
    profile?.height_cm || 175,
    profile?.date_of_birth 
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 25,
    (profile?.gender as 'male' | 'female' | 'other') || 'male',
    (profile?.fitness_goal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance') || 'muscle_gain',
    profile?.body_fat_percentage || undefined,
    isTrainingDay
  );

  const hydrationProgress = hydrationLog 
    ? Math.round((hydrationLog.consumed_ml / (hydration.dailyLiters * 1000)) * 100) 
    : 0;

  const handleAddWater = (amount: number) => {
    updateHydration.mutate({ date: today, amount });
  };

  const handleLogMeal = (meal: { protein: number; carbs: number; fat: number; calories: number; blocks: any[] }) => {
    logMeal.mutate({
      date: today,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      calories: meal.calories,
      blocks: meal.blocks,
    });
  };

  const handleLogSuggestedMeal = (meal: { protein: number; carbs: number; fat: number; calories: number }) => {
    logMeal.mutate({
      date: today,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      calories: meal.calories,
      blocks: [],
    });
  };

  const handleDeleteMeal = (id: string) => {
    deleteMealLog.mutate({ id, date: today });
  };

  const handleAteOutsidePlan = () => {
    setAteOutsidePlan(true);
    toast({ 
      title: 'Registrado', 
      description: 'No pasa nada, mañana seguimos. Tu cuerpo se adapta.' 
    });
  };

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Ganancia Muscular',
    fat_loss: 'Pérdida de Grasa',
    recomposition: 'Recomposición',
    maintenance: 'Mantenimiento',
  };

  // Calculate remaining macros
  const remainingMacros = {
    protein: Math.max(0, macros.proteinGrams - dailyMacros.consumedProtein),
    carbs: Math.max(0, macros.carbsGrams - dailyMacros.consumedCarbs),
    fat: Math.max(0, macros.fatGrams - dailyMacros.consumedFat),
    calories: Math.max(0, macros.calories - dailyMacros.consumedCalories),
  };

  return (
    <div className="px-4 py-6 safe-top pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-2">Nutrición</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {goalLabels[profile?.fitness_goal || 'muscle_gain']} · {isTrainingDay ? 'Día de entreno' : 'Día de descanso'}
      </p>

      {/* Smart Hydration Reminder */}
      <div className="mb-4">
        <SmartHydrationReminder
          consumedMl={hydrationLog?.consumed_ml || 0}
          targetMl={hydration.dailyLiters * 1000}
          onAddWater={handleAddWater}
        />
      </div>

      {/* Food Block Logger - Main Feature */}
      <div className="mb-6">
        <FoodBlockLogger
          targetProtein={macros.proteinGrams}
          targetCarbs={macros.carbsGrams}
          targetFat={macros.fatGrams}
          targetCalories={macros.calories}
          consumedProtein={dailyMacros.consumedProtein}
          consumedCarbs={dailyMacros.consumedCarbs}
          consumedFat={dailyMacros.consumedFat}
          consumedCalories={dailyMacros.consumedCalories}
          onLogMeal={handleLogMeal}
        />
      </div>

      {/* Meal Suggestions based on preferences */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <MealSuggestions
          targetMacros={{
            protein: macros.proteinGrams,
            carbs: macros.carbsGrams,
            fat: macros.fatGrams,
            calories: macros.calories,
          }}
          remainingMacros={remainingMacros}
          likedFoods={foodPreferences?.liked_foods}
          dislikedFoods={foodPreferences?.disliked_foods}
          allergies={foodPreferences?.allergies}
          preference={foodPreferences?.preference}
          onSelectMeal={handleLogSuggestedMeal}
        />
      </div>

      {/* Today's Logged Meals */}
      {mealLogs && mealLogs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Comidas de hoy</h3>
          <div className="space-y-2">
            {mealLogs.map((log, index) => (
              <div 
                key={log.id}
                className="bg-card rounded-xl p-3 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {log.protein_grams}g prot · {log.carbs_grams}g carbs · {log.fat_grams}g grasa
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.calories} kcal
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteMeal(log.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calories Overview */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-foreground">Calorías del día</h3>
        </div>
        
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold text-foreground">
            {dailyMacros.consumedCalories}
          </span>
          <span className="text-muted-foreground">
            / {macros.calories} kcal
          </span>
        </div>
        
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-500"
            style={{ width: `${Math.min((dailyMacros.consumedCalories / macros.calories) * 100, 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {isTrainingDay ? 'Calorías para entrenar fuerte' : 'Calorías para recuperar'}
        </p>
      </div>

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
