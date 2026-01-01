import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Moon, Sun, LogOut, Loader2, Clock, Dumbbell, Utensils, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { usePreferences, useUpdatePreferences } from '@/hooks/usePreferences';
import { useNotifications, notificationScheduler } from '@/hooks/useNotifications';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { data: preferences, isLoading: prefsLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const { permission, requestPermission, isSupported, sendNotification } = useNotifications();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Schedule notifications when preferences change
  useEffect(() => {
    if (preferences?.notifications_enabled && permission === 'granted') {
      // Schedule daily reminders
      notificationScheduler.scheduleDaily(
        'workout-reminder',
        18, 0, // 6:00 PM
        '💪 Hora de entrenar',
        '¿Listo para tu entreno de hoy?'
      );
      
      notificationScheduler.scheduleDaily(
        'hydration-reminder',
        10, 0, // 10:00 AM
        '💧 Hidratación',
        'Recuerda beber agua regularmente'
      );

      notificationScheduler.scheduleDaily(
        'hydration-reminder-2',
        15, 0, // 3:00 PM
        '💧 Hidratación',
        '¿Has bebido suficiente agua hoy?'
      );
    } else {
      notificationScheduler.cancelAll();
    }

    return () => {
      notificationScheduler.cancelAll();
    };
  }, [preferences?.notifications_enabled, permission]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/auth');
    } catch {
      toast({ title: 'Error al cerrar sesión', variant: 'destructive' });
      setIsLoggingOut(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    if (enabled) {
      // Request permission first
      const granted = await requestPermission();
      if (!granted) {
        return; // Don't save preference if permission denied
      }
    }

    try {
      await updatePreferences.mutateAsync({ notifications_enabled: enabled });
      
      if (!enabled) {
        notificationScheduler.cancelAll();
        toast({ title: 'Notificaciones desactivadas' });
      }
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      toast({ 
        title: 'Activa las notificaciones primero', 
        variant: 'destructive' 
      });
      return;
    }
    
    sendNotification('🔔 Notificación de prueba', {
      body: 'Las notificaciones funcionan correctamente',
    });
  };

  const isDark = theme === 'dark';
  const notificationsEnabled = preferences?.notifications_enabled ?? true;

  if (prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 safe-top pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/perfil')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Configuración</h1>
      </div>

      <div className="space-y-4">
        {/* Notifications Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Notificaciones
          </h2>
          
          {/* Main notification toggle */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Notificaciones</p>
                  <p className="text-sm text-muted-foreground">
                    {!isSupported 
                      ? 'No soportado en este navegador' 
                      : permission === 'denied' 
                        ? 'Bloqueadas en el navegador'
                        : 'Recordatorios y alertas'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={notificationsEnabled && permission === 'granted'} 
                onCheckedChange={handleNotificationsChange}
                disabled={updatePreferences.isPending || !isSupported || permission === 'denied'}
              />
            </div>
          </div>

          {/* Notification types info */}
          {notificationsEnabled && permission === 'granted' && (
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Recibirás recordatorios de:</p>
              
              <div className="flex items-center gap-3 text-sm">
                <Dumbbell className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Entreno diario (18:00)</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Hidratación (10:00 y 15:00)</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={handleTestNotification}
              >
                Probar notificación
              </Button>
            </div>
          )}

          {permission === 'denied' && (
            <p className="text-xs text-destructive px-1">
              Has bloqueado las notificaciones. Para activarlas, ve a la configuración de tu navegador.
            </p>
          )}
        </div>

        {/* Appearance Section */}
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Apariencia
          </h2>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {mounted && isDark ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Tema oscuro</p>
                  <p className="text-sm text-muted-foreground">
                    {mounted ? (isDark ? 'Activado' : 'Desactivado') : 'Cargando...'}
                  </p>
                </div>
              </div>
              {mounted && (
                <Switch 
                  checked={isDark} 
                  onCheckedChange={toggleTheme}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-8">
          <Button 
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
