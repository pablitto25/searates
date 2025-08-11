"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L, { LatLngTuple, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchAllContainers } from "@/types/containerService";
import type { ContainerResponse } from "@/types/container";
import { AnimatedPolyline } from "./AnimatedPolyline";
import { Circle, CircleMarker } from 'react-leaflet';
import EmojiIconMarker from '@/components/EmojiIconMarker'
import { CountryFlag } from "@/utils/CountryFlags";
import { LineStyleOptions } from "@/types/types";

const darkBg = "#E6E6E6";

const defaultPin = new L.Icon({
    iconUrl: "/assets/leaflet/location.png",
    iconRetinaUrl: "/assets/leaflet/location.png",
    iconSize: [32, 32], // Tamaño aumentado para mejor visibilidad
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "",
});

const focusedPin = new L.Icon({
    iconUrl: "/assets/leaflet/mark2.gif",
    iconRetinaUrl: "/assets/leaflet/mark2.gif",
    iconSize: [40, 40], // Tamaño ligeramente mayor para destacar
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    shadowUrl: "",
});


const getRouteColor = (index: number) => {
    const colors = [
        '#FF6B6B', // Rojo claro
        '#48BB78', // Verde
        '#4299E1', // Azul
        '#F6AD55', // Naranja
        '#9F7AEA', // Morado
        '#ED64A6', // Rosa
        '#667EEA', // Azul índigo
        '#ECC94B', // Amarillo
    ];
    return colors[index % colors.length];
};

/* ---------- estilos ---------- */
function lineStyleByType(type?: string, index: number = 0, isLast: boolean = false): LineStyleOptions {
    const baseColor = getRouteColor(index);

    const baseStyle: LineStyleOptions = {
        color: baseColor,
        weight: isLast ? 5 : 4, // Más grueso para el último tramo
        opacity: 0.9
    };

    if (isLast) {
        return {
            ...baseStyle,
            dashArray: "2, 6",  // Patrón más visible
            lineCap: 'round',
            lineJoin: 'round'
        };
    }

    switch (type) {
        case "SEA":
            return {
                ...baseStyle,
                dashArray: index % 2 === 0 ? undefined : "5, 5"
            };
        case "LAND":
            return {
                ...baseStyle,
                dashArray: "8, 4"
            };
        case "AIR":
            return {
                ...baseStyle,
                dashArray: "2, 6"
            };
        default:
            return {
                ...baseStyle,
                weight: 3,
                dashArray: "4, 8",
                opacity: 0.7
            };
    }
}


/* ---------- fit inicial a todos los pins (una vez) ---------- */
function FitAllOnce({ pins }: { pins: LatLngTuple[] }) {
    const map = useMap();
    const doneRef = useRef(false);
    useEffect(() => {
        if (doneRef.current || !pins.length) return;
        const bounds = new LatLngBounds(pins);
        map.fitBounds(bounds, { padding: [60, 60] });
        doneRef.current = true;
    }, [pins, map]);
    return null;
}

// Mantiene [-180,180]
function normalizeLon(lon: number): number {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
}

// Devuelve la copia de `lon` (sumando k*360) más cercana a `ref`
function toNearestCopy(lon: number, ref: number): number {
    const k = Math.round((ref - lon) / 360);
    return lon + 360 * k;
}

