import { useEffect, useRef } from "react";
import { Polyline, PolylineProps } from "react-leaflet";
import L from "leaflet";
import { LineStyleOptions } from '@/types/types';

interface AnimatedPolylineProps extends PolylineProps {
    duration?: number;
    pathOptions: LineStyleOptions; // Usa el tipo importado
    isLastSegment?: boolean;
}

export const AnimatedPolyline = ({
    positions,
    duration = 1500,
    isLastSegment = false,
    ...props
}: AnimatedPolylineProps) => {
    const polylineRef = useRef<L.Polyline>(null);

    useEffect(() => {
        const polyline = polylineRef.current;
        if (!polyline) return;

        // Guardamos TODOS los estilos originales
        const originalStyles = {
            color: props.pathOptions.color, // Obligatorio (según tu interfaz)
            weight: props.pathOptions.weight, // Obligatorio
            opacity: props.pathOptions.opacity, // Obligatorio
            dashArray: props.pathOptions.dashArray || "none", // Opcional, con valor por defecto
            lineCap: props.pathOptions.lineCap || "round", // Opcional, con valor por defecto
            lineJoin: props.pathOptions.lineJoin || "round", // Opcional, con valor por defecto
        };

        // Inicialmente ocultamos la línea pero mantenemos el dashArray
        polyline.setStyle({
            opacity: 0,
            weight: 0,
            dashArray: isLastSegment ? originalStyles.dashArray : undefined
        });

        let start: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);

            const path = (polyline as any)._path;
            if (!path) return;

            const totalLength = path.getTotalLength();
            const drawToLength = totalLength * progress;
            const opacity = progress < 0.1 ? progress * 10 : 1;

            // Aplicar estilo durante animación
            const currentStyle = {
                opacity: opacity,
                weight: originalStyles.weight,
                color: originalStyles.color
            };

            // Para el último segmento, mantener el dashArray durante toda la animación


            polyline.setStyle(currentStyle);

            // Configurar animación de trazado
            path.style.strokeDashoffset = `${totalLength - drawToLength}`;
            path.style.strokeDasharray = isLastSegment
                ? originalStyles.dashArray
                : `${totalLength} ${totalLength}`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (polyline) {
                polyline.setStyle(originalStyles);
            }
        };
    }, [positions, duration, props.pathOptions, isLastSegment]);

    return <Polyline ref={polylineRef} positions={positions} {...props} />;
};