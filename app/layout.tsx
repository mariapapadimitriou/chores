import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Chores",
  description: "A little shared chore board for the apartment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
