import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import { updateContainersData } from '@/lib/updateContainers';

const DATA_FILE = path.join(process.cwd(), 'data', 'containers.json');

// Función para leer y validar el archivo JSON
function readAndValidateJsonFile(filePath: string) {
    try {
        if (!fs.existsSync(filePath)) return null;

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (!fileContent.trim()) {
            console.warn('⚠️ Archivo JSON existe pero está vacío');
            return null;
        }

        const data = JSON.parse(fileContent);
        return data;
    } catch (error) {
        console.error('Error al leer/parsear archivo JSON:', error);
        return null;
    }
}

export async function GET() {
    try {
        // 1. Intentar leer datos existentes
        const existingData = readAndValidateJsonFile(DATA_FILE);
        if (existingData) {
            return NextResponse.json(existingData);
        }

        // 2. Si no hay datos válidos, intentar actualizar
        console.log('⚠️ No hay datos válidos, intentando actualizar...');
        const updateResult = await updateContainersData();

        if (updateResult.success) {
            const newData = readAndValidateJsonFile(DATA_FILE);
            if (newData) {
                return NextResponse.json(newData);
            }
        }

        // 3. Si todo falla, devolver error con detalles
        return NextResponse.json(
            {
                error: "Datos no disponibles",
                details: updateResult.error || "No se pudo obtener ni actualizar los datos"
            },
            { status: 503 }
        );
    } catch (error) {
        console.error("Error en el endpoint /api/containers:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}