import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'containers.json');
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hora en milisegundos

// Variable para almacenar el tiempo de la última actualización
let lastUpdateTime: number | null = null;

// Función para mostrar el tiempo restante
function logTimeRemaining() {
    if (lastUpdateTime) {
        const nextUpdateTime = lastUpdateTime + UPDATE_INTERVAL;
        const timeRemaining = nextUpdateTime - Date.now();

        if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / 60000);
            console.log(`🕒 Próxima actualización automática en: ${minutes} minutos`);
        } else {
            console.log('⚠️ La actualización automática debería haber ocurrido ya');
        }
    } else {
        console.log('⏳ Aún no se ha realizado ninguna actualización');
    }
}

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
        lastUpdateTime = Date.now(); // Actualizar el tiempo de la última actualización

        console.log(`✅ Datos actualizados en ${duration.toFixed(2)}s. Guardados en: ${DATA_FILE}`);

        // Programar el próximo log de tiempo restante
        setTimeout(logTimeRemaining, 10 * 60 * 1000); // 10 minutos

        return { success: true };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error al actualizar datos:', errorMsg);
        return { success: false, error: errorMsg };
    }
}

// Configurar intervalo para logs de tiempo restante
if (process.env.NODE_ENV === 'development') {
    // Iniciar la primera actualización
    updateContainersData().then(() => {
        // Configurar intervalo para logs cada 10 minutos
        setInterval(logTimeRemaining, 10 * 60 * 1000);
    });

    // Mostrar mensaje inicial
    console.log('🔹 Sistema de actualización iniciado. Mostrando logs cada 10 minutos.');
}