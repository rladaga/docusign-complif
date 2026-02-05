'use client';

import { Template } from '@/lib/types';
import { FileText, Calendar, Send, Edit, History, FileJson, Copy, Trash2 } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onSend: (template: Template) => void;
  onEdit: (templateId: string) => void;
  onVersion: (templateId: string) => void;
  onExport: (template: Template) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateCard({
  template,
  onSend,
  onEdit,
  onVersion,
  onExport,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
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
        <button
          onClick={() => onSend(template)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Send className="h-4 w-4" />
          Enviar a Firmar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(template.id)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={() => onVersion(template.id)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
            title="Crear Nueva Versión"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={() => onExport(template)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
            title="Exportar JSON Config"
          >
            <FileJson className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDuplicate(template.id)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
            title="Duplicar"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-2 text-red-600 hover:border-red-200 hover:bg-red-50"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
