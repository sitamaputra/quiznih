"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { motion } from "framer-motion";
import { PlusCircle, Gamepad2, Crown, Users, LayoutDashboard, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WalletDropdown from "@/components/WalletDropdown";
import { isMiniPayEnvironment } from "@/lib/celo";
import TopBar from "@/components/TopBar";
import Image from "next/image";

export default function DashboardPage() {
  const { lang } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const router = useRouter();
  const isMiniPay = isMiniPayEnvironment();

  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      if (isMiniPay) {
        connect({ connector: connectors[0] });
      }
    }
  }, [isConnected, connectors, connect, isMiniPay]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Soft glow orbs — memperkuat warna dari layout.tsx */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", left: "5%", top: "15%",
          width: 600, height: 600, borderRadius: "50%",
          background: "rgba(53,208,127,0.12)", filter: "blur(120px)",
        }} />
        <div style={{
          position: "absolute", right: "0%", bottom: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "rgba(252,255,82,0.15)", filter: "blur(120px)",
        }} />
        <div style={{
          position: "absolute", right: "30%", top: "50%",
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(53,208,127,0.07)", filter: "blur(80px)",
        }} />
      </div>

      <TopBar backHref="/" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Wallet Row */}
        {isConnected && (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "68px 24px 0", display: "flex", justifyContent: "flex-end" }}>
            <WalletDropdown />
          </div>
        )}

        {/* Hero Header */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isConnected ? "24px 24px 0" : "80px 24px 0", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Live badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 16px", borderRadius: 100,
              background: "rgba(53,208,127,0.10)",
              border: "1px solid rgba(53,208,127,0.3)",
              fontSize: 13, color: "#1a9f5e", fontWeight: 600,
              marginBottom: 24,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#35D07F", display: "inline-block",
                animation: "pulse-dot 2s ease-in-out infinite",
              }} />
              {lang === "ENG" ? "Your Command Center" : "Pusat Komando Anda"}
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 5.5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 16px",
              color: "#0a1a0f",
            }}>
              {lang === "ENG" ? "What would you like" : "Apa yang ingin"}
              <br />
              <span style={{
                background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {lang === "ENG" ? "to do today?" : "kamu lakukan hari ini?"}
              </span>
            </h1>

            <p style={{
              fontSize: 17, color: "#4a6357",
              maxWidth: 480, margin: "0 auto 52px",
              lineHeight: 1.6,
            }}>
              {lang === "ENG"
                ? "Host quizzes, join games, spin the wheel — all on Celo blockchain."
                : "Buat kuis, ikut game, putar roda — semuanya di blockchain Celo."}
            </p>
          </motion.div>
        </div>

        {/* Main Cards Grid */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>

          {/* Top row: Creator + Player */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 20,
          }}>
            {/* Create Quiz Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              onClick={() => handleNavigate("/create")}
              style={{
                position: "relative", overflow: "hidden",
                background: "#ffffff",
                border: "1.5px solid rgba(53,208,127,0.2)",
                boxShadow: "0 3px 20px rgba(53,208,127,0.09)",
                borderRadius: 24, padding: 36,
                cursor: "pointer", transition: "all 0.3s",
              }}
              whileHover={{
                y: -5,
                boxShadow: "0 12px 40px rgba(53,208,127,0.18)",
                borderColor: "rgba(53,208,127,0.5)",
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #35D07F, #FCFF52)",
                borderRadius: "24px 24px 0 0",
              }} />
              {/* Green glow */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: "rgba(53,208,127,0.08)", filter: "blur(40px)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "rgba(53,208,127,0.12)",
                  border: "1px solid rgba(53,208,127,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Crown style={{ width: 26, height: 26, color: "#1a9f5e" }} />
                </div>

                <div style={{
                  display: "inline-block", padding: "3px 10px",
                  borderRadius: 6, background: "rgba(53,208,127,0.10)",
                  color: "#1a9f5e", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.05em", marginBottom: 10,
                }}>HOST</div>

                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0a1a0f", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                  {lang === "ENG" ? "Create Quiz" : "Buat Kuis"}
                </h2>
                <p style={{ fontSize: 14, color: "#4a6357", lineHeight: 1.6, margin: "0 0 24px" }}>
                  {lang === "ENG"
                    ? "Build an interactive quiz room, set CELO rewards, and challenge your friends!"
                    : "Bikin ruang kuis interaktif, atur hadiah CELO, dan tantang teman-temanmu!"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1a9f5e", fontWeight: 700 }}>
                    <PlusCircle style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 14 }}>{lang === "ENG" ? "Start Creating →" : "Mulai Buat →"}</span>
                  </div>
                  <Link
                    href="/manage"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      color: "#4a6357", textDecoration: "none", fontSize: 13, fontWeight: 500,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#1a9f5e")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#4a6357")}
                  >
                    <LayoutDashboard style={{ width: 15, height: 15 }} />
                    <span>{lang === "ENG" ? "Manage Quizzes" : "Kelola Kuis"}</span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Join Game Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onClick={() => handleNavigate("/play")}
              style={{
                position: "relative", overflow: "hidden",
                background: "#ffffff",
                border: "1.5px solid rgba(252,255,82,0.3)",
                boxShadow: "0 3px 20px rgba(252,255,82,0.08)",
                borderRadius: 24, padding: 36,
                cursor: "pointer", transition: "all 0.3s",
              }}
              whileHover={{
                y: -5,
                boxShadow: "0 12px 40px rgba(252,255,82,0.18)",
                borderColor: "rgba(252,255,82,0.55)",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #FCFF52, #35D07F)",
                borderRadius: "24px 24px 0 0",
              }} />
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: "rgba(252,255,82,0.10)", filter: "blur(40px)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "rgba(252,255,82,0.15)",
                  border: "1px solid rgba(252,255,82,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Users style={{ width: 26, height: 26, color: "#997000" }} />
                </div>

                <div style={{
                  display: "inline-block", padding: "3px 10px",
                  borderRadius: 6, background: "rgba(252,255,82,0.15)",
                  color: "#7a6e00", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.05em", marginBottom: 10,
                }}>PLAYER</div>

                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0a1a0f", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                  {lang === "ENG" ? "Join Game" : "Main Kuis"}
                </h2>
                <p style={{ fontSize: 14, color: "#4a6357", lineHeight: 1.6, margin: "0 0 24px" }}>
                  {lang === "ENG"
                    ? "Enter a room code to join the action. Answer fast and win real CELO prizes!"
                    : "Masukkan kode ruangan untuk beraksi. Jawab cepat dan menangkan hadiah CELO!"}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7a6e00", fontWeight: 700 }}>
                  <Gamepad2 style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14 }}>{lang === "ENG" ? "Enter Arena →" : "Masuk Arena →"}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom row: Tools */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}>
            {/* Spin Wheel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={() => handleNavigate("/spin")}
              style={{
                position: "relative", overflow: "hidden",
                background: "#ffffff",
                border: "1.5px solid rgba(6,182,212,0.2)",
                boxShadow: "0 2px 16px rgba(6,182,212,0.07)",
                borderRadius: 20, padding: 28,
                cursor: "pointer", transition: "all 0.3s",
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 8px 30px rgba(6,182,212,0.14)",
                borderColor: "rgba(6,182,212,0.4)",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #06B6D4, #35D07F)",
                borderRadius: "20px 20px 0 0",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(6,182,212,0.10)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, fontSize: 22,
                }}>🎡</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0a1a0f", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  {lang === "ENG" ? "Spin Wheel" : "Roda Putar"}
                </h2>
                <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {lang === "ENG"
                    ? "Can't decide a winner? Let fate spin the prize!"
                    : "Bingung pilih pemenang? Biarkan takdir yang memilih!"}
                </p>
                <span style={{ fontSize: 13, color: "#0891b2", fontWeight: 700 }}>
                  {lang === "ENG" ? "Spin Now →" : "Putar Sekarang →"}
                </span>
              </div>
            </motion.div>

            {/* Live Report */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              onClick={() => handleNavigate("/live")}
              style={{
                position: "relative", overflow: "hidden",
                background: "#ffffff",
                border: "1.5px solid rgba(53,208,127,0.2)",
                boxShadow: "0 2px 16px rgba(53,208,127,0.07)",
                borderRadius: 20, padding: 28,
                cursor: "pointer", transition: "all 0.3s",
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 8px 30px rgba(53,208,127,0.14)",
                borderColor: "rgba(53,208,127,0.4)",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                borderRadius: "20px 20px 0 0",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(53,208,127,0.10)",
                  border: "1px solid rgba(53,208,127,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, fontSize: 22,
                }}>📺</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0a1a0f", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  {lang === "ENG" ? "Live Report" : "Laporan Live"}
                </h2>
                <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {lang === "ENG"
                    ? "Watch the leaderboard update in real-time."
                    : "Tonton skor secara real-time dan rasakan ketegangan."}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a9f5e", fontWeight: 700, fontSize: 13 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#35D07F", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  {lang === "ENG" ? "Watch Match →" : "Tonton Match →"}
                </div>
              </div>
            </motion.div>

            {/* Live Q&A */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              onClick={() => handleNavigate("/qa")}
              style={{
                position: "relative", overflow: "hidden",
                background: "#ffffff",
                border: "1.5px solid rgba(252,255,82,0.28)",
                boxShadow: "0 2px 16px rgba(252,255,82,0.07)",
                borderRadius: 20, padding: 28,
                cursor: "pointer", transition: "all 0.3s",
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 8px 30px rgba(252,255,82,0.14)",
                borderColor: "rgba(252,255,82,0.5)",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #FCFF52, #35D07F)",
                borderRadius: "20px 20px 0 0",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(252,255,82,0.15)",
                  border: "1px solid rgba(252,255,82,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <MessageCircle style={{ width: 22, height: 22, color: "#7a6e00" }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0a1a0f", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  {lang === "ENG" ? "Live Q&A" : "Tanya Jawab"}
                </h2>
                <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {lang === "ENG"
                    ? "Create an interactive Q&A space. Ask, vote, and discuss!"
                    : "Buat ruang Q&A interaktif. Ajukan pertanyaan dan diskusi!"}
                </p>
                <span style={{ fontSize: 13, color: "#7a6e00", fontWeight: 700 }}>
                  {lang === "ENG" ? "Create / Join Q&A →" : "Buat / Gabung Q&A →"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Footer mini */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ textAlign: "center", paddingTop: 40, paddingBottom: 24 }}
          >
            <p style={{ fontSize: 13, color: "#4a6357" }}>
              {lang === "ENG"
                ? "Powered by Celo blockchain · Rewards paid on-chain"
                : "Didukung blockchain Celo · Hadiah dibayar on-chain"}
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
