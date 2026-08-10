// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { getConfig } from "@/lib/config";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${getConfig().name} Reference`,
  description: "Interactive API documentation generated from OpenAPI.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          className="fixed top-2 left-2 z-50 -translate-y-16 rounded-md bg-background px-3 py-2 text-sm shadow focus:translate-y-0"
          href="#main-content"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
