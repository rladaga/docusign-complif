'use client';

import { FileSignature, Type, Calendar, CheckSquare, PenTool } from 'lucide-react';
import { FieldType } from '@/lib/types/template';

interface FieldToolbarProps {
  onAddField: (type: FieldType) => void;
}

const FIELD_BUTTONS: Array<{
  type: FieldType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}> = [
  { type: FieldType.SIGNATURE, icon: FileSignature, label: 'Firma', color: 'bg-indigo-500' },
  { type: FieldType.TEXT, icon: Type, label: 'Texto', color: 'bg-emerald-500' },
  { type: FieldType.DATE, icon: Calendar, label: 'Fecha', color: 'bg-amber-500' },
  { type: FieldType.CHECKBOX, icon: CheckSquare, label: 'Checkbox', color: 'bg-purple-500' },
  { type: FieldType.INITIALS, icon: PenTool, label: 'Iniciales', color: 'bg-pink-500' },
];

export function FieldToolbar({ onAddField }: FieldToolbarProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Agregar Campo</h3>
      <div className="grid grid-cols-2 gap-2">
        {FIELD_BUTTONS.map(({ type, icon: Icon, label, color }) => (
          <button
            key={type}
            onClick={() => onAddField(type)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 ${color} text-sm font-medium text-white transition-opacity hover:opacity-90`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
