import React, { useState, useMemo } from 'react';
import { Check, Droplets, UtensilsCrossed, Flame, Trash2, Plus, Search, Coffee, Sun, Utensils, Moon, Save, Heart } from 'lucide-react';
import { useHydrationLog, useUpdateHydration } from '@/hooks/useNutrition';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { useFoodPreferences } from '@/hooks/useFoodPreferences';
import { getHydrationRecommendation, getMacroRecommendation } from '@/services/decision-engine/habit-recommendations';
import { useDailyMacros, useLogMeal, useMealLogs, useDeleteMealLog, PREDEFINED_MEALS, MEAL_TIME_LABELS, MealTime, useCustomMeals, useSaveCustomMeal, useDeleteCustomMeal } from '@/hooks/useMealLog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PageHeader, StatCard, ProgressBar, EmptyState } from '@/components/ui/saas-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

const MEAL_TIME_ICONS: Record<MealTime, typeof Coffee> = {
  desayuno: Coffee,
  media_manana: Sun,
  comida: Utensils,
  cena: Moon,
};

const NutritionPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[dayOfWeek];
  
  const [ateOutsidePlan, setAteOutsidePlan] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('comida');
  const [mealName, setMealName] = useState('');
  const [newMeal, setNewMeal] = useState({ protein: '', carbs: '', fat: '', calories: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [saveAsCustom, setSaveAsCustom] = useState(false);

  const { data: profile } = useProfile();
  const { data: schedule } = useUserSchedule();
  const { data: hydrationLog } = useHydrationLog(today);
  const updateHydration = useUpdateHydration();
  const { toast } = useToast();
  
  const logMeal = useLogMeal();
  const deleteMealLog = useDeleteMealLog();
  const { data: mealLogs } = useMealLogs(today);
  const dailyMacros = useDailyMacros(today);
  const { data: customMeals } = useCustomMeals();
  const saveCustomMeal = useSaveCustomMeal();
  const deleteCustomMeal = useDeleteCustomMeal();

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

  // Combine predefined and custom meals for search
  const allMeals = useMemo(() => {
    const predefined = PREDEFINED_MEALS.map(m => ({ ...m, isCustom: false, id: undefined as string | undefined }));
    const custom = (customMeals || []).map(m => ({
      name: m.name,
      protein: m.protein_grams,
      carbs: m.carbs_grams,
      fat: m.fat_grams,
      calories: m.calories,
      isCustom: true,
      id: m.id as string | undefined,
    }));
    return [...custom, ...predefined];
  }, [customMeals]);

  // Filter meals by search
  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) return allMeals;
    const query = searchQuery.toLowerCase();
    return allMeals.filter(meal => 
      meal.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allMeals]);

  const handleAddWater = (amount: number) => {
    updateHydration.mutate({ date: today, amount });
  };

  const handleLogCustomMeal = () => {
    const protein = parseInt(newMeal.protein) || 0;
    const carbs = parseInt(newMeal.carbs) || 0;
    const fat = parseInt(newMeal.fat) || 0;
    // Allow manual calories or auto-calculate
    const calories = newMeal.calories ? parseInt(newMeal.calories) : protein * 4 + carbs * 4 + fat * 9;

    if (!mealName.trim()) {
      toast({ title: 'Error', description: 'Introduce un nombre para la comida', variant: 'destructive' });
      return;
    }

    // Log the meal
    logMeal.mutate({
      date: today,
      mealName: mealName.trim(),
      mealTime: selectedMealTime,
      protein,
      carbs,
      fat,
      calories,
      blocks: [],
    });

    // Optionally save as custom meal for reuse
    if (saveAsCustom) {
      saveCustomMeal.mutate({
        name: mealName.trim(),
        protein,
        carbs,
        fat,
        calories,
      });
    }

    resetForm();
  };

  const handleLogPredefinedMeal = (meal: { name: string; protein: number; carbs: number; fat: number; calories: number }) => {
    logMeal.mutate({
      date: today,
      mealName: meal.name,
      mealTime: selectedMealTime,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      calories: meal.calories,
      blocks: [],
    });

    resetForm();
  };

  const resetForm = () => {
    setMealName('');
    setNewMeal({ protein: '', carbs: '', fat: '', calories: '' });
    setSearchQuery('');
    setSaveAsCustom(false);
    setIsAddMealOpen(false);
  };

  const handleDeleteCustomMeal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomMeal.mutate(id);
  };

  const handleDeleteMeal = (id: string) => {
    deleteMealLog.mutate({ id, date: today });
  };

  const handleAteOutsidePlan = () => {
    setAteOutsidePlan(true);
    toast({ title: 'Registrado', description: 'Mañana seguimos con el plan.' });
  };

  // Group meals by meal time
  const mealsByTime = useMemo(() => {
    const grouped: Record<MealTime, typeof mealLogs> = {
      desayuno: [],
      media_manana: [],
      comida: [],
      cena: [],
    };
    
    (mealLogs || []).forEach(log => {
      const time = log.meal_time as MealTime || 'comida';
      if (grouped[time]) {
        grouped[time]!.push(log);
      }
    });
    
    return grouped;
  }, [mealLogs]);

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
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Registrar comida</DialogTitle>
            </DialogHeader>
            
            {/* Meal Time Selector */}
            <div className="flex gap-2 py-2">
              {(Object.keys(MEAL_TIME_LABELS) as MealTime[]).map((time) => {
                const Icon = MEAL_TIME_ICONS[time];
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedMealTime(time)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                      selectedMealTime === time
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", selectedMealTime === time ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", selectedMealTime === time ? "text-primary" : "text-muted-foreground")}>
                      {MEAL_TIME_LABELS[time]}
                    </span>
                  </button>
                );
              })}
            </div>

            <Tabs defaultValue="predefined" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="predefined">Comidas guardadas</TabsTrigger>
                <TabsTrigger value="custom">Personalizada</TabsTrigger>
              </TabsList>
              
              {/* Predefined Meals */}
              <TabsContent value="predefined" className="flex-1 overflow-hidden flex flex-col mt-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar comida..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {/* Custom meals section */}
                  {filteredMeals.some(m => m.isCustom) && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Mis comidas</span>
                      </div>
                      {filteredMeals.filter(m => m.isCustom).map((meal) => (
                        <button
                          key={meal.id}
                          onClick={() => handleLogPredefinedMeal(meal)}
                          className="w-full p-3 rounded-lg border border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all text-left group mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {meal.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {meal.calories} kcal
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDeleteCustomMeal(meal.id!, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="text-red-400">{meal.protein}g prot</span>
                            <span className="text-amber-400">{meal.carbs}g carbs</span>
                            <span className="text-yellow-400">{meal.fat}g grasa</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Predefined meals */}
                  {filteredMeals.filter(m => !m.isCustom).map((meal) => (
                    <button
                      key={meal.name}
                      onClick={() => handleLogPredefinedMeal(meal)}
                      className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {meal.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {meal.calories} kcal
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="text-red-400">{meal.protein}g prot</span>
                        <span className="text-amber-400">{meal.carbs}g carbs</span>
                        <span className="text-yellow-400">{meal.fat}g grasa</span>
                      </div>
                    </button>
                  ))}
                  
                  {filteredMeals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No se encontraron comidas
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Custom Meal */}
              <TabsContent value="custom" className="space-y-4 mt-4 overflow-y-auto">
                <div>
                  <Label>Nombre de la comida</Label>
                  <Input
                    placeholder="Ej: Salmoncitos, Garbanzos tal..."
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Carbohidratos (g)</Label>
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
                  <div>
                    <Label>Calorías (kcal)</Label>
                    <Input 
                      type="number" 
                      placeholder={String((parseInt(newMeal.protein) || 0) * 4 + (parseInt(newMeal.carbs) || 0) * 4 + (parseInt(newMeal.fat) || 0) * 9)}
                      value={newMeal.calories}
                      onChange={(e) => setNewMeal(prev => ({ ...prev, calories: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">
                      Auto: {(parseInt(newMeal.protein) || 0) * 4 + (parseInt(newMeal.carbs) || 0) * 4 + (parseInt(newMeal.fat) || 0) * 9} kcal
                    </span>
                  </div>
                </div>
                
                {/* Save for reuse checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="saveAsCustom" 
                    checked={saveAsCustom}
                    onCheckedChange={(checked) => setSaveAsCustom(checked === true)}
                  />
                  <label 
                    htmlFor="saveAsCustom" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Guardar en "Mis comidas" para reutilizar
                  </label>
                </div>
                
                <Button onClick={handleLogCustomMeal} className="w-full" disabled={!mealName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar comida
                </Button>
              </TabsContent>
            </Tabs>
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

          {/* Meals by Time */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Comidas de hoy</h3>
            </div>
            
            {mealLogs && mealLogs.length > 0 ? (
              <div className="space-y-4">
                {(Object.keys(MEAL_TIME_LABELS) as MealTime[]).map((time) => {
                  const meals = mealsByTime[time];
                  if (!meals || meals.length === 0) return null;
                  
                  const Icon = MEAL_TIME_ICONS[time];
                  
                  return (
                    <Card key={time}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          {MEAL_TIME_LABELS[time]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {meals.map((log) => (
                          <div 
                            key={log.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{log.meal_name}</div>
                              <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                <span className="text-red-400">{log.protein_grams}g prot</span>
                                <span className="text-amber-400">{log.carbs_grams}g carbs</span>
                                <span className="text-yellow-400">{log.fat_grams}g grasa</span>
                                <span>{log.calories} kcal</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => handleDeleteMeal(log.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
