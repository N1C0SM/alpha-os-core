import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { User, Target, Calendar, Settings, LogOut, ChevronRight, Download, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import ProgressPhotosSection from '@/components/profile/ProgressPhotosSection';
import { useFollowersCount, useFollowingCount, useFollowersList, useFollowingList } from '@/hooks/usePublicProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { isInstalled } = usePWAInstall();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const { data: followersCount } = useFollowersCount(user?.id || null);
  const { data: followingCount } = useFollowingCount(user?.id || null);
  const { data: followers } = useFollowersList(user?.id || null);
  const { data: following } = useFollowingList(user?.id || null);

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
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/usuario/${user?.id}`)}
          className="text-muted-foreground"
        >
          <Users className="w-4 h-4 mr-2" />
          Ver perfil público
        </Button>
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

        {/* Followers/Following Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-border">
          <button onClick={() => setShowFollowers(true)} className="text-center">
            <p className="text-lg font-bold text-foreground">{followersCount || 0}</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </button>
          <button onClick={() => setShowFollowing(true)} className="text-center">
            <p className="text-lg font-bold text-foreground">{followingCount || 0}</p>
            <p className="text-xs text-muted-foreground">Siguiendo</p>
          </button>
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

      {/* Progress Photos */}
      <div className="mb-6">
        <ProgressPhotosSection />
      </div>

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

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {followers?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin seguidores aún</p>
            ) : (
              <div className="space-y-3">
                {followers?.map((follower) => (
                  <button
                    key={follower.id}
                    onClick={() => {
                      setShowFollowers(false);
                      navigate(`/usuario/${follower.id}`);
                    }}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={follower.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {follower.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{follower.full_name || 'Usuario'}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Siguiendo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {following?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sigues a nadie</p>
            ) : (
              <div className="space-y-3">
                {following?.map((followed) => (
                  <button
                    key={followed.id}
                    onClick={() => {
                      setShowFollowing(false);
                      navigate(`/usuario/${followed.id}`);
                    }}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={followed.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {followed.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{followed.full_name || 'Usuario'}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
