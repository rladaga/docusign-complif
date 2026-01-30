'use client';

import { Users, Plus, X, GripVertical } from 'lucide-react';
import { useTemplateStore } from '@/lib/store/template-store';

export function SignerPanel() {
  const { currentTemplate, addSigner, deleteSigner, updateSigner } = useTemplateStore();

  if (!currentTemplate) return null;

  return (
    <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Users className="h-4 w-4" />
          Roles de Firmantes
        </h3>
        <button
          onClick={() => addSigner('')}
          className="rounded p-1 text-indigo-600 hover:bg-gray-100"
          title="Agregar Rol"
        >
          <Plus className="h-4 w-4" />
        </button>
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
          <p className="py-2 text-center text-xs text-gray-400 italic">
            No hay roles definidos (ej: Empleado, Gerente)
          </p>
        )}
      </div>
    </div>
  );
}
