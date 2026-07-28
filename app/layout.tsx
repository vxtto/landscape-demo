import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic AI Open Source Landscape 2026",
  description:
    "Explore Agent Infra, Model Infra, and ecosystem signals across the open-source Agentic AI landscape.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
