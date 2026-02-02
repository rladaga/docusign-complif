import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/templates/route';
import { db } from '@/lib/mocks/mock-db';
import { Template, ReminderFrequency, SigningOrder } from '@/lib/types';

// Helper para crear un objeto Request simulado para los tests
function createMockRequest(body: any, method: 'POST' | 'GET' = 'POST'): Request {
  const request = new Request('http://localhost/api/templates', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return request;
}

// Datos que coinciden con el constructor de MockDatabase
const SEED_TEMPLATE: Template = {
  id: 'template-nda',
  accountId: 'account-1',
  name: 'Acuerdo de Confidencialidad (NDA)',
  description: 'Plantilla estándar para empleados y contratistas.',
  version: 1,
  pdfUrl:
    'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  pdfFileName: 'nda-v1.pdf',
  totalPages: 14,
  fields: [], // Simplificado para el test
  signers: [],
  settings: {
    expirationDays: 7,
    reminderFrequency: ReminderFrequency.DAILY,
    signingOrder: SigningOrder.SEQUENTIAL,
    allowDecline: true,
    requireAllFields: true,
    notifyOnComplete: true,
    notifyOnDecline: true,
    requireAccessCode: false,
  },
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
  isArchived: false,
};

describe('API Route: /api/templates', () => {
  // Restauramos el estado inicial (Seed Data) antes de cada test
  beforeEach(() => {
    const allTemplates = db.getAll();
    allTemplates.forEach((t) => db.delete(t.id));

    // Re-insertamos el template por defecto
    db.create(SEED_TEMPLATE);
  });

  // --- Tests para GET /api/templates ---
  describe('GET', () => {
    it('debe devolver los templates iniciales (Seed Data) por defecto', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('template-nda');
      expect(data[0].name).toBe('Acuerdo de Confidencialidad (NDA)');
      expect(data[0].settings.expirationDays).toBe(7);
    });

    it('debe devolver seed data + nuevos templates creados', async () => {
      db.create({ id: 't2', name: 'Template 2' } as Template);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2); // Seed + Nuevo
    });
  });

  // --- Tests para POST /api/templates ---
  describe('POST', () => {
    it('debe crear un nuevo template y devolverlo con status 201', async () => {
      // Arrange
      const newTemplateData = {
        name: 'Mi Nuevo Template',
        accountId: 'acc-123',
        pdfUrl: 'url/test.pdf',
        pdfFileName: 'test.pdf',
        totalPages: 1,
        createdBy: 'test-user',
      };
      const request = createMockRequest(newTemplateData);

      // Act
      const response = await POST(request);
      const createdTemplate = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(createdTemplate.name).toBe('Mi Nuevo Template');
      expect(createdTemplate.id).toBeDefined();
      expect(createdTemplate.settings).toBeDefined(); // Verifica que se aplicaron los settings por defecto

      // Verifica que se guardó en la "base de datos"
      const allTemplates = db.getAll();
      expect(allTemplates).toHaveLength(2); // Seed + Nuevo
      expect(allTemplates.find((t) => t.id === createdTemplate.id)).toBeDefined();
    });

    it('debe devolver un error 400 si faltan campos requeridos', async () => {
      // Arrange: Enviamos un body incompleto (falta 'name' y 'accountId')
      const incompleteData = { description: 'Incompleto' };
      const request = createMockRequest(incompleteData);

      // Act
      const response = await POST(request);
      const errorBody = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(errorBody.error).toContain('Faltan campos requeridos');
      expect(db.getAll()).toHaveLength(1); // La DB debe seguir solo con el Seed
    });
  });
});
