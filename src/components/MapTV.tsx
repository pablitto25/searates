"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L, { LatLngTuple, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchAllContainers } from "@/types/containerService";
import type { ContainerResponse } from "@/types/container";

const darkBg = "#0B1220";

const customPin = new L.Icon({
    iconUrl: "/assets/leaflet/location.png",
    iconRetinaUrl: "/assets/leaflet/location.png",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    shadowUrl: "",
});

// Estilo por tipo de tramo
function lineStyleByType(type?: string) {
    switch (type) {
        case "SEA": return { color: "#69A7FF", weight: 3, opacity: 0.9 };
        case "LAND": return { color: "#FFD166", weight: 3, dashArray: "6 6", opacity: 0.9 };
        case "AIR": return { color: "#FB7185", weight: 3, dashArray: "2 6", opacity: 0.9 };
        default: return { color: "#9CA3AF", weight: 2, dashArray: "4 8", opacity: 0.7 };
    }
}

// Ajusta vista a todos los pins
function FitAll({ pins }: { pins: LatLngTuple[] }) {
    const map = useMap();
    useEffect(() => {
        if (!pins.length) return;
        const bounds = new LatLngBounds(pins);
        map.fitBounds(bounds, { padding: [60, 60] });
    }, [pins, map]);
    return null;
}

// Autoplay robusto: reinicia si cambia la lista de ids
function useAutoplayFocus(ids: number[], intervalMs = 8000) {
    const [focusId, setFocusId] = useState<number | null>(null);

    useEffect(() => {
        if (!ids || ids.length === 0) {
            setFocusId(null);
            return;
        }
        let i = 0;
        setFocusId(ids[0]);

        const t = setInterval(() => {
            i = (i + 1) % ids.length;
            setFocusId(ids[i]);
        }, intervalMs);

        return () => clearInterval(t);
    }, [JSON.stringify(ids), intervalMs]); // <- reinicia si cambia la lista

    return focusId;
}

