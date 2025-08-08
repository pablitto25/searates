export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteLocation extends Coordinates {
    name: string;
    state: string;
    country: string;
}

export interface RouteInfo {
    type: string;
    transport_type: TransportType;
    from: RouteLocation;
    to: RouteLocation;
    pathObjects: Coordinates[];
}

export interface RouteData {
    route_info: RouteInfo[];
    pin: Coordinates;
}

export interface TrackedContainers {
    nroOrden: string | null;
    state: string | null;
    detalle: string | null;
    nombreEmpresa: string | null;
}

export interface ContainerResponse {
    id: number;
    metadata: {
        number: string;
        sealine_name: string;
        status: string;
        updated_at: string;
    };
    route: RouteStages;
    route_data: RouteData;
    trackedContainers?: TrackedContainers[] | null;
}


export interface RouteStages {
    prepol: RoutePoint;
    pol: RoutePoint;  // Puerto de origen real
    pod: RoutePoint;  // Puerto de destino real
    postpod: RoutePoint;
}

export interface RoutePoint {
    date: string;                 // "2025-06-30 08:49:00"
    actual: boolean;              // true / false
    predictiveEta: string | null; // Puede ser null
    resolvedlocation: string | null; // Puede ser null (si algún día viene con valor)
}

export type TransportType =
    | 'VESSEL'       // Buque de carga
    | 'BARGE'        // Barcaza
    | 'FEEDER'       // Buque alimentador
    | 'TRUCK'        // Camión
    | 'TRAIN'        // Tren
    | 'RAIL'         // Ferrocarril (alternativa a TRAIN)
    | 'AIR'          // Transporte aéreo
    | 'AIRCRAFT'     // Avión (alternativa a AIR)
    | 'INTERMODAL'   // Transporte multimodal
    | 'RO-RO'        // Roll-on/Roll-off (transbordador)
    | 'LIGHTER'      // Barcaza de transferencia
    | 'PIPELINE'     // Transporte por tuberías
    | 'POST'         // Servicio postal
    | 'WAREHOUSE'    // Almacén
    | 'PORT'         // Operación portuaria
    | 'ONFOOT'       // Transporte a pie (para distancias cortas)
    | 'BULK'         // Carga a granel
    | 'CONTAINER'    // Contenedor específico
    | 'TANKER'       // Buque tanque
    | 'REEFER'       // Contenedor refrigerado
    | string;        // Para cualquier tipo no listado


