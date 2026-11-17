import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gusteau's Kitchen | Kitchen Display System & POS",
  description: "Real-time kitchen display and waitstaff point-of-sale system inspired by Parisian bistro warmth.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#FAF6EE] text-[#2B2623]"
      >
        {children}
      </body>
    </html>
  );
}
