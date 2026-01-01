import React from 'react';
import { Dumbbell, Play, History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TrainingPage: React.FC = () => {
  const todayWorkout = {
    name: 'Push Day',
    focus: 'Pecho, Hombros, Tríceps',
    exercises: [
      { name: 'Press de Banca', sets: 4, reps: '8-10', weight: '70kg' },
      { name: 'Press Inclinado', sets: 3, reps: '10-12', weight: '50kg' },
      { name: 'Press Militar', sets: 4, reps: '8-10', weight: '40kg' },
      { name: 'Aperturas con Mancuernas', sets: 3, reps: '12-15', weight: '14kg' },
      { name: 'Extensiones en Polea', sets: 3, reps: '12-15', weight: '25kg' },
    ],
  };

  return (
    <div className="px-4 py-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground mb-6">Entrenamiento</h1>

      {/* Today's Workout */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-5 mb-6 border border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-primary">Hoy</p>
            <h2 className="text-xl font-bold text-foreground">{todayWorkout.name}</h2>
            <p className="text-sm text-muted-foreground">{todayWorkout.focus}</p>
          </div>
          <Button className="bg-primary text-primary-foreground rounded-full w-14 h-14">
            <Play className="w-6 h-6 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{todayWorkout.exercises.length} ejercicios • ~60 min</p>
      </div>

      {/* Exercise List */}
      <div className="space-y-3 mb-6">
        {todayWorkout.exercises.map((ex, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div>
                <p className="font-medium text-foreground">{ex.name}</p>
                <p className="text-sm text-muted-foreground">{ex.sets} series × {ex.reps}</p>
              </div>
            </div>
            <span className="text-primary font-bold">{ex.weight}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-14 border-border">
          <History className="w-5 h-5 mr-2" />
          Historial
        </Button>
        <Button variant="outline" className="h-14 border-border">
          <TrendingUp className="w-5 h-5 mr-2" />
          Progreso
        </Button>
      </div>
    </div>
  );
};

export default TrainingPage;
