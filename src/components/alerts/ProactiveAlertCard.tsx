import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProactiveAlert } from '@/services/decision-engine/proactive-alerts';

interface ProactiveAlertCardProps {
  alert: ProactiveAlert;
  onDismiss?: (alertId: string) => void;
}

const colorClasses: Record<ProactiveAlert['color'], string> = {
  red: 'bg-destructive/10 border-destructive/30 text-destructive',
  yellow: 'bg-warning/10 border-warning/30 text-warning-foreground',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  green: 'bg-green-500/10 border-green-500/30 text-green-500',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
};

const bgColorClasses: Record<ProactiveAlert['color'], string> = {
  red: 'bg-destructive/20',
  yellow: 'bg-warning/20',
  blue: 'bg-blue-500/20',
  green: 'bg-green-500/20',
  purple: 'bg-purple-500/20',
};

export const ProactiveAlertCard: React.FC<ProactiveAlertCardProps> = ({ alert, onDismiss }) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (alert.actionPath) {
      navigate(alert.actionPath);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all hover:shadow-md',
        colorClasses[alert.color]
      )}
    >
      {alert.dismissible && onDismiss && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg text-xl', bgColorClasses[alert.color])}>
          {alert.icon}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-semibold text-foreground text-sm leading-tight">
            {alert.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {alert.description}
          </p>

          {alert.actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAction}
              className="mt-2 h-7 px-2 text-xs font-medium"
            >
              {alert.actionLabel}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProactiveAlertsListProps {
  alerts: ProactiveAlert[];
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export const ProactiveAlertsList: React.FC<ProactiveAlertsListProps> = ({ 
  alerts, 
  onDismiss,
  className 
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {alerts.map(alert => (
        <ProactiveAlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
