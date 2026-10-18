import type { Metadata } from "next";
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
  description: "Lista de la compra, despensa y recetas del hogar",
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
