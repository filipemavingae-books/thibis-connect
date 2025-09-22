import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  if (showCodeInput && selectedChat) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setShowCodeInput(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Código de Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarImage src={selectedChat.avatar_url} />
                  <AvatarFallback>{selectedChat.display_name[0]}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{selectedChat.display_name}</h3>
                <p className="text-sm text-muted-foreground">@{selectedChat.username}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Digite o código de mensagem (email ou telefone cadastrado) para iniciar o chat:
              </p>
              <Input
                type="text"
                placeholder="Código de mensagem"
                value={messageCode}
                onChange={(e) => setMessageCode(e.target.value)}
              />
              <Button onClick={verifyCodeAndOpenChat} className="w-full">
                Verificar e Abrir Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedChat(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarImage src={selectedChat.avatar_url} />
                <AvatarFallback>{selectedChat.display_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{selectedChat.display_name}</h3>
                  {selectedChat.is_verified && (
                    <Badge variant="secondary" className="text-xs">Verificado</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{selectedChat.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-card p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Mensagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários verificados..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProfiles(e.target.value);
                }}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Resultados da busca:</h3>
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => openChat(profile)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{profile.display_name}</p>
                          {profile.is_verified && (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Conversar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground">
                Nenhum usuário verificado encontrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;