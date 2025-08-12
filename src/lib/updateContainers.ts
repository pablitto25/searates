import { ContainerResponse } from '@/types/container';
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
        const response = await fetch('/api/update-containers', {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to update containers');
        }

        return await response.json();
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function readContainersData(): Promise<ContainerResponse[]> {
    try {
        const response = await fetch('/api/update-containers');
        if (!response.ok) {
            throw new Error('Failed to read containers');
        }
        return await response.json();
    } catch (error) {
        console.error('Error reading containers:', error);
        return [];
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