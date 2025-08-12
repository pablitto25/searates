import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'containers.json');

export async function GET() {
    try {
        // Leer el archivo existente
        if (!fs.existsSync(DATA_FILE)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json(
            { error: 'Error reading file' },
            { status: 500 }
        );
    }
}

export async function POST() {
    try {
        const res = await fetch("http://54.82.251.60:8080/DataEntity");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();

        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error('Empty data received');
        }

        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const tempFile = DATA_FILE + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, DATA_FILE);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}