import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Target, Brain, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">
              Alpha<span className="text-primary">Supps</span> OS
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Empezar gratis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
            <Brain className="w-4 h-4" />
            <span>Potenciado por inteligencia artificial</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Entrena sin pensar.
            <br />
            <span className="text-primary">Resultados automáticos.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AUTOPILOT es el sistema operativo de fitness que decide tu entreno, 
            progresión y nutrición por ti. Tú solo ejecutas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=register">
              <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90">
                Empezar gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Todo en piloto automático</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              El sistema toma las decisiones difíciles. Tú solo te presentas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Rutinas inteligentes"
              description="El sistema genera y adapta tu rutina según tu objetivo, equipo disponible y días de entreno."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Progresión automática"
              description="Aumenta pesos y volumen de forma óptima basándose en tu rendimiento real, no en suposiciones."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Nutrición simplificada"
              description="Objetivos claros de proteína y calorías. Sin complicaciones, solo lo que necesitas."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Cómo funciona</h2>
          </div>
          
          <div className="space-y-8">
            <StepItem
              number="01"
              title="Configura tu perfil"
              description="Indica tu objetivo, experiencia y días disponibles. 2 minutos."
            />
            <StepItem
              number="02"
              title="Recibe tu plan"
              description="El sistema genera tu rutina personalizada y objetivos nutricionales."
            />
            <StepItem
              number="03"
              title="Ejecuta y registra"
              description="Entrena siguiendo las indicaciones. El sistema aprende de cada sesión."
            />
            <StepItem
              number="04"
              title="Progresa automáticamente"
              description="Sin pensar en cuándo subir peso o cambiar ejercicios. El sistema decide."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Deja de pensar. Empieza a entrenar.
          </h2>
          <p className="text-muted-foreground mb-8">
            Únete a cientos de usuarios que ya entrenan en modo autopilot.
          </p>
          <Link to="/auth?mode=register">
            <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90">
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">
              © 2024 AlphaSupps OS
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const StepItem: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({ number, title, description }) => (
  <div className="flex gap-6 items-start">
    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
      {number}
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default LandingPage;
