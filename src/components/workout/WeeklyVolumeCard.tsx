import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  useWeeklyVolume, 
  getMuscleTranslation, 
  getRecommendedSets, 
  getVolumeStatus 
} from '@/hooks/useWeeklyVolume';
import { cn } from '@/lib/utils';

const WeeklyVolumeCard: React.FC = () => {
  const { data, isLoading } = useWeeklyVolume();

  if (isLoading) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-secondary rounded w-1/3"></div>
          <div className="h-4 bg-secondary rounded w-full"></div>
          <div className="h-4 bg-secondary rounded w-full"></div>
        </div>
      </Card>
    );
  }

  if (!data || data.muscleVolumes.length === 0) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Volumen Semanal</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Empieza a entrenar para ver tu volumen semanal por músculo.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Volumen Semanal</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {data.totalSets} sets totales
        </span>
      </div>

      <div className="space-y-3">
        {data.muscleVolumes.slice(0, 8).map((item) => {
          const rec = getRecommendedSets(item.muscle);
          const status = getVolumeStatus(item.muscle, item.sets);
          const progress = Math.min(100, (item.sets / rec.max) * 100);

          return (
            <div key={item.muscle} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">
                    {getMuscleTranslation(item.muscle)}
                  </span>
                  {status === 'low' && (
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {status === 'optimal' && (
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  )}
                  {status === 'high' && (
                    <Minus className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  status === 'low' && "text-amber-500",
                  status === 'optimal' && "text-green-500",
                  status === 'high' && "text-red-500"
                )}>
                  {item.sets} / {rec.min}-{rec.max}
                </span>
              </div>
              <Progress 
                value={progress} 
                className={cn(
                  "h-2",
                  status === 'low' && "[&>div]:bg-amber-500",
                  status === 'optimal' && "[&>div]:bg-green-500",
                  status === 'high' && "[&>div]:bg-red-500"
                )}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Bajo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Óptimo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Alto
          </span>
        </div>
      </div>
    </Card>
  );
};

export default WeeklyVolumeCard;
