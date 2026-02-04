'use client';

import { useSignatureStore } from '@/lib/store/signature-store';
import { useTemplateStore } from '@/lib/store/template-store';
import { useSchemaStore } from '@/lib/store/schema-store';
import {
  FileSignature,
  ExternalLink,
  Download,
  Loader2,
  Settings,
  Building2,
  BellRing,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentStatus, SignatureRequest, FieldType, SignerStatus } from '@/lib/types';
import { generateSignedPDF, SignatureInfo } from '@/lib/pdf/generator';
import { useState, useEffect } from 'react';

export default function RequestsPage() {
  const router = useRouter();
  const requests = useSignatureStore((state) => state.requests);
  const templates = useTemplateStore((state) => state.templates);
  const accounts = useSchemaStore((state) => state.accounts);
  const schemas = useSchemaStore((state) => state.schemas);
  const setActiveSchemaId = useSchemaStore((state) => state.setActiveSchemaId);
  const sendManualReminder = useSignatureStore((state) => state.sendManualReminder);
  const checkAndSendReminders = useSignatureStore((state) => state.checkAndSendReminders);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Forzar recarga del store al volver a la pestaña
  useEffect(() => {
    const onFocus = () => {
      useSignatureStore.persist.rehydrate();
      checkAndSendReminders();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const filteredRequests = requests.filter((r) => r.accountId === selectedAccountId);

  const getTemplateName = (id: string) =>
    templates.find((t) => t.id === id)?.name || 'Template Eliminado';

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return 'bg-green-100 text-green-700 border-green-200';
      case DocumentStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case DocumentStatus.DECLINED:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDownload = async (req: SignatureRequest) => {
    const template = templates.find((t) => t.id === req.templateId);
    if (!template) return alert('Template original no encontrado');

    setDownloadingId(req.id);

    try {
      const pdfBytes = await fetch(template.pdfUrl).then((res) => res.arrayBuffer());

      // Mapeo seguro de tipos para TypeScript
      const signaturesForPdf: SignatureInfo[] = req.signatures.map((s) => {
        const signer = req.signers.find((sig) => sig.id === s.signerId);
        const field = template.fields.find((f) => f.id === s.fieldId);

        // Determinamos el tipo compatible con SignatureInfo
        let safeType: 'signature' | 'initials' | 'text' | 'date' | 'checkbox' = 'text';

        if (field?.type) {
          if (field.type === FieldType.SIGNATURE) safeType = 'signature';
          else if (field.type === FieldType.INITIALS) safeType = 'initials';
          else if (field.type === FieldType.DATE) safeType = 'date';
          else if (field.type === FieldType.CHECKBOX) safeType = 'checkbox';
          else safeType = 'text';
        }

        return {
          fieldId: s.fieldId,
          signerId: s.signerId,
          signerName: signer?.name || 'Desconocido',
          signerEmail: signer?.email || 'Desconocido',
          signatureDataUrl: s.signatureData,
          timestamp: s.timestamp.toString(),
          ip: s.ipAddress,
          type: safeType,
        };
      });

      const signedPdfBytes = await generateSignedPDF({
        originalPdfBytes: new Uint8Array(pdfBytes),
        fields: template.fields,
        signatures: signaturesForPdf,
        includeAuditTrail: true,
      });

      // Casteo 'as any' para evitar el conflicto de tipos entre Uint8Array y BlobPart
      const blob = new Blob([signedPdfBytes as any], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${template.name}_firmado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Hubo un error al generar el PDF final.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfigureRules = () => {
    const activeSchema = schemas.find((s) => s.accountId === selectedAccountId && s.isActive);

    if (activeSchema) {
      setActiveSchemaId(activeSchema.id);
      router.push('/admin/schema');
    } else {
      router.push('/admin/schemas');
    }
  };

  const getGroupName = (groupId: string) => {
    for (const schema of schemas) {
      const group = schema.groups.find((g) => g.id === groupId);
      if (group) return group.name;
    }
    return groupId;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Firma</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleConfigureRules}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Configurar Reglas
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white py-12 text-center shadow-sm">
            <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes activas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ve a "Templates" y selecciona "Enviar a Firmar".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getTemplateName(req.templateId)}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                        ID: {req.id.slice(0, 8)}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-indigo-600">{req.faculty}</span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      {req.status !== DocumentStatus.COMPLETED &&
                        req.status !== DocumentStatus.DECLINED &&
                        req.expiresAt && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600">
                              Expires in{' '}
                              {Math.ceil(
                                (new Date(req.expiresAt).getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{' '}
                              days
                            </span>
                          </>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Botón de Descarga */}
                    {req.status === DocumentStatus.COMPLETED && (
                      <button
                        onClick={() => handleDownload(req)}
                        disabled={downloadingId === req.id}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
                      >
                        {downloadingId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Descargar PDF
                      </button>
                    )}

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(req.status)}`}
                    >
                      {req.status.replace('_', ' ')} {/* Evitar problema con IN_PROGRESS */}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase">
                    Estado de Firmantes
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {req.signers.map((signer) => (
                      <div
                        key={signer.id}
                        className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              signer.status === SignerStatus.COMPLETED
                                ? 'bg-green-500'
                                : signer.status === SignerStatus.DECLINED
                                  ? 'bg-red-500'
                                  : 'bg-gray-400'
                            }`}
                            title={signer.status}
                          />
                          <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {signer.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">{signer.email}</p>
                          </div>
                        </div>

                        {signer.status === SignerStatus.PENDING &&
                          req.status !== DocumentStatus.COMPLETED && (
                            <button
                              onClick={() => {
                                sendManualReminder(req.id, signer.id);
                                alert(`Recordatorio enviado a ${signer.email}`);
                              }}
                              className="rounded-md p-1.5 text-orange-600 transition-colors hover:bg-orange-50"
                              title="Enviar Recordatorio Manualmente"
                            >
                              <BellRing className="h-4 w-4" />
                            </button>
                          )}

                        {signer.status !== SignerStatus.COMPLETED &&
                          signer.status !== SignerStatus.DECLINED && (
                            <Link
                              href={`/sign/${req.id}?signerId=${signer.id}`}
                              className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
                              title="Simular Firma (Dev Mode)"
                              target="_blank"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combinaciones Restantes */}
                {req.status !== DocumentStatus.COMPLETED &&
                  req.status !== DocumentStatus.DECLINED && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase">
                        Combinaciones Posibles para Aprobación
                      </h4>
                      <div className="space-y-3">
                        {req.validCombinations
                          .filter((combo) =>
                            combo.requirements.every((r) => {
                              const groupSigners = req.signers.filter(
                                (s) => s.groupId === r.groupId
                              );
                              const potentialCount = groupSigners.filter(
                                (s) => s.status !== SignerStatus.DECLINED
                              ).length;
                              return potentialCount >= r.count;
                            })
                          )
                          .map((combo) => (
                            <div
                              key={combo.id}
                              className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
                            >
                              {combo.description && (
                                <div className="mb-2 font-medium text-gray-700">
                                  {combo.description}
                                </div>
                              )}
                              <div className="space-y-1">
                                {combo.requirements.map((r, idx) => {
                                  const groupSigners = req.signers.filter(
                                    (s) => s.groupId === r.groupId
                                  );
                                  const completedCount = groupSigners.filter(
                                    (s) => s.status === 'COMPLETED'
                                  ).length;
                                  const isMet = completedCount >= r.count;

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-xs text-gray-600"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span
                                          className={`h-1.5 w-1.5 rounded-full ${
                                            isMet ? 'bg-green-500' : 'bg-gray-300'
                                          }`}
                                        />
                                        <span>
                                          {r.count} firmante(s) de{' '}
                                          <span className="font-medium">
                                            {getGroupName(r.groupId)}
                                          </span>
                                        </span>
                                      </span>
                                      <span
                                        className={
                                          isMet ? 'font-medium text-green-600' : 'text-gray-500'
                                        }
                                      >
                                        {completedCount} / {r.count}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        {req.validCombinations.length === 0 && (
                          <p className="text-xs text-gray-400 italic">
                            No hay combinaciones válidas configuradas.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
