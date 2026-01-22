import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Target, Calendar, Settings, LogOut, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
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

  const menuItems = [
    { icon: User, label: 'Datos personales', path: '/perfil/datos' },
    { icon: Target, label: 'Objetivos', path: '/perfil/objetivos' },
    { icon: Calendar, label: 'Horarios', path: '/perfil/horarios' },
    { icon: Settings, label: 'Configuración', path: '/perfil/config' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
        {isPremium && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-500">Premium</span>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile?.full_name || 'Usuario'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{profile?.weight_kg || '--'}kg</p>
              <p className="text-sm text-muted-foreground">Peso</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{profile?.height_cm || '--'}cm</p>
              <p className="text-sm text-muted-foreground">Altura</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {goalLabels[profile?.fitness_goal as keyof typeof goalLabels] || '--'}
              </p>
              <p className="text-sm text-muted-foreground">Objetivo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Upgrade */}
      {!isPremium && (
        <Card 
          className="cursor-pointer border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 hover:from-yellow-500/10 hover:to-orange-500/10 transition-colors"
          onClick={() => navigate('/premium')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Hazte Premium</p>
              <p className="text-sm text-muted-foreground">Rutinas ilimitadas, historial completo y más</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu */}
      <div className="grid gap-2 md:grid-cols-2">
        {menuItems.map((item, i) => (
          <Card 
            key={i}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => item.path && navigate(item.path)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <Card 
          className="cursor-pointer border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
          onClick={() => navigate('/admin')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <Shield className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-foreground">Panel de administración</span>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  );
};

export default ProfilePage;
