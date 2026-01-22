import React, { useState } from 'react';
import { Check, Droplets, UtensilsCrossed, Flame, Trash2, Plus } from 'lucide-react';
import { useHydrationLog, useUpdateHydration } from '@/hooks/useNutrition';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { getHydrationRecommendation, getMacroRecommendation } from '@/services/decision-engine/habit-recommendations';
import { useDailyMacros, useLogMeal, useMealLogs, useDeleteMealLog } from '@/hooks/useMealLog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PageHeader, StatCard, ProgressBar, DataTable, EmptyState } from '@/components/ui/saas-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NutritionPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[dayOfWeek];
  
  const [ateOutsidePlan, setAteOutsidePlan] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({ protein: '', carbs: '', fat: '' });

  const { data: profile } = useProfile();
  const { data: schedule } = useUserSchedule();
  const { data: hydrationLog } = useHydrationLog(today);
  const updateHydration = useUpdateHydration();
  const { toast } = useToast();
  
  const logMeal = useLogMeal();
  const deleteMealLog = useDeleteMealLog();
  const { data: mealLogs } = useMealLogs(today);
  const dailyMacros = useDailyMacros(today);

  const hydration = getHydrationRecommendation(
    profile?.weight_kg || 75,
    profile?.height_cm || 175,
    profile?.fitness_goal || 'muscle_gain'
  );

  const preferredDays = schedule?.preferred_workout_days || ['monday', 'tuesday', 'thursday', 'friday'];
  const isTrainingDay = preferredDays.includes(todayDayName);

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

  const consumedWaterL = (hydrationLog?.consumed_ml || 0) / 1000;

  const handleAddWater = (amount: number) => {
    updateHydration.mutate({ date: today, amount });
  };

  const handleLogMeal = () => {
    const protein = parseInt(newMeal.protein) || 0;
    const carbs = parseInt(newMeal.carbs) || 0;
    const fat = parseInt(newMeal.fat) || 0;
    const calories = protein * 4 + carbs * 4 + fat * 9;

    logMeal.mutate({
      date: today,
      protein,
      carbs,
      fat,
      calories,
      blocks: [],
    });

    setNewMeal({ protein: '', carbs: '', fat: '' });
    setIsAddMealOpen(false);
    toast({ title: 'Comida registrada' });
  };

  const handleDeleteMeal = (id: string) => {
    deleteMealLog.mutate({ id, date: today });
  };

  const handleAteOutsidePlan = () => {
    setAteOutsidePlan(true);
    toast({ title: 'Registrado', description: 'Mañana seguimos con el plan.' });
  };

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Ganancia Muscular',
    fat_loss: 'Pérdida de Grasa',
    recomposition: 'Recomposición',
    maintenance: 'Mantenimiento',
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nutrición"
        description={`${goalLabels[profile?.fitness_goal || 'muscle_gain']} • ${isTrainingDay ? 'Día de entreno' : 'Día de descanso'}`}
      >
        <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar comida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar comida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Proteína (g)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={newMeal.protein}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, protein: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Carbos (g)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={newMeal.carbs}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, carbs: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Grasa (g)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={newMeal.fat}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, fat: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleLogMeal} className="w-full">
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Calorías"
          value={`${dailyMacros.consumedCalories} / ${macros.calories}`}
          icon={<Flame className="w-5 h-5 text-orange-500" />}
        />
        <StatCard 
          label="Proteína"
          value={`${dailyMacros.consumedProtein}g / ${macros.proteinGrams}g`}
          icon={<div className="w-5 h-5 rounded-full bg-primary" />}
        />
        <StatCard 
          label="Carbohidratos"
          value={`${dailyMacros.consumedCarbs}g / ${macros.carbsGrams}g`}
          icon={<div className="w-5 h-5 rounded-full bg-yellow-500" />}
        />
        <StatCard 
          label="Grasa"
          value={`${dailyMacros.consumedFat}g / ${macros.fatGrams}g`}
          icon={<div className="w-5 h-5 rounded-full bg-red-500" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Macros Progress */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progreso de macros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBar 
                value={dailyMacros.consumedProtein} 
                max={macros.proteinGrams} 
                label="Proteína"
                color="primary"
              />
              <ProgressBar 
                value={dailyMacros.consumedCarbs} 
                max={macros.carbsGrams} 
                label="Carbohidratos"
                color="orange"
              />
              <ProgressBar 
                value={dailyMacros.consumedFat} 
                max={macros.fatGrams} 
                label="Grasa"
                color="red"
              />
              <ProgressBar 
                value={dailyMacros.consumedCalories} 
                max={macros.calories} 
                label="Calorías totales"
                color="green"
              />
            </CardContent>
          </Card>

          {/* Meals Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Comidas de hoy</h3>
            </div>
            
            {mealLogs && mealLogs.length > 0 ? (
              <DataTable headers={['#', 'Proteína', 'Carbos', 'Grasa', 'Calorías', '']}>
                {mealLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-secondary/50">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {log.protein_grams}g
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.carbs_grams}g
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.fat_grams}g
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.calories} kcal
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteMeal(log.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={<UtensilsCrossed className="w-8 h-8" />}
                    title="Sin comidas registradas"
                    description="Registra tu primera comida del día"
                    action={
                      <Button onClick={() => setIsAddMealOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar comida
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Hydration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Hidratación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground">
                  {consumedWaterL.toFixed(1)}
                </span>
                <span className="text-muted-foreground"> / {hydration.dailyLiters.toFixed(1)}L</span>
              </div>
              
              <ProgressBar 
                value={consumedWaterL} 
                max={hydration.dailyLiters}
                showValue={false}
                color="blue"
                size="lg"
              />

              <div className="grid grid-cols-2 gap-2">
                {[250, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => handleAddWater(amount)}
                    disabled={updateHydration.isPending}
                    className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                  >
                    +{amount}ml
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ate Outside Plan */}
          <Card>
            <CardContent className="py-4">
              <Button
                variant={ateOutsidePlan ? "secondary" : "outline"}
                onClick={handleAteOutsidePlan}
                disabled={ateOutsidePlan}
                className="w-full"
              >
                {ateOutsidePlan ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Registrado
                  </>
                ) : (
                  <>
                    <UtensilsCrossed className="w-4 h-4 mr-2" />
                    Comí fuera del plan
                  </>
                )}
              </Button>
              {ateOutsidePlan && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Mañana volvemos 💪
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NutritionPage;
