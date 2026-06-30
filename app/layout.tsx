import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Safety Services · Gestión de H&S",
  description: "Tablero de siniestralidad y documentación — Ing. Eduardo Klopp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Safety Services",
  },
  icons: {
    icon: [
      { url: "/logo.pc_favicon.png", type: "image/png" },
      { url: "/logo-android192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/logo-apple.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6FB63F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${sora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
