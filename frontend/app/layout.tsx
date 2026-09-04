import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalTech Sandbox",
  description: "SMU LIT Hackathon full-stack starter",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

