'use client';

import { FileText, Plus } from 'lucide-react';

interface TemplateEmptyStateProps {
  onCreate: () => void;
}

export function TemplateEmptyState({ onCreate }: TemplateEmptyStateProps) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No hay templates</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comienza creando tu primer template de documento
        </p>
        <button
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Crear Template
        </button>
      </div>
    </div>
  );
}
