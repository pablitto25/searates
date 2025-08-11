import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignora ESLint al hacer `next build`
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configurar intervalo para producción (en desarrollo se ejecuta al importar)
      if (process.env.NODE_ENV === 'production') {
        setInterval(() => {
          require('./src/lib/updateContainers').updateContainersData();
        }, 60 * 60 * 1000); // Cada hora
      }
    }
    return config;
  },
};

export default nextConfig;
