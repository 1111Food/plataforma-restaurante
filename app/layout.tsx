import type { Metadata } from "next";
import { Inter, Playfair_Display, Anton, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-playfair" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "11:11 Menu",
  description: "Dynamic Menu Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${anton.variable} ${caveat.variable} font-sans antialiased text-white bg-black`}>
        {children}
      </body>
    </html>
  );
}
