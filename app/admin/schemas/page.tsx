'use client';

import { useState } from 'react';
import { useSchemaStore } from '@/lib/store/schema-store';
import Link from 'next/link';
import { Settings, Edit2, X } from 'lucide-react';

export default function SchemasPage() {
  const { accounts, schemas, createSchema, setActiveSchemaId } = useSchemaStore();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState('');

  // Filtramos los esquemas por la cuenta seleccionada
  const filteredSchemas = schemas.filter((s) => s.accountId === selectedAccount);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold text-black">Esquemas de Firma</h1>

      {/* Account selector */}
      <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-black">Seleccionar Cuenta</h2>
        <select
          className="w-full rounded-lg border p-2 text-black"
          value={selectedAccount || ''}
          onChange={(e) => setSelectedAccount(e.target.value)}
        >
          <option value="">-- Seleccione una cuenta --</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {selectedAccount && (
        <div className="space-y-6">
          {filteredSchemas.map((schema) => (
            <div key={schema.id} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">
                  {schema.name}
                  {schema.isActive && <span className="ml-2 text-sm text-green-600">(Activo)</span>}
                </h2>
                <Link
                  onClick={() => setActiveSchemaId(schema.id)}
                  href="/admin/schema?tab=rules"
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Configurar
                </Link>
              </div>

              <div className="space-y-6">
                {schema.rules.map((rule) => (
                  <div key={rule.id} className="border-t pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Facultad: <span className="text-indigo-600">{rule.faculty}</span>
                      </h3>
                      <Link
                        onClick={() => setActiveSchemaId(schema.id)}
                        href={`/admin/schema?tab=rules&faculty=${rule.faculty}`}
                        className="text-gray-400 hover:text-indigo-600"
                        title="Editar reglas"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Opciones de Aprobación (OR):
                      </p>
                      {rule.combinations.map((combo, idx) => (
                        <div
                          key={combo.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                        >
                          <div className="mb-2 text-xs font-bold text-gray-500">
                            Opción {idx + 1}
                          </div>
                          <div className="space-y-2">
                            {combo.requirements.map((req, reqIdx) => {
                              const group = schema.groups.find((g) => g.id === req.groupId);
                              return (
                                <div key={reqIdx} className="flex items-center gap-2 text-sm">
                                  <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                                    {req.count}
                                  </span>
                                  <span className="text-black">firmante(s) del</span>
                                  <span className="rounded bg-green-100 px-2 py-0.5 font-medium text-green-800">
                                    {group?.name || req.groupId}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {combo.description && (
                            <div className="mt-2 text-xs text-gray-500 italic">
                              {combo.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nuevo Esquema de Firma
          </button>
        </div>
      )}

      {/* Modal Crear Esquema */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Esquema</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre del Esquema
                </label>
                <input
                  type="text"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej: Esquema 2024"
                />
              </div>
              <button
                onClick={() => {
                  if (selectedAccount && newSchemaName) {
                    createSchema(selectedAccount, newSchemaName);
                    setShowCreateModal(false);
                    setNewSchemaName('');
                  }
                }}
                disabled={!newSchemaName}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Crear Esquema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
