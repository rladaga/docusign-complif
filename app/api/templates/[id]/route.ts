import { NextResponse } from 'next/server';
import { db } from '@/lib/mocks/mock-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/templates/[id]
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const template = db.getById(id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json(template);
}

// PUT /api/templates/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = db.update(id, body);

    // Upsert para poder trabajar con Zustand y la api y mock-db sin problemas
    if (!updated) {
      console.log(`Recuperando template perdido: ${id}`);

      const recoveredTemplate = {
        ...body,
        id: id,
        updatedAt: new Date(),
        createdAt: body.createdAt || new Date(),
        version: body.version || 1,
      };

      db.create(recoveredTemplate);

      return NextResponse.json(recoveredTemplate);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const success = db.delete(id);

  if (!success) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Template ${id} deleted successfully`,
  });
}
