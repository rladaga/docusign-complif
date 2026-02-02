'use client';

import { useState } from 'react';
import { useTemplateStore } from '@/lib/store/template-store';
import {
  PDFViewer,
  FieldOverlay,
  FieldToolbar,
  SignerPanel,
  FieldProperties,
} from '@/components/pdf-builder';
import { FieldType } from '@/lib/types/template';
import { Save, ArrowLeft, EyeOff, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BuilderPage() {
  const router = useRouter();
  const {
    currentTemplate,
    currentPage,
    selectedFieldId,
    addField,
    updateField,
    deleteField,
    selectField,
    setCurrentPage,
    saveTemplate,
  } = useTemplateStore();

  const [scale] = useState(1.5);
  const [isPreview, setIsPreview] = useState(false);

  const handleAddField = (type: FieldType) => {
    if (!currentTemplate) return;

    addField(
      type,
      {
        page: currentPage,
        x: 200,
        y: 200,
        width: type === FieldType.SIGNATURE ? 200 : 150,
        height: type === FieldType.SIGNATURE ? 60 : 40,
      },
      ''
    );
  };

  const handleFieldMove = (fieldId: string, x: number, y: number) => {
    updateField(fieldId, {
      position: {
        ...currentTemplate!.fields.find((f) => f.id === fieldId)!.position,
        x,
        y,
      },
    });
  };

  const handleFieldResize = (fieldId: string, width: number, height: number) => {
    const field = currentTemplate?.fields.find((f) => f.id === fieldId);
    if (!field) return;

    updateField(fieldId, {
      position: {
        ...field.position,
        width,
        height,
      },
    });
  };

  const handleSave = () => {
    saveTemplate();
    alert('Template guardado exitosamente');
  };

  if (!currentTemplate) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">No hay template seleccionado</h2>
          <p className="mt-2 text-gray-600">Crea o selecciona un template para comenzar a editar</p>
          <button
            onClick={() => router.push('/admin/templates')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Ir a Templates
          </button>
        </div>
      </div>
    );
  }

  const currentPageFields = currentTemplate.fields.filter(
    (field) => field.position.page === currentPage
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/templates')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{currentTemplate.name}</h1>
              <p className="text-sm text-gray-500">
                {isPreview ? 'Modo Vista Previa' : 'Modo Edición'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsPreview(!isPreview);
                selectField(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isPreview
                  ? 'bg-gray-800 text-white hover:bg-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isPreview ? (
                <>
                  {' '}
                  <EyeOff className="h-4 w-4" /> Volver a Editar{' '}
                </>
              ) : (
                <>
                  {' '}
                  <Eye className="h-4 w-4" /> Vista Previa{' '}
                </>
              )}
            </button>

            {!isPreview && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700"
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Toolbar */}
        {!isPreview && (
          <aside className="flex w-80 flex-col gap-4 border-r bg-white p-4">
            <FieldToolbar onAddField={handleAddField} />
            <SignerPanel />

            {/* Field List */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Campos en esta página ({currentPageFields.length})
              </h3>
              <div className="space-y-1">
                {currentPageFields.map((field) => (
                  <button
                    key={field.id}
                    onClick={() => selectField(field.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm text-gray-800 transition-colors ${
                      selectedFieldId === field.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {field.label || field.type}
                  </button>
                ))}
                {currentPageFields.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">
                    No hay campos en esta página
                  </p>
                )}
              </div>
            </div>

            <FieldProperties />
          </aside>
        )}

        {/* Canvas - PDF Viewer with Fields */}
        <main className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              <PDFViewer
                fileUrl={currentTemplate.pdfUrl}
                currentPage={currentPage}
                scale={scale}
                onPageChange={setCurrentPage}
              />
              <FieldOverlay
                fields={currentPageFields}
                selectedFieldId={isPreview ? null : selectedFieldId}
                onFieldSelect={selectField}
                onFieldMove={handleFieldMove}
                onFieldResize={handleFieldResize}
                onFieldDelete={deleteField}
                scale={scale}
                readOnly={isPreview}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
