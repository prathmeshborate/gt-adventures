import type { Metadata } from "next";
import { Inter } from "next/font/google"; // or whatever font you are using
import "./globals.css";
// 1. Import your Navbar and Footer
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GT Adventures",
  description: "Conquer the Mountains with GT Adventures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />
        
        {/* The main content of your pages (Home, Profile, etc.) goes here */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 2. Add the Footer here so it sticks to the bottom! */}
        <Footer />
      </body>
    </html>
  );
}