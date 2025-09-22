import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  ArrowLeft,
  Sparkles,
  Shield,
  Heart,
  Star,
  Smile,
  Image,
  Paperclip,
  Mic,
  Users,
  Clock,
  Check,
  CheckCheck,
  MessageCircle,
  UserCheck,
  Lock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/ui/verified-badge";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  post_id?: string;
}

interface Profile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  is_verified: boolean;
  uuid_code: string;
}

const Chat = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedChat, setSelectedChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageCode, setMessageCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedChat || !user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.chat_${user.id}_${selectedChat.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, user]);

  // Real-time presence
  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user?.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.keys(newState);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({
            user_id: user.id,
            username: profile?.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const searchProfiles = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, is_verified, uuid_code')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .eq('is_verified', true)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openChat = async (selectedProfile: Profile) => {
    setShowCodeInput(true);
    setSelectedChat(selectedProfile);
  };

  const verifyCodeAndOpenChat = async () => {
    if (!selectedChat || !user) return;

    try {
      // Verify message code matches email or phone
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('contact_info')
        .eq('id', selectedChat.id)
        .single();

      if (error) throw error;

      // Simple code verification (in real app, this would be more secure)
      if (messageCode === profileData.contact_info || messageCode === selectedChat.uuid_code) {
        setShowCodeInput(false);
        await loadMessages();
        toast({
          title: "Chat aberto!",
          description: `Agora você pode conversar com ${selectedChat.display_name}`,
        });
      } else {
        throw new Error("Código de mensagem inválido");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    if (!selectedChat || !user) return;

    try {
      const chatId = `chat_${user.id}_${selectedChat.id}`;
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const chatId = `chat_${user.id}_${selectedChat.id}`;
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newMessage,
          user_id: user.id,
          post_id: chatId,
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (showCodeInput && selectedChat) {
    return (
      <div className="min-h-screen bg-gradient-primary p-1">
        <div className="max-w-md mx-auto pt-16">
          <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCodeInput(false)}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Shield className="h-5 w-5" />
                Código Seguro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="relative">
                  <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-white/20">
                    <AvatarImage src={selectedChat.avatar_url} />
                    <AvatarFallback className="bg-white/20 text-white text-xl">
                      {selectedChat.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {selectedChat.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                      <VerifiedBadge size="sm" className="text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-white text-xl">{selectedChat.display_name}</h3>
                <p className="text-white/70">@{selectedChat.username}</p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-sm text-white/80 text-center mb-4 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Digite o código de mensagem para iniciar uma conversa segura:
                </p>
                <Input
                  type="text"
                  placeholder="Código de mensagem"
                  value={messageCode}
                  onChange={(e) => setMessageCode(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center"
                />
              </div>
              
              <Button 
                onClick={verifyCodeAndOpenChat} 
                className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-glow"
              >
                <Star className="h-4 w-4 mr-2" />
                Verificar e Abrir Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    const isOnline = onlineUsers.includes(selectedChat.id);
    
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col">
        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedChat(null)}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={selectedChat.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedChat.display_name[0]}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{selectedChat.display_name}</h3>
                  {selectedChat.is_verified && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      <VerifiedBadge size="sm" className="mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">@{selectedChat.username}</p>
                  {isOnline && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Online
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Video className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <MoreVertical className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Início de uma nova conversa
                </p>
                <p className="text-sm text-muted-foreground/70">Seja respeitoso e divirta-se!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.user_id === user?.id;
                const prevMessage = messages[index - 1];
                const isFirstInGroup = !prevMessage || prevMessage.user_id !== message.user_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isOwn && isFirstInGroup && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={selectedChat.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {selectedChat.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isOwn && !isFirstInGroup && <div className="w-8" />}
                      
                      <div className={`relative group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-soft relative ${
                            isOwn
                              ? 'bg-gradient-primary text-white'
                              : 'bg-white border border-gray-100'
                          } ${isFirstInGroup ? (isOwn ? 'rounded-br-md' : 'rounded-bl-md') : ''}`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white/90 backdrop-blur-lg border-t border-white/20 p-4 sticky bottom-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Paperclip className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Image className="h-4 w-4 text-primary" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="pr-12 bg-white/80 border-white/30 focus:border-primary/50 rounded-full"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-primary/10"
                >
                  <Smile className="h-4 w-4 text-primary" />
                </Button>
              </div>
              
              {newMessage.trim() ? (
                <Button 
                  onClick={sendMessage} 
                  className="bg-gradient-primary hover:opacity-90 rounded-full shadow-glow"
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <Mic className="h-4 w-4 text-primary" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-elegant">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Mensagens
                </CardTitle>
                <p className="text-muted-foreground">Conecte-se com pessoas verificadas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários verificados..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProfiles(e.target.value);
                }}
                className="pl-11 bg-white/60 border-white/30 focus:border-primary/50 rounded-full"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Resultados da busca:
                </h3>
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 cursor-pointer transition-all hover-lift"
                    onClick={() => openChat(profile)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {onlineUsers.includes(profile.id) && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{profile.display_name}</p>
                          {profile.is_verified && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                              <VerifiedBadge size="sm" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white shadow-soft">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conversar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário verificado encontrado.</p>
                <p className="text-sm text-muted-foreground/70">Tente buscar por outro nome ou usuário</p>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Comece uma conversa
                </h3>
                <p className="text-muted-foreground mb-4">
                  Busque por usuários verificados para iniciar um chat seguro
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <VerifiedBadge size="sm" />
                    <span>Apenas usuários verificados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Conversas seguras</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;