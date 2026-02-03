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

  const newVersion: Template = {
    ...original,
    id: nanoid(),
    version: original.version + 1,
    previousVersionId: original.id,
    updatedAt: new Date(),

    fields: original.fields.map((f) => ({ ...f })),
    signers: original.signers.map((s) => ({ ...s })),
  };

  db.create(newVersion);

  return NextResponse.json(newVersion);
}
