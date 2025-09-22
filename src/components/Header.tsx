import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageCircle, Menu, X, Shield, User, Settings, LogOut } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary shadow-elegant backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2" onClick={() => handleNavigation('/')} role="button">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Thibis</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Button 
                variant="ghost" 
                className="text-white hover:text-primary hover:bg-white/10"
                onClick={() => handleNavigation('/chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              
              {user && profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-2 text-white hover:bg-white/10">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="bg-white text-primary">
                          {profile.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Definições
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => handleNavigation('/auth')}
                >
                  Entrar
                </Button>
              )}
            </nav>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-primary/95 backdrop-blur-sm border-t border-white/10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="ghost" 
                  className="text-white justify-start"
                  onClick={() => handleNavigation('/chat')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                
                {user && profile ? (
                  <>
                    <Button 
                      variant="ghost" 
                      className="text-white justify-start"
                      onClick={() => handleNavigation('/profile')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-white justify-start"
                      onClick={() => handleNavigation('/settings')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Definições
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-primary justify-start"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="bg-white text-primary hover:bg-white/90 justify-start"
                    onClick={() => handleNavigation('/auth')}
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;