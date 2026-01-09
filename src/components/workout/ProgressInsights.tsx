import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Target, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlateauAnalysis } from '@/hooks/usePlateauAnalysis';

const ProgressInsights: React.FC = () => {
  const { data: analysis, isLoading } = usePlateauAnalysis();

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Análisis de progreso</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Entrena durante algunas semanas más para ver tu análisis de progreso y predicción de estancamientos.
        </p>
      </div>
    );
  }

  const riskColors = {
    low: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-destructive bg-destructive/10',
  };

  const trendIcons = {
    improving: <TrendingUp className="w-5 h-5 text-success" />,
    maintaining: <Minus className="w-5 h-5 text-warning" />,
    declining: <TrendingDown className="w-5 h-5 text-destructive" />,
  };

  const trendLabels = {
    improving: 'Mejorando',
    maintaining: 'Manteniendo',
    declining: 'Bajando',
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header with trend */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Predicción de progreso</h3>
              <p className="text-xs text-muted-foreground">Análisis de las últimas 12 semanas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {trendIcons[analysis.overallTrend]}
            <span className="text-sm font-medium">{trendLabels[analysis.overallTrend]}</span>
          </div>
        </div>

        {/* Risk indicator */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            riskColors[analysis.plateauRisk]
          )}>
            {analysis.plateauRisk === 'high' && <AlertTriangle className="w-4 h-4" />}
            {analysis.plateauRisk === 'medium' && <AlertTriangle className="w-4 h-4" />}
            {analysis.plateauRisk === 'low' && <CheckCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">
              Riesgo de estancamiento: {analysis.plateauRisk === 'low' ? 'bajo' : analysis.plateauRisk === 'medium' ? 'medio' : 'alto'}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Volumen semanal: {analysis.weeklyVolumeChange >= 0 ? '+' : ''}{analysis.weeklyVolumeChange.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Exercises at risk */}
      {analysis.exercisesAtRisk.length > 0 && (
        <div className="p-5 border-b border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Ejercicios a vigilar
          </h4>
          <div className="space-y-3">
            {analysis.exercisesAtRisk.slice(0, 3).map((exercise) => (
              <div key={exercise.exerciseId} className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm">{exercise.exerciseName}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    exercise.status === 'plateaued' && "bg-destructive/20 text-destructive",
                    exercise.status === 'stalling' && "bg-warning/20 text-warning",
                    exercise.status === 'declining' && "bg-destructive/20 text-destructive",
                    exercise.status === 'progressing' && "bg-success/20 text-success",
                  )}>
                    {exercise.status === 'plateaued' && 'Estancado'}
                    {exercise.status === 'stalling' && 'Frenando'}
                    {exercise.status === 'declining' && 'Retrocediendo'}
                    {exercise.status === 'progressing' && 'Progresando'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{exercise.recommendation}</p>
                {exercise.predictedPlateauIn && (
                  <p className="text-xs text-warning mt-1">
                    ⚠️ Posible estancamiento en ~{exercise.predictedPlateauIn} semanas
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="p-5">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Recomendaciones
        </h4>
        <ul className="space-y-2">
          {analysis.recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProgressInsights;