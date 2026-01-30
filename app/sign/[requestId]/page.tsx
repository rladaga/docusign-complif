'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSignatureStore } from '@/lib/store/signature-store';
import { useTemplateStore } from '@/lib/store/template-store';
import { SignatureInterface } from '@/components/signature-flow/SignatureInterface';
import { DocumentStatus, SignerStatus, SigningOrder } from '@/lib/types';
import { CheckCircle2, XCircle, Clock, FileSignature } from 'lucide-react';
import { CombinatoricsDebug } from '@/components/signature-flow/CombinatoricsDebug';

export default function SignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = params.requestId as string;
  const signerId = searchParams.get('signerId');

  const { requests, loadRequest, currentRequest } = useSignatureStore();
  const { templates, loadTemplate } = useTemplateStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      loadRequest(requestId);
      setIsLoading(false);
    }
  }, [requestId, loadRequest]);

  useEffect(() => {
    if (currentRequest?.templateId) {
      loadTemplate(currentRequest.templateId);
    }
  }, [currentRequest?.templateId, loadTemplate]);

  const request = currentRequest || requests.find((r) => r.id === requestId);
  const template = templates.find((t) => t.id === request?.templateId);
  const signer = request?.signers.find((s) => s.id === signerId);

  // Estados de error/éxito
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">⏳</div>
          <h1 className="text-xl font-semibold text-gray-900">Cargando documento...</h1>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Solicitud no encontrada</h1>
          <p className="mt-2 text-gray-600">El documento que buscas no existe.</p>
        </div>
      </div>
    );
  }

  if (!signer) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="mt-2 text-gray-600">
            No tienes permiso para firmar este documento o el enlace es inválido.
          </p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Template no encontrado</h1>
          <p className="mt-2 text-gray-600">El documento base ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  if (request.expiresAt && new Date() > new Date(request.expiresAt)) {
    if (request.status !== DocumentStatus.EXPIRED && request.status !== DocumentStatus.COMPLETED) {
      request.status = DocumentStatus.EXPIRED;
    }
  }

  // Documento completado
  if (request.status === DocumentStatus.COMPLETED) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Documento Completado</h1>
          <p className="mt-2 text-gray-600">
            Este documento ya ha sido firmado por todas las partes necesarias.
          </p>
          {request.completedAt && (
            <p className="mt-4 text-sm text-gray-500">
              Completado el {new Date(request.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Documento declinado
  if (request.status === DocumentStatus.DECLINED) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Documento Rechazado</h1>
          <p className="mt-2 text-gray-600">{request.declinedBy} rechazó firmar este documento.</p>
          {request.declineReason && (
            <p className="mt-4 rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
              "{request.declineReason}"
            </p>
          )}
        </div>
      </div>
    );
  }

  // Documento expirado
  if (request.status === DocumentStatus.EXPIRED) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <Clock className="mx-auto mb-4 h-16 w-16 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Documento Expirado</h1>
          <p className="mt-2 text-gray-600">El plazo para firmar este documento ha vencido.</p>
          {request.expiresAt && (
            <p className="mt-4 text-sm text-gray-500">
              Expiró el {new Date(request.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Este firmante ya completó
  if (signer.status === SignerStatus.COMPLETED) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Ya firmaste este documento</h1>
          <p className="mt-2 text-gray-600">Gracias {signer.name}, tu firma fue registrada.</p>
          {signer.signedAt && (
            <p className="mt-4 text-sm text-gray-500">
              Firmado el {new Date(signer.signedAt).toLocaleDateString()}
            </p>
          )}
          <div className="mt-6">
            <p className="text-sm text-gray-600">
              Estado del documento:{' '}
              <span className="font-semibold text-indigo-600">{request.status}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Este firmante rechazó
  if (signer.status === SignerStatus.DECLINED) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Rechazaste firmar</h1>
          <p className="mt-2 text-gray-600">
            Decidiste no firmar este documento. El proceso ha sido cancelado.
          </p>
        </div>
      </div>
    );
  }

  if (template.settings.signingOrder === SigningOrder.SEQUENTIAL) {
    const myOrder = signer.order;

    if (myOrder > 1) {
      // Verificar que todos los anteriores hayan firmado
      const previousSigners = request.signers.filter((s) => s.order < myOrder);
      const allPreviousSigned = previousSigners.every((s) => s.status === SignerStatus.COMPLETED);

      if (!allPreviousSigned) {
        const nextPending = previousSigners.find((s) => s.status !== SignerStatus.COMPLETED);
        return (
          <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md text-center">
              <Clock className="mx-auto mb-4 h-16 w-16 text-amber-500" />
              <h1 className="text-2xl font-bold text-gray-900">Esperando Turno</h1>
              <p className="mt-2 text-gray-600">
                Este documento requiere firma secuencial.
                <br />
                Debes esperar a que <strong>{nextPending?.name}</strong> firme primero.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Orden de firma: {myOrder} de {request.signers.length}
              </p>
            </div>
          </div>
        );
      }
    }
  }

  // INTERFAZ DE FIRMA (Estado normal)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-sm text-gray-600">
                Firmante: <span className="font-medium">{signer.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                {signer.assignedFields.length} campo(s) por firmar
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Signing Interface */}
      <SignatureInterface
        request={request}
        signer={signer}
        template={template}
        onComplete={() => {
          // Refrescar página para mostrar estado actualizado
          window.location.reload();
        }}
      />

      <CombinatoricsDebug request={request} />
    </div>
  );
}
