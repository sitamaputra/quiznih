"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { motion } from "framer-motion";
import {
  Plus, LayoutDashboard, ExternalLink, Trash2, Users, Trophy
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import WalletDropdown from "@/components/wallet/WalletDropdown";
import TopBar from "@/components/layout/TopBar";

export default function ManageQuizzesPage() {
  const { lang } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!address && connectors.length > 0) {
      connect({ connector: connectors[0] });
      return;
    }
    if (!address) return;

    const fetchMyQuizzes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*, questions(count)")
          .eq("host_wallet", address)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setQuizzes(data || []);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyQuizzes();
  }, [address, connectors, connect]);

  const handleDelete = async (quizId: string) => {
    if (!confirm(lang === "ENG" ? "Are you sure you want to delete this quiz?" : "Anda yakin ingin menghapus kuis ini?")) return;
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err) {
      console.error("Error deleting quiz:", err);
      alert(lang === "ENG" ? "Failed to delete" : "Gagal menghapus");
    }
  };

  const statusStyle = (status: string) => {
    if (status === "waiting") return { bg: "rgba(234,179,8,0.12)", color: "#7a6e00", label: lang === "ENG" ? "Waiting" : "Menunggu" };
    if (status === "playing") return { bg: "rgba(53,208,127,0.12)", color: "#1a9f5e", label: lang === "ENG" ? "Live" : "Sedang Berjalan" };
    return { bg: "rgba(0,0,0,0.05)", color: "#4a6357", label: status };
  };

  return (
    <main style={{
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Soft glow orbs */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", right: "0%", top: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "rgba(53,208,127,0.11)", filter: "blur(120px)",
        }} />
        <div style={{
          position: "absolute", left: "0%", bottom: "15%",
          width: 450, height: 450, borderRadius: "50%",
          background: "rgba(252,255,82,0.13)", filter: "blur(120px)",
        }} />
      </div>

      <TopBar backHref="/dashboard" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {mounted && isConnected && (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "68px 24px 0", display: "flex", justifyContent: "flex-end" }}>
            <WalletDropdown />
          </div>
        )}

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: mounted && isConnected ? "32px 24px 60px" : "80px 24px 60px" }}>
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 40 }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1a9f5e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                {lang === "ENG" ? "My Workspace" : "Ruang Kerja Saya"}
              </p>
              <h1 style={{
                fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800,
                letterSpacing: "-0.03em", color: "#0a1a0f",
                display: "flex", alignItems: "center", gap: 12, margin: 0,
              }}>
                <LayoutDashboard style={{ width: 34, height: 34, color: "#35D07F" }} />
                {lang === "ENG" ? "Manage " : "Kelola "}
                <span style={{
                  background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {lang === "ENG" ? "Quizzes" : "Kuis"}
                </span>
              </h1>
              <p style={{ fontSize: 15, color: "#4a6357", margin: "10px 0 0", lineHeight: 1.5 }}>
                {lang === "ENG"
                  ? "Track your active games, review player results, and manage your live rooms."
                  : "Pantau kuis aktifmu, periksa hasil pemain, dan kelola ruangan live-mu."}
              </p>
            </div>

            <Link href="/create" style={{ textDecoration: "none" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 24px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #1a9f5e, #35D07F)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(53,208,127,0.25)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(53,208,127,0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(53,208,127,0.25)";
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                {lang === "ENG" ? "Create New" : "Buat Baru"}
              </button>
            </Link>
          </motion.div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(53,208,127,0.15)", marginBottom: 32 }} />

          {/* Content */}
          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 260, borderRadius: 20,
                  background: "rgba(53,208,127,0.05)",
                  border: "1.5px solid rgba(53,208,127,0.12)",
                  animation: "pulse-dot 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(53,208,127,0.18)",
                boxShadow: "0 2px 16px rgba(53,208,127,0.07)",
                borderRadius: 24, padding: "60px 40px",
                textAlign: "center",
              }}
            >
              <div style={{
                width: 64, height: 64, margin: "0 auto 20px",
                borderRadius: 18,
                background: "rgba(53,208,127,0.10)",
                border: "1px solid rgba(53,208,127,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Plus style={{ width: 28, height: 28, color: "#35D07F" }} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0a1a0f", margin: "0 0 8px" }}>
                {lang === "ENG" ? "No Quizzes Yet" : "Belum Ada Kuis"}
              </h3>
              <p style={{ fontSize: 14, color: "#4a6357", margin: "0 0 28px", lineHeight: 1.6 }}>
                {lang === "ENG"
                  ? "You haven't hosted any interactive games yet. Ready to start?"
                  : "Kamu belum membuat permainan interaktif apapun. Siap untuk mulai?"}
              </p>
              <Link href="/create" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, #1a9f5e, #35D07F)",
                color: "#fff", fontWeight: 700, fontSize: 14,
                textDecoration: "none",
              }}>
                <Plus style={{ width: 16, height: 16 }} />
                {lang === "ENG" ? "Create Your First Quiz" : "Buat Kuis Pertama Anda"}
              </Link>
            </motion.div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {quizzes.map((quiz, idx) => {
                const st = statusStyle(quiz.status);
                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      position: "relative", overflow: "hidden",
                      background: "#ffffff",
                      border: "1.5px solid rgba(53,208,127,0.18)",
                      boxShadow: "0 2px 16px rgba(53,208,127,0.07)",
                      borderRadius: 20, padding: 24,
                      display: "flex", flexDirection: "column", justifyContent: "space-between",
                      transition: "all 0.3s",
                    }}
                    whileHover={{
                      y: -4,
                      boxShadow: "0 8px 28px rgba(53,208,127,0.14)",
                      borderColor: "rgba(53,208,127,0.4)",
                    }}
                  >
                    {/* Accent bar */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: "linear-gradient(90deg, #35D07F, #FCFF52)",
                      borderRadius: "20px 20px 0 0",
                    }} />

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: 8,
                          background: st.bg, color: st.color,
                          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                        }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize: 12, color: "#4a6357", fontFamily: "monospace" }}>
                          {quiz.room_code}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0a1a0f", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                        {quiz.title}
                      </h3>
                      <p style={{ fontSize: 13, color: "#4a6357", margin: "0 0 16px", lineHeight: 1.5 }}>
                        {quiz.description || (lang === "ENG" ? "No description" : "Tidak ada deskripsi")}
                      </p>

                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 8,
                        background: "rgba(53,208,127,0.08)",
                        border: "1px solid rgba(53,208,127,0.15)",
                        fontSize: 12, color: "#1a9f5e", fontWeight: 600,
                        marginBottom: 20,
                      }}>
                        <Trophy style={{ width: 13, height: 13 }} />
                        {quiz.reward_pool_amount} CELO
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => router.push(`/create/room/${quiz.id}`)}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "10px 0", borderRadius: 12,
                          background: "rgba(53,208,127,0.08)",
                          border: "1px solid rgba(53,208,127,0.2)",
                          color: "#1a9f5e", fontWeight: 700, fontSize: 13,
                          cursor: "pointer", transition: "background 0.2s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(53,208,127,0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(53,208,127,0.08)")}
                      >
                        <ExternalLink style={{ width: 14, height: 14 }} />
                        {lang === "ENG" ? "Manage" : "Kelola"}
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        style={{
                          padding: "10px 14px", borderRadius: 12,
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.15)",
                          cursor: "pointer", transition: "background 0.2s",
                          color: "#ef4444",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#ef4444";
                          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                        }}
                      >
                        <Trash2 style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
