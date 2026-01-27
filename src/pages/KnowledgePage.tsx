import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, ChevronRight, Zap, Brain, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const articles = [
  {
    id: 'rutinas-fijas-fallan',
    title: '¿Por qué las rutinas fijas fallan?',
    excerpt: 'El problema no es la rutina. Es que tu cuerpo cambia y la rutina no.',
    readTime: '5 min',
    icon: Target,
    category: 'Entrenamiento',
  },
  {
    id: 'macros-deben-cambiar',
    title: '¿Por qué los macros deben cambiar?',
    excerpt: 'Calcular macros una vez y mantenerlos meses es el error más común.',
    readTime: '4 min',
    icon: TrendingUp,
    category: 'Nutrición',
  },
  {
    id: 'menos-decisiones-adherencia',
    title: '¿Por qué menos decisiones mejora la adherencia?',
    excerpt: 'La fatiga de decisión mata más transformaciones que la falta de motivación.',
    readTime: '6 min',
    icon: Brain,
    category: 'Sistema',
  },
  {
    id: 'principios-autopilot',
    title: 'Los principios detrás del sistema AUTOPILOT',
    excerpt: 'No es magia. Es lógica aplicada con consistencia.',
    readTime: '8 min',
    icon: Zap,
    category: 'Sistema',
  },
];

const KnowledgePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">AUTOPILOT</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Conocimiento
          </h1>
          <p className="text-xl text-muted-foreground">
            Entendé por qué funciona lo que funciona.
            <br />
            Sin humo. Solo principios.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4">
            {articles.map((article) => (
              <Link 
                key={article.id}
                to={`/conocimiento/${article.id}`}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <article.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {article.excerpt}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

export default KnowledgePage;
