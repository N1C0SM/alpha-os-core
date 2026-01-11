import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, UserMinus, Dumbbell, Calendar, Flame, Clock, Loader2, Heart, MessageCircle, CheckSquare, Pill, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  usePublicProfile,
  useFollowersCount,
  useFollowingCount,
  useFollowersList,
  useFollowingList,
  useIsFollowing,
  useUserPosts,
  useUserWorkoutPlans,
  useUserWorkoutSessions,
  useUserHabits,
  useUserSupplements,
  useUserSchedule,
} from '@/hooks/usePublicProfile';
import { useFollowUser, useUnfollowUser, useToggleLike, Post } from '@/hooks/useCommunity';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'feed' | 'routines'>('feed');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const { data: profile, isLoading: profileLoading } = usePublicProfile(userId || null);
  const { data: followersCount } = useFollowersCount(userId || null);
  const { data: followingCount } = useFollowingCount(userId || null);
  const { data: followers } = useFollowersList(userId || null);
  const { data: following } = useFollowingList(userId || null);
  const { data: isFollowing, isLoading: isFollowingLoading } = useIsFollowing(userId || null);
  const { data: posts } = useUserPosts(userId || null);
  const { data: workoutPlans } = useUserWorkoutPlans(userId || null);
  const { data: workoutSessions } = useUserWorkoutSessions(userId || null);
  const { data: habits } = useUserHabits(userId || null, profile?.show_habits || false);
  const { data: supplements } = useUserSupplements(userId || null, profile?.show_supplements || false);
  const { data: schedule } = useUserSchedule(userId || null, profile?.show_schedule || false);

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const toggleLike = useToggleLike();

  const isOwnProfile = user?.id === userId;

  const handleFollow = async () => {
    if (!userId) return;
    try {
      await followUser.mutateAsync(userId);
      toast({ title: '¡Ahora sigues a este usuario!' });
    } catch {
      toast({ title: 'Error al seguir', variant: 'destructive' });
    }
  };

  const handleUnfollow = async () => {
    if (!userId) return;
    try {
      await unfollowUser.mutateAsync(userId);
      toast({ title: 'Has dejado de seguir' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleLike = async (post: Post) => {
    try {
      await toggleLike.mutateAsync({ postId: post.id, isLiked: post.liked_by_me || false });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Ganar músculo',
    fat_loss: 'Perder grasa',
    recomposition: 'Recomposición',
    maintenance: 'Mantener',
  };

  const experienceLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Usuario no encontrado</h2>
        <p className="text-muted-foreground mb-4">Este perfil no existe o no está disponible</p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {profile.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name || 'Usuario'}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.fitness_goal && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {goalLabels[profile.fitness_goal] || profile.fitness_goal}
                </span>
              )}
              {profile.experience_level && (
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-full">
                  {experienceLabels[profile.experience_level] || profile.experience_level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-6">
          <button onClick={() => setShowFollowers(true)} className="text-center">
            <p className="text-xl font-bold text-foreground">{followersCount || 0}</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </button>
          <button onClick={() => setShowFollowing(true)} className="text-center">
            <p className="text-xl font-bold text-foreground">{followingCount || 0}</p>
            <p className="text-xs text-muted-foreground">Siguiendo</p>
          </button>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{posts?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && user && (
          <Button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            disabled={isFollowingLoading || followUser.isPending || unfollowUser.isPending}
            className={`w-full ${isFollowing ? 'bg-secondary text-foreground hover:bg-destructive hover:text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}
          >
            {followUser.isPending || unfollowUser.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-2" />
                Siguiendo
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Seguir
              </>
            )}
          </Button>
        )}

        {isOwnProfile && (
          <Button onClick={() => navigate('/perfil')} variant="outline" className="w-full">
            Editar perfil
          </Button>
        )}
      </div>

      {/* Optional Sections */}
      {(profile.show_habits || profile.show_supplements || profile.show_schedule) && (
        <div className="px-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {profile.show_habits && habits && habits.length > 0 && (
              <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{habits.length} hábitos</span>
              </div>
            )}
            {profile.show_supplements && supplements && supplements.length > 0 && (
              <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{supplements.length} suplementos</span>
              </div>
            )}
            {profile.show_schedule && schedule && (
              <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">
                  Entrena a las {schedule.workout_time?.substring(0, 5) || '--:--'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full bg-secondary/50 p-1 rounded-xl mb-4">
            <TabsTrigger value="feed" className="flex-1 rounded-lg">
              Feed
            </TabsTrigger>
            <TabsTrigger value="routines" className="flex-1 rounded-lg">
              Rutinas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            {posts?.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Sin publicaciones aún</p>
              </div>
            ) : (
              posts?.map((post) => (
                <div key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-4">
                    {post.content && (
                      <p className="text-foreground mb-3">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <button 
                        onClick={() => handleLike(post as any)}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Heart className={`w-5 h-5 ${(post as any).liked_by_me ? 'fill-primary text-primary' : ''}`} />
                        <span className="text-sm">{post.likes_count}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post.comments_count}</span>
                      </div>
                      <span className="text-xs ml-auto">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="routines" className="space-y-4">
            {/* Recent Sessions */}
            {workoutSessions && workoutSessions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Entrenamientos recientes
                </h3>
                <div className="space-y-2">
                  {workoutSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="bg-card rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {(session.workout_plan_days as any)?.name || 'Entrenamiento'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(session.date), "d 'de' MMMM", { locale: es })}
                            </p>
                          </div>
                        </div>
                        {session.duration_minutes && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{session.duration_minutes} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workout Plans */}
            {workoutPlans?.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Sin rutinas públicas</p>
              </div>
            ) : (
              workoutPlans?.map((plan) => (
                <div key={plan.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.days_per_week} días/semana • {plan.split_type?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  
                  {plan.workout_plan_days && (
                    <div className="space-y-2">
                      {(plan.workout_plan_days as any[]).slice(0, 3).map((day: any) => (
                        <div key={day.id} className="bg-secondary/50 rounded-lg p-3">
                          <p className="font-medium text-foreground text-sm">{day.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {day.workout_plan_exercises?.length || 0} ejercicios
                          </p>
                        </div>
                      ))}
                      {(plan.workout_plan_days as any[]).length > 3 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{(plan.workout_plan_days as any[]).length - 3} días más
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

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
              <p className="text-center text-muted-foreground py-8">No sigue a nadie</p>
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

export default PublicProfilePage;
