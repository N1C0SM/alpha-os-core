import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, Zap, Target, TrendingUp, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

const articlesContent: Record<string, {
  title: string;
  category: string;
  readTime: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}> = {
  'rutinas-fijas-fallan': {
    title: '¿Por qué las rutinas fijas fallan?',
    category: 'Entrenamiento',
    readTime: '5 min',
    icon: Target,
    content: (
      <>
        <p className="text-xl text-muted-foreground mb-8">
          El problema no es la rutina. Es que tu cuerpo cambia y la rutina no.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">El mito de la rutina perfecta</h2>
        <p className="text-muted-foreground mb-6">
          Todos hemos buscado "la rutina definitiva". La que usan los influencers, la del estudio científico, 
          la del amigo que está enorme. Pero hay un problema fundamental: <strong className="text-foreground">tu cuerpo no es estático</strong>.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Lo que cambia cada semana</h2>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Tu capacidad de recuperación</strong> — depende del sueño, estrés laboral, alimentación de esa semana.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Tu fuerza real</strong> — no es lineal, fluctúa según el día.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Tus músculos fatigados</strong> — si ayer machacaste espalda, hoy tu agarre está comprometido.</span>
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold mb-4">Por qué las rutinas fijas estancan</h2>
        <p className="text-muted-foreground mb-6">
          Una rutina fija asume que siempre llegas igual al gimnasio. Pero si dormiste mal, 
          hacer 4x10 de peso muerto es contraproducente. Si estás en tu mejor momento, hacer lo mismo de siempre es desperdiciar potencial.
        </p>
        <p className="text-muted-foreground mb-6">
          El resultado: <strong className="text-foreground">semanas de sobreesfuerzo seguidas de semanas de infraentrenamiento</strong>. 
          Y al final, estancamiento.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">La solución: rutinas que respiran</h2>
        <p className="text-muted-foreground mb-6">
          AUTOPILOT no te da una rutina fija. Te da un <strong className="text-foreground">sistema que adapta 
          el volumen, intensidad y ejercicios</strong> según cómo llegues cada día. Si dormiste 5 horas, 
          reduce. Si vienes recuperado, empuja.
        </p>
        <p className="text-muted-foreground">
          No es magia. Es lógica. Y funciona porque <strong className="text-foreground">tu cuerpo cambia, 
          y el sistema cambia con él</strong>.
        </p>
      </>
    ),
  },
  'macros-deben-cambiar': {
    title: '¿Por qué los macros deben cambiar?',
    category: 'Nutrición',
    readTime: '4 min',
    icon: TrendingUp,
    content: (
      <>
        <p className="text-xl text-muted-foreground mb-8">
          Calcular macros una vez y mantenerlos meses es el error más común.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">El problema del "set and forget"</h2>
        <p className="text-muted-foreground mb-6">
          Calculaste tus macros. 2200 kcal, 150g proteína, bien. Pero eso fue hace 3 meses. 
          Desde entonces: <strong className="text-foreground">perdiste 4kg, tu metabolismo se adaptó, 
          tu nivel de actividad cambió</strong>.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Tu cuerpo es un sistema dinámico</h2>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Pierdes peso</strong> → necesitas menos calorías de mantenimiento.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Ganas músculo</strong> → tu metabolismo basal sube.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Entrenas más duro</strong> → necesitas más carbohidratos para rendir.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Reduces actividad</strong> → sobran calorías que se almacenan.</span>
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold mb-4">El ciclo del estancamiento nutricional</h2>
        <p className="text-muted-foreground mb-6">
          Empiezas con un déficit de 500 kcal. Pierdes peso las primeras semanas. Luego el cuerpo se adapta: 
          <strong className="text-foreground"> tu nuevo mantenimiento es más bajo</strong>. Si no ajustas, 
          ese "déficit" ya no existe. Resultado: semanas sin progreso.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">La solución: ajustes automáticos</h2>
        <p className="text-muted-foreground mb-6">
          AUTOPILOT recalcula tus macros según tu peso actual, nivel de actividad semanal, 
          y progreso real. <strong className="text-foreground">Cada semana, los números se ajustan</strong>. 
          Tú solo comes. El sistema piensa.
        </p>
        <p className="text-muted-foreground">
          Y si un día te pasas, no pasa nada. <strong className="text-foreground">El sistema compensa 
          en los días siguientes</strong> sin que tengas que calcular nada.
        </p>
      </>
    ),
  },
  'menos-decisiones-adherencia': {
    title: '¿Por qué menos decisiones mejora la adherencia?',
    category: 'Sistema',
    readTime: '6 min',
    icon: Brain,
    content: (
      <>
        <p className="text-xl text-muted-foreground mb-8">
          La fatiga de decisión mata más transformaciones que la falta de motivación.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">El problema invisible</h2>
        <p className="text-muted-foreground mb-6">
          Cada día tomas cientos de decisiones. Qué desayunar. Qué ropa ponerte. Qué responder en ese email. 
          Para cuando llegas al gimnasio, <strong className="text-foreground">tu cerebro está agotado de decidir</strong>.
        </p>
        <p className="text-muted-foreground mb-6">
          Y entonces llega la pregunta: "¿Qué entreno hoy?" — Y ahí, sin energía mental, 
          eliges lo fácil o directamente no vas.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">La ciencia detrás</h2>
        <p className="text-muted-foreground mb-6">
          Se llama <strong className="text-foreground">"decision fatigue"</strong> (fatiga de decisión). 
          Estudios muestran que la calidad de nuestras decisiones deteriora a lo largo del día. 
          Por eso los jueces dan sentencias más duras por la tarde y los CEOs usan la misma ropa cada día.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">El fitness está lleno de decisiones</h2>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground">¿Qué rutina sigo hoy?</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground">¿Cuánto peso pongo?</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground">¿Cuántas series hago?</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground">¿Qué como para llegar a mis macros?</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground">¿Cuánto descanso entre series?</span>
          </li>
        </ul>
        <p className="text-muted-foreground mb-6">
          Cada una de estas preguntas <strong className="text-foreground">consume energía mental</strong>. 
          Y cuando se acaba, abandonas.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">La solución: eliminar decisiones</h2>
        <p className="text-muted-foreground mb-6">
          AUTOPILOT toma todas estas decisiones por ti. Llegas al gym y solo ejecutas. 
          <strong className="text-foreground"> Abres la app, haces lo que dice, te vas</strong>. 
          Cero fricción mental.
        </p>
        <p className="text-muted-foreground">
          El resultado: <strong className="text-foreground">más energía para entrenar, más consistencia, 
          mejores resultados</strong>. No es que tengas más motivación. Es que gastas menos energía en pensar.
        </p>
      </>
    ),
  },
  'principios-autopilot': {
    title: 'Los principios detrás del sistema AUTOPILOT',
    category: 'Sistema',
    readTime: '8 min',
    icon: Zap,
    content: (
      <>
        <p className="text-xl text-muted-foreground mb-8">
          No es magia. Es lógica aplicada con consistencia.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Principio 1: Adaptación continua</h2>
        <p className="text-muted-foreground mb-6">
          Tu cuerpo cambia cada día. Tu plan también debería. AUTOPILOT no te da un PDF de 12 semanas. 
          <strong className="text-foreground"> Te da un sistema que evoluciona contigo</strong>.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Principio 2: Datos sobre intuición</h2>
        <p className="text-muted-foreground mb-6">
          "Me siento fuerte" no es un dato. Cuántas horas dormiste, sí. Tu peso de esta semana vs la anterior, también. 
          <strong className="text-foreground">AUTOPILOT basa sus decisiones en métricas reales</strong>, no en percepciones subjetivas.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Principio 3: Progresión inteligente</h2>
        <p className="text-muted-foreground mb-6">
          Añadir peso cada semana no funciona para siempre. El sistema detecta cuándo es momento de:
        </p>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Progresar</strong> — porque vienes rindiendo bien y estás recuperado.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Mantener</strong> — porque estás en el límite de lo que puedes recuperar.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-muted-foreground"><strong className="text-foreground">Descargar</strong> — porque necesitas un respiro para supercompensar.</span>
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold mb-4">Principio 4: Fricción mínima</h2>
        <p className="text-muted-foreground mb-6">
          Cada paso extra que te pedimos es una oportunidad de que abandones. Por eso el sistema 
          <strong className="text-foreground"> hace el máximo posible automáticamente</strong>. 
          Tú solo ejecutas y registras lo mínimo.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Principio 5: Feedback loops</h2>
        <p className="text-muted-foreground mb-6">
          Cada entrenamiento alimenta al sistema. Cada registro de peso ajusta los macros. 
          <strong className="text-foreground">El sistema aprende de ti constantemente</strong>. 
          Cuanto más lo usas, mejor te conoce, mejores decisiones toma.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Por qué funciona</h2>
        <p className="text-muted-foreground mb-6">
          Estos principios no son nuevos. Son los mismos que usan los mejores coaches del mundo 
          con sus atletas de élite. La diferencia es que AUTOPILOT 
          <strong className="text-foreground"> los aplica automáticamente, para todos, 24/7</strong>.
        </p>
        <p className="text-muted-foreground">
          No necesitas ser experto. No necesitas pensar. Solo necesitas ejecutar. 
          <strong className="text-foreground">El sistema hace el resto</strong>.
        </p>
      </>
    ),
  },
};

const ArticlePage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  
  if (!articleId || !articlesContent[articleId]) {
    return <Navigate to="/conocimiento" replace />;
  }
  
  const article = articlesContent[articleId];
  const IconComponent = article.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/conocimiento" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">AUTOPILOT</span>
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Article Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {article.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime} de lectura
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {article.title}
            </h1>
          </div>

          {/* Article Body */}
          <div className="prose prose-lg prose-invert max-w-none">
            {article.content}
          </div>
        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            ¿Listo para dejar de pensar?
          </h2>
          <p className="text-muted-foreground mb-6">
            El conocimiento está bien. Pero ejecutar es mejor.
          </p>
          <Link to="/auth?mode=register">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Empezar gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">© 2024 AUTOPILOT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArticlePage;
