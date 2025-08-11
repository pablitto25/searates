import { updateContainersData } from './updateContainers';

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hora

class DataUpdater {
    private intervalId: NodeJS.Timeout | null = null;

    start() {
        // Ejecutar inmediatamente
        updateContainersData();

        // Configurar intervalo
        this.intervalId = setInterval(() => {
            updateContainersData();
        }, UPDATE_INTERVAL);

        console.log('🔄 DataUpdater iniciado');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('🛑 DataUpdater detenido');
        }
    }
}

export const dataUpdater = new DataUpdater();