export default function MapTV() {
    const [data, setData] = useState<ContainerResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    // Cache local + refresh periódico
    useEffect(() => {
        const cached = localStorage.getItem("all_containers");
        if (cached) {
            try {
                const parsed: ContainerResponse[] = JSON.parse(cached);
                setData(parsed);
                setLoading(false);
            } catch { }
        }
        refresh();
        const t = setInterval(refresh, 3 * 60 * 1000); // cada 3 min
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function refresh() {
        try {
            const all = await fetchAllContainers();
            // orden estable por id (evita saltos en autoplay)
            const sorted = [...all].sort((a, b) => a.id - b.id);
            setData(sorted);
            localStorage.setItem("all_containers", JSON.stringify(sorted));
            setLastRefresh(new Date());
            setLoading(false);
        } catch (e) {
            console.error("TV refresh error", e);
            setLoading(false);
        }
    }

    // Pins actuales (para fitBounds)
    const pins = useMemo<LatLngTuple[]>(
        () =>
            data
                .map(c => c.route_data?.pin)
                .filter(Boolean)
                .map(p => [p!.lat, p!.lng] as LatLngTuple),
        [data]
    );

    // Ids para autoplay
    const ids = useMemo(() => data.map(c => c.id), [data]);
    const focusId = useAutoplayFocus(ids, 8000);

    // Polylines por contenedor
    const getContainerLines = (c: ContainerResponse) =>
        c.route_data?.route_info?.map(r =>
            r.pathObjects.map(p => [p.lat, p.lng] as LatLngTuple)
        ) ?? [];

    // Estilo resaltado si está en foco
    const withFocus = (cid: number, base: any) =>
        focusId === null || focusId === cid
            ? { ...base, weight: (base.weight ?? 3) + 1, opacity: 1 }
            : { ...base, opacity: 0.25 };

    // Contenedor en foco con fallback al primero
    const focusContainer = useMemo(() => {
        if (!data || data.length === 0) return null;
        const found = data.find(c => c.id === focusId);
        return found ?? data[0]; // fallback al primero
    }, [data, focusId]);

    function FlyToPin({ pin }: { pin: LatLngTuple | null }) {
        const map = useMap();
        useEffect(() => {
            if (!pin) return;
            map.flyTo(pin, Math.max(map.getZoom(), 4), { duration: 1.2 }); // zoom mínimo 4
        }, [pin, map]);
        return null;
    }

    return (
        <div className="w-screen h-screen" style={{ background: darkBg }}>
            {/* Header compacto para TV */}
            <div
                className="w-full flex items-center justify-between px-6 py-3 text-white/90"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(4px)" }}
            >
                <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="logo" style={{ height: 28 }} />
                    <div className="text-lg font-semibold">Tracking – Vista TV</div>
                </div>
                <div className="text-sm opacity-80">
                    {lastRefresh ? `Actualizado: ${lastRefresh.toLocaleTimeString()}` : "Cargando..."}
                </div>
            </div>

            <div className="w-full h-[calc(100vh-56px)] relative">
                <MapContainer
                    center={[0, 0]}
                    zoom={3}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    dragging={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FitAll pins={pins} />

                    <FlyToPin
                        pin={
                            focusContainer?.route_data?.pin
                                ? [focusContainer.route_data.pin.lat, focusContainer.route_data.pin.lng]
                                : null
                        }
                    />

                    {/* Rutas + pins */}
                    {data.map((c) => {
                        const lines = getContainerLines(c);
                        const pin = c.route_data?.pin
                            ? ([c.route_data.pin.lat, c.route_data.pin.lng] as LatLngTuple)
                            : null;

                        return (
                            <div key={c.id}>
                                {lines.map((line, idx) => {
                                    if (line.length < 2) return null;
                                    const type = c.route_data?.route_info?.[idx]?.type;
                                    const base = lineStyleByType(type);
                                    const style = withFocus(c.id, base);
                                    return (
                                        <Polyline key={`${c.id}-${idx}`} positions={line} pathOptions={style} />
                                    );
                                })}
                                {pin && <Marker position={pin} icon={customPin} />}
                            </div>
                        );
                    })}
                </MapContainer>

                {/* Leyenda / KPIs */}
                <div className="absolute top-4 right-4 text-white/90">
                    <div
                        className="rounded-xl p-3 shadow-lg space-y-1"
                        style={{ background: "rgba(11,18,32,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                        <div className="text-sm mb-1 opacity-80">Leyenda</div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-[3px]" style={{ background: "#69A7FF" }} /> SEA
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-[3px]" style={{ borderBottom: "3px dashed #FFD166" }} /> LAND
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-[3px]" style={{ borderBottom: "3px dotted #FB7185" }} /> AIR
                        </div>
                    </div>
                </div>

                {/* Loader simple */}
                {loading && (
                    <div className="absolute inset-0 grid place-items-center text-white/80">
                        Cargando datos…
                    </div>
                )}
            </div>

            {/* Panel de foco (información del contenedor activo) */}
            {focusContainer && (
                <div
                    className="absolute top-[70px] right-4 w-96 bg-white/90 text-black rounded-xl shadow-lg p-4 space-y-2 backdrop-blur-md transition-opacity duration-500"
                    style={{ zIndex: 1000 }} // <-- más alto que los panes de Leaflet
                >
                    <div className="text-lg font-bold">{focusContainer.metadata.number}</div>
                    <div className="text-sm">
                        Orden: <strong>{focusContainer.trackedContainers?.[0]?.nroOrden ?? "-"}</strong>
                    </div>
                    <div className="text-sm">Detalle: {focusContainer.trackedContainers?.[0]?.detalle ?? "-"}</div>
                    <div className="text-sm">Empresa: {focusContainer.trackedContainers?.[0]?.nombreEmpresa ?? "-"}</div>
                    <div className="text-sm">Estado: {focusContainer.metadata.status}</div>
                    <div className="text-sm">Última actualización: {focusContainer.metadata.updated_at}</div>
                </div>
            )}
        </div>
    );
}
