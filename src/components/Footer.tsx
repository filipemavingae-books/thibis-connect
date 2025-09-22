import { MessageCircle, Mail, Shield, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary/5 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary">Thibis</span>
            </div>
            <p className="text-muted-foreground">
              A plataforma de mensagens mais segura e completa do mercado.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Produto</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><a href="#download" className="hover:text-primary transition-colors">Download</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
              <li><a href="#api" className="hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Suporte</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#help" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contato</a></li>
              <li><a href="#status" className="hover:text-primary transition-colors">Status</a></li>
              <li><a href="#community" className="hover:text-primary transition-colors">Comunidade</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#privacy" className="hover:text-primary transition-colors">Privacidade</a></li>
              <li><a href="#terms" className="hover:text-primary transition-colors">Termos</a></li>
              <li><a href="#security" className="hover:text-primary transition-colors">Segurança</a></li>
              <li><a href="#cookies" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Global</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>24/7 Suporte</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2024 Thibis. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;