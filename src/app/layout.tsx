import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import Providers from "@/components/Providers";
import "leaflet/dist/leaflet.css";
import Chatbot from "@/components/Chatbot";

export const metadata: Metadata = {
  title: "TripDone",
  description: "Plan the smartest way to travel across every mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          geistSans.variable,
          geistMono.variable
        )}
      >
        <Providers>
          {children}
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}
