import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Atlas — Agent Infra Landscape 2026",
  description:
    "An interactive, data-driven exploration of the Agent Infra Landscape 2026.",
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
