import { NextResponse } from 'next/server';
import { db } from '@/lib/mocks/mock-db';
import { Template } from '@/lib/types';
import { nanoid } from 'nanoid';

// GET /api/templates
// Obtener todos los templates
export async function GET() {
  const templates = db.getAll();
  return NextResponse.json(templates);
}

// POST /api/templates
// Crear un nuevo template
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validación básica
    if (!body.name || !body.accountId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, accountId' },
        { status: 400 }
      );
    }

    const newTemplate: Template = {
      ...body,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      fields: body.fields || [],
      signers: body.signers || [],
      settings: body.settings || {
        expirationDays: 0,
        reminderFrequency: 'daily',
        signingOrder: 'sequential',
        allowDecline: true,
        requireAllFields: true,
        notifyOnComplete: true,
        notifyOnDecline: true,
        requireAccessCode: false,
      },
    };

    const created = db.create(newTemplate);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
