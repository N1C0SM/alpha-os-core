import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Moon, Sun, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { usePreferences, useUpdatePreferences } from '@/hooks/usePreferences';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { data: preferences, isLoading: prefsLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    try {
      await updatePreferences.mutateAsync({ notifications_enabled: enabled });
      toast({ title: enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas' });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
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
    <div className="px-4 py-6 safe-top">
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
        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Notificaciones</p>
                <p className="text-sm text-muted-foreground">Recordatorios y alertas</p>
              </div>
            </div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={handleNotificationsChange}
              disabled={updatePreferences.isPending}
            />
          </div>
        </div>

        {/* Theme */}
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

        {/* Sign Out */}
        <Button 
          variant="destructive"
          className="w-full mt-8"
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
  );
};

export default SettingsPage;
