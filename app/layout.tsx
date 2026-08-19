import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardIQ",
  description: "Smart credit card recommendations and spend tracking",
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
