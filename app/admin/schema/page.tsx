'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GroupManager } from '@/components/schema/GroupManager';
import { RuleManager } from '@/components/schema/RuleManager';
import { Users, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Faculty } from '@/lib/types';

function SchemaPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const facultyParam = searchParams.get('faculty');

  const [activeTab, setActiveTab] = useState<'groups' | 'rules'>(
    tabParam === 'rules' ? 'rules' : 'groups'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/schemas"
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Schemas
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Configuración de Cuenta</h1>
        <p className="mb-8 text-gray-500">
          Gestiona los grupos de firmantes y las reglas de aprobación por facultad.
        </p>

        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'groups'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Grupos de Firmantes
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Reglas de Aprobación
          </button>
        </div>

        {activeTab === 'groups' ? (
          <GroupManager />
        ) : (
          <RuleManager initialFaculty={facultyParam as Faculty} />
        )}
      </div>
    </div>
  );
}

export default function SchemaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SchemaPageContent />
    </Suspense>
  );
}
