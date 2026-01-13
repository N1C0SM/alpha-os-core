import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { User, Target, Calendar, Settings, LogOut, ChevronRight, Download, Crown, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useSubscription } from '@/contexts/SubscriptionContext';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { isInstalled } = usePWAInstall();
  const { isPremium } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRedoOnboarding = () => {
    navigate('/onboarding?redo=true');
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
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        {isPremium && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-500">Premium</span>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-5 mb-6 border border-border">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{profile?.full_name || 'Usuario'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{profile?.weight_kg || '--'}kg</p>
            <p className="text-xs text-muted-foreground">Peso</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{profile?.height_cm || '--'}cm</p>
            <p className="text-xs text-muted-foreground">Altura</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">
              {goalLabels[profile?.fitness_goal as keyof typeof goalLabels] || '--'}
            </p>
            <p className="text-xs text-muted-foreground">Objetivo</p>
          </div>
        </div>
      </div>

      {/* Premium Upgrade */}
      {!isPremium && (
        <button
          onClick={() => navigate('/premium')}
          className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/30 flex items-center gap-4 hover:from-yellow-500/20 hover:to-orange-500/20 transition-colors mb-6"
        >
          <Crown className="w-6 h-6 text-yellow-500" />
          <div className="flex-1 text-left">
            <span className="font-semibold text-foreground block">Hazte Premium</span>
            <span className="text-xs text-muted-foreground">Rutinas ilimitadas, historial completo y más</span>
          </div>
          <ChevronRight className="w-5 h-5 text-yellow-500" />
        </button>
      )}

      {/* Menu */}
      <div className="space-y-2 mb-6">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => item.path && navigate(item.path)}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary/50 transition-colors"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Redo Onboarding */}
      <button
        onClick={handleRedoOnboarding}
        className="w-full bg-secondary/50 rounded-xl p-4 border border-border flex items-center gap-4 hover:bg-secondary transition-colors mb-4"
      >
        <RotateCcw className="w-5 h-5 text-muted-foreground" />
        <span className="flex-1 text-left font-medium text-foreground">Rehacer onboarding</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Install App Button */}
      {!isInstalled && (
        <button
          onClick={() => navigate('/instalar')}
          className="w-full bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center gap-4 hover:bg-primary/20 transition-colors mb-6"
        >
          <Download className="w-5 h-5 text-primary" />
          <span className="flex-1 text-left font-medium text-foreground">Instalar app</span>
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full h-12 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  );
};

export default ProfilePage;