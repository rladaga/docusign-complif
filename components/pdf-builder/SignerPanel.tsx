'use client';

import { Users, Plus, X, GripVertical } from 'lucide-react';
import { useTemplateStore } from '@/lib/store/template-store';
import { useSchemaStore } from '@/lib/store/schema-store';
import { useState } from 'react';

export function SignerPanel() {
  const { currentTemplate, addSigner, deleteSigner, updateSigner } = useTemplateStore();
  const { schemas } = useSchemaStore();

  if (!currentTemplate) return null;

  // Obtener grupos del schema asociado a la cuenta del template
  const activeSchema =
    schemas.find((s) => s.accountId === currentTemplate.accountId && s.isActive) ||
    schemas.find((s) => s.accountId === currentTemplate.accountId);

  const availableGroups = activeSchema?.groups || [];

  const [isAdding, setIsAdding] = useState(false);

  const handleAddGroupRole = (group: { id: string; name: string }) => {
    // Contamos cuántos roles de este grupo ya existen para autonumerar
    // Ej: Si ya existe "Directores", el próximo será "Directores 2"
    const existingRoles = currentTemplate.signers.filter((s) => s.linkedGroupId === group.id);
    const count = existingRoles.length;
    const newName = count === 0 ? group.name : `${group.name} ${count + 1}`;

    addSigner(newName, group.id);
    setIsAdding(false);
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Firmantes Requeridos</h3>
        </div>

        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="rounded p-1 text-indigo-600 hover:bg-gray-100"
            title="Agregar Rol"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsAdding(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {currentTemplate.signers.map((signer) => (
          <div
            key={signer.id}
            className="group flex items-center gap-2 rounded-md border bg-gray-50 p-2 text-sm"
            style={{ borderLeftColor: signer.color, borderLeftWidth: '4px' }}
          >
            <GripVertical className="h-3 w-3 cursor-move text-gray-400" />
            <input
              type="text"
              value={signer.name}
              onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
              className="flex-1 border-indigo-300 bg-transparent text-black focus:border-b focus:outline-none"
              placeholder="Nuevo Rol"
            />
            <button
              onClick={() => deleteSigner(signer.id)}
              className="mr-5 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {currentTemplate.signers.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-xs text-gray-400 italic">No hay roles definidos</p>
          </div>
        )}

        {isAdding && (
          <div className="mt-2 rounded-md border border-dashed border-indigo-300 bg-indigo-50 p-2">
            <p className="mb-2 text-xs font-medium text-indigo-700">
              Seleccionar Grupo del Schema:
            </p>
            <p className="mb-2 text-[10px] leading-tight text-indigo-600 opacity-80">
              Tip: Agrega varias veces el mismo grupo si necesitas firmas de distintas personas de
              ese área (ej: Director 1, Director 2).
            </p>
            <div className="space-y-1">
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleAddGroupRole(group)}
                  className="w-full rounded px-2 py-1 text-left text-xs text-gray-700 hover:bg-indigo-100"
                >
                  {group.name}
                </button>
              ))}
              <button
                onClick={() => {
                  addSigner('Nuevo Rol');
                  setIsAdding(false);
                }}
                className="w-full rounded px-2 py-1 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-100"
              >
                + Rol Genérico (Sin Grupo)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
