import React from 'react';
import { Check, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const HabitsPage: React.FC = () => {
  const habits = [
    { name: 'Beber 3L de agua', icon: '💧', completed: false, streak: 12 },
    { name: 'Tomar creatina', icon: '💊', completed: true, streak: 30 },
    { name: '10 min estiramientos', icon: '🧘', completed: false, streak: 5 },
    { name: 'Caminar 8000 pasos', icon: '🚶', completed: false, streak: 8 },
    { name: 'Meditar 5 min', icon: '🧠', completed: true, streak: 15 },
    { name: 'Dormir 8 horas', icon: '😴', completed: false, streak: 3 },
  ];

  const completedCount = habits.filter(h => h.completed).length;

  return (
    <div className="px-4 py-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground mb-6">Hábitos</h1>

      {/* Progress */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Progreso de hoy</h3>
          <span className="text-primary font-bold">{completedCount}/{habits.length}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / habits.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.map((habit, i) => (
          <div 
            key={i}
            className={cn(
              "bg-card rounded-xl p-4 border flex items-center gap-4 transition-all",
              habit.completed ? "border-success/30 bg-success/5" : "border-border"
            )}
          >
            <button className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
              habit.completed ? "bg-success" : "bg-secondary"
            )}>
              {habit.completed ? (
                <Check className="w-6 h-6 text-success-foreground" />
              ) : (
                habit.icon
              )}
            </button>
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                habit.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {habit.name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">{habit.streak} días</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitsPage;
