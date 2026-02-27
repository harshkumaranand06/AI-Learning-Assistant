import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import CreditBar from "@/components/CreditBar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Learning Assistant",
  description: "Learn anything faster with AI generated flashcards, quizzes, and chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#05010a] text-white`}>
        <CreditBar />
        <Navbar />
        <main className="flex-grow w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
