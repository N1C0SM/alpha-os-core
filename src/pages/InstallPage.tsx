import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Smartphone, Check, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

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

      <div className="max-w-md mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Instala AlphaSupps OS
          </h2>
          <p className="text-muted-foreground">
            Accede más rápido desde tu pantalla de inicio. Sin tiendas de apps, sin esperas.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Ventajas de instalar:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">Acceso rápido desde tu pantalla de inicio</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">Notificaciones de recordatorios</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">Funciona sin conexión</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">Experiencia de app nativa</p>
            </div>
          </div>
        </div>

        {/* Install Button or Status */}
        {isInstalled ? (
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-5 text-center">
            <Check className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-semibold text-foreground">¡App instalada!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ya puedes acceder desde tu pantalla de inicio
            </p>
          </div>
        ) : isIOS ? (
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">
                Cómo instalar en iPhone/iPad:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">Pulsa el botón</p>
                    <Share className="w-5 h-5 text-primary" />
                    <p className="text-sm text-foreground">de Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">Selecciona</p>
                    <PlusSquare className="w-5 h-5 text-primary" />
                    <p className="text-sm text-foreground">"Añadir a inicio"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm text-foreground">Pulsa "Añadir" en la esquina superior derecha</p>
                </div>
              </div>
            </div>
          </div>
        ) : isInstallable ? (
          <Button 
            onClick={handleInstall}
            className="w-full h-14 bg-primary text-primary-foreground text-lg font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            Instalar ahora
          </Button>
        ) : (
          <div className="bg-muted/50 rounded-xl border border-border p-5 text-center">
            <p className="text-muted-foreground text-sm">
              Abre esta página en Chrome o Safari en tu móvil para instalar la app.
            </p>
          </div>
        )}

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center">
          No necesitas descargar nada de la App Store ni Google Play. 
          La app se instala directamente en tu dispositivo.
        </p>
      </div>
    </div>
  );
};

export default InstallPage;
