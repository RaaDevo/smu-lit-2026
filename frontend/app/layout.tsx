import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firm Regulatory Resilience Twin",
  description: "Scenario approval, internal impact and lawyer-reviewed remediation",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
