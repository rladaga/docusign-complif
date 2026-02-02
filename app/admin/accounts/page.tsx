'use client';

import { useState, SyntheticEvent } from 'react';
import { useSchemaStore } from '@/lib/store/schema-store';
import { X } from 'lucide-react';

export default function AccountsPage() {
  const { accounts, schemas, signers, createGroup, createSigner, setActiveSchemaId } =
    useSchemaStore();

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Buscamos el esquema activo para la cuenta seleccionada
  const activeSchemaForAccount = schemas.find((s) => s.accountId === selectedAccount && s.isActive);
  const currentGroups = activeSchemaForAccount ? activeSchemaForAccount.groups : [];

  const currentSigners = signers.filter((s) => s.accountId === selectedAccount);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSignerModal, setShowSignerModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [newSigner, setNewSigner] = useState({ name: '', email: '', groupId: '' });

  const handleCreateGroup = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newGroup.name) {
      createGroup(newGroup.name, newGroup.description);
      setShowGroupModal(false);
      setNewGroup({ name: '', description: '' });
    }
  };

  const handleCreateSigner = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newSigner.name && newSigner.email && newSigner.groupId) {
      createSigner(newSigner.name, newSigner.email, [newSigner.groupId]);
      setShowSignerModal(false);
      setNewSigner({ name: '', email: '', groupId: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold text-black">Gestión de Cuentas</h1>

        {/* Account selector */}
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-black">Seleccionar Cuenta</h2>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  setSelectedAccount(account.id);

                  const schema = schemas.find((s) => s.accountId === account.id && s.isActive);
                  if (schema) setActiveSchemaId(schema.id);
                }}
                className={`block w-full rounded-lg border p-4 text-left text-black transition ${
                  selectedAccount === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold">{account.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedAccount && (
        <>
          {/* Groups Section */}
          <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">Grupos de Firmantes</h2>
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={() => setShowGroupModal(true)}
              >
                + Nuevo Grupo
              </button>
            </div>
            <div className="grid gap-4 text-black md:grid-cols-2 lg:grid-cols-3">
              {currentGroups.map((group) => (
                <div key={group.id} className="rounded-lg border p-4">
                  <div className="mb-2 font-semibold">{group.name}</div>
                  <div className="text-sm text-gray-600">{group.description}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {currentSigners.filter((s) => s.groupIds.includes(group.id)).length} firmantes
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signers Section */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">Firmantes</h2>
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={() => setShowSignerModal(true)}
              >
                + Nuevo Firmante
              </button>
            </div>
            <div className="space-y-2">
              {currentSigners.map((signer) => (
                <div key={signer.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between text-black">
                    <div>
                      <div className="font-semibold">{signer.name}</div>
                      <div className="text-sm text-gray-600">{signer.email}</div>
                    </div>
                    <div className="flex gap-2">
                      {signer.groupIds.map((groupId) => {
                        const group = currentGroups.find((g) => g.id === groupId);
                        return (
                          <span
                            key={groupId}
                            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                          >
                            {group?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Crear Grupo */}
          {showGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Nuevo Grupo</h2>
                  <button
                    onClick={() => setShowGroupModal(false)}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Ej: Legales"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Opcional"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
                  >
                    Crear Grupo
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal Crear Firmante */}
          {showSignerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Nuevo Firmante</h2>
                  <button
                    onClick={() => setShowSignerModal(false)}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleCreateSigner} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={newSigner.name}
                      onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={newSigner.email}
                      onChange={(e) => setNewSigner({ ...newSigner, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Grupo</label>
                    <select
                      value={newSigner.groupId}
                      onChange={(e) => setNewSigner({ ...newSigner, groupId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Seleccionar Grupo...</option>
                      {currentGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
                  >
                    Crear Firmante
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
