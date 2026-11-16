import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AIO System - Enterprise Operations",
  description: "Enterprise Operations & Supply Chain Management System",
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gray-50 text-gray-900 light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50 text-gray-900`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
