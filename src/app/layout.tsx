import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Tipografías del diseño de Stitch: Plus Jakarta Sans para títulos y
// Be Vietnam Pro para el texto. globals.css las expone como font-heading y
// font-sans. Las variables van en <html> porque `html` aplica font-sans.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Migas",
  applicationName: "Migas",
  description: "Lista de la compra, despensa y recetas del hogar",
  // iOS no lee el manifiesto para esto: "Añadir a pantalla de inicio" en Safari.
  appleWebApp: { capable: true, title: "Migas", statusBarStyle: "default" },
  // Evita que iOS convierta cantidades en enlaces de teléfono.
  formatDetection: { telephone: false },
};

// Color de la barra del sistema en el móvil: el fondo de la app en cada tema.
// viewportFit "cover": la app ocupa también la zona del notch; la barra inferior
// se aparta con env(safe-area-inset-bottom).
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#1c140b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${beVietnam.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
