'use client';

import { useState } from 'react';
import { useSchemaStore } from '@/lib/store/schema-store';

export default function AccountsPage() {
  const { accounts, schemas, signers, createGroup, createSigner, setActiveSchemaId } =
    useSchemaStore();

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Buscamos el esquema activo para la cuenta seleccionada
  const activeSchemaForAccount = schemas.find((s) => s.accountId === selectedAccount && s.isActive);
  const currentGroups = activeSchemaForAccount ? activeSchemaForAccount.groups : [];

  const currentSigners = signers.filter((s) => s.accountId === selectedAccount);

  return (
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
                // Si hay un esquema activo para esta cuenta, lo seleccionamos en el store
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

      {selectedAccount && (
        <>
          {/* Groups Section */}
          <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">Grupos de Firmantes</h2>
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={() => {
                  const name = prompt('Nombre del grupo (ej: Grupo A):');
                  const description = prompt('Descripción:');
                  if (name) createGroup(name, description || undefined);
                }}
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
                onClick={() => {
                  const name = prompt('Nombre del firmante:');
                  const email = prompt('Email:');
                  const groupId = prompt(
                    `ID del grupo (${currentGroups.map((g) => g.id).join(', ')}):`
                  );
                  if (name && email && groupId) {
                    createSigner(name, email, [groupId]);
                  }
                }}
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
        </>
      )}
    </div>
  );
}
