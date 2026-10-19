import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA: permite "Añadir a pantalla de inicio" e instalar Migas
 * en el móvil, abriéndose a pantalla completa (sin barra del navegador).
 * Next lo sirve en /manifest.webmanifest y añade el <link> solo.
 *
 * Sin service worker por ahora: no hace falta para instalarla. Llegará con el
 * modo sin conexión (Sync).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Migas · Compra y recetas",
    short_name: "Migas",
    description: "Lista de la compra, despensa y recetas del hogar",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Colores de globals.css: el fondo crema evita el destello blanco al abrir.
    background_color: "#fff8f3",
    theme_color: "#fff8f3",
    // Iconos generados desde assets/icono-migas.svg (versión simplificada del logo:
    // a 48 dp las migas y las hojas sueltas se convertían en ruido). Si cambia el
    // icono, hay que desinstalar y volver a instalar la app en el móvil.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Dibujo dentro del círculo seguro (80 % del lado): Android lo recorta en círculo, gota, etc.
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
