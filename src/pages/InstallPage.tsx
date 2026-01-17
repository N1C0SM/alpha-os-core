import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Smartphone, Check, Share, PlusSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Auto-redirect if already installed
  useEffect(() => {
    if (isInstalled) {
      navigate('/hoy', { replace: true });
    }
  }, [isInstalled, navigate]);

  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 safe-top">
      <div className="flex items-center gap-3 mb-8">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Instalar App</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        {/* Install Card */}
        {isInstalled ? (
          <div className="bg-primary/10 rounded-2xl border border-primary/20 p-6 text-center">
            <Check className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="font-bold text-lg text-foreground">¡App instalada!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ya puedes acceder desde tu pantalla de inicio
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">
                {isIOS ? 'Instálala en tu iPhone' : 'Instálala en tu móvil'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                AUTOPILOT funciona como una app real.<br />
                No necesitas App Store.
              </p>
            </div>

            {isIOS ? (
              <ol className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">1</span>
                  </div>
                  <span className="text-foreground">
                    Ábrela en <strong className="text-primary">Safari</strong>
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">2</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span>Toca</span>
                    <Share className="w-5 h-5 text-primary" />
                    <strong className="text-primary">Compartir</strong>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">3</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span>Pulsa</span>
                    <PlusSquare className="w-5 h-5 text-primary" />
                    <strong className="text-primary">Añadir a inicio</strong>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">4</span>
                  </div>
                  <span className="text-foreground">
                    <strong>Listo.</strong> Ya es una app.
                  </span>
                </li>
              </ol>
            ) : isInstallable ? (
              <div className="space-y-4">
                <ol className="space-y-4">
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">1</span>
                    </div>
                    <span className="text-foreground">
                      Pulsa el botón <strong className="text-primary">Instalar</strong> abajo
                    </span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">2</span>
                    </div>
                    <span className="text-foreground">
                      Confirma en el diálogo del navegador
                    </span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">3</span>
                    </div>
                    <span className="text-foreground">
                      <strong>Listo.</strong> Ya es una app.
                    </span>
                  </li>
                </ol>
                <Button 
                  onClick={handleInstall}
                  className="w-full h-14 bg-primary text-primary-foreground text-lg font-semibold rounded-xl"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instalar ahora
                </Button>
              </div>
            ) : (
              <ol className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">1</span>
                  </div>
                  <span className="text-foreground">
                    Abre en <strong className="text-primary">Chrome</strong>
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">2</span>
                  </div>
                  <span className="text-foreground">
                    Toca <strong className="text-primary">⋮ Menú</strong> arriba a la derecha
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">3</span>
                  </div>
                  <span className="text-foreground">
                    Pulsa <strong className="text-primary">Instalar app</strong>
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">4</span>
                  </div>
                  <span className="text-foreground">
                    <strong>Listo.</strong> Ya es una app.
                  </span>
                </li>
              </ol>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              Se abre a pantalla completa y funciona como una app nativa.
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-secondary/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">Acceso rápido desde tu pantalla</p>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">Notificaciones de recordatorios</p>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">Funciona sin conexión</p>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">Experiencia de app nativa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
