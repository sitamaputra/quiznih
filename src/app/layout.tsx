import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiznih | Web3 Trivia on Celo",
  description: "Join the ultimate Web3 trivia experience on Celo. Win crypto, climb the leaderboard, and prove your knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} antialiased`}>
      <body className="min-h-screen selection:bg-[#35D07F] selection:text-black flex flex-col items-center transition-colors">
        <Providers>
          {/* Futuristic Background Elements */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#35D07F] mix-blend-screen opacity-20 blur-[120px] rounded-full dark:opacity-20 opacity-10"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FCFF52] mix-blend-screen opacity-20 blur-[120px] rounded-full dark:opacity-20 opacity-10"></div>
          </div>
          
          {children}
        </Providers>
      </body>
    </html>
  );
}
