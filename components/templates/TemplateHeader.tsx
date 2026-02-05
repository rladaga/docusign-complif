'use client';

import { Building2, Plus } from 'lucide-react';
import { Account } from '@/lib/types';

interface TemplateHeaderProps {
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  onCreate: () => void;
}

export function TemplateHeader({
  accounts,
  selectedAccountId,
  onAccountChange,
  onCreate,
}: TemplateHeaderProps) {
  return (
    <header className="border-b bg-white px-6 py-4 shadow-sm">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
            <p className="text-sm text-gray-600">Administra tus formularios PDF</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedAccountId}
                onChange={(e) => onAccountChange(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onCreate}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" /> Nuevo Template
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
