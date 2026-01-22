import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Target, Calendar, Settings, LogOut, Crown, Shield, Mail, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader, StatCard } from '@/components/ui/saas-components';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: schedule } = useUserSchedule();
  const navigate = useNavigate();
  const { isPremium } = useSubscription();

  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      if (error) return false;
      return data as boolean;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const goalLabels = {
    muscle_gain: 'Ganar músculo',
    fat_loss: 'Perder grasa',
    recomposition: 'Recomposición',
    maintenance: 'Mantener',
  };

  const experienceLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mi Perfil"
        description="Gestiona tu cuenta y configuración"
      >
        {isPremium && (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-500">Premium</span>
          </div>
        )}
      </PageHeader>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{profile?.full_name || 'Usuario'}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => navigate('/perfil/datos')}>
                  <User className="w-4 h-4 mr-2" />
                  Editar perfil
                </Button>
                <Button variant="outline" onClick={() => navigate('/perfil/config')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Peso"
          value={`${profile?.weight_kg || '--'} kg`}
        />
        <StatCard 
          label="Altura"
          value={`${profile?.height_cm || '--'} cm`}
        />
        <StatCard 
          label="Objetivo"
          value={goalLabels[profile?.fitness_goal as keyof typeof goalLabels] || '--'}
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard 
          label="Experiencia"
          value={experienceLabels[profile?.experience_level as keyof typeof experienceLabels] || '--'}
          icon={<Dumbbell className="w-5 h-5" />}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Datos personales */}
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/perfil/datos')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Datos personales</h3>
              <p className="text-sm text-muted-foreground">Nombre, peso, altura, edad</p>
            </div>
          </CardContent>
        </Card>

        {/* Objetivos */}
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/perfil/objetivos')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Objetivos</h3>
              <p className="text-sm text-muted-foreground">Meta fitness y preferencias</p>
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/perfil/horarios')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Horarios</h3>
              <p className="text-sm text-muted-foreground">Disponibilidad y actividades</p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/perfil/config')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Configuración</h3>
              <p className="text-sm text-muted-foreground">Notificaciones, tema, cuenta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium & Admin */}
      <div className="space-y-3">
        {!isPremium && (
          <Card 
            className="cursor-pointer border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 hover:from-yellow-500/10 hover:to-orange-500/10 transition-colors"
            onClick={() => navigate('/premium')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Hazte Premium</h3>
                <p className="text-sm text-muted-foreground">Rutinas ilimitadas, progresión automática y más</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card 
            className="cursor-pointer border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
            onClick={() => navigate('/admin')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Panel de Administración</h3>
                <p className="text-sm text-muted-foreground">Gestionar usuarios y configuración</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  );
};

export default ProfilePage;
