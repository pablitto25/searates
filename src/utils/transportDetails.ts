export interface TransportDetails {
    icon: string;
    label: string;
    description: string;
}

export function getTransportDetails(transportType: string): TransportDetails {
    const details = { icon: '🚚', label: transportType, description: '' };

    switch (transportType) {
        case 'VESSEL':
            return { ...details, icon: '🚢', label: 'Buque', description: 'Transporte marítimo' };
        case 'BARGE':
            return { ...details, icon: '🛶', label: 'Barcaza', description: 'Transporte fluvial' };
        case 'FEEDER':
            return { ...details, icon: '⛴️', label: 'Alimentador', description: 'Buque de conexión entre puertos' };
        case 'TRUCK':
            return { ...details, icon: '🚛', label: 'Camión', description: 'Transporte por carretera' };
        case 'TRAIN':
        case 'RAIL':
            return { ...details, icon: '🚂', label: 'Tren', description: 'Transporte ferroviario' };
        case 'AIR':
        case 'AIRCRAFT':
            return { ...details, icon: '✈️', label: 'Aéreo', description: 'Transporte por avión' };
        case 'INTERMODAL':
            return { ...details, icon: '🔄', label: 'Multimodal', description: 'Combinación de transportes' };
        case 'RO-RO':
            return { ...details, icon: '🚢⇨🚛', label: 'RO-RO', description: 'Transbordador para vehículos' };
        case 'LIGHTER':
            return { ...details, icon: '🚤', label: 'Barcaza', description: 'Transferencia puerto-barco' };
        case 'PIPELINE':
            return { ...details, icon: '⛽', label: 'Tubería', description: 'Transporte por ductos' };
        case 'POST':
            return { ...details, icon: '📮', label: 'Postal', description: 'Servicio de correos' };
        case 'WAREHOUSE':
            return { ...details, icon: '🏭', label: 'Almacén', description: 'Almacenamiento temporal' };
        case 'PORT':
            return { ...details, icon: '⚓', label: 'Puerto', description: 'Operación portuaria' };
        case 'ONFOOT':
            return { ...details, icon: '🚶', label: 'A pie', description: 'Transporte manual' };
        case 'BULK':
            return { ...details, icon: '🔄', label: 'Granel', description: 'Carga a granel' };
        case 'CONTAINER':
            return { ...details, icon: '📦', label: 'Contenedor', description: 'Contenedor estándar' };
        case 'TANKER':
            return { ...details, icon: '🛢️', label: 'Tanquero', description: 'Transporte de líquidos' };
        case 'REEFER':
            return { ...details, icon: '❄️', label: 'Refrigerado', description: 'Contenedor con control de temperatura' };
        default:
            return { ...details, label: transportType, description: 'Tipo de transporte no especificado' };
    }
}