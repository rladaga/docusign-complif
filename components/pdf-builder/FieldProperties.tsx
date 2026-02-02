'use client';

import { useTemplateStore, selectSelectedField } from '@/lib/store/template-store';
import { Trash2 } from 'lucide-react';

export function FieldProperties() {
  // Usamos el selector para obtener el campo actual reactivamente
  const selectedField = useTemplateStore(selectSelectedField);
  const { currentTemplate, updateField, deleteField } = useTemplateStore();

  if (!selectedField || !currentTemplate) {
    return (
      <div className="mt-auto border-t bg-white p-4 text-center text-sm text-gray-500">
        Selecciona un campo para editar sus propiedades
      </div>
    );
  }

  const isUnassigned = !selectedField.assignedTo;
  const assignedSigner = currentTemplate.signers.find((s) => s.id === selectedField.assignedTo);

  return (
    <div className="border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Propiedades</h3>
        <button
          onClick={() => deleteField(selectedField.id)}
          className="rounded p-1 text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Asignado A (Selector de Roles) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Asignado a (Rol)</label>
          <div className="flex items-center gap-2">
            {assignedSigner && (
              <div
                className="h-8 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: assignedSigner.color }}
                title={`Color: ${assignedSigner.name}`}
              />
            )}
            <select
              value={selectedField.assignedTo || ''} // Si es undefined o null, usa ""
              onChange={(e) => updateField(selectedField.id, { assignedTo: e.target.value })}
              className={`w-full rounded border p-2 text-sm text-black focus:ring-2 focus:outline-none ${
                isUnassigned
                  ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            >
              {/* Opción por defecto deshabilitada para obligar a elegir */}
              <option value="" disabled>
                -- Seleccionar Firmante --
              </option>

              {currentTemplate.signers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {isUnassigned && (
            <p className="mt-1 text-[10px] text-red-500">* Debes asignar un firmante</p>
          )}
        </div>

        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={selectedField.required}
              onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600"
            />
            Obligatorio
          </label>
        </div>
      </div>
    </div>
  );
}
