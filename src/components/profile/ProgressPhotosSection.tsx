import React, { useState, useRef } from 'react';
import { Camera, Plus, X, ChevronLeft, ChevronRight, Trash2, Scale, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useProgressPhotos, useAddProgressPhoto, useDeleteProgressPhoto, ProgressPhoto } from '@/hooks/useProgressPhotos';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProgressPhotosSection: React.FC = () => {
  const { data: photos, isLoading } = useProgressPhotos();
  const addPhoto = useAddProgressPhoto();
  const deletePhoto = useDeleteProgressPhoto();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDate, setPhotoDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [photoWeight, setPhotoWeight] = useState('');
  const [photoType, setPhotoType] = useState<'front' | 'side' | 'back'>('front');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!previewFile) return;

    try {
      await addPhoto.mutateAsync({
        file: previewFile,
        date: photoDate,
        weight_kg: photoWeight ? parseFloat(photoWeight) : undefined,
        photo_type: photoType,
      });
      toast({ title: 'Foto añadida' });
      setIsAddOpen(false);
      setPreviewFile(null);
      setPreviewUrl(null);
      setPhotoWeight('');
    } catch (error) {
      toast({ title: 'Error al subir', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhoto.mutateAsync(id);
      toast({ title: 'Foto eliminada' });
      setSelectedPhotos(prev => prev.filter(p => p !== id));
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const togglePhotoSelection = (id: string) => {
    if (selectedPhotos.includes(id)) {
      setSelectedPhotos(prev => prev.filter(p => p !== id));
    } else if (selectedPhotos.length < 2) {
      setSelectedPhotos(prev => [...prev, id]);
    }
  };

  const getComparePhotos = (): [ProgressPhoto | null, ProgressPhoto | null] => {
    if (!photos || selectedPhotos.length !== 2) return [null, null];
    const photo1 = photos.find(p => p.id === selectedPhotos[0]) || null;
    const photo2 = photos.find(p => p.id === selectedPhotos[1]) || null;
    return [photo1, photo2];
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-secondary rounded w-1/3"></div>
          <div className="h-32 bg-secondary rounded"></div>
        </div>
      </Card>
    );
  }

  const [comparePhoto1, comparePhoto2] = getComparePhotos();

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Fotos de Progreso</h3>
        </div>
        <div className="flex gap-2">
          {photos && photos.length >= 2 && (
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedPhotos([]);
              }}
            >
              {compareMode ? 'Salir' : 'Comparar'}
            </Button>
          )}
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Añadir
          </Button>
        </div>
      </div>

      {compareMode && selectedPhotos.length === 2 && comparePhoto1 && comparePhoto2 && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-xl">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <img 
                src={comparePhoto1.photo_url} 
                alt="Before" 
                className="w-full aspect-[3/4] object-cover rounded-lg mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {format(new Date(comparePhoto1.date), 'd MMM yyyy', { locale: es })}
              </p>
              {comparePhoto1.weight_kg && (
                <p className="text-sm font-medium text-foreground">{comparePhoto1.weight_kg}kg</p>
              )}
            </div>
            <div className="text-center">
              <img 
                src={comparePhoto2.photo_url} 
                alt="After" 
                className="w-full aspect-[3/4] object-cover rounded-lg mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {format(new Date(comparePhoto2.date), 'd MMM yyyy', { locale: es })}
              </p>
              {comparePhoto2.weight_kg && (
                <p className="text-sm font-medium text-foreground">{comparePhoto2.weight_kg}kg</p>
              )}
            </div>
          </div>
          {comparePhoto1.weight_kg && comparePhoto2.weight_kg && (
            <div className="mt-3 text-center">
              <span className={cn(
                "text-sm font-medium",
                comparePhoto2.weight_kg < comparePhoto1.weight_kg ? "text-green-500" : 
                comparePhoto2.weight_kg > comparePhoto1.weight_kg ? "text-red-500" : "text-muted-foreground"
              )}>
                {comparePhoto2.weight_kg - comparePhoto1.weight_kg > 0 ? '+' : ''}
                {(comparePhoto2.weight_kg - comparePhoto1.weight_kg).toFixed(1)}kg
              </span>
            </div>
          )}
        </div>
      )}

      {compareMode && selectedPhotos.length < 2 && (
        <p className="text-sm text-muted-foreground mb-3">
          Selecciona 2 fotos para comparar ({selectedPhotos.length}/2)
        </p>
      )}

      {/* Photo grid */}
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className={cn(
                "relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group",
                compareMode && selectedPhotos.includes(photo.id) && "ring-2 ring-primary"
              )}
              onClick={() => compareMode && togglePhotoSelection(photo.id)}
            >
              <img 
                src={photo.photo_url} 
                alt={`Progress ${photo.date}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-1 left-1 right-1">
                  <p className="text-xs text-white truncate">
                    {format(new Date(photo.date), 'd MMM', { locale: es })}
                  </p>
                </div>
                {!compareMode && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 w-6 h-6 text-white hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {compareMode && selectedPhotos.includes(photo.id) && (
                <div className="absolute top-1 left-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {selectedPhotos.indexOf(photo.id) + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Camera className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin fotos de progreso</p>
        </div>
      )}

      {/* Add Photo Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Añadir foto de progreso</DialogTitle>
            <DialogDescription>Sube una foto para trackear tu transformación</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full aspect-[3/4] object-cover rounded-lg"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreviewFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Camera className="w-10 h-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Toca para añadir foto</span>
              </button>
            )}

            {/* Photo type */}
            <div className="flex gap-2">
              {(['front', 'side', 'back'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPhotoType(type)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                    photoType === type 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {type === 'front' ? 'Frontal' : type === 'side' ? 'Lateral' : 'Espalda'}
                </button>
              ))}
            </div>

            {/* Date and weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
                <Input
                  type="date"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Peso (kg)</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={photoWeight}
                  onChange={(e) => setPhotoWeight(e.target.value)}
                  placeholder="75.5"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleUpload}
              disabled={!previewFile || addPhoto.isPending}
            >
              {addPhoto.isPending ? 'Subiendo...' : 'Guardar foto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProgressPhotosSection;
