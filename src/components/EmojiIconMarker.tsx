"use client";

import L from "leaflet";
import { Marker } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { ContainerResponse } from "@/types/container";
import { getTransportDetails } from "@/utils/transportDetails";
import { unwrapLongitudes, toNearestCopy } from "@/utils/map-utils";

// ==================
// Helpers internos
// ==================
function createEmojiDivIcon(emoji: string) {
    return L.divIcon({
        className: "emoji-divicon",
        html: `<div class="emoji-bounce">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
}

export function getContainerLines(container: any): LatLngTuple[][] {
    if (!container?.route_data?.route_info) return [];

    return container.route_data.route_info.map((route: any) =>
        route.pathObjects.map((p: any) => [p.lat, p.lng] as LatLngTuple)
    );
}

function haversineDistance(a: LatLngTuple, b: LatLngTuple): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000;
    const φ1 = toRad(a[0]);
    const φ2 = toRad(b[0]);
    const Δφ = toRad(b[0] - a[0]);
    const Δλ = toRad(b[1] - a[1]);
    const sinΔφ = Math.sin(Δφ / 2);
    const sinΔλ = Math.sin(Δλ / 2);
    const aa = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
}

function getTransportTypeForPin(c: ContainerResponse, adjPin: LatLngTuple | null): string {
    const routeInfo = c.route_data?.route_info;
    if (!routeInfo || !routeInfo.length) return "";

    if (!adjPin) return routeInfo[routeInfo.length - 1].transport_type ?? "";

    const lines = getContainerLines(c);
    let best = { dist: Infinity, idx: 0 };

    lines.forEach((line: LatLngTuple[], idx: number) => {
        for (let i = 0; i < line.length; i++) {
            const pt = line[i];
            const d = haversineDistance(pt, adjPin);
            if (d < best.dist) {
                best.dist = d;
                best.idx = idx;
            }
        }
    });

    return routeInfo[best.idx]?.transport_type ?? "";
}

// ==================
// Componente principal
// ==================
export default function EmojiIconMarker({
    container,
    adjPin,
    focusId,
}: {
    container: ContainerResponse;
    adjPin: LatLngTuple | null;
    focusId?: number;
}) {
    if (!adjPin) return null;

    const transportType = getTransportTypeForPin(container, adjPin);
    const emoji = getTransportDetails(transportType).icon || "📍";
    const iconToUse = createEmojiDivIcon(emoji);

    return <Marker position={adjPin} icon={iconToUse} zIndexOffset={focusId === container.id ? 1000 : 0} />;
}