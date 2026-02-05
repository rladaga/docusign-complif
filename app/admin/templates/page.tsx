'use client';

import { useState, useEffect } from 'react';
import { useTemplateStore } from '@/lib/store/template-store';
import { useSchemaStore } from '@/lib/store/schema-store';
import { useRouter } from 'next/navigation';
import { Template } from '@/lib/types';
import { CreateRequestModal } from '@/components/signature-flow/CreateRequestModal';
import { TemplateHeader } from '@/components/templates/TemplateHeader';
import { TemplateEmptyState } from '@/components/templates/TemplateEmptyState';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { CreateVersionModal } from '@/components/templates/CreateVersionModal';

export default function TemplatesPage() {
  const router = useRouter();
  const {
    templates,
    createTemplate,
    deleteTemplate,
    duplicateTemplate,
    loadTemplate,
    createNewVersion,
  } = useTemplateStore();
  const { accounts } = useSchemaStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionTemplateId, setVersionTemplateId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const filteredTemplates = templates.filter((t) => t.accountId === selectedAccountId);

  // Estado para controlar qué template se está enviando a firmar
  const [selectedTemplateForRequest, setSelectedTemplateForRequest] = useState<Template | null>(
    null
  );

  const handleCreateTemplate = (
    name: string,
    pdfUrl: string,
    pdfFileName: string,
    totalPages: number
  ) => {
    if (selectedAccountId) {
      createTemplate(selectedAccountId, name, pdfUrl, pdfFileName, totalPages);
      setShowCreateModal(false);
    }
  };

  const handleOpenBuilder = (templateId: string) => {
    loadTemplate(templateId);
    router.push('/builder');
  };

  const handleExportJson = (template: Template) => {
    const jsonString = JSON.stringify(template, null, 2);
    console.log('Template Configuration (JSON):', jsonString);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}_v${template.version}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateVersion = (templateId: string) => {
    setVersionTemplateId(templateId);
    setShowVersionModal(true);
  };

  const handleVersionSubmit = (description: string) => {
    if (versionTemplateId) {
      createNewVersion(versionTemplateId, description);
      setShowVersionModal(false);
      setVersionTemplateId(null);
    }
  };

  const handleDelete = (templateId: string) => {
    if (confirm('¿Eliminar este template?')) {
      deleteTemplate(templateId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TemplateHeader
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        onCreate={() => setShowCreateModal(true)}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {filteredTemplates.length === 0 ? (
          <TemplateEmptyState onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSend={setSelectedTemplateForRequest}
                onEdit={handleOpenBuilder}
                onVersion={handleCreateVersion}
                onExport={handleExportJson}
                onDuplicate={duplicateTemplate}
                onDelete={handleDelete}
              />
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

      {/* Modal Crear Versión */}
      {showVersionModal && (
        <CreateVersionModal
          onClose={() => setShowVersionModal(false)}
          onCreate={handleVersionSubmit}
        />
      )}

      {/* Modal Enviar a Firmar (CreateRequest) */}
      {selectedTemplateForRequest && (
        <CreateRequestModal
          template={selectedTemplateForRequest}
          onClose={() => setSelectedTemplateForRequest(null)}
          onSuccess={() => {
            setSelectedTemplateForRequest(null);
            router.push('/admin/requests');
          }}
        />
      )}
    </div>
  );
}
