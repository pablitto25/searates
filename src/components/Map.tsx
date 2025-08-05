"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import { Button } from "@heroui/button";
import { fetchAllContainers, fetchContainer } from "@/types/containerService";
import type { ContainerResponse } from "@/types/container";

delete (L.Icon.Default.prototype as any)._getIconUrl;

const customIcon = new L.Icon({
    iconUrl: "/assets/leaflet/location.png",
    iconRetinaUrl: "/assets/leaflet/location.png",
    iconSize: [20, 20],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "",
    shadowSize: undefined,
    shadowAnchor: undefined,
});

export default function Map() {

    //all containers
    const [allContainers, setAllContainers] = useState<ContainerResponse[] | null>(null);
    const [loadingList, setLoadingList] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const cached = localStorage.getItem("all_containers");
        if (cached) {
            setAllContainers(JSON.parse(cached));
        } else {
            loadAllContainers();
        }
    }, []);

    const loadAllContainers = async () => {
        setLoadingList(true);
        try {
            const data = await fetchAllContainers();
            localStorage.setItem("all_containers", JSON.stringify(data));
            setAllContainers(data);
        } catch (err) {
            console.error("Error fetching container list:", err);
        } finally {
            setLoadingList(false);
        }
    };

    const toggleContainer = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getPolylinesFromSelected = (): LatLngTuple[][] => {
        if (!allContainers) return [];

        return allContainers
            .filter(c => selectedIds.has(c.id))
            .flatMap(c =>
                c.route_data?.route_info?.map(route =>
                    route.pathObjects.map(p => [p.lat, p.lng] as LatLngTuple)
                ) || []
            );
    };

    const getSelectedPins = (): { id: number; pin: LatLngTuple }[] => {
        if (!allContainers) return [];

        return allContainers
            .filter(c => selectedIds.has(c.id) && c.route_data?.pin)
            .map(c => ({
                id: c.id,
                pin: [c.route_data!.pin.lat, c.route_data!.pin.lng] as LatLngTuple,
            }));
    };

    //marks icons start - end
    const startIcon = new L.Icon({
        iconUrl: "/assets/leaflet/start.png", // ← poné tu ícono de banderita de inicio
        iconSize: [20, 20],
        iconAnchor: [16, 32],
    });

    const endIcon = new L.Icon({
        iconUrl: "/assets/leaflet/end.png", // ← poné tu ícono de llegada
        iconSize: [16, 16],
        iconAnchor: [16, 32],
    });

    return (
        <div className="w-full h-[900px] flex flex-col gap-4">
            <div className="flex-grow">
                <MapContainer
                    center={[0, 0]}
                    zoom={3}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {getPolylinesFromSelected().map((line, i) => {
                        if (!line || line.length < 2) return null;

                        const start = line[0];
                        const end = line[line.length - 1];

                        return (
                            <React.Fragment key={`selected-${i}`}>
                                <Polyline positions={line} pathOptions={{ color: "blue", weight: 2 }} />

                                {/* Punto de inicio */}
                                <Marker position={start} icon={startIcon}>
                                    <Popup>Inicio de ruta 🏁</Popup>
                                </Marker>

                                {/* Punto de fin */}
                                <Marker position={end} icon={endIcon}>
                                    <Popup>Fin de ruta 🎯</Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}

                    {/* Pin de la Lista */}
                    {getSelectedPins().map(({ id, pin }) => (
                        <Marker key={`pin-${id}`} position={pin} icon={customIcon}>
                            <Popup>Posición actual 📦 #{id}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            <div>
                <div className="container flex-col m-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-black">Lista de Contenedores</h2>
                        <Button onClick={loadAllContainers} className="text-black">Actualizar</Button>
                    </div>

                    {loadingList && <p className="text-black">Cargando contenedores...</p>}

                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="min-w-full text-sm text-white border">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="p-2 border">Ver Ruta</th>
                                    <th className="p-2 border">N. Contenedor</th>
                                    <th className="p-2 border">N. Orden</th>
                                    <th className="p-2 border">Detalle</th>
                                    <th className="p-2 border">Status</th>
                                    <th className="p-2 border">Updated At</th>
                                    <th className="p-2 border">Type</th>
                                    <th className="p-2 border">Transport</th>
                                    <th className="p-2 border">Nombre de Empresa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allContainers?.map((container) => {
                                    const info = container.route_data?.route_info?.[0];
                                    return (
                                        <tr key={container.id} className="border-t border-gray-700">
                                            <td className="p-2 border text-center text-black">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(container.id)}
                                                    onChange={() => toggleContainer(container.id)}
                                                />
                                            </td>
                                            <td className="p-2 border text-black">{container.metadata.number}</td>
                                            <td className="p-2 border text-black">{container.trackedContainers?.[0]?.nroOrden ?? "-"}</td>
                                            <td className="p-2 border text-black">{container.trackedContainers?.[0]?.detalle ?? "-"}</td>
                                            <td className="p-2 border text-black">{container.metadata.status}</td>
                                            <td className="p-2 border text-black">{container.metadata.updated_at}</td>
                                            <td className="p-2 border text-black">{info?.type || "-"}</td>
                                            <td className="p-2 border text-black">{info?.transport_type || "-"}</td>
                                            <td className="p-2 border text-black">{container.trackedContainers?.[0]?.nombreEmpresa ?? "-"}</td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
