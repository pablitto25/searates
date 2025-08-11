import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'containers.json');

export async function updateContainersData(): Promise<{ success: boolean, error?: string }> {
    try {
        console.log('⏳ Iniciando actualización de datos de contenedores...');
        const startTime = Date.now();

        const res = await fetch("http://54.82.251.60:8080/DataEntity");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();

        // Validar que los datos no estén vacíos
        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error('Datos recibidos están vacíos');
        }

        // Crear directorio si no existe
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Escribir archivo temporal primero
        const tempFile = DATA_FILE + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));

        // Reemplazar archivo original solo si la escritura fue exitosa
        fs.renameSync(tempFile, DATA_FILE);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Datos actualizados en ${duration.toFixed(2)}s. Guardados en: ${DATA_FILE}`);
        return { success: true };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error al actualizar datos:', errorMsg);
        return { success: false, error: errorMsg };
    }
}

// Solo ejecutar automáticamente en desarrollo si no estamos en proceso de construcción
if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE) {
    updateContainersData();
}