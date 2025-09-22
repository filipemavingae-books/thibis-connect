import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Facebook, 
  MessageCircle, 
  Flag,
  Shield,
  Users,
  Heart,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import VerifiedBadge from "@/components/ui/verified-badge";

interface ProfileData {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  location: string;
  work_study: string;
  education: string;
  contact_info: string;
  is_verified: boolean;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  uuid_code: string;
}

interface Post {
  id: string;
  content: string;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const Profile = () => {
  const { user, profile: currentUserProfile } = useAuth();
  const { username } = useParams();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    } else if (currentUserProfile) {
      setProfileData(currentUserProfile as ProfileData);
      fetchUserPosts(currentUserProfile.id);
      setLoading(false);
    }
  }, [username, currentUserProfile]);

  const fetchProfile = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      setProfileData(data);
      await fetchUserPosts(data.id);
      await checkFollowStatus(data.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
    }
  };

  const checkFollowStatus = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !profileData) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profileData.id,
          });

        if (error) throw error;
        setIsFollowing(true);
      }

      toast({
        title: isFollowing ? "Deixou de seguir" : "Seguindo",
        description: `Agora você ${isFollowing ? 'não segue' : 'segue'} ${profileData.display_name}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reportUser = async (reason: string) => {
    if (!user || !profileData) return;

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: profileData.id,
          type: 'user',
          reason: reason,
        });

      if (error) throw error;

      toast({
        title: "Denúncia enviada",
        description: "Sua denúncia foi registrada e será analisada.",
      });
      setShowReportDialog(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
          <p className="text-muted-foreground">O usuário que você procura não existe.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profileData?.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 mx-auto md:mx-0">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profileData.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{profileData.display_name}</h1>
                  {profileData.is_verified && (
                    <VerifiedBadge size="lg" className="text-blue-500" />
                  )}
                </div>
                
                <p className="text-muted-foreground mb-2">@{profileData.username}</p>
                
                {profileData.bio && (
                  <p className="mb-4">{profileData.bio}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                  {profileData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                  {profileData.work_study && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{profileData.work_study}</span>
                    </div>
                  )}
                  {profileData.education && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{profileData.education}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <div className="font-bold">{posts.length}</div>
                    <div className="text-sm text-muted-foreground">Publicações</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{profileData.followers_count}</div>
                    <div className="text-sm text-muted-foreground">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{profileData.following_count}</div>
                    <div className="text-sm text-muted-foreground">Seguindo</div>
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={toggleFollow}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {isFollowing ? "Seguindo" : "Seguir"}
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Mensagem
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowReportDialog(true)}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Publicações</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <p className="mb-4">{post.content}</p>
                    {post.media_url && (
                      <div className="mb-4">
                        {post.media_type?.startsWith('image/') ? (
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full rounded-lg max-h-96 object-cover"
                          />
                        ) : post.media_type?.startsWith('video/') ? (
                          <video 
                            src={post.media_url} 
                            controls 
                            className="w-full rounded-lg max-h-96"
                          />
                        ) : null}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments_count}</span>
                      </div>
                      <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="media">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {posts
                    .filter(post => post.media_url)
                    .map((post) => (
                      <div key={post.id} className="aspect-square rounded-lg overflow-hidden">
                        {post.media_type?.startsWith('image/') ? (
                          <img 
                            src={post.media_url} 
                            alt="Media" 
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        ) : (
                          <video 
                            src={post.media_url} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                      </div>
                    ))}
                </div>
                {posts.filter(post => post.media_url).length === 0 && (
                  <p className="text-center text-muted-foreground">Nenhuma mídia encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="font-medium">Código UUID:</label>
                  <p className="text-muted-foreground">{profileData.uuid_code}</p>
                </div>
                
                {profileData.contact_info && (
                  <div>
                    <label className="font-medium">Contato:</label>
                    <p className="text-muted-foreground">
                      {profileData.contact_info.replace(/(.{2})(.*)(.{2})/, '$1***$3')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="font-medium">Status da Conta:</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={profileData.is_verified ? "default" : "secondary"}>
                      {profileData.is_verified ? "Verificada" : "Não Verificada"}
                    </Badge>
                    <Badge variant={profileData.is_private ? "outline" : "secondary"}>
                      {profileData.is_private ? "Privada" : "Pública"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;