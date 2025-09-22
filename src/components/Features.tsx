import { 
  MessageSquare, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle, 
  Globe,
  Smartphone,
  Lock
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Chat em Tempo Real",
    description: "Mensagens instantâneas com WebSocket, indicadores de digitação e status de entrega.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Canais Exclusivos",
    description: "Crie canais como Instagram, publique conteúdo e monetize com verificação premium.",
    color: "text-success"
  },
  {
    icon: Shield,
    title: "Segurança Máxima",
    description: "Autenticação OTP, PIN de segurança e sistema de denúncias para proteção total.",
    color: "text-destructive"
  },
  {
    icon: Zap,
    title: "PWA Instalável", 
    description: "Instale como aplicativo nativo, funciona offline com limite de 20MB.",
    color: "text-warning"
  },
  {
    icon: CheckCircle,
    title: "Selo de Verificação",
    description: "Obtenha o selo azul de verificação para canais seguros e monetizados.",
    color: "text-primary"
  },
  {
    icon: Globe,
    title: "Acesso Global",
    description: "Conecte-se com pessoas do mundo todo de forma segura e verificada.",
    color: "text-success"
  },
  {
    icon: Smartphone,
    title: "Totalmente Responsivo",
    description: "Experiência perfeita em qualquer dispositivo, sem zoom, sem erros.",
    color: "text-primary"
  },
  {
    icon: Lock,
    title: "Privacidade Total",
    description: "Seus dados são protegidos com as melhores práticas de segurança.",
    color: "text-destructive"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            Funcionalidades <span className="text-primary">Poderosas</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para uma comunicação segura e profissional
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 bg-card rounded-xl shadow-soft hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4">
                <feature.icon className={`w-12 h-12 ${feature.color} group-hover:scale-110 transition-transform`} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;