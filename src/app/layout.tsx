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
  icons: {
    icon: "/quiznih-icon-flat.png",
    shortcut: "/quiznih-icon-flat.png",
    apple: "/quiznih-icon-flat.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} antialiased`}>
      <body className="min-h-screen selection:bg-[#FCFF52] selection:text-black flex flex-col items-center" style={{ background: 'linear-gradient(160deg, #e8fdf2 0%, #fafffe 40%, #fffef0 100%)', color: '#0a1a0f' }}>
        <Providers>
          {/* Global Background Glow — subtle green + yellow */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '45%', height: '45%', background: '#35D07F', opacity: 0.07, filter: 'blur(120px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '40%', height: '40%', background: '#FCFF52', opacity: 0.09, filter: 'blur(120px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '40%', right: '20%', width: '30%', height: '30%', background: '#35D07F', opacity: 0.04, filter: 'blur(100px)', borderRadius: '50%' }} />
          </div>
          
          {children}
        </Providers>
      </body>
    </html>
  );
}
