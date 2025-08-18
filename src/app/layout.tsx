import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito, Merriweather } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Merriweather({
  variable: "--font-display",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Madressa Bell System",
  description: "Simple bell schedule and chimes for classrooms",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${body.variable} ${display.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
