import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  ImageIcon,
  ChevronRight,
  Search
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
  useSuggestedUsers,
  useSearchUsers,
  useFollowUser,
  useUnfollowUser,
  Post,
  Challenge,
  UserToFollow,
} from '@/hooks/useCommunity';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'discover'>('feed');
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: feed, isLoading: feedLoading } = useCommunityFeed(feedFilter === 'following');
  const { data: challenges, isLoading: challengesLoading } = useActiveChallenges();
  const { data: comments, isLoading: commentsLoading } = usePostComments(selectedPost?.id || null);
  const { data: suggestedUsers, isLoading: suggestedLoading } = useSuggestedUsers();
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(searchQuery);
  
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const addComment = useAddComment();
  const joinChallenge = useJoinChallenge();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return;
    
    try {
      await createPost.mutateAsync({ 
        content: newPostContent,
        imageFile: selectedImage || undefined,
      });
      setNewPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
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

  const handleFollow = async (userId: string) => {
    try {
      await followUser.mutateAsync(userId);
      toast({ title: '¡Ahora sigues a este usuario!' });
    } catch (error) {
      toast({ title: 'Error al seguir', variant: 'destructive' });
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser.mutateAsync(userId);
      toast({ title: 'Has dejado de seguir' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
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
              value="discover" 
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Descubrir
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
            {/* Feed Filter */}
            <div className="flex gap-2">
              <Button
                variant={feedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedFilter('all')}
                className={cn(
                  "rounded-full",
                  feedFilter === 'all' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </Button>
              <Button
                variant={feedFilter === 'following' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedFilter('following')}
                className={cn(
                  "rounded-full",
                  feedFilter === 'following' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Siguiendo
              </Button>
            </div>

            {feedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : feed?.length === 0 ? (
              feedFilter === 'following' ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No sigues a nadie aún</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Descubre usuarios y síguelos para ver su contenido aquí
                  </p>
                  <Button onClick={() => setActiveTab('discover')} className="bg-primary text-primary-foreground">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Descubrir usuarios
                  </Button>
                </div>
              ) : (
                <EmptyFeed onCreatePost={() => setIsNewPostOpen(true)} />
              )
            ) : (
              feed?.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={() => handleLike(post)}
                  onComment={() => setSelectedPost(post)}
                  onFollow={() => handleFollow(post.user_id)}
                  onUnfollow={() => handleUnfollow(post.user_id)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Results */}
            {searchQuery.trim().length >= 2 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Resultados</h3>
                {searchLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : searchResults?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No se encontraron usuarios con "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  searchResults?.map((userToFollow) => (
                    <UserCard
                      key={userToFollow.id}
                      user={userToFollow}
                      onFollow={() => userToFollow.is_following ? handleUnfollow(userToFollow.id) : handleFollow(userToFollow.id)}
                      isFollowing={userToFollow.is_following}
                    />
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Suggested Users */}
                <h3 className="text-lg font-semibold text-foreground">Usuarios sugeridos</h3>
                {suggestedLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : suggestedUsers?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No hay sugerencias</h3>
                    <p className="text-muted-foreground text-sm">
                      Pronto aparecerán más usuarios aquí
                    </p>
                  </div>
                ) : (
                  suggestedUsers?.map((userToFollow) => (
                    <UserCard
                      key={userToFollow.id}
                      user={userToFollow}
                      onFollow={() => handleFollow(userToFollow.id)}
                    />
                  ))
                )}
              </>
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

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full h-8 w-8"
                  onClick={removeSelectedImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedImage ? (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                    <span className="text-primary">Foto añadida</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Foto
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleCreatePost}
                disabled={(!newPostContent.trim() && !selectedImage) || createPost.isPending}
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
  currentUserId?: string;
  onLike: () => void;
  onComment: () => void;
  onFollow: () => void;
  onUnfollow: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onLike, onComment, onFollow, onUnfollow }) => {
  const isOwnPost = currentUserId === post.user_id;
  
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Author */}
      <div className="p-4 flex items-center gap-3">
        <a href={`/usuario/${post.user_id}`} className="cursor-pointer">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {post.author?.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </a>
        <div className="flex-1">
          <a href={`/usuario/${post.user_id}`} className="font-medium text-foreground hover:underline">
            {post.author?.full_name || 'Usuario'}
          </a>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
        
        {/* Follow/Unfollow button */}
        {!isOwnPost && (
          post.is_following ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onUnfollow}
              className="rounded-full border-border text-muted-foreground hover:text-foreground"
            >
              Siguiendo
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onFollow}
              className="rounded-full bg-primary text-primary-foreground"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Seguir
            </Button>
          )
        )}
        
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

interface UserCardProps {
  user: UserToFollow;
  onFollow: () => void;
  isFollowing?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, onFollow, isFollowing = false }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-4">
      <a 
        href={`/usuario/${user.id}`}
        onClick={(e) => { e.preventDefault(); navigate(`/usuario/${user.id}`); }}
        className="cursor-pointer"
      >
        <Avatar className="h-14 w-14">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback className="bg-primary/20 text-primary text-lg">
            {user.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      </a>
      <div className="flex-1">
        <a 
          href={`/usuario/${user.id}`}
          onClick={(e) => { e.preventDefault(); navigate(`/usuario/${user.id}`); }}
          className="cursor-pointer hover:underline"
        >
          <p className="font-medium text-foreground text-lg">
            {user.full_name || 'Usuario'}
          </p>
        </a>
        <p className="text-sm text-muted-foreground">
          Comparte su progreso contigo
        </p>
      </div>
      <Button
        size="sm"
        onClick={onFollow}
        variant={isFollowing ? "outline" : "default"}
        className={cn(
          "rounded-full",
          isFollowing 
            ? "border-border text-muted-foreground hover:text-foreground" 
            : "bg-primary text-primary-foreground"
        )}
      >
        {isFollowing ? (
          'Siguiendo'
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-1" />
            Seguir
          </>
        )}
      </Button>
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