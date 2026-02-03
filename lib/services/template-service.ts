import { Template } from '@/lib/types';

export const TemplateService = {
  // GET
  getAll: async (): Promise<Template[]> => {
    const res = await fetch('/api/templates');
    if (!res.ok) throw new Error('Error fetching templates');
    return res.json();
  },

  // POST
  create: async (payload: {
    accountId: string;
    name: string;
    pdfUrl: string;
    pdfFileName: string;
    totalPages: number;
  }): Promise<Template> => {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creating template');
    return res.json();
  },

  //PUT
  update: async (id: string, updates: Partial<Template>): Promise<Template> => {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error updating template');
    return res.json();
  },

  // DELETE
  delete: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  duplicate: async (id: string): Promise<Template> => {
    const res = await fetch(`/api/templates/${id}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Error duplicating template');
    return res.json();
  },

  createVersion: async (id: string): Promise<Template> => {
    const res = await fetch(`/api/templates/${id}/versions`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Error creating version');
    return res.json();
  },
};
