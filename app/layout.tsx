import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/marketing/site-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"]
});

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
      <body className={`${inter.variable} ${poppins.variable} min-h-screen font-sans antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
