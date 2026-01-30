import { http, HttpResponse } from 'msw';

// Mock storage
let mockTemplates: any[] = [];
let mockRequests: any[] = [];

export const handlers = [
  // ============
  // TEMPLATES
  // ============

  http.get('/api/templates', () => {
    return HttpResponse.json(mockTemplates);
  }),

  http.get('/api/templates/:id', ({ params }) => {
    const template = mockTemplates.find((t) => t.id === params.id);
    if (!template) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(template);
  }),

  http.post('/api/templates', async ({ request }) => {
    const body = (await request.json()) as any;
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTemplates.push(newTemplate);
    return HttpResponse.json(newTemplate);
  }),

  http.put('/api/templates/:id', async ({ params, request }) => {
    const body = (await request.json()) as any;
    const index = mockTemplates.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    mockTemplates[index] = {
      ...mockTemplates[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockTemplates[index]);
  }),

  http.delete('/api/templates/:id', ({ params }) => {
    const index = mockTemplates.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    mockTemplates.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ==================
  // SIGNATURE REQUESTS
  // ==================
  http.get('/api/signature-requests', () => {
    return HttpResponse.json(mockRequests);
  }),

  http.post('/api/signature-requests', async ({ request }) => {
    const body = (await request.json()) as any;
    const newRequest = {
      id: `request-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRequests.push(newRequest);
    return HttpResponse.json(newRequest);
  }),
];

// Helper para resetear mocks (útil para tests)
export function resetMockData() {
  mockTemplates = [];
  mockRequests = [];
}
