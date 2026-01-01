import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const PersonalDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    weight_kg: '',
    height_cm: '',
    body_fat_percentage: '',
    gender: '',
    date_of_birth: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        weight_kg: profile.weight_kg?.toString() || '',
        height_cm: profile.height_cm?.toString() || '',
        body_fat_percentage: profile.body_fat_percentage?.toString() || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: formData.full_name || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
        gender: formData.gender as 'male' | 'female' | null,
        date_of_birth: formData.date_of_birth || null,
      });
      toast({ title: 'Datos guardados' });
      navigate('/perfil');
    } catch {
      toast({ title: 'Error', description: 'No se pudieron guardar los datos', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/perfil')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Datos Personales</h1>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Tu nombre"
            className="bg-card border-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Peso (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              placeholder="75"
              className="bg-card border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height_cm">Altura (cm)</Label>
            <Input
              id="height_cm"
              type="number"
              value={formData.height_cm}
              onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
              placeholder="175"
              className="bg-card border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body_fat">Grasa corporal (%)</Label>
          <Input
            id="body_fat"
            type="number"
            value={formData.body_fat_percentage}
            onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
            placeholder="15"
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <Label>Género</Label>
          <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Selecciona género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Femenino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Fecha de nacimiento</Label>
          <Input
            id="dob"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className="bg-card border-border"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full h-12 bg-primary text-primary-foreground"
        >
          {updateProfile.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
};

export default PersonalDataPage;
