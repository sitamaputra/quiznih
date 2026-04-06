"use client";
import { Wallet2, Menu, Globe2, Sun, Moon, LogOut, User, LogIn } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import WalletDropdown from "./WalletDropdown";
import AuthModal from "./AuthModal";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  
  // Web2 Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-black/10 dark:border-white/10 text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Quiznih" className="w-9 h-9 rounded-xl" />
              <span className="font-extrabold text-xl tracking-wider">
                Quiz<span className="text-gradient">nih</span>
              </span>
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              {lang === "ENG" ? "How it Works" : "Cara Kerja"}
            </a>
            <a href="#leaderboard" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              {lang === "ENG" ? "Leaderboard" : "Papan Peringkat"}
            </a>
            
            <div className="flex items-center gap-2 border-l border-black/10 dark:border-white/10 pl-6">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <button 
                onClick={toggleLang}
                className="flex items-center gap-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/20 px-3 py-1.5 rounded-full transition-colors text-xs font-bold"
              >
                <Globe2 className="w-3 h-3" />
                {lang}
              </button>
            </div>

            {/* Auth Section */}
            {mounted && (
              <div className="relative flex items-center gap-3">
                {/* 1. Master Login Button (If completely unauthenticated) */}
                {!user && !publicKey && (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-2 bg-[#9945FF] hover:bg-[#7b3fe4] text-white px-5 py-2.5 rounded-full transition-all font-semibold text-sm shadow-[0_0_15px_rgba(153,69,255,0.4)]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{lang === "ENG" ? "Sign In / Connect" : "Masuk / Hubung"}</span>
                  </button>
                )}

                {/* 2. Web2 User Profile (If signed in via Supabase) */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/20 px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all font-semibold text-sm"
                    >
                      <User className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">
                        {user.user_metadata?.username || user.email?.split('@')[0]}
                      </span>
                    </button>
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50">
                        <div className="px-3 py-2 border-b border-black/10 dark:border-white/10 mb-2">
                          <p className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Signed in as" : "Masuk sebagai"}</p>
                          <p className="text-sm font-bold truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          {lang === "ENG" ? "Sign Out" : "Keluar"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Solana Wallet Component */}
                <WalletDropdown hideIfDisconnected={!user} />
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/20 text-black dark:text-white px-2 py-1 rounded text-xs"
            >
              <Globe2 className="w-3 h-3" />
              {lang}
            </button>
            <button className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </nav>
  );
}
