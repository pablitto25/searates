import { useEffect, useRef } from "react";
import { Polyline, PolylineProps } from "react-leaflet";
import L from "leaflet";

export const AnimatedPolyline = ({
    positions,
    duration = 1500,
    ...props
}: PolylineProps & { duration?: number }) => {
    const polylineRef = useRef<L.Polyline>(null);

    useEffect(() => {
        const polyline = polylineRef.current;
        if (!polyline) return;

        // Inicialmente ocultamos la línea
        polyline.setStyle({ opacity: 0, weight: 0 });

        // Animación
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

            // Aplicar el estilo
            polyline.setStyle({
                opacity: opacity,
                weight: props.pathOptions?.weight || 3
            });

            // Redibujar solo la parte visible
            path.style.strokeDashoffset = `${totalLength - drawToLength}`;
            path.style.strokeDasharray = `${totalLength} ${totalLength}`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            // Restablecer estilo al desmontar
            if (polyline) {
                polyline.setStyle({
                    opacity: 1,
                    weight: props.pathOptions?.weight || 3
                });
            }
        };
    }, [positions, duration, props.pathOptions?.weight]);

    return <Polyline ref={polylineRef} positions={positions} {...props} />;
};