'use client';

import { useState, useRef } from 'react';
import {
  SignatureRequest,
  SignerAssignment,
  Template,
  Field,
  FieldType,
  SignerStatus,
  DocumentStatus,
} from '@/lib/types';
import { useSignatureStore } from '@/lib/store/signature-store';
import { PDFViewer } from '@/components/pdf-builder/PDFViewer';
import SignatureCanvas from 'react-signature-canvas';
import {
  CheckCircle,
  X,
  Pen,
  Calendar,
  Type,
  CheckSquare,
  ArrowRight,
  Lock,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface SignatureInterfaceProps {
  request: SignatureRequest;
  signer: SignerAssignment;
  template: Template;
  onComplete: () => void;
}

export function SignatureInterface({
  request: initialRequest,
  signer,
  template,
  onComplete,
}: SignatureInterfaceProps) {
  const { signField, completeSignerSignature, declineRequest, requests } = useSignatureStore();

  // Usar la versión del store para asegurar reactividad inmediata al cambiar estado (ej: DECLINED)
  const request = requests.find((r) => r.id === initialRequest.id) || initialRequest;

  // Estado local
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [currentFieldId, setCurrentFieldId] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [modalType, setModalType] = useState<'signature' | 'initials'>('signature');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const SCALE = 1.5;

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  const sigPadRef = useRef<SignatureCanvas>(null);

  // Filtrar campos de este usuario (GLOBALES del documento)
  const myFields = template.fields.filter((f) => signer.assignedFields.includes(f.id));

  // Filtrar campos VISIBLES (Solo los de la página actual)
  const visibleFields = myFields.filter((f) => f.position.page === currentPage);

  // --- VALIDACIONES DE FLUJO (Parte 1) ---

  // 1. Validación de Expiración
  const isExpired =
    request.status === DocumentStatus.EXPIRED ||
    (request.expiresAt && new Date() > new Date(request.expiresAt));

  if (isExpired) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4">
          <Clock className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Documento Expirado</h1>
        <p className="mt-2 max-w-md text-gray-600">
          El tiempo límite para firmar este documento ha finalizado. Por favor, contacta al
          remitente para solicitar una nueva invitación.
        </p>
      </div>
    );
  }

  // 1.5 Validación de Rechazo
  if (request.status === DocumentStatus.DECLINED) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4">
          <X className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Documento Rechazado</h1>
        <p className="mt-2 max-w-md text-gray-600">
          Este documento ha sido rechazado por{' '}
          <span className="font-medium">{request.declinedBy}</span>.
          <br />
          <span className="text-sm italic">"{request.declineReason}"</span>
        </p>
      </div>
    );
  }

  // 2. Validación de Orden Secuencial
  const isSequential = request.settings?.signingOrder === 'sequential';
  let isLockedByOrder = false;
  let pendingPreviousSigners: SignerAssignment[] = [];

  if (isSequential) {
    const previousSigners = request.signers.filter((s) => s.order < signer.order);
    pendingPreviousSigners = previousSigners.filter((s) => s.status !== SignerStatus.COMPLETED);
    isLockedByOrder = pendingPreviousSigners.length > 0;
  }

  if (isLockedByOrder) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-amber-100 p-4">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Espera tu turno</h1>
        <p className="mt-2 max-w-md text-gray-600">
          Este documento requiere un orden de firma secuencial. Aún hay firmantes anteriores
          pendientes.
        </p>
        <div className="mt-6 rounded-lg border bg-white p-4 text-left shadow-sm">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Esperando a:</p>
          <ul className="space-y-2">
            {pendingPreviousSigners.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                {s.name} <span className="text-gray-400">({s.email})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // --- LÓGICA DE ACTIONS ---
  const handleFieldClick = (field: Field) => {
    if (completedFields.has(field.id)) return;

    setCurrentFieldId(field.id);

    switch (field.type) {
      case FieldType.SIGNATURE:
        setModalType('signature');
        setShowSignatureModal(true);
        break;
      case FieldType.INITIALS:
        setModalType('initials');
        setShowSignatureModal(true);
        break;
      case FieldType.DATE:
        const today = new Date().toLocaleDateString('es-AR');
        saveFieldValue(field.id, today);
        break;
      case FieldType.TEXT:
        const text = prompt('Ingresa el texto:');
        if (text) saveFieldValue(field.id, text);
        break;
      case FieldType.CHECKBOX:
        saveFieldValue(field.id, 'checked');
        break;
      default:
        break;
    }
  };

  const saveFieldValue = (fieldId: string, value: string) => {
    signField(request.id, signer.id, fieldId, value);
    setCompletedFields((prev) => new Set(prev).add(fieldId));
    setCurrentFieldId(null);
    setShowSignatureModal(false);
  };

  const handleSaveSignature = () => {
    if (!sigPadRef.current || !currentFieldId) return;
    if (sigPadRef.current.isEmpty()) return alert('Por favor dibuja algo.');

    const signatureDataUrl = sigPadRef.current.toDataURL();
    saveFieldValue(currentFieldId, signatureDataUrl);
  };

  const handleClearSignature = () => {
    sigPadRef.current?.clear();
  };

  const handleCompleteAllFields = () => {
    if (completedFields.size < myFields.length) {
      alert('Debes completar todos los campos antes de finalizar.');
      return;
    }
    completeSignerSignature(request.id, signer.id);
    onComplete();
  };

  const handleDecline = () => {
    setShowDeclineModal(true);
  };

  const confirmDecline = () => {
    declineRequest(request.id, signer.id, 'Rechazado por el usuario');
    setShowDeclineModal(false);
  };

  const allFieldsCompleted = completedFields.size === myFields.length;

  const renderFieldContent = (field: Field, isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-[10px] font-bold text-green-700">Listo</span>
        </>
      );
    }
    switch (field.type) {
      case FieldType.SIGNATURE:
        return (
          <>
            <Pen className="h-3 w-3" /> Firmar
          </>
        );
      case FieldType.INITIALS:
        return (
          <>
            <Pen className="h-3 w-3" /> Inicialar
          </>
        );
      case FieldType.DATE:
        return (
          <>
            <Calendar className="h-3 w-3" /> Fecha hoy
          </>
        );
      case FieldType.TEXT:
        return (
          <>
            <Type className="h-3 w-3" /> Completar
          </>
        );
      case FieldType.CHECKBOX:
        return (
          <>
            <CheckSquare className="h-3 w-3" /> Marcar
          </>
        );
      default:
        return <span>Llenar</span>;
    }
  };

  // Función para saltar al siguiente campo pendiente (UX Improvement)
  const jumpToNextField = () => {
    const nextField = myFields.find((f) => !completedFields.has(f.id));
    if (nextField) {
      setCurrentPage(nextField.position.page);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-gray-100 pb-32">
      {/* Barra de progreso superior */}
      <div className="sticky top-0 z-20 flex w-full items-center justify-between bg-white px-6 py-3 shadow-sm">
        <div className="text-sm font-medium text-gray-600">
          Página {currentPage} de {numPages || '--'}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {completedFields.size} / {myFields.length} campos
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${(completedFields.size / myFields.length) * 100}%` }}
            />
          </div>
        </div>
        {/* Botón para saltar al siguiente campo si está en otra página */}
        {!allFieldsCompleted && (
          <button
            onClick={jumpToNextField}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Siguiente Campo <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="relative mt-8 flex h-fit w-full max-w-4xl flex-col bg-white shadow-2xl">
        <PDFViewer
          fileUrl={template.pdfUrl}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLoadSuccess={(p) => setNumPages(p)}
          scale={SCALE}
        />

        {/* Overlay de campos (SOLO LOS DE ESTA PÁGINA) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto relative h-full w-full">
            {visibleFields.map((field) => {
              const isCompleted = completedFields.has(field.id);

              return (
                <button
                  key={field.id}
                  onClick={() => handleFieldClick(field)}
                  disabled={isCompleted}
                  className={`absolute flex items-center justify-center gap-1 rounded border-2 text-xs font-medium shadow-sm transition-all ${
                    isCompleted
                      ? 'cursor-default border-green-500 bg-green-100 opacity-90'
                      : 'animate-pulse cursor-pointer border-indigo-500 bg-indigo-50 text-indigo-700 hover:scale-105 hover:bg-indigo-100'
                  }`}
                  style={{
                    left: `${field.position.x}px`,
                    top: `${field.position.y}px`,
                    width: `${field.position.width}px`,
                    height: `${field.position.height}px`,
                  }}
                >
                  {renderFieldContent(field, isCompleted)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botón Flotante Final */}
      <div className="fixed right-8 bottom-8 z-30 flex gap-4">
        <button
          onClick={handleDecline}
          className="flex items-center gap-2 rounded-full bg-red-100 px-6 py-4 font-bold text-red-700 shadow-xl transition-all hover:bg-red-200"
        >
          <X className="h-5 w-5" /> Rechazar
        </button>

        <button
          onClick={handleCompleteAllFields}
          disabled={!allFieldsCompleted}
          className={`flex items-center gap-2 rounded-full px-6 py-4 font-bold text-white shadow-xl transition-all ${
            allFieldsCompleted
              ? 'animate-bounce bg-green-600 hover:scale-105 hover:bg-green-700'
              : 'cursor-not-allowed bg-gray-400'
          }`}
        >
          {allFieldsCompleted ? (
            <>✓ Finalizar Documento</>
          ) : (
            <span className="text-sm">Faltan {myFields.length - completedFields.size} campos</span>
          )}
        </button>
      </div>

      {/* Modal de Firma (Igual que antes) */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {modalType === 'signature' ? 'Dibuja tu Firma' : 'Dibuja tus Iniciales'}
              </h2>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="mb-4 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{ className: 'w-full h-48 block' }}
                minWidth={1}
                maxWidth={2.5}
                penColor="black"
              />
              <div className="border-t border-gray-200 p-2 text-center text-xs text-gray-400">
                Dibuja aquí arriba
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClearSignature}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Borrar
              </button>
              <button
                onClick={handleSaveSignature}
                className="flex-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
              >
                {modalType === 'signature' ? 'Aplicar Firma' : 'Aplicar Iniciales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Rechazar Documento</h2>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              ¿Estás seguro de que deseas rechazar este documento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDecline}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white shadow-lg hover:bg-red-700"
              >
                Sí, Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
