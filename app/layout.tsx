import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Vida En Sueño",
  description:
    "Connecting people from Latin America and the Caribbean with people from the US and Europe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
