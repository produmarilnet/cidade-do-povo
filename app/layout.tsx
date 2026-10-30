import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cidade do Povo",
  description: "Gestão de serviços do Cidade do Povo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#214DB0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
