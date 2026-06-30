import type { Metadata } from "next";
import { DM_Serif_Display, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const displaySerif = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Food Formulator",
  description:
    "OpenAI-powered recipe reformulation for dietary, nutrition, allergen, cost, protein, and calorie goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${displaySerif.variable} h-full`}
    >
      <body className="min-h-screen bg-slate-50 font-sans text-sage-900 antialiased">
        {children}
      </body>
    </html>
  );
}
