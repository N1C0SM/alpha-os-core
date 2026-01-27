import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  ArrowRight, 
  Brain, 
  Utensils, 
  Dumbbell, 
  TrendingUp, 
  BookOpen,
  CheckCircle2,
  XCircle,
  Gauge,
  RefreshCw,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

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
            <span className="font-bold text-lg">AUTOPILOT</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#sistema" className="text-muted-foreground hover:text-foreground transition-colors">Sistema</a>
            <a href="#nutricion" className="text-muted-foreground hover:text-foreground transition-colors">Nutrición</a>
            <a href="#entrenamiento" className="text-muted-foreground hover:text-foreground transition-colors">Entrenamiento</a>
            <a href="#progreso" className="text-muted-foreground hover:text-foreground transition-colors">Progreso</a>
            <Link to="/conocimiento" className="text-muted-foreground hover:text-foreground transition-colors">Conocimiento</Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Empezar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — "¿Esto es para mí?" */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
            Deja de decidir.
            <br />
            <span className="text-primary">Empieza a avanzar.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Un sistema que decide tu entreno, nutrición y progresión por ti.
            <br />
            <span className="text-foreground font-medium">Tú solo ejecutas.</span>
          </p>

          {/* Quick answers */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-12 mb-12 text-left">
            <QuickAnswer 
              question="¿Qué problema quita?"
              answer="Pensar qué hacer, cuándo cambiar, si vas bien."
            />
            <QuickAnswer 
              question="¿Qué es diferente?"
              answer="No sugiere. Decide. Y se adapta solo."
            />
            <QuickAnswer 
              question="¿Qué hago yo?"
              answer="Seguir instrucciones. Registrar. Ejecutar."
            />
            <QuickAnswer 
              question="¿Y si empiezo ahora?"
              answer="En 2 min tienes tu plan personalizado listo."
            />
          </div>
          
          <Link to="/auth?mode=register">
            <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90">
              Crear mi plan gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Sin tarjeta. Sin compromiso. Plan listo en 2 minutos.
          </p>
        </div>
      </section>

      {/* SECCIÓN SISTEMA — "¿De verdad decide algo?" */}
      <section id="sistema" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader 
            icon={<Brain className="w-6 h-6" />}
            title="El sistema"
            subtitle="Decide de verdad. No sugiere."
          />
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-6">
              <SystemPoint 
                icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                title="Toma decisiones reales"
                description="Qué ejercicios hacer hoy. Cuánto peso poner. Cuándo cambiar la rutina. Cuántas calorías comer."
              />
              <SystemPoint 
                icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                title="Se basa en tus datos"
                description="Peso, objetivo, rendimiento en cada sesión, sensaciones registradas, progreso semanal."
              />
              <SystemPoint 
                icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                title="Aprende contigo"
                description="Si un ejercicio te resulta fácil, sube. Si estás estancado, cambia. Sin que tengas que pensarlo."
              />
            </div>
            
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <h4 className="font-semibold mb-4 text-lg">Decisiones que dejas de tomar:</h4>
              <ul className="space-y-3">
                <DecisionItem text="¿Cuánto peso pongo hoy?" />
                <DecisionItem text="¿Es momento de cambiar rutina?" />
                <DecisionItem text="¿Cuántas calorías necesito?" />
                <DecisionItem text="¿Estoy progresando bien?" />
                <DecisionItem text="¿Debería descansar o entrenar?" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN NUTRICIÓN — "¿Voy a tener que pensar en la comida?" */}
      <section id="nutricion" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader 
            icon={<Utensils className="w-6 h-6" />}
            title="Nutrición"
            subtitle="Objetivos claros. Sin cálculos."
          />
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <NutritionCard 
              icon={<XCircle className="w-5 h-5" />}
              title="Sin calcular macros"
              description="El sistema calcula todo. Tú ves un número simple: proteína del día."
            />
            <NutritionCard 
              icon={<RefreshCw className="w-5 h-5" />}
              title="Se ajustan solos"
              description="Si tu peso cambia, los objetivos cambian. Automáticamente."
            />
            <NutritionCard 
              icon={<Sparkles className="w-5 h-5" />}
              title="Flexible sin drama"
              description="¿No cumpliste perfecto? El sistema ajusta mañana. Sin culpa."
            />
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Lo que elimina el sistema:</h4>
                <p className="text-muted-foreground">
                  Buscar recetas, calcular porciones, recalcular cada semana, sentir culpa por un día malo.
                  <span className="text-foreground font-medium"> Solo miras el objetivo y comes.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN ENTRENAMIENTO — "¿Y qué entreno exactamente?" */}
      <section id="entrenamiento" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader 
            icon={<Dumbbell className="w-6 h-6" />}
            title="Entrenamiento"
            subtitle="Rutinas que evolucionan contigo."
          />
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-4">
              <TrainingPoint 
                question="¿Son rutinas genéricas?"
                answer="No. Se generan según tu objetivo, equipo disponible y días de entreno."
              />
              <TrainingPoint 
                question="¿Cambian con el tiempo?"
                answer="Sí. El sistema detecta estancamientos y modifica ejercicios, series o peso."
              />
              <TrainingPoint 
                question="¿Y si tengo poco tiempo?"
                answer="Se adapta. Menos días = más intensidad por sesión."
              />
              <TrainingPoint 
                question="¿Quién decide cuándo cambiar?"
                answer="El sistema. Basado en tu rendimiento real, no en calendario."
              />
            </div>
            
            <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col justify-center">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <Gauge className="w-4 h-4" />
                  <span>Progresión automática</span>
                </div>
                <p className="text-2xl font-bold mb-2">+2.5kg</p>
                <p className="text-muted-foreground text-sm">
                  Subida automática cuando el sistema detecta que estás listo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PROGRESO — "¿Cómo sé que funciona?" */}
      <section id="progreso" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader 
            icon={<TrendingUp className="w-6 h-6" />}
            title="Progreso"
            subtitle="Métricas claras. Sin adivinanzas."
          />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <ProgressCard 
              title="¿Qué mide?"
              items={["Peso levantado", "Consistencia", "Tendencias semanales"]}
            />
            <ProgressCard 
              title="¿Cómo sé si voy bien?"
              items={["Indicadores visuales", "Comparativa semanal", "Alertas proactivas"]}
            />
            <ProgressCard 
              title="¿Detecta estancamientos?"
              items={["Sí, automáticamente", "Analiza 2+ semanas", "Te avisa antes"]}
            />
            <ProgressCard 
              title="¿Qué hace cuando falla algo?"
              items={["Ajusta la rutina", "Modifica el volumen", "Cambia ejercicios"]}
            />
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h4 className="font-semibold">Diferencia clave:</h4>
            </div>
            <p className="text-muted-foreground">
              Otras apps te muestran gráficos bonitos. 
              <span className="text-foreground font-medium"> AUTOPILOT actúa cuando algo no funciona.</span>
              {' '}No espera a que tú te des cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN CONOCIMIENTO — Link */}
      <section id="conocimiento" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-4">¿Quieres saber por qué funciona?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Artículos que explican los principios detrás del sistema. 
            Sin humo. Solo ciencia aplicada.
          </p>
          <Link to="/conocimiento">
            <Button variant="outline" size="lg">
              <BookOpen className="w-4 h-4 mr-2" />
              Ir a Conocimiento
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Deja de pensar.
            <br />
            Empieza a avanzar.
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Tu plan personalizado en 2 minutos. Gratis.
          </p>
          <Link to="/auth?mode=register">
            <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90">
              Crear mi plan ahora
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
              © 2024 AUTOPILOT
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <Link to="/conocimiento" className="hover:text-foreground transition-colors">Conocimiento</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Sub-components
const QuickAnswer: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="p-4 rounded-xl bg-card border border-border/50">
    <p className="text-sm text-muted-foreground mb-1">{question}</p>
    <p className="font-medium">{answer}</p>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="text-center">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
      {icon}
    </div>
    <h2 className="text-3xl font-bold mb-2">{title}</h2>
    <p className="text-xl text-muted-foreground">{subtitle}</p>
  </div>
);

const SystemPoint: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </div>
);

const DecisionItem: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-center gap-3 text-muted-foreground">
    <XCircle className="w-4 h-4 text-primary shrink-0" />
    <span>{text}</span>
  </li>
);

const NutritionCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-card border border-border/50">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const TrainingPoint: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="p-4 rounded-xl bg-card border border-border/50">
    <p className="text-sm text-primary font-medium mb-1">{question}</p>
    <p className="text-muted-foreground">{answer}</p>
  </div>
);

const ProgressCard: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="p-5 rounded-2xl bg-card border border-border/50">
    <h4 className="font-semibold mb-3 text-sm">{title}</h4>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default LandingPage;
