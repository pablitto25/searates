"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import { Button } from "@heroui/button";
import { fetchContainer } from "@/types/containerService";
import type { ContainerResponse } from "@/types/container";

delete (L.Icon.Default.prototype as any)._getIconUrl;

const customIcon = new L.Icon({
    iconUrl: "/assets/leaflet/location.png",
    iconRetinaUrl: "/assets/leaflet/location.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "",
    shadowSize: undefined,
    shadowAnchor: undefined,
});

export default function Map() {
    const [containerNumber, setContainerNumber] = useState("");
    const [containerData, setContainerData] = useState<ContainerResponse | null>(null);

    const handleSearch = async () => {
        const data = await fetchContainer(containerNumber.trim());
        if (data) {
            setContainerData(data);
        }
    };

    const getPolylineFromRoute = (): LatLngTuple[][] => {
        if (!containerData) return [];
        return containerData.route_data.route_info.map(route =>
            route.pathObjects.map(point => [point.lat, point.lng] as LatLngTuple)
        );
    };

    const getPin = (): LatLngTuple | null => {
        if (!containerData) return null;
        return [containerData.route_data.pin.lat, containerData.route_data.pin.lng];
    };

    const center = getPin() ?? [0, 0];

    return (
        <div className="w-full h-[700px] flex flex-col gap-4">
            <div className="flex gap-2">
                <input
                    className="text-black border-2 border-solid px-2 py-1"
                    type="text"
                    name="search"
                    placeholder="Container Number"
                    value={containerNumber}
                    onChange={(e) => setContainerNumber(e.target.value)}
                />
                <Button className="text-black border-2 border-solid" onClick={handleSearch}>Buscar</Button>
            </div>

            <div className="flex-grow">
                <MapContainer
                    center={center}
                    zoom={3}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Dibujar las rutas si existen */}
                    {getPolylineFromRoute().map((line, i) => (
                        <Polyline key={i} positions={line} pathOptions={{ color: "red", weight: 2 }} />
                    ))}

                    {/* Pin actual */}
                    {getPin() && (
                        <Marker position={getPin()!} icon={customIcon}>
                            <Popup>Posición actual 📦</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
