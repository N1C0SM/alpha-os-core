import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) throw error;

      if (!data) {
        toast.error("No tienes permisos de administrador");
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadStripeMode();
    } catch (error) {
      console.error("Error checking admin role:", error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadStripeMode = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .single();

      if (error) throw error;
      setStripeMode(data.value as 'test' | 'live');
    } catch (error) {
      console.error("Error loading stripe mode:", error);
    }
  };

  const toggleStripeMode = async () => {
    const newMode = stripeMode === 'test' ? 'live' : 'test';
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: newMode, updated_by: user?.id })
        .eq('key', 'stripe_mode');

      if (error) throw error;

      setStripeMode(newMode);
      toast.success(`Stripe cambiado a modo ${newMode === 'test' ? 'TEST' : 'PRODUCCIÓN'}`);
    } catch (error) {
      console.error("Error updating stripe mode:", error);
      toast.error("Error al cambiar el modo de Stripe");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
        </div>

        <Card className={stripeMode === 'live' ? 'border-red-500/50' : 'border-yellow-500/50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Modo de Stripe
            </CardTitle>
            <CardDescription>
              Cambia entre modo test (sandbox) y producción para los pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${stripeMode === 'live' ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                {stripeMode === 'live' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-semibold">
                  Modo actual: {stripeMode === 'test' ? 'TEST (Sandbox)' : 'PRODUCCIÓN (Real)'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stripeMode === 'test' 
                  ? 'Los pagos se procesan en el entorno de pruebas. Usa tarjetas de test.'
                  : '⚠️ Los pagos son REALES. El dinero se cobrará de verdad.'
                }
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stripe-mode">Modo Producción</Label>
                <p className="text-sm text-muted-foreground">
                  Activa para usar pagos reales
                </p>
              </div>
              <Switch
                id="stripe-mode"
                checked={stripeMode === 'live'}
                onCheckedChange={toggleStripeMode}
                disabled={updating}
              />
            </div>

            {stripeMode === 'test' && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Tarjetas de test:</p>
                <ul className="space-y-1 font-mono text-xs">
                  <li>✅ Éxito: 4242 4242 4242 4242</li>
                  <li>❌ Rechazada: 4000 0000 0000 0002</li>
                  <li>🔐 3D Secure: 4000 0025 0000 3155</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          onClick={() => navigate('/perfil')}
          className="w-full"
        >
          Volver al perfil
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;
