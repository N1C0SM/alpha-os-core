import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission as NotificationPermissionState);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({ 
        title: 'No soportado', 
        description: 'Tu navegador no soporta notificaciones',
        variant: 'destructive' 
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);
      
      if (result === 'granted') {
        // Show a test notification
        new Notification('AlphaSupps OS', {
          body: '¡Notificaciones activadas! Te recordaremos tus entrenos y comidas.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
        return true;
      } else if (result === 'denied') {
        toast({ 
          title: 'Permiso denegado', 
          description: 'Puedes habilitarlas en la configuración del navegador',
          variant: 'destructive' 
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const scheduleNotification = useCallback((
    title: string, 
    body: string, 
    delayMs: number,
    tag?: string
  ) => {
    if (!isSupported || permission !== 'granted') return null;

    const timeoutId = setTimeout(() => {
      sendNotification(title, { body, tag });
    }, delayMs);

    return timeoutId;
  }, [isSupported, permission, sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
  };
};

// Notification scheduler for daily reminders
export class NotificationScheduler {
  private scheduledNotifications: Map<string, ReturnType<typeof setTimeout>> = new Map();

  scheduleDaily(id: string, hour: number, minute: number, title: string, body: string) {
    // Clear existing schedule for this id
    this.cancel(id);

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: id,
        });
      }
      // Reschedule for next day
      this.scheduleDaily(id, hour, minute, title, body);
    }, delay);

    this.scheduledNotifications.set(id, timeoutId);
    return true;
  }

  cancel(id: string) {
    const existing = this.scheduledNotifications.get(id);
    if (existing) {
      clearTimeout(existing);
      this.scheduledNotifications.delete(id);
    }
  }

  cancelAll() {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }
}

export const notificationScheduler = new NotificationScheduler();
