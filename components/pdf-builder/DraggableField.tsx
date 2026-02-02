'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FieldType } from '@/lib/types/template';
import { X, GripVertical, Scaling } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DraggableFieldProps {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  assignedTo?: string;
  onClick: () => void;
  onResize: (width: number, height: number) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const FIELD_COLORS: Record<FieldType, string> = {
  [FieldType.SIGNATURE]: 'border-indigo-500 bg-indigo-500/10',
  [FieldType.TEXT]: 'border-emerald-500 bg-emerald-500/10',
  [FieldType.DATE]: 'border-amber-500 bg-amber-500/10',
  [FieldType.CHECKBOX]: 'border-purple-500 bg-purple-500/10',
  [FieldType.INITIALS]: 'border-pink-500 bg-pink-500/10',
};

const FIELD_LABELS: Record<FieldType, string> = {
  [FieldType.SIGNATURE]: 'Firma',
  [FieldType.TEXT]: 'Texto',
  [FieldType.DATE]: 'Fecha',
  [FieldType.CHECKBOX]: 'Checkbox',
  [FieldType.INITIALS]: 'Iniciales',
};

export function DraggableField({
  id,
  type,
  x,
  y,
  width,
  height,
  isSelected,
  assignedTo,
  onClick,
  onResize,
  onDelete,
  readOnly = false,
}: DraggableFieldProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isResizing.current || readOnly,
  });

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    elementRef.current = node;
  };

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.width = `${width}px`;
      elementRef.current.style.height = `${height}px`;
    }
  }, [width, height]);

  // --- LÓGICA DE RESIZE  ---
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!elementRef.current) return;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(30, startWidth + deltaX);
      const newHeight = Math.max(30, startHeight + deltaY);
      elementRef.current.style.width = `${newWidth}px`;
      elementRef.current.style.height = `${newHeight}px`;
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      isResizing.current = false;
      const finalDeltaX = upEvent.clientX - startX;
      const finalDeltaY = upEvent.clientY - startY;
      const finalW = Math.max(30, startWidth + finalDeltaX);
      const finalH = Math.max(30, startHeight + finalDeltaY);
      onResize(finalW, finalH);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: !readOnly && transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 50 : isSelected ? 40 : 30,
  };

  const isUnassigned = !assignedTo || assignedTo === '';

  const borderClass = readOnly
    ? 'border-dashed border-indigo-300 bg-indigo-50/30'
    : `${isUnassigned ? 'border-gray-400 bg-gray-200 opacity-80' : FIELD_COLORS[type]}`;

  const cursorClass = readOnly
    ? 'cursor-default'
    : isDragging
      ? 'opacity-50 cursor-grabbing'
      : 'cursor-pointer hover:shadow-lg';

  return (
    <div
      ref={setRefs}
      style={style}
      onClick={(e) => {
        if (!readOnly) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`absolute flex items-center justify-center overflow-hidden rounded-md border-2 transition-colors ${borderClass} ${isSelected && !readOnly ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${cursorClass}`}
      {...(!readOnly ? listeners : {})}
      {...(!readOnly ? attributes : {})}
    >
      <div className="flex items-center gap-2 px-2 text-xs font-medium select-none">
        {/* Ocultar Grip en Preview */}
        {!readOnly && <GripVertical className="h-3 w-3 shrink-0 opacity-50" />}

        <div className="flex flex-col overflow-hidden text-black">
          <span className="truncate">{FIELD_LABELS[type]}</span>
          {!readOnly &&
            (isUnassigned ? (
              <span className="truncate rounded border border-red-200 bg-white/80 px-1 text-[9px] font-bold text-red-500">
                Sin Asignar
              </span>
            ) : (
              <span className="max-w-20 truncate text-[9px] opacity-60">Asignado</span>
            ))}
        </div>
      </div>

      {/* Botones de acción solo si NO es readOnly y está seleccionado */}
      {!readOnly && isSelected && (
        <>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-1 right-1 z-50 rounded-full bg-red-500 p-0.5 text-white shadow-sm transition-transform hover:scale-110 hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>

          <div
            onPointerDown={handleResizeStart}
            className="absolute right-0 bottom-0 z-50 flex h-5 w-5 cursor-nwse-resize items-center justify-center rounded-tl bg-indigo-500/20 transition-colors hover:bg-indigo-500"
          >
            <Scaling className="h-3 w-3 text-indigo-700 hover:text-white" />
          </div>
        </>
      )}
    </div>
  );
}
