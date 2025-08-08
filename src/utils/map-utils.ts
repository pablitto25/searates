import { LatLngTuple } from "leaflet";

// Normaliza [-180, 180]
export function normalizeLon(lon: number): number {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
}

// Devuelve la copia de lon más cercana a ref
export function toNearestCopy(lon: number, ref: number): number {
    const k = Math.round((ref - lon) / 360);
    return lon + 360 * k;
}

// Ajusta longitudes al cruzar el meridiano
export function unwrapLongitudes(line: [number, number][]): [number, number][] {
    if (!line || !line.length) return line;
    const out: [number, number][] = [];
    let offset = 0;
    let prevLon = line[0][1];
    for (let i = 0; i < line.length; i++) {
        const [lat, lon] = line[i];
        let adj = lon + offset;
        const diff = adj - prevLon;
        if (diff > 180) { offset -= 360; adj = lon + offset; }
        else if (diff < -180) { offset += 360; adj = lon + offset; }
        out.push([lat, adj]);
        prevLon = adj;
    }
    return out;
}

// Distancia en km
export function haversineDistance(a: LatLngTuple, b: LatLngTuple) {
    const R = 6371; // km
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);

    const h = Math.sin(dLat / 2) ** 2 +
        Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
}


