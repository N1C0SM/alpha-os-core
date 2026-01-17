import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeBlock, TimeBlockType, TIME_BLOCK_LABELS } from '@/types/time-blocks';
import { cn } from '@/lib/utils';

interface TimeBlockEditorProps {
  blocks: TimeBlock[];
  onBlocksChange: (blocks: TimeBlock[]) => void;
  dayName: string;
}

export function TimeBlockEditor({ blocks, onBlocksChange, dayName }: TimeBlockEditorProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBlock, setNewBlock] = useState<Partial<TimeBlock>>({
    type: 'class',
    name: '',
    start: '09:00',
    end: '10:00',
  });

  const sortedBlocks = [...blocks].sort((a, b) => {
    const aStart = a.start.split(':').map(Number);
    const bStart = b.start.split(':').map(Number);
    return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
  });

  const handleAddBlock = () => {
    if (!newBlock.name || !newBlock.start || !newBlock.end || !newBlock.type) return;

    const block: TimeBlock = {
      id: crypto.randomUUID(),
      type: newBlock.type as TimeBlockType,
      name: newBlock.name,
      start: newBlock.start,
      end: newBlock.end,
    };

    onBlocksChange([...blocks, block]);
    setNewBlock({ type: 'class', name: '', start: '09:00', end: '10:00' });
    setIsAddOpen(false);
  };

  const handleRemoveBlock = (blockId: string) => {
    onBlocksChange(blocks.filter(b => b.id !== blockId));
  };

  return (
    <div className="space-y-2">
      {sortedBlocks.length > 0 ? (
        <div className="space-y-2">
          {sortedBlocks.map((block) => {
            const typeConfig = TIME_BLOCK_LABELS[block.type];
            return (
              <div
                key={block.id}
                className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg text-sm"
              >
                <span className="text-lg">{typeConfig.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{block.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {block.start} - {block.end}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveBlock(block.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Sin actividades programadas
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAddOpen(true)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" />
        Añadir actividad
      </Button>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva actividad - {dayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newBlock.type}
                onValueChange={(value) => setNewBlock(prev => ({ ...prev, type: value as TimeBlockType }))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIME_BLOCK_LABELS)
                    .filter(([key]) => !['gym', 'meal', 'sleep'].includes(key))
                    .map(([key, { label, emoji }]) => (
                      <SelectItem key={key} value={key}>
                        {emoji} {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                placeholder="Ej: Matemáticas, Trabajo, Boxeo..."
                value={newBlock.name || ''}
                onChange={(e) => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Inicio</Label>
                <Input
                  type="time"
                  value={newBlock.start || '09:00'}
                  onChange={(e) => setNewBlock(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input
                  type="time"
                  value={newBlock.end || '10:00'}
                  onChange={(e) => setNewBlock(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <Button
              onClick={handleAddBlock}
              disabled={!newBlock.name?.trim()}
              className="w-full bg-primary text-primary-foreground"
            >
              Añadir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quick preview of time blocks for a day
export function TimeBlocksPreview({ blocks }: { blocks: TimeBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <span className="text-muted-foreground">Libre</span>;
  }

  const sortedBlocks = [...blocks].sort((a, b) => {
    const aStart = a.start.split(':').map(Number);
    const bStart = b.start.split(':').map(Number);
    return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
  });

  return (
    <div className="flex flex-wrap gap-1">
      {sortedBlocks.slice(0, 3).map((block) => (
        <span
          key={block.id}
          className={cn(
            "inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded",
            "bg-secondary/70 text-foreground"
          )}
          title={`${block.name}: ${block.start}-${block.end}`}
        >
          {TIME_BLOCK_LABELS[block.type].emoji}
          <span className="hidden sm:inline">{block.start}</span>
        </span>
      ))}
      {sortedBlocks.length > 3 && (
        <span className="text-xs text-muted-foreground">+{sortedBlocks.length - 3}</span>
      )}
    </div>
  );
}
