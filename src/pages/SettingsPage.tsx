import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Moon, Sun, LogOut, Loader2, Dumbbell, Utensils, Droplets, Pill, CheckSquare, Crown, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { usePreferences, useUpdatePreferences } from '@/hooks/usePreferences';
import { useUserSchedule } from '@/hooks/useProfile';
import { useNotifications, notificationScheduler } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { data: preferences, isLoading: prefsLoading } = usePreferences();
  const { data: schedule } = useUserSchedule();
  const updatePreferences = useUpdatePreferences();
  const { permission, requestPermission, isSupported, sendNotification } = useNotifications();
  const { isPremium, subscriptionEnd, openCheckout, openCustomerPortal, isLoading: subLoading } = useSubscription();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Parse time string to hours and minutes
  const parseTime = (timeStr: string | null | undefined): { hour: number; minute: number } => {
    if (!timeStr) return { hour: 8, minute: 0 };
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour: hour || 8, minute: minute || 0 };
  };

  // Schedule notifications based on user schedule
  useEffect(() => {
    if (preferences?.notifications_enabled && permission === 'granted') {
      // Workout reminder - based on user's workout time
      const workoutTime = parseTime(schedule?.workout_time);
      notificationScheduler.scheduleDaily(
        'workout-reminder',
        workoutTime.hour,
        workoutTime.minute,
        '💪 Hora de entrenar',
        '¿Listo para tu entreno de hoy?'
      );

      // Morning supplements - at wake time
      const wakeTime = parseTime(schedule?.wake_time);
      notificationScheduler.scheduleDaily(
        'supplements-morning',
        wakeTime.hour,
        wakeTime.minute + 30, // 30 min after waking
        '💊 Suplementos de mañana',
        'No olvides tus suplementos matutinos'
      );

      // Pre-workout supplements - 30 min before workout
      const preWorkoutHour = workoutTime.minute >= 30 
        ? workoutTime.hour 
        : workoutTime.hour - 1;
      const preWorkoutMinute = workoutTime.minute >= 30 
        ? workoutTime.minute - 30 
        : workoutTime.minute + 30;
      notificationScheduler.scheduleDaily(
        'supplements-preworkout',
        preWorkoutHour,
        preWorkoutMinute,
        '⚡ Pre-entreno',
        'Toma tu pre-entreno ahora'
      );

      // Post-workout supplements - 30 min after workout
      notificationScheduler.scheduleDaily(
        'supplements-postworkout',
        workoutTime.hour + 1,
        workoutTime.minute,
        '🥤 Post-entreno',
        'Hora del batido y suplementos post-entreno'
      );

      // Night supplements - before sleep
      const sleepTime = parseTime(schedule?.sleep_time);
      notificationScheduler.scheduleDaily(
        'supplements-night',
        sleepTime.hour - 1,
        sleepTime.minute,
        '🌙 Suplementos nocturnos',
        'No olvides tus suplementos antes de dormir'
      );

      // Habits reminder - mid morning
      notificationScheduler.scheduleDaily(
        'habits-morning',
        9, 0,
        '✅ Revisa tus hábitos',
        'Empieza el día completando tus hábitos'
      );

      // Habits reminder - evening
      notificationScheduler.scheduleDaily(
        'habits-evening',
        20, 0,
        '✅ Hábitos del día',
        '¿Has completado todos tus hábitos hoy?'
      );

      // Hydration reminders
      notificationScheduler.scheduleDaily(
        'hydration-1',
        10, 0,
        '💧 Hidratación',
        'Recuerda beber agua'
      );

      notificationScheduler.scheduleDaily(
        'hydration-2',
        13, 0,
        '💧 Hidratación',
        '¿Has bebido suficiente agua?'
      );

      notificationScheduler.scheduleDaily(
        'hydration-3',
        16, 0,
        '💧 Hidratación',
        'Mantén tu hidratación'
      );

      // Meal reminders based on schedule
      const breakfastTime = parseTime(schedule?.breakfast_time);
      notificationScheduler.scheduleDaily(
        'meal-breakfast',
        breakfastTime.hour,
        breakfastTime.minute,
        '🍳 Desayuno',
        'Hora de desayunar'
      );

      const lunchTime = parseTime(schedule?.lunch_time);
      notificationScheduler.scheduleDaily(
        'meal-lunch',
        lunchTime.hour,
        lunchTime.minute,
        '🥗 Almuerzo',
        'Hora de almorzar'
      );

      const dinnerTime = parseTime(schedule?.dinner_time);
      notificationScheduler.scheduleDaily(
        'meal-dinner',
        dinnerTime.hour,
        dinnerTime.minute,
        '🍽️ Cena',
        'Hora de cenar'
      );

    } else {
      notificationScheduler.cancelAll();
    }

    return () => {
      notificationScheduler.cancelAll();
    };
  }, [preferences?.notifications_enabled, permission, schedule]);

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
      const granted = await requestPermission();
      if (!granted) {
        return;
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

  // Format time for display
  const formatTimeDisplay = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

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
                    {permission === 'unsupported' || !isSupported
                      ? 'No disponible en preview (funciona en la app publicada)' 
                      : permission === 'denied' 
                        ? 'Bloqueadas - actívalas en configuración del navegador'
                        : permission === 'default'
                          ? 'Pulsa para activar'
                          : 'Recordatorios personalizados'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={notificationsEnabled && permission === 'granted'} 
                onCheckedChange={handleNotificationsChange}
                disabled={updatePreferences.isPending || permission === 'unsupported' || permission === 'denied'}
              />
            </div>
          </div>

          {/* Info for unsupported/preview context */}
          {(permission === 'unsupported' || !isSupported) && (
            <div className="bg-muted/50 rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Las notificaciones no están disponibles en el modo preview. 
                Publica tu app para recibir recordatorios en tu dispositivo.
              </p>
            </div>
          )}

          {/* Notification details */}
          {notificationsEnabled && permission === 'granted' && (
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Recibirás recordatorios de:</p>
              
              {/* Training */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Entreno</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeDisplay(schedule?.workout_time)}
                </span>
              </div>

              {/* Supplements */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Suplementos</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Mañana, pre/post, noche
                </span>
              </div>

              {/* Habits */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Hábitos</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  09:00 y 20:00
                </span>
              </div>

              {/* Meals */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Utensils className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Comidas</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeDisplay(schedule?.breakfast_time)}, {formatTimeDisplay(schedule?.lunch_time)}, {formatTimeDisplay(schedule?.dinner_time)}
                </span>
              </div>
              
              {/* Hydration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Hidratación</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  10:00, 13:00, 16:00
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleTestNotification}
                >
                  Probar notificación
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Los horarios se basan en tu configuración de horarios
                </p>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <p className="text-xs text-destructive px-1">
              Has bloqueado las notificaciones. Para activarlas, ve a la configuración de tu navegador.
            </p>
          )}
        </div>

        {/* Subscription Section */}
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Suscripción
          </h2>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPremium 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                    : 'bg-muted'
                }`}>
                  <Crown className={`w-5 h-5 ${isPremium ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {isPremium ? 'Premium' : 'Plan Gratuito'}
                    </p>
                    {isPremium && (
                      <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPremium && subscriptionEnd
                      ? `Renueva el ${format(new Date(subscriptionEnd), "d 'de' MMMM", { locale: es })}`
                      : 'Máximo 3 rutinas'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              {isPremium ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={openCustomerPortal}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gestionar suscripción
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={openCheckout}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Actualizar a Premium - 4,99€/mes
                </Button>
              )}
            </div>
          </div>
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
