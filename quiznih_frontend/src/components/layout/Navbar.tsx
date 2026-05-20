"use client";
import { t } from "@/lib/translations";
import { Menu, Globe2, LogOut, User, LogIn, X } from "lucide-react";
import Link from "next/link";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AnimatePresence, motion } from "framer-motion";
import WalletDropdown from "@/components/wallet/WalletDropdown";
import AuthModal from "@/components/wallet/AuthModal";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { lang, setLang, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  // Web2 Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <><nav
      className="fixed top-0 w-full z-50 text-black dark:text-white"
      style={{
        background: "#35D07F",
        boxShadow: "0 2px 16px rgba(53,208,127,0.3)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20" style={{ position: "relative" }}>

          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <img
              src="/quiznih-logo.png"
              alt="Quiznih"
              style={{ width: 36, height: 36, objectFit: "contain", background: "none", border: "none", borderRadius: "10px" }}
            />
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em", color: "#ffffff" }}>
              Quiznih
            </span>
          </Link>

          {/* Center: Nav links (absolutely centered) */}
          <div
            className="hidden md:flex items-center gap-8"
            style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          >
            <a
              href="#how-it-works"
              style={{ color: "rgba(0,0,0,0.6)", fontSize: 16, fontWeight: 700, textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#000")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(0,0,0,0.6)")}
            >
              How it Works
            </a>
            <a
              href="#quizzes"
              style={{ color: "rgba(0,0,0,0.6)", fontSize: 16, fontWeight: 700, textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#000")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(0,0,0,0.6)")}
            >
              Join a Quiz
            </a>
            <a
              href="#minipay"
              style={{ color: "rgba(0,0,0,0.6)", fontSize: 16, fontWeight: 700, textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#000")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(0,0,0,0.6)")}
            >
              Play with MiniPay
            </a>
            <a
              href="#leaderboard"
              style={{ color: "rgba(0,0,0,0.6)", fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#000")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(0,0,0,0.6)")}
            >
              Leaderboard
            </a>
          </div>

          {/* Right: Controls + Auth */}
          <div className="hidden md:flex items-center gap-2">
            {mounted && (
              <div className="relative flex items-center gap-3">
                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="flex items-center gap-1.5 transition-all text-base font-semibold hover:bg-white/30"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 50, padding: "8px 14px", cursor: "pointer" }}
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>{LANGUAGES.find(l => l.code === lang)?.code || lang}</span>
                  </button>
                  {isLangDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#1A1A2E] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setIsLangDropdownOpen(false); }}
                          className={`flex items-center gap-3 w-full px-3 py-2 text-base rounded-xl transition-colors font-semibold ${lang === l.code ? "bg-[#35D07F]/10 text-[#35D07F]" : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"}`}
                        >
                          <span className="text-lg">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1. Master Login Button (If completely unauthenticated) */}
                {!user && !isConnected && (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-2 transition-all text-base"
                    style={{ background: "#FCFF52", color: "#0a1a0f", fontWeight: 900, border: "none", borderRadius: 50, padding: "10px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: "pointer" }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t("auto.1", lang)}</span>
                  </button>
                )}

                {/* 2. Web2 User Profile (If signed in via Supabase) */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 transition-all font-semibold text-base"
                      style={{ background: "#FCFF52", color: "#0a1a0f", border: "none", borderRadius: 50, padding: "8px 16px", cursor: "pointer" }}
                    >
                      <User className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">
                        {user.user_metadata?.username || user.email?.split('@')[0]}
                      </span>
                    </button>
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50">
                        <div className="px-3 py-2 border-b border-black/10 dark:border-white/10 mb-2">
                          <p className="text-xs text-gray-500 font-semibold">{t("auto.2", lang)}</p>
                          <p className="text-base font-bold truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-base text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("auto.3", lang)}
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

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>
    </nav>

    {/* Mobile Menu Panel */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-20 left-0 right-0 z-40 md:hidden"
          style={{
            background: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            borderTop: "1px solid rgba(53,208,127,0.2)",
          }}
        >
          <div className="flex flex-col px-4 py-4 gap-1">
            {/* Nav links */}
            {[
              { label: "How it Works", href: "#how-it-works" },
              { label: "Join a Quiz", href: "#quizzes" },
              { label: "Play with MiniPay", href: "#minipay" },
              { label: "Leaderboard", href: "#leaderboard" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-700 text-gray-700 hover:bg-[#35D07F]/10 hover:text-[#35D07F] transition-colors"
                style={{ fontWeight: 700 }}
              >
                {label}
              </a>
            ))}

            {/* Divider */}
            <div className="my-2 border-t border-gray-100" />

            {/* Language switcher */}
            {mounted && (
              <div className="flex items-center gap-2 px-4 py-2">
                <Globe2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-semibold mr-2">Language:</span>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); }}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${lang === l.code ? "bg-[#35D07F] text-white" : "bg-gray-100 text-gray-600 hover:bg-[#35D07F]/20"}`}
                  >
                    {l.flag} {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Auth controls */}
            {mounted && (
              <div className="px-4 py-2 flex flex-col gap-2">
                {!user && !isConnected && (
                  <button
                    onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-base"
                    style={{ background: "#FCFF52", color: "#0a1a0f", fontWeight: 900, border: "none" }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t("auto.1", lang)}</span>
                  </button>
                )}
                {user && (
                  <div className="flex items-center justify-between px-3 py-3 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-700 truncate max-w-[160px]">
                        {user.user_metadata?.username || user.email?.split("@")[0]}
                      </span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-1 text-sm text-red-500 font-semibold hover:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("auto.3", lang)}
                    </button>
                  </div>
                )}
                <div onClick={() => setIsMobileMenuOpen(false)}>
                  <WalletDropdown hideIfDisconnected={!user} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Auth Modal — outside nav to escape backdrop-filter containing block */}
    <AuthModal
      isOpen={isAuthOpen}
      onClose={() => setIsAuthOpen(false)}
    />
    </>
  );
}
