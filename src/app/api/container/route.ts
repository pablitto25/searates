import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'containers.json');

// Función auxiliar para leer y validar el archivo JSON
function readContainersData() {
    try {
        if (!fs.existsSync(DATA_FILE)) return null;

        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        if (!fileContent.trim()) return null;

        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading containers data:', error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const containerNumber = searchParams.get("number");

    if (!containerNumber) {
        return NextResponse.json({ error: "Missing container number" }, { status: 400 });
    }

    try {
        // 1. Primero intentar obtener del archivo local
        const containersData = readContainersData();

        if (containersData) {
            // Buscar el contenedor en los datos locales
            const container = Array.isArray(containersData)
                ? containersData.find((c: any) => c.metadata?.number === containerNumber)
                : null;

            if (container) {
                return NextResponse.json(container);
            }
        }

        // 2. Si no se encuentra localmente, hacer fetch a la API externa
        const res = await fetch(`http://54.82.251.60:8080/DataEntity/ContainerNumber/${containerNumber}`);
        const data = await res.json();

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error fetching container data:", error);
        return NextResponse.json(
            { error: "Failed to fetch container data" },
            { status: 500 }
        );
    }
}