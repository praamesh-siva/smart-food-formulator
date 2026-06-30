import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Food Formulator",
  description:
    "Paste a recipe and reformulate it with AI based on allergen-free, vegan, sugar reduction, cost, protein, or calorie goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body
        className={`${geistSans.className} min-h-screen bg-slate-50 font-sans text-sage-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
