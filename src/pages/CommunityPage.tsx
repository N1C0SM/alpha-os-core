import React, { useState } from 'react';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Plus, 
  Trophy, 
  Flame, 
  Camera, 
  Send,
  Loader2,
  UserPlus,
  Target,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useCommunityFeed,
  useCreatePost,
  useToggleLike,
  usePostComments,
  useAddComment,
  useActiveChallenges,
  useJoinChallenge,
  Post,
  Challenge,
} from '@/hooks/useCommunity';
import { useProfile } from '@/hooks/useProfile';

const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges'>('feed');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState('');

  const { data: profile } = useProfile();
  const { data: feed, isLoading: feedLoading } = useCommunityFeed();
  const { data: challenges, isLoading: challengesLoading } = useActiveChallenges();
  const { data: comments, isLoading: commentsLoading } = usePostComments(selectedPost?.id || null);
  
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const addComment = useAddComment();
  const joinChallenge = useJoinChallenge();
  const { toast } = useToast();

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      await createPost.mutateAsync({ content: newPostContent });
      setNewPostContent('');
      setIsNewPostOpen(false);
      toast({ title: '¡Post publicado!' });
    } catch (error) {
      toast({ title: 'Error al publicar', variant: 'destructive' });
    }
  };

  const handleLike = async (post: Post) => {
    try {
      await toggleLike.mutateAsync({ postId: post.id, isLiked: post.liked_by_me || false });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;
    
    try {
      await addComment.mutateAsync({ postId: selectedPost.id, content: newComment });
      setNewComment('');
    } catch (error) {
      toast({ title: 'Error al comentar', variant: 'destructive' });
    }
  };

  const handleJoinChallenge = async (challenge: Challenge) => {
    try {
      await joinChallenge.mutateAsync(challenge.id);
      toast({ title: '¡Te has unido al reto!' });
    } catch (error) {
      toast({ title: 'Error al unirse', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent pointer-events-none" />
        
        <div className="px-5 pt-12 pb-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Comunidad</h1>
              <p className="text-muted-foreground mt-1">Comparte tu progreso</p>
            </div>
            <Button 
              size="icon"
              className="bg-primary text-primary-foreground rounded-full h-12 w-12 shadow-lg"
              onClick={() => setIsNewPostOpen(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger 
              value="feed" 
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="challenges" 
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Retos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="px-5">
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {feedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : feed?.length === 0 ? (
              <EmptyFeed onCreatePost={() => setIsNewPostOpen(true)} />
            ) : (
              feed?.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post)}
                  onComment={() => setSelectedPost(post)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challengesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : challenges?.length === 0 ? (
              <EmptyChallenges />
            ) : (
              challenges?.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={() => handleJoinChallenge(challenge)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* New Post Dialog */}
      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nuevo post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {profile?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="¿Qué quieres compartir?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="flex-1 min-h-[100px] bg-secondary/50 border-border resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Camera className="w-5 h-5 mr-2" />
                Foto
              </Button>
              
              <Button 
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || createPost.isPending}
                className="bg-primary text-primary-foreground"
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comentarios</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-2">
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : comments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Sé el primero en comentar
                </p>
              ) : (
                comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {comment.author?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">
                          {comment.author?.full_name || 'Usuario'}
                        </span>{' '}
                        <span className="text-muted-foreground">{comment.content}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Input
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-secondary/50 border-border"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button 
              size="icon"
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending}
              className="bg-primary text-primary-foreground"
            >
              {addComment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-components

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment }) => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Author */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.author?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {post.author?.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {post.author?.full_name || 'Usuario'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
        {post.post_type !== 'general' && (
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            post.post_type === 'workout' && "bg-primary/20 text-primary",
            post.post_type === 'progress' && "bg-success/20 text-success",
            post.post_type === 'achievement' && "bg-warning/20 text-warning",
          )}>
            {post.post_type === 'workout' && '🏋️ Entreno'}
            {post.post_type === 'progress' && '📈 Progreso'}
            {post.post_type === 'achievement' && '🏆 Logro'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="aspect-square bg-secondary">
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center gap-4 border-t border-border/50">
        <button 
          onClick={onLike}
          className={cn(
            "flex items-center gap-2 transition-colors",
            post.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("w-5 h-5", post.liked_by_me && "fill-current")} />
          <span className="text-sm">{post.likes_count}</span>
        </button>
        
        <button 
          onClick={onComment}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments_count}</span>
        </button>
      </div>
    </div>
  );
};

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onJoin }) => {
  const isParticipating = !!challenge.my_participation;
  const progress = challenge.my_participation && challenge.target_value 
    ? (challenge.my_participation.current_value / challenge.target_value) * 100 
    : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            challenge.challenge_type === 'workout' && "bg-primary/20",
            challenge.challenge_type === 'nutrition' && "bg-success/20",
            challenge.challenge_type === 'habit' && "bg-purple-500/20",
            challenge.challenge_type === 'steps' && "bg-blue-500/20",
          )}>
            {challenge.challenge_type === 'workout' && <Flame className="w-5 h-5 text-primary" />}
            {challenge.challenge_type === 'nutrition' && <Target className="w-5 h-5 text-success" />}
            {challenge.challenge_type === 'habit' && <Trophy className="w-5 h-5 text-purple-500" />}
            {challenge.challenge_type === 'steps' && <Users className="w-5 h-5 text-blue-500" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{challenge.title}</h3>
            <p className="text-sm text-muted-foreground">{challenge.participants_count} participantes</p>
          </div>
        </div>
        
        {!isParticipating ? (
          <Button 
            size="sm" 
            onClick={onJoin}
            className="bg-primary text-primary-foreground"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Unirse
          </Button>
        ) : challenge.my_participation?.completed ? (
          <span className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium">
            ✓ Completado
          </span>
        ) : (
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
            En progreso
          </span>
        )}
      </div>

      {challenge.description && (
        <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
      )}

      {isParticipating && challenge.target_value && (
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso</span>
            <span className="text-foreground font-medium">
              {challenge.my_participation?.current_value || 0}/{challenge.target_value} {challenge.target_unit}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Termina el {new Date(challenge.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
};

const EmptyFeed: React.FC<{ onCreatePost: () => void }> = ({ onCreatePost }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
      <Users className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">El feed está vacío</h3>
    <p className="text-muted-foreground mb-6">Sé el primero en compartir tu progreso</p>
    <Button onClick={onCreatePost} className="bg-primary text-primary-foreground">
      <Plus className="w-4 h-4 mr-2" />
      Crear post
    </Button>
  </div>
);

const EmptyChallenges: React.FC = () => (
  <div className="text-center py-16">
    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
      <Trophy className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">No hay retos activos</h3>
    <p className="text-muted-foreground">Los retos semanales aparecerán aquí</p>
  </div>
);

export default CommunityPage;