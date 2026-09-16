import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Vida En Sueño",
  description:
    "Conexiones reales entre Latinoamérica, el Caribe, Estados Unidos y Europa. Real connections between Latin America, the Caribbean, the US and Europe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
