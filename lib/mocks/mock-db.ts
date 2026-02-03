import { Template, FieldType, SigningOrder, ReminderFrequency } from '@/lib/types';

/**
 * Mock Database (Server-Side)
 *
 * Esta clase simula una base de datos en el servidor para respaldar
 * los API Endpoints de CRUD. Los datos persisten mientras el servidor
 * de desarrollo esté corriendo.
 */

class MockDatabase {
  private templates: Template[] = [];

  constructor() {}

  getAll(): Template[] {
    return this.templates;
  }

  getById(id: string): Template | undefined {
    return this.templates.find((t) => t.id === id);
  }

  create(template: Template): Template {
    this.templates.push(template);
    return template;
  }

  update(id: string, data: Partial<Template>): Template | null {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.templates[index] = { ...this.templates[index], ...data, updatedAt: new Date() };
    return this.templates[index];
  }

  delete(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter((t) => t.id !== id);
    return this.templates.length !== initialLength;
  }
}

// Singleton instance
export const db = new MockDatabase();
