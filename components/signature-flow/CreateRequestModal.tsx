'use client';

import { useState } from 'react';
import {
  Template,
  Faculty,
  SignatureRule,
  SignatureCombination,
  SignerAssignment,
  SignerStatus,
} from '@/lib/types';
import { useSignatureStore } from '@/lib/store/signature-store';
import { useSchemaStore } from '@/lib/store/schema-store';
import { calculateValidCombinations } from '@/lib/utils/combinatorics';
import { X, Send, Users, AlertTriangle, ArrowDownUp, GitMerge, Clock } from 'lucide-react';

interface CreateRequestModalProps {
  template: Template;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRequestModal({ template, onClose, onSuccess }: CreateRequestModalProps) {
  const { createRequest, addSigner, sendForSignature, calculateCombinations } = useSignatureStore();
  const { schemas, signers, createSigner } = useSchemaStore();

  // Determinar el schema correcto basado en la cuenta del template
  const activeSchema =
    schemas.find((s) => s.accountId === template.accountId && s.isActive) ||
    schemas.find((s) => s.accountId === template.accountId);

  const getRuleLocal = (fac: Faculty) => activeSchema?.rules.find((r) => r.faculty === fac);
  const getGroupLocal = (groupId: string) => activeSchema?.groups.find((g) => g.id === groupId);

  // Filtrar firmantes que tienen campos asignados y reordenar secuencialmente
  const activeSigners = template.signers
    .filter((signer) => template.fields.some((field) => field.assignedTo === signer.id))
    .sort((a, b) => a.order - b.order);

  const isSingleSigner = activeSigners.length <= 1;

  const [faculty, setFaculty] = useState<Faculty>(Faculty.APPROVE_WIRE);
  const [signerData, setSignerData] = useState<
    Record<string, { email: string; name: string; groupId: string }>
  >({});
  const [signingOrder, setSigningOrder] = useState<'sequential' | 'parallel'>(
    isSingleSigner ? 'parallel' : template.settings?.signingOrder || 'sequential'
  );
  const [rolesOrder, setRolesOrder] = useState<Record<string, number>>(() =>
    activeSigners.reduce(
      (acc, s, index) => ({ ...acc, [s.id]: index + 1 }),
      {} as Record<string, number>
    )
  );
  const [expirationDays, setExpirationDays] = useState<number>(
    template.settings?.expirationDays || 30
  );

  const handleInputChange = (roleId: string, field: string, value: string) => {
    setSignerData((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value,
      },
    }));
  };

  const handleSignerSelect = (roleId: string, signerId: string) => {
    const signer = signers.find((s) => s.id === signerId);
    if (signer) {
      setSignerData((prev) => ({
        ...prev,
        [roleId]: {
          email: signer.email,
          name: signer.name,
          groupId: signer.groupIds[0] || '', // Tomamos el primer grupo por defecto
        },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Obtener reglas dinámicas (Parte 0)
    const selectedRule = getRuleLocal(faculty) || getRuleLocal(Faculty.CREATE_WIRE);

    if (!selectedRule || !selectedRule.combinations) {
      alert('No hay reglas configuradas para esta facultad.');
      return;
    }

    // Verificar que las combinaciones sean posibles ANTES de crear
    const tempSigners = activeSigners
      .map((role) => {
        const data = signerData[role.id];
        if (!data) return null;

        return {
          id: 'temp-' + role.id,
          requestId: 'temp',
          email: data.email,
          name: data.name,
          groupId: data.groupId,
          order: rolesOrder[role.id] || role.order,
          assignedFields: template.fields.filter((f) => f.assignedTo === role.id).map((f) => f.id),
          status: 'PENDING' as SignerStatus,
          reminderCount: 0,
        };
      })
      .filter(Boolean) as SignerAssignment[];

    // Calcular combinaciones válidas con estos firmantes
    const validCombinations = calculateValidCombinations(
      {
        id: 'temp-rule',
        schemaId: 'temp-schema',
        faculty,
        combinations: selectedRule.combinations as SignatureCombination[],
        createdAt: new Date(),
      },
      tempSigners
    );

    // Si no hay combinaciones posibles, no permitir crear
    if (validCombinations.length === 0) {
      const combosText = selectedRule.combinations
        .map((c, i) => {
          const reqs = c.requirements
            .map((r) => {
              const group = getGroupLocal(r.groupId);
              const groupName = group ? group.name : r.groupId;
              return `${r.count} ${groupName}`;
            })
            .join(' + ');
          return `  ${i + 1}. ${reqs}`;
        })
        .join('\n');

      alert(
        `❌ No se puede crear la solicitud.\n\n` +
          `La facultad "${faculty}" requiere una de estas combinaciones:\n\n${combosText}\n\n` +
          `Con los firmantes asignados actuales, ninguna combinación es posible.\n\n` +
          `Agregá más firmantes o cambiá sus grupos.`
      );
      return;
    }

    // Crear la Request (Nace como DRAFT)
    const requestId = createRequest(
      template.id,
      template.accountId,
      faculty,
      expirationDays,
      signingOrder
    );

    // Set para evitar duplicados si se asigna la misma persona nueva a múltiples roles en la misma request
    const processedNewEmails = new Set<string>();

    // Asignar firmantes
    activeSigners.forEach((role) => {
      const data = signerData[role.id];
      if (data) {
        // Guardar firmante en la cuenta si no existe (para futuras ocasiones)
        const exists =
          signers.some((s) => s.email === data.email && s.accountId === template.accountId) ||
          processedNewEmails.has(data.email);

        if (!exists) {
          createSigner(data.name, data.email, [data.groupId]);
          processedNewEmails.add(data.email);
        }

        const assignedFields = template.fields
          .filter((f) => f.assignedTo === role.id)
          .map((f) => f.id);

        addSigner(
          requestId,
          data.email,
          data.name,
          data.groupId,
          assignedFields,
          signingOrder === 'parallel' ? 1 : rolesOrder[role.id]
        );
      }
    });

    // Inicializar motor de combinatoria
    calculateCombinations(requestId, {
      combinations: selectedRule.combinations as SignatureCombination[],
    });

    // Enviar la solicitud (Cambia DRAFT -> PENDING)
    sendForSignature(requestId);

    onSuccess();
  };

  const selectedRule = getRuleLocal(faculty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">Enviar Documento</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Selección de Facultad */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-indigo-900">
                Tipo de Operación
              </label>
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value as Faculty)}
                className="w-full rounded-md border-indigo-200 bg-white px-3 py-2 text-sm text-black focus:border-indigo-500 focus:ring-indigo-500"
              >
                {Object.values(Faculty).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-indigo-600">Define las reglas de aprobación.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Orden de Firma
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSingleSigner}
                  onClick={() => setSigningOrder('sequential')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-md border p-2 text-xs transition-colors ${signingOrder === 'sequential' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:bg-gray-100'} ${isSingleSigner ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <ArrowDownUp className="h-4 w-4" />
                  Secuencial
                </button>
                <button
                  type="button"
                  onClick={() => setSigningOrder('parallel')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-md border p-2 text-xs transition-colors ${signingOrder === 'parallel' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:bg-gray-100'}`}
                >
                  <GitMerge className="h-4 w-4 rotate-90" />
                  Paralelo
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Expiración (Días)
              </label>
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800">
                <Clock className="h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value) || 1)}
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Info de reglas */}
          {selectedRule && selectedRule.combinations.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-800">
                  <p className="mb-1 font-semibold">
                    Esta facultad requiere una de estas combinaciones:
                  </p>
                  <ul className="list-inside list-disc space-y-0.5">
                    {selectedRule.combinations.map((combo, i) => (
                      <li key={combo.id}>
                        {combo.requirements.map((req, j) => {
                          const group = getGroupLocal(req.groupId);
                          const groupName = group ? group.name : req.groupId;
                          return (
                            <span key={j}>
                              {j > 0 && ' + '}
                              {req.count} {groupName}
                            </span>
                          );
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Asignación de Roles */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">Asignar Firmantes</h3>
            <div className="space-y-4">
              {activeSigners.map((role) => {
                // Filtrar firmantes si el rol está vinculado a un grupo
                const availableSigners = role.linkedGroupId
                  ? signers.filter((s) => s.groupIds.includes(role.linkedGroupId!))
                  : signers;

                // Filtrar firmantes ya seleccionados en otros roles para evitar duplicados
                const selectedEmails = Object.entries(signerData)
                  .filter(([key]) => key !== role.id)
                  .map(([, data]) => data.email);

                const filteredSigners = availableSigners.filter(
                  (s) => !selectedEmails.includes(s.email)
                );

                return (
                  <div
                    key={role.id}
                    className="flex items-start gap-4 rounded-lg border bg-gray-50 p-3"
                  >
                    <div className="mt-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        {signingOrder === 'sequential'
                          ? rolesOrder[role.id]
                          : role.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="flex items-center md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                          {role.name}
                        </label>
                      </div>

                      {/* Selector de Firmante Existente */}
                      <div className="md:col-span-10">
                        <select
                          className="w-full rounded border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                          onChange={(e) => handleSignerSelect(role.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            -- Seleccionar Firmante Existente --
                          </option>
                          {filteredSigners.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.email})
                            </option>
                          ))}
                          <option value="manual">Ingresar manualmente...</option>
                        </select>
                      </div>

                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          value={signerData[role.id]?.name || ''}
                          required
                          className="w-full rounded border-gray-300 px-3 py-2 text-sm text-gray-700"
                          onChange={(e) => handleInputChange(role.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-6">
                        <input
                          type="email"
                          placeholder="email@ejemplo.com"
                          value={signerData[role.id]?.email || ''}
                          required
                          className="w-full rounded border-gray-300 px-3 py-2 text-sm text-gray-700"
                          onChange={(e) => handleInputChange(role.id, 'email', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-6">
                        <Users className="h-4 w-4 text-gray-400" />
                        <select
                          required
                          value={signerData[role.id]?.groupId || ''}
                          className="flex-1 rounded border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                          onChange={(e) => handleInputChange(role.id, 'groupId', e.target.value)}
                        >
                          <option value="" disabled>
                            Seleccionar Grupo...
                          </option>
                          {activeSchema?.groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Input de Orden (Solo visible si es Secuencial) */}
                      {signingOrder === 'sequential' && (
                        <div className="flex items-center gap-2 rounded bg-gray-100 p-2 md:col-span-6">
                          <span className="text-xs font-semibold text-gray-500">
                            Orden de Firma:
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={rolesOrder[role.id]}
                            onChange={(e) =>
                              setRolesOrder((prev) => ({
                                ...prev,
                                [role.id]: parseInt(e.target.value) || 1,
                              }))
                            }
                            className="w-16 rounded border-gray-300 px-2 py-1 text-center text-sm font-bold text-indigo-600 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
              Crear Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
