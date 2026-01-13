import React, { useState } from 'react';
import { Check, Flame, Plus, Loader2, Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHabits, useHabitLogs, useToggleHabit, useCreateHabit, useDeleteHabit } from '@/hooks/useHabits';
import { useProfile } from '@/hooks/useProfile';
import { getHabitRecommendations, RecommendedHabit } from '@/services/decision-engine/habit-recommendations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const HabitsPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✓');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const { data: profile } = useProfile();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: habitLogs } = useHabitLogs(today);
  const toggleHabit = useToggleHabit();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const { toast } = useToast();

  // Get personalized recommendations
  const recommendations = profile ? getHabitRecommendations({
    weightKg: profile.weight_kg || 75,
    heightCm: profile.height_cm || 175,
    fitnessGoal: (profile.fitness_goal as any) || 'muscle_gain',
    experienceLevel: (profile.experience_level as any) || 'beginner',
  }) : [];

  // Filter out already added habits
  const availableRecommendations = recommendations.filter(
    rec => !habits?.some(h => h.name.toLowerCase().includes(rec.name.toLowerCase().slice(0, 10)))
  );

  const isHabitCompleted = (habitId: string) => {
    return habitLogs?.some(log => log.habit_id === habitId && log.completed) || false;
  };

  const handleToggle = (habitId: string) => {
    const completed = !isHabitCompleted(habitId);
    toggleHabit.mutate({ habitId, date: today, completed });
  };

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;
    
    try {
      await createHabit.mutateAsync({ 
        name: newHabitName, 
        icon: newHabitIcon 
      });
      setNewHabitName('');
      setNewHabitIcon('✓');
      setIsDialogOpen(false);
      toast({ title: 'Hábito creado', description: newHabitName });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el hábito', variant: 'destructive' });
    }
  };

  const handleAddRecommendedHabit = async (rec: RecommendedHabit) => {
    try {
      await createHabit.mutateAsync({ 
        name: rec.name, 
        description: rec.description,
        icon: rec.icon 
      });
      toast({ title: '✨ Hábito añadido', description: rec.name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el hábito', variant: 'destructive' });
    }
  };

  const handleDeleteHabit = async (habitId: string, name: string) => {
    try {
      await deleteHabit.mutateAsync(habitId);
      toast({ title: 'Hábito eliminado', description: name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const completedCount = habits?.filter(h => isHabitCompleted(h.id)).length || 0;
  const totalCount = habits?.length || 0;

  const iconOptions = ['✓', '💧', '💊', '🧘', '🚶', '🧠', '😴', '📚', '🏃', '🥗', '⏰', '💪', '☀️', '📝', '🍌'];

  if (habitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Hábitos</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowRecommendations(true)}
            className="rounded-full"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="bg-primary text-primary-foreground rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Nuevo hábito</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Nombre del hábito"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="bg-secondary border-border"
                />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Icono</p>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewHabitIcon(icon)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                          newHabitIcon === icon 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={handleCreateHabit} 
                  className="w-full bg-primary text-primary-foreground"
                  disabled={!newHabitName.trim() || createHabit.isPending}
                >
                  {createHabit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear hábito'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Recommendations Dialog */}
      <Dialog open={showRecommendations} onOpenChange={setShowRecommendations}>
        <DialogContent className="bg-card border-border max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Hábitos recomendados para ti
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3 pt-2">
              {availableRecommendations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  ¡Ya has añadido todos los hábitos recomendados! 💪
                </p>
              ) : (
                availableRecommendations.map((rec, i) => (
                  <div 
                    key={i}
                    className="bg-secondary/50 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{rec.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{rec.name}</p>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddRecommendedHabit(rec)}
                        disabled={createHabit.isPending}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded">
                      💡 {rec.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Progress */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Progreso de hoy</h3>
          <span className="text-primary font-bold">{completedCount}/{totalCount}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Quick add recommendations banner */}
      {availableRecommendations.length > 0 && (!habits || habits.length < 3) && (
        <button
          onClick={() => setShowRecommendations(true)}
          className="w-full mb-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground text-sm">Hábitos personalizados</p>
              <p className="text-xs text-muted-foreground">
                {availableRecommendations.length} recomendaciones según tu perfil
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* Habits List */}
      {habits && habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map((habit) => {
            const completed = isHabitCompleted(habit.id);
            return (
              <div 
                key={habit.id}
                className={cn(
                  "bg-card rounded-xl p-4 border flex items-center gap-4 transition-all",
                  completed ? "border-success/30 bg-success/5" : "border-border"
                )}
              >
                <button 
                  onClick={() => handleToggle(habit.id)}
                  disabled={toggleHabit.isPending}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
                    completed ? "bg-success" : "bg-secondary"
                  )}
                >
                  {completed ? (
                    <Check className="w-6 h-6 text-success-foreground" />
                  ) : (
                    habit.icon
                  )}
                </button>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    completed ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Racha activa</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHabit(habit.id, habit.name)}
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
          <p className="text-muted-foreground mb-4">No tienes hábitos todavía</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button 
              onClick={() => setShowRecommendations(true)} 
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ver recomendados para ti
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear hábito manual
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
