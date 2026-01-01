import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

const goals: { value: FitnessGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'muscle_gain', label: 'Ganar músculo', emoji: '💪', desc: 'Hipertrofia y fuerza' },
  { value: 'fat_loss', label: 'Perder grasa', emoji: '🔥', desc: 'Definición manteniendo músculo' },
  { value: 'recomposition', label: 'Recomposición', emoji: '⚖️', desc: 'Ganar músculo y perder grasa' },
  { value: 'maintenance', label: 'Mantener', emoji: '🎯', desc: 'Conservar forma actual' },
];

const levels: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Principiante', desc: 'Menos de 1 año entrenando' },
  { value: 'intermediate', label: 'Intermedio', desc: '1-3 años entrenando' },
  { value: 'advanced', label: 'Avanzado', desc: 'Más de 3 años entrenando' },
];

const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const handleGoalChange = async (goal: FitnessGoal) => {
    try {
      await updateProfile.mutateAsync({ fitness_goal: goal });
      toast({ title: 'Objetivo actualizado' });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  const handleLevelChange = async (level: ExperienceLevel) => {
    try {
      await updateProfile.mutateAsync({ experience_level: level });
      toast({ title: 'Nivel actualizado' });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/perfil')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Objetivos</h1>
      </div>

      {/* Fitness Goal */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Objetivo principal</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {goals.map((goal) => (
            <button
              key={goal.value}
              onClick={() => handleGoalChange(goal.value)}
              disabled={updateProfile.isPending}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                profile?.fitness_goal === goal.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <span className="text-2xl mb-2 block">{goal.emoji}</span>
              <p className="font-semibold text-foreground">{goal.label}</p>
              <p className="text-xs text-muted-foreground">{goal.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Nivel de experiencia</h2>
        </div>
        
        <div className="space-y-3">
          {levels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleLevelChange(level.value)}
              disabled={updateProfile.isPending}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                profile?.experience_level === level.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <p className="font-semibold text-foreground">{level.label}</p>
              <p className="text-sm text-muted-foreground">{level.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
