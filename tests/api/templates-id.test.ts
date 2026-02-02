import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/templates/[id]/route';
import { db } from '@/lib/mocks/mock-db';
import { Template } from '@/lib/types';

// Helper para crear un objeto Request simulado
function createMockRequest(body: any = null, method: string = 'GET'): Request {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request('http://localhost/api/templates/123', init);
}

describe('API Route: /api/templates/[id]', () => {
  // Limpiar la base de datos antes de cada test
  beforeEach(() => {
    const all = db.getAll();
    all.forEach((t) => db.delete(t.id));
  });

  describe('GET', () => {
    it('debe devolver 404 si el template no existe', async () => {
      const request = createMockRequest();
      const response = await GET(request, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });

    it('debe devolver el template si existe', async () => {
      const template = { id: 't1', name: 'Test Template' } as Template;
      db.create(template);

      const request = createMockRequest();
      const response = await GET(request, { params: { id: 't1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('t1');
      expect(data.name).toBe('Test Template');
    });
  });

  describe('PUT', () => {
    it('debe devolver 404 si el template a actualizar no existe', async () => {
      const request = createMockRequest({ name: 'Updated' }, 'PUT');
      const response = await PUT(request, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });

    it('debe actualizar el template y devolverlo', async () => {
      const template = { id: 't1', name: 'Original' } as Template;
      db.create(template);

      const request = createMockRequest({ name: 'Updated' }, 'PUT');
      const response = await PUT(request, { params: { id: 't1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated');

      // Verificar persistencia en la "DB"
      const stored = db.getById('t1');
      expect(stored?.name).toBe('Updated');
    });
  });

  describe('DELETE', () => {
    it('debe devolver 404 si el template a eliminar no existe', async () => {
      const request = createMockRequest(null, 'DELETE');
      const response = await DELETE(request, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });

    it('debe eliminar el template correctamente', async () => {
      const template = { id: 't1', name: 'To Delete' } as Template;
      db.create(template);

      const request = createMockRequest(null, 'DELETE');
      const response = await DELETE(request, { params: { id: 't1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.getById('t1')).toBeUndefined();
    });
  });
});
