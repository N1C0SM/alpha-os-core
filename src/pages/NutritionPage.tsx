import React, { useState, useEffect } from 'react';
import { Check, Utensils, Plus, Loader2, Droplets, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNutritionPlan, useCreateNutritionPlan, useCreateMeal, useMealLogs, useToggleMeal, useHydrationLog, useUpdateHydration, useDeleteMeal } from '@/hooks/useNutrition';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import SupplementsSection from '@/components/nutrition/SupplementsSection';

const NutritionPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    meal_type: 'lunch' as 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'pre_workout' | 'post_workout',
    calories: 0,
    protein_grams: 0,
    carbs_grams: 0,
    fat_grams: 0,
    scheduled_time: '12:00',
  });

  const { data: nutritionPlan, isLoading } = useNutritionPlan();
  const { data: profile } = useProfile();
  const { data: mealLogs } = useMealLogs(today);
  const { data: hydrationLog } = useHydrationLog(today);
  const createNutritionPlan = useCreateNutritionPlan();
  const createMeal = useCreateMeal();
  const deleteMeal = useDeleteMeal();
  const toggleMeal = useToggleMeal();
  const updateHydration = useUpdateHydration();
  const { toast } = useToast();

  // Auto-create nutrition plan if doesn't exist
  useEffect(() => {
    if (!isLoading && !nutritionPlan && profile) {
      const weight = Number(profile.weight_kg) || 75;
      const calories = Math.round(weight * 33); // Simple TDEE estimate
      const protein = Math.round(weight * 2);
      const fat = Math.round((calories * 0.25) / 9);
      const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

      createNutritionPlan.mutate({
        daily_calories: calories,
        protein_grams: protein,
        carbs_grams: carbs,
        fat_grams: fat,
      });
    }
  }, [isLoading, nutritionPlan, profile]);

  const isMealCompleted = (mealId: string) => {
    return mealLogs?.some(log => log.meal_id === mealId && log.completed) || false;
  };

  const handleToggleMeal = (mealId: string) => {
    const completed = !isMealCompleted(mealId);
    toggleMeal.mutate({ mealId, date: today, completed });
  };

  const handleAddWater = (amount: number) => {
    updateHydration.mutate({ date: today, amount });
  };

  const handleCreateMeal = async () => {
    if (!newMeal.name.trim() || !nutritionPlan) return;
    
    try {
      await createMeal.mutateAsync({
        nutrition_plan_id: nutritionPlan.id,
        ...newMeal,
      });
      setNewMeal({
        name: '',
        meal_type: 'lunch',
        calories: 0,
        protein_grams: 0,
        carbs_grams: 0,
        fat_grams: 0,
        scheduled_time: '12:00',
      });
      setIsDialogOpen(false);
      toast({ title: 'Comida añadida', description: newMeal.name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la comida', variant: 'destructive' });
    }
  };

  const handleDeleteMeal = async (mealId: string, name: string) => {
    try {
      await deleteMeal.mutateAsync(mealId);
      toast({ title: 'Comida eliminada', description: name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const meals = nutritionPlan?.meals || [];
  const hydrationProgress = hydrationLog ? Math.round((hydrationLog.consumed_ml / hydrationLog.target_ml) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nutrición</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="bg-primary text-primary-foreground rounded-full">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva comida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre de la comida"
                value={newMeal.name}
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                className="bg-secondary border-border"
              />
              <Select 
                value={newMeal.meal_type} 
                onValueChange={(v: typeof newMeal.meal_type) => setNewMeal({ ...newMeal, meal_type: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Desayuno</SelectItem>
                  <SelectItem value="lunch">Almuerzo</SelectItem>
                  <SelectItem value="snack">Merienda</SelectItem>
                  <SelectItem value="dinner">Cena</SelectItem>
                  <SelectItem value="pre_workout">Pre-entreno</SelectItem>
                  <SelectItem value="post_workout">Post-entreno</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={newMeal.scheduled_time}
                onChange={(e) => setNewMeal({ ...newMeal, scheduled_time: e.target.value })}
                className="bg-secondary border-border"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Calorías</label>
                  <Input
                    type="number"
                    value={newMeal.calories || ''}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: Number(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Proteína (g)</label>
                  <Input
                    type="number"
                    value={newMeal.protein_grams || ''}
                    onChange={(e) => setNewMeal({ ...newMeal, protein_grams: Number(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Carbos (g)</label>
                  <Input
                    type="number"
                    value={newMeal.carbs_grams || ''}
                    onChange={(e) => setNewMeal({ ...newMeal, carbs_grams: Number(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Grasas (g)</label>
                  <Input
                    type="number"
                    value={newMeal.fat_grams || ''}
                    onChange={(e) => setNewMeal({ ...newMeal, fat_grams: Number(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateMeal} 
                className="w-full bg-primary text-primary-foreground"
                disabled={!newMeal.name.trim() || createMeal.isPending}
              >
                {createMeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir comida'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Macros Summary */}
      {nutritionPlan && (
        <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Macros del día</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{nutritionPlan.daily_calories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{nutritionPlan.protein_grams}g</p>
              <p className="text-xs text-muted-foreground">Proteína</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{nutritionPlan.carbs_grams}g</p>
              <p className="text-xs text-muted-foreground">Carbos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{nutritionPlan.fat_grams}g</p>
              <p className="text-xs text-muted-foreground">Grasas</p>
            </div>
          </div>
        </div>
      )}

      {/* Hydration */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-foreground">Hidratación</h3>
          </div>
          <span className="text-blue-400 font-bold">{hydrationLog?.consumed_ml || 0}ml / 3000ml</span>
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

      {/* Supplements */}
      <div className="mb-6">
        <SupplementsSection />
      </div>

      {/* Meals */}
      <h3 className="font-semibold text-foreground mb-3">Comidas</h3>
      {meals.length > 0 ? (
        <div className="space-y-3">
          {meals.map((meal) => {
            const completed = isMealCompleted(meal.id);
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
                  disabled={toggleMeal.isPending}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    completed ? "bg-success" : "bg-secondary"
                  )}
                >
                  {completed ? (
                    <Check className="w-5 h-5 text-success-foreground" />
                  ) : (
                    <Utensils className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{meal.name}</p>
                    <span className="text-sm text-muted-foreground">{meal.scheduled_time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {meal.calories} kcal • {meal.protein_grams}g prot
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMeal(meal.id, meal.name)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tienes comidas programadas</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Añadir primera comida
          </Button>
        </div>
      )}
    </div>
  );
};

export default NutritionPage;
