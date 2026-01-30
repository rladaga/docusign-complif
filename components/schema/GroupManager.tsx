'use client';

import { useState } from 'react';
import { useSchemaStore } from '@/lib/store/schema-store';
import { Plus, Users } from 'lucide-react';

export function GroupManager() {
  const { schemas, activeSchemaId, createGroup } = useSchemaStore();
  const activeSchema = schemas.find((s) => s.id === activeSchemaId);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroup(newGroupName);
    setNewGroupName('');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Lista de Grupos */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Grupos Existentes</h2>
        <div className="space-y-3">
          {activeSchema?.groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{group.name}</p>
                  <p className="text-xs text-gray-500">ID: {group.id}</p>
                </div>
              </div>
            </div>
          ))}
          {(!activeSchema?.groups || activeSchema.groups.length === 0) && (
            <p className="text-center text-sm text-gray-500">No hay grupos creados.</p>
          )}
        </div>
      </div>

      {/* Crear Grupo */}
      <div className="h-fit rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Nuevo Grupo</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del Grupo</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ej: Legales, RRHH, Directorio"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newGroupName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Crear Grupo
          </button>
        </form>
      </div>
    </div>
  );
}
