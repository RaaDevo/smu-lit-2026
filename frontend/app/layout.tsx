import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Donna — Firm Regulatory Resilience Twin",
  description:
    "Donna supports scenario approval, internal impact assessment, and lawyer-reviewed remediation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
