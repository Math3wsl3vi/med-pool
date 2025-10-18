import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 👇 Add Poppins
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // optional, choose what you need
});

export const metadata: Metadata = {
  title: "MedPool - Purpose-Driven Savings Platform",
  description: "Create purpose-driven savings funds with trusted family and friends. Your money grows safely in Money Market Funds while requiring unanimous approval for withdrawals.",
  keywords: ["savings", "funds", "family", "collaborative", "investment", "money market", "Kenya"],
  authors: [{ name: "MedPool Team" }],
  openGraph: {
    title: "MedPool - Purpose-Driven Savings Platform",
    description: "Create purpose-driven savings funds with trusted family and friends. Your money grows safely in Money Market Funds while requiring unanimous approval for withdrawals.",
    type: "website",
    locale: "en_KE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} font-poppins`}
      >
        {children}
      </body>
    </html>
  );
}
