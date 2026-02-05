'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface CreateTemplateModalProps {
  onClose: () => void;
  onCreate: (name: string, pdfUrl: string, pdfFileName: string, totalPages: number) => void;
}

export function CreateTemplateModal({ onClose, onCreate }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pdfFile) return;

    setIsProcessing(true);

    try {
      const pdfBase64 = await fileToBase64(pdfFile);
      const pdfDoc = await PDFDocument.load(pdfBase64);
      const totalPages = pdfDoc.getPageCount();

      onCreate(name, pdfBase64, pdfFile.name, totalPages);
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
