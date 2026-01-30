'use client';

import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { DraggableField } from './DraggableField';
import type { Field } from '@/lib/types/template';

interface FieldOverlayProps {
  fields: Field[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onFieldMove: (fieldId: string, x: number, y: number) => void;
  onFieldResize: (fieldId: string, width: number, height: number) => void;
  onFieldDelete: (fieldId: string) => void;
  scale?: number;
  readOnly?: boolean;
}

export function FieldOverlay({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldMove,
  onFieldResize,
  onFieldDelete,
  scale = 1.5,
  readOnly = false,
}: FieldOverlayProps) {
  // Configuración de sensores (clic vs arrastre)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere mover 5px para empezar a arrastrar
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    // Seguridad extra: si es readOnly, no hacemos nada
    if (readOnly) return;

    const { active, delta } = event;
    if (delta.x !== 0 || delta.y !== 0) {
      const field = fields.find((f) => f.id === active.id);
      if (field) {
        onFieldMove(field.id, field.position.x + delta.x, field.position.y + delta.y);
      }
    } else {
      onFieldSelect(active.id as string);
    }
  };

  // --- MODO VISTA PREVIA (Solo Lectura) ---
  if (readOnly) {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto relative h-full w-full">
          {fields.map((field) => (
            <DraggableField
              key={field.id}
              id={field.id}
              type={field.type}
              x={field.position.x}
              y={field.position.y}
              width={field.position.width}
              height={field.position.height}
              isSelected={false}
              assignedTo={field.assignedTo}
              onClick={() => {}}
              onResize={() => {}}
              onDelete={() => {}}
              readOnly={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- MODO EDICIÓN (Normal) ---
  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto relative h-full w-full">
          {fields.map((field) => (
            <DraggableField
              key={field.id}
              id={field.id}
              type={field.type}
              x={field.position.x}
              y={field.position.y}
              width={field.position.width}
              height={field.position.height}
              isSelected={field.id === selectedFieldId}
              assignedTo={field.assignedTo}
              onClick={() => onFieldSelect(field.id)}
              onResize={(w, h) => onFieldResize(field.id, w, h)}
              onDelete={() => onFieldDelete(field.id)}
              readOnly={false}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
