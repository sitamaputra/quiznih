import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { Navbar } from '@/components/navbar';
import { WalletProvider } from "@/components/wallet-provider"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'quiznih_smartcontract',
  description: 'Quiznih adalah platform kuis interaktif berbasis Web3 yang berjalan di blockchain Celo. Host (pembuat kuis) dapat membuat sesi kuis real-time dengan reward pool dalam CELO yang dikunci di smart contract escrow (QuizEscrow.sol). Pemain bergabung lewat room code atau QR code, menjawab soal dengan timer, dan pemenang otomatis menerima reward on-chain (juara 1: 50%, juara 2: 30%, juara 3: 20%).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col">
          <WalletProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
