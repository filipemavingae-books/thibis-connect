import { ArrowRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-thibis.jpg";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Conecte-se com
                <span className="hero-gradient bg-clip-text text-transparent"> segurança</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A plataforma de mensagens mais segura e completa. Chat em tempo real, 
                canais exclusivos e verificação premium para uma experiência única.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="default" size="lg" className="group">
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Ver Demonstração
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">100% Seguro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Tempo Real</span>
              </div>
            </div>
          </div>
          
          <div className="relative animate-scale-in">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Thibis - Plataforma de Mensagens Segura" 
                className="w-full h-auto rounded-2xl shadow-2xl hover-lift"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-full h-full bg-primary/10 rounded-2xl -z-10"></div>
            <div className="absolute -bottom-4 -left-4 w-full h-full bg-accent rounded-2xl -z-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;