import type { NextConfig } from "next";

// Raíz del proyecto fija: si hay otro lockfile en una carpeta superior
// (p. ej. un package-lock.json suelto en la carpeta de usuario), Next no la toma como raíz.
const root = process.cwd();

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
  // Tipa los href de <Link>, router.push y redirect contra las rutas reales.
  typedRoutes: true,
};

export default nextConfig;
