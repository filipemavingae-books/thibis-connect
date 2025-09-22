import { Check, Star, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  const benefits = [
    "Autenticação segura com Supabase",
    "Chat em tempo real com WebSocket",
    "Upload ilimitado de documentos e fotos",
    "Sistema de denúncias e moderação",
    "PWA instalável com cache de 20MB",
    "Selo de verificação premium",
    "Canais monetizados",
    "Suporte a OTP por email e SMS"
  ];

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                A plataforma que <span className="text-primary">revoluciona</span> 
                a comunicação digital
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Thibis combina a praticidade do WhatsApp com a funcionalidade de canais 
                do Instagram, oferecendo uma experiência única e segura para todos os usuários.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center space-x-8 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Online</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Mensagens</div>
              </div>
            </div>
          </div>
          
          <div className="relative animate-scale-in">
            <div className="bg-primary/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Verificação Premium</h3>
                  <p className="text-sm text-muted-foreground">Selo azul de confiança</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                  <Users2 className="w-6 h-6 text-success-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Comunidade Segura</h3>
                  <p className="text-sm text-muted-foreground">Sistema de denúncias ativo</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="default" className="w-full">
                  Começar Gratuitamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;