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
    transport_type: string;
    from: RouteLocation;
    to: RouteLocation;
    pathObjects: Coordinates[];
}

export interface RouteData {
    route_info: RouteInfo[];
    pin: Coordinates;
}

export interface ContainerResponse {
    id: number;
    metadata: {
        number: string;
        sealine_name: string;
        status: string;
        updated_at: string;
    };
    route_data: RouteData;
}