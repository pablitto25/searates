"use client"
import Map from "@/components/Map";
import Navbar from "@/components/navbar";
import dynamic from "next/dynamic";

export default function MapSection() {

    const Map = dynamic(() => import("@/components/Map"), {
        ssr: false, // 👈 esto evita que intente renderizar en el servidor
    });

    return (
        <div className="">
            <Map />
        </div>
    )
}