// Tu unwrap existente, sin cambios (o el que ya uses)
function unwrapLongitudes(line: [number, number][]): [number, number][] {
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

// líneas por contenedor
const getContainerLines = (c: ContainerResponse) =>
    c.route_data?.route_info?.map((r) => {
        const raw = r.pathObjects.map((p) => [p.lat, p.lng] as LatLngTuple);
        return unwrapLongitudes(raw as [number, number][]) as LatLngTuple[];
    }) ?? [];

/* ---------- autoplay robusto por contador ---------- */
type FocusPhase = "start" | "pin" | "end";

function useAutoplayFocusPhases(
    conts: ContainerResponse[],
    intervalMs = 8000
) {
    // Construimos la lista en base a LÍNEAS UNWRAP
    const list = useMemo(() => {
        return conts.map((c) => {
            const lines = getContainerLines(c);               // <-- unwrap aplicado
            const all = lines.flat();
            const start = all.length ? { lat: all[0][0], lng: all[0][1] } : null;
            const end = all.length ? { lat: all[all.length - 1][0], lng: all[all.length - 1][1] } : null;

            // Pin “tal cual”; si alguna vez lo ves despajado respecto de la línea,
            // se puede ajustar copiando el offset del tramo más cercano.
            const pin = c.route_data?.pin
                ? { lat: c.route_data.pin.lat, lng: c.route_data.pin.lng }
                : null;

            return { id: c.id, start, pin, end, ref: c, lines };
        });
    }, [conts]);

    const [step, setStep] = useState(0);

    useEffect(() => { setStep(0); }, [JSON.stringify(list.map(i => i.id))]);
    useEffect(() => {
        if (!list.length) return;
        const t = setInterval(() => setStep(s => s + 1), intervalMs);
        return () => clearInterval(t);
    }, [list.length, intervalMs]);

    if (!list.length) {
        return { focusId: null as number | null, phase: "start" as FocusPhase, focusContainer: null as ContainerResponse | null, trio: null as any };
    }

    const totalSteps = list.length * 3;
    const norm = ((step % totalSteps) + totalSteps) % totalSteps;
    const idx = Math.floor(norm / 3);
    const phaseIndex = norm % 3;
    const phase: FocusPhase = phaseIndex === 0 ? "start" : phaseIndex === 1 ? "pin" : "end";

    const current = list[idx];
    const focusId = current.id;
    const focusContainer = current.ref;

    return { focusId, phase, focusContainer, trio: current };
}

/* ---------- encuadre del foco (start/pin/end) ---------- */
function FitFocusBounds({
    trio,
}: {
    trio: { start: { lat: number; lng: number } | null; pin: { lat: number; lng: number } | null; end: { lat: number; lng: number } | null } | null;
}) {
    const map = useMap();
    useEffect(() => {
        if (!trio) return;
        const pts: LatLngTuple[] = [];
        if (trio.start) pts.push([trio.start.lat, trio.start.lng]);
        if (trio.pin) pts.push([trio.pin.lat, trio.pin.lng]);
        if (trio.end) pts.push([trio.end.lat, trio.end.lng]);
        if (!pts.length) return;

        if (pts.length === 1) {
            map.flyTo(pts[0], Math.max(map.getZoom(), 4), { duration: 1.2 });
        } else {
            const b = new LatLngBounds(pts);
            map.fitBounds(b, { padding: [80, 80] });
        }
    }, [trio, map]);
    return null;
}

export default function MapTV() {
    const [data, setData] = useState<ContainerResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const containerListRef = useRef<HTMLDivElement>(null);



    // Cache + refresh
    useEffect(() => {
        const cached = localStorage.getItem("all_containers");
        if (cached) {
            try {
                const parsed: ContainerResponse[] = JSON.parse(cached);
                setData(parsed.sort((a, b) => a.id - b.id));
                setLoading(false);
            } catch { }
        }
        refresh();
        const t = setInterval(refresh, 60 * 60 * 1000);
        return () => clearInterval(t);
    }, []);

    // Auto-scroll para el contenedor en foco
    useEffect(() => {
        if (!focusId || !containerListRef.current) return;

        const timer = setTimeout(() => {
            const containerElement = document.getElementById(`container-${focusId}`);
            if (containerElement) {
                containerElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    async function refresh() {
        try {
            const all = await fetchAllContainers();
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

    // pins para fit inicial
    const pins = useMemo<LatLngTuple[]>(
        () =>
            data
                .map((c) => c.route_data?.pin)
                .filter(Boolean)
                .map((p) => [p!.lat, p!.lng] as LatLngTuple),
        [data]
    );

    // autoplay: id + fase + trio
    const { focusId, phase, focusContainer, trio } = useAutoplayFocusPhases(data, 8000);
    useProgressBar(24000, focusId, phase); // 24 segundos en total

    useEffect(() => {
        if (!focusId || !containerListRef.current) return;

        const timer = setTimeout(() => {
            const containerElement = document.getElementById(`container-${focusId}`);
            if (containerElement) {
                containerElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [focusId]);


    const getTransportDetails = (transportType: string) => {
        const details = {
            icon: '🚚',
            label: transportType,
            description: ''
        };

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
    };

    const [nextRefreshTime, setNextRefreshTime] = useState<string>("");

    useEffect(() => {
        const updateNextRefreshTime = () => {
            const now = new Date();
            const nextRefresh = new Date(now.getTime() + 60 * 60 * 1000);
            setNextRefreshTime(nextRefresh.toLocaleTimeString());
        };

        updateNextRefreshTime();
        const timer = setInterval(updateNextRefreshTime, 60000); // Actualiza el contador cada minuto

        return () => clearInterval(timer);
    }, [lastRefresh]);


    // Añade este hook en tu archivo
    function useProgressBar(totalDuration: number, focusId: number | null, phase: FocusPhase) {
        useEffect(() => {
            if (!focusId) {
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) progressBar.style.width = '0%';
                return;
            }

            let startTime: number;
            let animationFrameId: number;
            const segmentDuration = totalDuration / 3;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const currentPhaseProgress = (elapsed / segmentDuration) * 33.33;

                let totalProgress = 0;
                if (phase === "start") {
                    totalProgress = currentPhaseProgress;
                } else if (phase === "pin") {
                    totalProgress = 33.33 + currentPhaseProgress;
                } else {
                    totalProgress = 66.66 + currentPhaseProgress;
                }

                const progressBar = document.getElementById('progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${totalProgress}%`;
                    // Elimina cualquier modificación de clase que cambie el color
                }

                if (totalProgress < 100) {
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animationFrameId = requestAnimationFrame(animate);

            return () => {
                cancelAnimationFrame(animationFrameId);
            };
        }, [focusId, phase, totalDuration]);
    }

    const extractCountry = (empresa: string | undefined) => {
        if (!empresa) return null;

        // Expresión regular para encontrar el país entre paréntesis
        const match = empresa.match(/\(([^)]+)\)/);
        return match ? match[1].trim() : null;
    };

    // Dentro de tu componente MapTV, añade este useEffect
    useEffect(() => {
        // Configurar el intervalo de 1 hora (3600000 milisegundos)
        const refreshInterval = setInterval(() => {
            console.log('🔄 Recargando página para actualización horaria...');
            window.location.reload();
        }, 60 * 60 * 1000); // 60 minutos * 60 segundos * 1000 milisegundos

        // Limpiar el intervalo al desmontar el componente
        return () => clearInterval(refreshInterval);
    }, []);


    return (
        <div className="fixed inset-0 flex flex-col" style={{ background: darkBg }}>
            {/* Header */}
            <div className="w-full flex items-center justify-between px-6 py-3 text-black/90 bg-[#E6E6E6] backdrop-blur-sm z-50 shadow-xl/20">
                <div className="flex items-center gap-3">
                    <img src="/assets/logo-tv.png" alt="logo" className="h-8" />
                    <div className="text-xl font-semibold">Container Tracking</div>
                </div>
                <div className="text-sm opacity-80">
                    {lastRefresh ? (
                        <>
                            <div>Actualizado: {lastRefresh.toLocaleTimeString()}</div>
                        </>
                    ) : (
                        "Cargando..."
                    )}
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex flex-1 overflow-hidden">
                {/* Mapa */}
                <div className="flex-1 relative">
                    <MapContainer
                        center={[20, 0]}
                        zoom={2}
                        minZoom={2}
                        zoomControl={false}
                        scrollWheelZoom={false}
                        dragging={false}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <FitAllOnce pins={pins} />
                        <FitFocusBounds trio={trio ? { start: trio.start, pin: trio.pin, end: trio.end } : null} />

                        {data.map((c) => {
                            if (focusId !== null && focusId !== c.id) return null;

                            const lines = getContainerLines(c);           // << ya unwrapped
                            const allPoints = lines.flat();
                            if (allPoints.length < 2) return null;

                            // Referencia de longitudes de la ruta (promedio)
                            const refLon = allPoints.reduce((acc, p) => acc + p[1], 0) / allPoints.length;

                            // Ajustar el pin al mundo más cercano a la ruta
                            let adjPin: LatLngTuple | null = null;
                            if (c.route_data?.pin) {
                                const p = c.route_data.pin;
                                const adjLon = toNearestCopy(p.lng, refLon);
                                adjPin = [p.lat, adjLon] as LatLngTuple;
                            }

                            // Inicio/fin del recorrido (ya unwrapped)
                            const firstPoint = allPoints[0];
                            const lastPoint = allPoints[allPoints.length - 1];

                            return (
                                <div key={c.id}>
                                    {/* Inicio */}
                                    <CircleMarker
                                        center={firstPoint}
                                        radius={6}
                                        pathOptions={{ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.8, weight: 2 }}
                                        eventHandlers={{ add: (e) => e.target.bringToFront() }}
                                    />

                                    {/* Líneas */}
                                    {lines.map((line, idx) => {
                                        if (line.length < 2) return null;
                                        const type = c.route_data?.route_info?.[idx]?.type;
                                        const isLast = idx === lines.length - 1;
                                        const base = lineStyleByType(type, idx, isLast);

                                        // Si es la última línea o está en foco, usa AnimatedPolyline
                                        const shouldAnimate = isLast || focusId === c.id;

                                        return shouldAnimate ? (
                                            <AnimatedPolyline
                                                key={`${c.id}-${idx}`}
                                                positions={line}
                                                pathOptions={base}
                                                isLastSegment={isLast}
                                                duration={800}
                                                eventHandlers={{ add: (e) => e.target.bringToBack() }}
                                            />
                                        ) : (
                                            <Polyline
                                                key={`${c.id}-${idx}`}
                                                positions={line}
                                                pathOptions={base}
                                                eventHandlers={{ add: (e) => e.target.bringToBack() }}
                                            />
                                        );
                                    })}

                                    {/* Fin */}
                                    <CircleMarker
                                        center={lastPoint}
                                        radius={6}
                                        pathOptions={{ color: '#00aa00', fillColor: '#00aa00', fillOpacity: 0.8, weight: 2 }}
                                        eventHandlers={{ add: (e) => e.target.bringToFront() }}
                                    />

                                    {/* Pin actual (ajustado al mismo mundo) */}
                                    {adjPin && (
                                        <EmojiIconMarker
                                            container={c}
                                            adjPin={adjPin}
                                            focusId={focusId ?? undefined}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </MapContainer>

                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
                            <div className="text-black text-2xl">Cargando datos de contenedores...</div>
                        </div>
                    )}
                </div>

                {/* Lista de contenedores */}
                <div className="w-80 border-l border-gray-200 bg-white/90 backdrop-blur-sm flex flex-col">
                    <div className="p-4 border-b border-gray-200 sticky top-0 bg-white/90 z-10">
                        <h3 className="text-lg text-black font-bold">Seguimiento de contenedor ({data.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto" ref={containerListRef}>
                        {data.map((c) => (
                            <div
                                key={c.id}
                                id={`container-${c.id}`}
                                className={`
                                        text-black p-5 my-2 mx-3 rounded-lg 
                                        bg-white border border-gray-200
                                        transition-all duration-300
                                        hover:border-gray-300 hover:shadow-md
                                        ${focusId === c.id
                                        ? 'ring-2 ring-black border-blue-200 bg-blue-50'
                                        : ''
                                    }
`}
                            >
                                <div className="font-semibold">{c.metadata.number}
                                </div>
                                <div className="text-xs text-black">
                                    Orden: {c.trackedContainers?.[0]?.nroOrden || '-'}
                                </div>
                                <div className="flex items-center text-sm text-black mt-1">
                                    <div className="text-xs">
                                        Empresa: {c.trackedContainers?.[0]?.nombreEmpresa}
                                    </div>
                                    <div className="pl-2">
                                        {c.trackedContainers?.[0]?.nombreEmpresa && (
                                            <div className="">
                                                <CountryFlag
                                                    empresa={c.trackedContainers?.[0].nombreEmpresa || "-"}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-black">
                                    Detalle: {c.trackedContainers?.[0]?.detalle || "-"}
                                </div>
                                {/* Sección de rutas mejorada */}
                                <div className="mt-2 text-xs space-y-2">
                                    {c.route_data?.route_info?.map((route, index) => {
                                        const transport = getTransportDetails(route.transport_type);
                                        return (
                                            <div key={index} className="grid grid-cols-2 gap-1">
                                                <div
                                                    className="flex items-center col-span-2"
                                                    style={{
                                                        borderLeft: `4px solid ${getRouteColor(index)}`,
                                                        paddingLeft: '6px'
                                                    }}
                                                >
                                                    <span className="mr-2 text-base">{transport.icon}</span>
                                                    <div>
                                                        <span className="font-medium">{transport.label}</span>
                                                        <span className="text-gray-500 ml-2">({transport.description})</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-gray-600">
                                                    <span className="font-medium">Desde:</span> {route.from.name}, {route.from.state}, {route.from.country}
                                                </div>
                                                <div className="col-span-2 text-gray-600">
                                                    <span className="font-medium">Hacia:</span> {route.to.name}, {route.to.state}, {route.to.country}
                                                </div>
                                                {index < c.route_data.route_info.length - 1 && (
                                                    <div className="col-span-2 border-t border-gray-200 my-1"></div>
                                                )}

                                            </div>


                                        );
                                    })}
                                </div>
                                <div className="text-xs pt-2 text-black">
                                    Fecha de Llegada: {c.route.pod?.date
                                        ? new Date(c.route.pod.date).toLocaleDateString("es-AR")
                                        : ""}
                                </div>

                                {/* {focusId === c.id && (
                                    <div className="text-xs text-blue-600 mt-1 font-medium">
                                        {phase === "start" ? "Mostrando: Inicio" : phase === "pin" ? "Mostrando: Posición actual" : "Mostrando: Destino"}
                                    </div>
                                )} */}

                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 z-[9999]">
                <div
                    id="progress-bar"
                    className="h-full bg-red-600 transition-all duration-100 ease-linear"
                    style={{ width: '0%' }}
                ></div>
            </div>

            {/* Panel de detalles del contenedor en foco */}
            {focusContainer && (
                <div
                    className="absolute bottom-4 left-4 right-[calc(20rem+16px)] bg-white/95 text-black rounded-lg shadow-xl p-4 backdrop-blur-md z-[1000] shadow-xl/30"
                    style={{
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                >
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-black uppercase font-medium">Contenedor</div>
                            <div className="text-lg font-bold">{focusContainer.metadata.number}</div>
                        </div>
                        <div>
                            <div className="text-xs text-black uppercase font-medium">Orden</div>
                            <div className="text-lg">{focusContainer.trackedContainers?.[0]?.nroOrden || "-"}</div>
                        </div>
                        <div>
                            <div className="text-xs text-black uppercase font-medium">Detalle</div>
                            <div className="text-lg">{focusContainer.trackedContainers?.[0]?.detalle || "-"}</div>
                        </div>
                        <div>
                            <div className="text-xs text-black uppercase font-medium">Fecha de llegada: </div>
                            <div className="text-lg font-semibold">
                                {focusContainer.route.pod?.date
                                    ? new Date(focusContainer.route.pod.date).toLocaleDateString("es-AR")
                                    : ""}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}