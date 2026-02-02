import { NextResponse } from 'next/server';
import { db } from '@/lib/mocks/mock-db';

interface RouteParams {
  params: { id: string };
}

// GET /api/templates/[id]
export async function GET(request: Request, { params }: RouteParams) {
  const template = db.getById(params.id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json(template);
}

// PUT /api/templates/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const updated = db.update(params.id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  const success = db.delete(params.id);

  if (!success) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Template ${params.id} deleted successfully`,
  });
}
