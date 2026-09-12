import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), '.dev_store');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(entity: string, tenantId: string) {
  ensureDataDir();
  const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${entity}_${safeTenant}.json`);
}

function readData(entity: string, tenantId: string) {
  const file = getFilePath(entity, tenantId);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

function writeData(entity: string, tenantId: string, data: unknown) {
  const file = getFilePath(entity, tenantId);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get('entity');
  const tenantId = searchParams.get('tenantId') || 'user-primary-dev';

  if (!entity) {
    return NextResponse.json({ error: 'Missing entity' }, { status: 400 });
  }

  const data = readData(entity, tenantId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entity, tenantId, data } = body;

    if (!entity || !tenantId) {
      return NextResponse.json({ error: 'Missing entity or tenantId' }, { status: 400 });
    }

    writeData(entity, tenantId, data);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
