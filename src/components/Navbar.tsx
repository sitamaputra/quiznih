"use client";
import { Menu, Globe2, Sun, Moon, LogOut, User, LogIn } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import WalletDropdown from "./WalletDropdown";
import AuthModal from "./AuthModal";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  
  // Web2 Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    const isClient = true; // Avoid setState in effect warning
    if (isClient) {
      setMounted(true);
    }
    
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
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-black/5 dark:border-[#FCFF52]/10 bg-white/80 dark:bg-[#050508]/80 text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FCFF52] flex items-center justify-center font-black text-black text-sm">Q</div>
              <span className="font-extrabold text-lg tracking-widest font-mono">
                QUIZ<span className="text-[#c4a700] dark:text-[#FCFF52]">NIH</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-[#FCFF52] transition-colors text-sm font-mono tracking-wider uppercase">
              {lang === "ENG" ? "Protocol" : "Protokol"}
            </a>
            <a href="#leaderboard" className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-[#FCFF52] transition-colors text-sm font-mono tracking-wider uppercase">
              {lang === "ENG" ? "Ranks" : "Peringkat"}
            </a>
            
            <div className="flex items-center gap-2 border-l border-black/10 dark:border-[#FCFF52]/10 pl-6">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-[#FCFF52]/10 transition-colors text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-[#FCFF52]"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <button 
                onClick={toggleLang}
                className="flex items-center gap-1.5 border border-black/10 dark:border-[#FCFF52]/20 bg-black/5 dark:bg-[#FCFF52]/5 hover:bg-black/10 dark:hover:bg-[#FCFF52]/10 px-3 py-1.5 rounded-lg transition-colors text-xs font-mono font-bold text-gray-600 dark:text-[#FCFF52]/70 hover:text-black dark:hover:text-[#FCFF52]"
              >
                <Globe2 className="w-3 h-3" />
                {lang}
              </button>
            </div>

            {/* Auth Section */}
            {mounted && (
              <div className="relative flex items-center gap-3">
                {/* 1. Master Login Button (If completely unauthenticated) */}
                {!user && !isConnected && (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-2 bg-[#FCFF52] hover:bg-[#e6e84a] text-black px-5 py-2 rounded-lg transition-all font-extrabold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(252,255,82,0.3)] hover:shadow-[0_0_30px_rgba(252,255,82,0.5)]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{lang === "ENG" ? "CONNECT" : "MASUK"}</span>
                  </button>
                )}

                {/* 2. Web2 User Profile (If signed in via Supabase) */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 border border-[#FCFF52]/20 bg-[#FCFF52]/5 px-4 py-2 rounded-lg hover:bg-[#FCFF52]/10 transition-all font-mono text-sm text-[#FCFF52]"
                    >
                      <User className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">
                        {user.user_metadata?.username || user.email?.split('@')[0]}
                      </span>
                    </button>
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#0a0a10] border border-[#FCFF52]/10 rounded-xl shadow-xl p-2 z-50">
                        <div className="px-3 py-2 border-b border-[#FCFF52]/10 mb-2">
                          <p className="text-xs text-gray-600 font-mono">{lang === "ENG" ? "SIGNED_IN" : "MASUK_SEBAGAI"}</p>
                          <p className="text-sm font-bold text-white truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          {lang === "ENG" ? "Disconnect" : "Keluar"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Celo Wallet Component */}
                <WalletDropdown hideIfDisconnected={!user} />
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-lg hover:bg-[#FCFF52]/10 transition-colors text-gray-400"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 border border-[#FCFF52]/20 text-[#FCFF52]/70 px-2 py-1 rounded text-xs font-mono"
            >
              <Globe2 className="w-3 h-3" />
              {lang}
            </button>
            <button className="text-gray-400 hover:text-[#FCFF52]">
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
