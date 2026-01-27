import React from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy, Dumbbell, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useWeeklyProgress, type WeeklyProgressData } from '@/hooks/useWeeklyProgress';

interface WeeklyProgressCardProps {
  scheduledDaysPerWeek?: number;
  className?: string;
}

export const WeeklyProgressCard: React.FC<WeeklyProgressCardProps> = ({ 
  scheduledDaysPerWeek = 4,
  className 
}) => {
  const { data, isLoading } = useWeeklyProgress(scheduledDaysPerWeek);

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-5 w-32 bg-secondary rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-secondary rounded" />
            <div className="h-4 bg-secondary rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColor = data.trend === 'up' ? 'text-green-500' : data.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const trendBg = data.trend === 'up' ? 'bg-green-500/10' : data.trend === 'down' ? 'bg-red-500/10' : 'bg-secondary';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Progreso semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volume Trend */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatVolume(data.currentWeekVolume)}
            </p>
            <p className="text-xs text-muted-foreground">
              Volumen esta semana
            </p>
          </div>
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full', trendBg)}>
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
            <span className={cn('text-sm font-medium', trendColor)}>
              {data.volumeChangePercent >= 0 ? '+' : ''}{data.volumeChangePercent}%
            </span>
          </div>
        </div>

        {/* Consistency */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Consistencia</span>
            <span className="text-xs font-medium">
              {data.sessionsThisWeek}/{scheduledDaysPerWeek} sesiones
            </span>
          </div>
          <Progress value={data.consistencyRate} className="h-2" />
        </div>

        {/* Weekly PRs */}
        {data.weeklyPRs.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-muted-foreground">
                PRs esta semana
              </span>
            </div>
            <div className="space-y-1">
              {data.weeklyPRs.slice(0, 2).map((pr, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate flex-1">
                    {pr.exerciseName}
                  </span>
                  <span className="text-primary font-medium ml-2">
                    {pr.weight}kg × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison with last week */}
        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            <span>
              Semana pasada: {formatVolume(data.previousWeekVolume)} ({data.sessionsPreviousWeek} sesiones)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function formatVolume(kg: number): string {
  if (kg >= 10000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${kg}kg`;
}

export default WeeklyProgressCard;
