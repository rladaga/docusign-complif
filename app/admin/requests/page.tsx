'use client';

import { useSignatureStore } from '@/lib/store/signature-store';
import { useTemplateStore } from '@/lib/store/template-store';
import { FileSignature, ExternalLink, Download, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { DocumentStatus, SignatureRequest, FieldType } from '@/lib/types'; // Importar FieldType
import { generateSignedPDF, SignatureInfo } from '@/lib/pdf/generator';
import { useState } from 'react';

export default function RequestsPage() {
  const { requests } = useSignatureStore();
  const { templates } = useTemplateStore();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
          else safeType = 'text'; // Fallback para RADIO y DROPDOWN
        }

        return {
          fieldId: s.fieldId,
          signerId: s.signerId,
          signerName: signer?.name || 'Desconocido',
          signerEmail: signer?.email || 'Desconocido',
          signatureDataUrl: s.signatureData,
          timestamp: s.timestamp.toString(),
          ip: s.ipAddress,
          type: safeType, // Usamos el tipo saneado
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
      link.download = `${template.name}_Firmado.pdf`;
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Firma</h1>
          <Link
            href="/admin/schema"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Configurar Reglas
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white py-12 text-center shadow-sm">
            <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes activas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ve a "Templates" y selecciona "Enviar a Firmar".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
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
                      {req.status.replace('_', ' ')}
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
                            className={`h-2 w-2 rounded-full ${signer.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-400'}`}
                          />
                          <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {signer.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">{signer.email}</p>
                          </div>
                        </div>

                        {signer.status !== 'COMPLETED' && (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
