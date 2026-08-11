import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "ProphyLink | Dental Staffing Marketplace",
  description:
    "Connecting dental offices with dental hygienists and dental assistants for flexible coverage."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
