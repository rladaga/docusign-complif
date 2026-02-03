import { NextResponse } from 'next/server';
import { db } from '@/lib/mocks/mock-db';
import { nanoid } from 'nanoid';
import { Template } from '@/lib/types';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = db.getById(id);

  if (!original) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const duplicate: Template = {
    ...original,
    id: nanoid(),
    name: `${original.name} (Copy)`,
    version: 1,
    previousVersionId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),

    fields: original.fields.map((f) => ({ ...f, id: nanoid() })),
    signers: original.signers.map((s) => ({ ...s, id: nanoid() })),
  };

  db.create(duplicate);

  return NextResponse.json(duplicate);
}
