import React from 'react';
import { Check, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

const NutritionPage: React.FC = () => {
  const meals = [
    { name: 'Desayuno', time: '08:00', calories: 550, protein: 35, completed: true },
    { name: 'Almuerzo', time: '13:00', calories: 650, protein: 45, completed: false },
    { name: 'Pre-entreno', time: '17:00', calories: 250, protein: 20, completed: false },
    { name: 'Post-entreno', time: '19:30', calories: 500, protein: 40, completed: false },
    { name: 'Cena', time: '21:00', calories: 450, protein: 30, completed: false },
  ];

  const totals = { calories: 2400, protein: 170, carbs: 280, fats: 75 };

  return (
    <div className="px-4 py-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground mb-6">Nutrición</h1>

      {/* Macros Summary */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Macros del día</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totals.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{totals.protein}g</p>
            <p className="text-xs text-muted-foreground">Proteína</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{totals.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{totals.fats}g</p>
            <p className="text-xs text-muted-foreground">Grasas</p>
          </div>
        </div>
      </div>

      {/* Meals */}
      <h3 className="font-semibold text-foreground mb-3">Comidas</h3>
      <div className="space-y-3">
        {meals.map((meal, i) => (
          <div 
            key={i} 
            className={cn(
              "bg-card rounded-xl p-4 border flex items-center gap-4",
              meal.completed ? "border-success/30 bg-success/5" : "border-border"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              meal.completed ? "bg-success" : "bg-secondary"
            )}>
              {meal.completed ? (
                <Check className="w-5 h-5 text-success-foreground" />
              ) : (
                <Utensils className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{meal.name}</p>
                <span className="text-sm text-muted-foreground">{meal.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {meal.calories} kcal • {meal.protein}g proteína
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NutritionPage;
