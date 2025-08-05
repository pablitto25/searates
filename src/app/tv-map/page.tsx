"use client"
import dynamic from "next/dynamic";

// Importá el componente del mapa en modo TV SIN SSR
const MapTV = dynamic(() => import("@/components/MapTV"), { ssr: false });

export default function TvMapPage() {
    return <MapTV />;
}