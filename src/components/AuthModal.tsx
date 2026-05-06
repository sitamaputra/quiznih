"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, LogIn, ChevronRight, Chrome, Wallet2 } from "lucide-react";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { isMiniPayEnvironment } from "@/lib/celo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { lang } = useLanguage();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { isConnected } = useAccount();
  const isMiniPay = isMiniPayEnvironment();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If in MiniPay, auto-connect and close
  useEffect(() => {
    if (isMiniPay && isOpen && connectors.length > 0) {
      connect({ connector: connectors[0] });
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [isMiniPay, isOpen, connectors, connect, onClose, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        if (!username.trim()) throw new Error(lang === "ENG" ? "Username is required" : "Username wajib diisi");
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            }
          }
        });
        if (signUpError) throw signUpError;
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'online',
            prompt: 'select_account',
          },
          scopes: 'email profile'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google login failed");
    }
  };

  const handleWalletConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] p-4"
          >
            <div className="glass rounded-[2rem] border border-white/20 p-8 shadow-2xl relative overflow-hidden bg-black/80 dark:bg-black/90">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white">
                  {isLogin 
                    ? (lang === "ENG" ? "Welcome Back" : "Selamat Datang") 
                    : (lang === "ENG" ? "Create Account" : "Daftar Akun")}
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  {lang === "ENG" ? "Log in to save your progress and quizzes." : "Masuk untuk menyimpan progres kuis Anda."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 ml-1">Username <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#35D07F] transition-colors"
                        placeholder="cool_player_99"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-300 ml-1">Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#35D07F] transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-300 ml-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#35D07F] transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm font-medium pt-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#35D07F] to-[#FCFF52] text-black font-extrabold text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 mt-4"
                >
                  {loading 
                    ? (lang === "ENG" ? "Processing..." : "Memproses...") 
                    : (isLogin ? (lang === "ENG" ? "Sign In" : "Masuk") : (lang === "ENG" ? "Create Account" : "Daftar Akun"))}
                  {!loading && <ChevronRight className="w-5 h-5" />}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-gray-400">
                    {lang === "ENG" ? "or continue with" : "atau masuk dengan"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-base flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Chrome className="w-5 h-5 text-blue-500" />
                Google
              </button>

              <button
                type="button"
                onClick={handleWalletConnect}
                className="w-full mt-3 py-3.5 rounded-xl bg-[#35D07F]/10 text-[#35D07F] border border-[#35D07F] font-extrabold text-base flex items-center justify-center gap-3 hover:bg-[#35D07F]/20 active:scale-95 transition-all"
              >
                <Wallet2 className="w-5 h-5" />
                {lang === "ENG" ? "Connect Celo Wallet" : "Hubungkan Dompet Celo"}
              </button>

              <div className="mt-6 text-center text-sm text-gray-400">
                {isLogin 
                  ? (lang === "ENG" ? "Don't have an account? " : "Belum punya akun? ")
                  : (lang === "ENG" ? "Already have an account? " : "Sudah punya akun? ")}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  className="text-[#35D07F] font-bold hover:underline"
                >
                  {isLogin 
                    ? (lang === "ENG" ? "Sign Up" : "Daftar Sekarang")
                    : (lang === "ENG" ? "Sign In" : "Masuk")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
