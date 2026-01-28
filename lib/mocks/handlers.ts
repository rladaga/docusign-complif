import { http, HttpResponse } from 'msw';

export const handlers = [
  // Template endpoints
  http.get('/api/templates', () => {
    return HttpResponse.json([]);
  }),

  http.post('/api/templates', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'template-1', ...body });
  }),

  // Más handlers después...
];
