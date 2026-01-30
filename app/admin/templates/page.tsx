'use client';

import { useState } from 'react';
import { useTemplateStore } from '@/lib/store/template-store';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Calendar, Trash2, Edit, Copy, Send } from 'lucide-react';
import { Template } from '@/lib/types';
// Importamos el modal que creamos en el paso anterior
import { CreateRequestModal } from '@/components/signature-flow/CreateRequestModal';

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, createTemplate, deleteTemplate, duplicateTemplate, loadTemplate } =
    useTemplateStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Estado para controlar qué template se está enviando a firmar
  const [selectedTemplateForRequest, setSelectedTemplateForRequest] = useState<Template | null>(
    null
  );

  const handleCreateTemplate = (name: string, pdfUrl: string, pdfFileName: string) => {
    createTemplate(name, pdfUrl, pdfFileName, 1);
    setShowCreateModal(false);
  };

  const handleOpenBuilder = (templateId: string) => {
    loadTemplate(templateId);
    router.push('/builder');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
              <p className="text-sm text-gray-600">Administra tus formularios PDF</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Nuevo Template
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {templates.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hay templates</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer template de documento
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Crear Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {template.description && (
                        <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                      v{template.version}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>
                        {template.fields.length} campos · {template.totalPages} páginas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col gap-3 border-t bg-gray-50 px-6 py-4">
                  {/* Botón Principal: Enviar a Firmar */}
                  <button
                    onClick={() => setSelectedTemplateForRequest(template)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                    Enviar a Firmar
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBuilder(template.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => duplicateTemplate(template.id)}
                      className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este template?')) {
                          deleteTemplate(template.id);
                        }
                      }}
                      className="rounded-lg border border-gray-300 bg-white p-2 text-red-600 hover:border-red-200 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear Template */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTemplate}
        />
      )}

      {/* Modal Enviar a Firmar (CreateRequest) */}
      {selectedTemplateForRequest && (
        <CreateRequestModal
          template={selectedTemplateForRequest}
          onClose={() => setSelectedTemplateForRequest(null)}
          onSuccess={() => {
            setSelectedTemplateForRequest(null);
            router.push('/admin/requests'); // Redirige al dashboard al terminar
          }}
        />
      )}
    </div>
  );
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Modal Component para Crear Template (Nuevo archivo)
function CreateTemplateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, pdfUrl: string, pdfFileName: string) => void;
}) {
  const [name, setName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Nuevo estado para feedback visual

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pdfFile) return;

    setIsProcessing(true);

    try {
      // SOLUCIÓN: Convertimos a Base64 en lugar de Blob URL
      // Esto permite que el PDF sobreviva al "localStorage" y funcione en nuevas pestañas
      const pdfBase64 = await fileToBase64(pdfFile);

      onCreate(name, pdfBase64, pdfFile.name);
    } catch (error) {
      console.error('Error al procesar el PDF', error);
      alert('Error al procesar el archivo. Intenta con uno más liviano.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-200">
        <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Template</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre del Template
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej: Contrato de confidencialidad"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Archivo PDF Base</label>
            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-6 transition-colors hover:bg-gray-50">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2 flex justify-center text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:outline-none hover:text-indigo-500">
                    <span>Subir un archivo</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="sr-only"
                      required
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {pdfFile ? pdfFile.name : 'PDF hasta 5MB (Recomendado)'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name || !pdfFile || isProcessing}
              className="flex flex-1 justify-center rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? 'Procesando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
