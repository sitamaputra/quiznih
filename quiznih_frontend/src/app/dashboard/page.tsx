"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Gamepad2, Crown, Users, LayoutDashboard, MessageCircle, Copy, CheckCircle2, Trash2, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import WalletDropdown from "@/components/wallet/WalletDropdown";
import { isMiniPayEnvironment } from "@/lib/celo";
import TopBar from "@/components/layout/TopBar";
import Image from "next/image";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { useCeloQuiz } from "@/hooks/useCeloQuiz";

type Quiz = {
  id: string;
  title: string;
  status: "waiting" | "playing" | "finished" | "cancelled";
  room_code: string;
  reward_pool_amount: number;
  contract_quiz_id: string;
  questions: { count: number }[];
};

function StatusBadge({ status }: { status: Quiz["status"] }) {
  const configs: Record<string, { bg: string; color: string; dot: string; label: string; pulse: boolean }> = {
    waiting: { bg: "rgba(53,208,127,0.12)", color: "#1a9f5e", dot: "#35D07F", label: "Waiting", pulse: true },
    playing: { bg: "rgba(252,255,82,0.18)", color: "#7a6e00", dot: "#e6d800", label: "Live", pulse: false },
    finished: { bg: "rgba(0,0,0,0.06)", color: "#4a6357", dot: "#9ca3af", label: "Finished", pulse: false },
    cancelled: { bg: "rgba(0,0,0,0.05)", color: "#9ca3af", dot: "#d1d5db", label: "Cancelled", pulse: false },
  };
  const cfg = configs[status] ?? configs.finished;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 100,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: cfg.dot, display: "inline-block",
        animation: cfg.pulse ? "pulse-dot 2s ease-in-out infinite" : "none",
      }} />
      {cfg.label}
    </span>
  );
}

export default function DashboardPage() {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const router = useRouter();
  const isMiniPay = isMiniPayEnvironment();
  const { cancelQuiz } = useCeloQuiz();

  const [showManage, setShowManage] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      if (isMiniPay) {
        connect({ connector: connectors[0] });
      }
    }
  }, [isConnected, connectors, connect, isMiniPay]);

  const fetchQuizzes = useCallback(async () => {
    if (!address) return;
    setLoadingQuizzes(true);
    const { data } = await supabase
      .from("quizzes")
      .select("*, questions(count)")
      .eq("host_wallet", address)
      .order("created_at", { ascending: false });
    setQuizzes((data as Quiz[]) || []);
    setLoadingQuizzes(false);
  }, [address]);

  useEffect(() => {
    if (showManage && address) fetchQuizzes();
  }, [showManage, address, fetchQuizzes]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCancelQuiz = async (quiz: Quiz) => {
    if (!window.confirm(t("dash.cancelConfirm", lang))) return;
    try {
      await cancelQuiz(quiz.id);
      await supabase.from("quizzes").update({ status: "cancelled" }).eq("id", quiz.id);
      alert(t("dash.cancelSuccess", lang));
      fetchQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!window.confirm(t("dash.deleteConfirm", lang))) return;
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    fetchQuizzes();
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
      {/* Soft glow orbs */}
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
        {mounted && isConnected && (
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
              {t("dash.badge", lang)}
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 5.5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 16px",
              color: "#0a1a0f",
            }}>
              {t("dash.title1", lang)}
              <br />
              <span style={{
                background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {t("dash.title2", lang)}
              </span>
            </h1>

            <p style={{
              fontSize: 17, color: "#4a6357",
              maxWidth: 480, margin: "0 auto 28px",
              lineHeight: 1.6,
            }}>
              {t("dash.subtitle", lang)}
            </p>
          </motion.div>
        </div>

        {/* Manage Toggle + Panel */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 32px", textAlign: "center" }}>
          <motion.button
            onClick={() => setShowManage((v) => !v)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "12px 28px", borderRadius: 100,
              background: showManage ? "linear-gradient(90deg, #35D07F, #1a9f5e)" : "transparent",
              border: `2px solid #35D07F`,
              color: showManage ? "#ffffff" : "#1a9f5e",
              fontWeight: 700, fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: showManage ? "0 4px 16px rgba(53,208,127,0.3)" : "none",
              transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
            }}
          >
            <LayoutDashboard style={{ width: 18, height: 18 }} />
            {t("dash.toggleManage", lang)}
          </motion.button>

          <AnimatePresence>
            {showManage && (
              <motion.div
                key="manage-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                style={{ overflow: "hidden", textAlign: "left", marginTop: 20 }}
              >
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(53,208,127,0.2)",
                  boxShadow: "0 3px 24px rgba(53,208,127,0.08)",
                  borderRadius: 24, padding: 28,
                }}>
                  {loadingQuizzes ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12, color: "#4a6357" }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 style={{ width: 20, height: 20 }} />
                      </motion.div>
                      <span style={{ fontSize: 14 }}>Loading...</span>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <p style={{ color: "#4a6357", fontSize: 15, margin: "0 0 20px" }}>
                        {t("dash.noQuizzes", lang)}
                      </p>
                      <button
                        onClick={() => router.push("/create")}
                        style={{
                          padding: "12px 24px", borderRadius: 12,
                          background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                          color: "#fff", fontWeight: 700, fontSize: 14,
                          border: "none", cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(53,208,127,0.3)",
                          fontFamily: "inherit",
                        }}
                      >
                        {t("dash.createFirst", lang)}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {quizzes.map((quiz, i) => (
                        <motion.div
                          key={quiz.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.3 }}
                          style={{
                            background: "#fafffe",
                            border: "1.5px solid rgba(53,208,127,0.15)",
                            borderRadius: 16, padding: "20px 24px",
                            boxShadow: "0 2px 10px rgba(53,208,127,0.05)",
                          }}
                        >
                          {/* Title + Status */}
                          <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 12, flexWrap: "wrap", gap: 8,
                          }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0a1a0f", margin: 0 }}>
                              {quiz.title}
                            </h3>
                            <StatusBadge status={quiz.status} />
                          </div>

                          {/* Meta row */}
                          <div style={{
                            display: "flex", flexWrap: "wrap", gap: 12,
                            marginBottom: 16, alignItems: "center",
                          }}>
                            <button
                              onClick={() => copyRoomCode(quiz.room_code)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: "rgba(53,208,127,0.08)",
                                border: "1px solid rgba(53,208,127,0.2)",
                                borderRadius: 8, padding: "5px 12px",
                                cursor: "pointer", color: "#1a9f5e",
                                fontWeight: 600, fontSize: 13,
                                fontFamily: "monospace",
                              }}
                            >
                              {copiedCode === quiz.room_code
                                ? <><CheckCircle2 style={{ width: 13, height: 13 }} />{t("dash.copied", lang)}</>
                                : <><Copy style={{ width: 13, height: 13 }} />{quiz.room_code}</>
                              }
                            </button>
                            <span style={{ fontSize: 13, color: "#4a6357" }}>
                              {quiz.questions?.[0]?.count ?? 0} {t("dash.questions", lang)}
                            </span>
                            <span style={{ fontSize: 13, color: "#4a6357" }}>
                              {quiz.reward_pool_amount ?? 0} CELO {t("dash.rewardPool", lang)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {(quiz.status === "waiting" || quiz.status === "playing") && (
                              <button
                                onClick={() => router.push(`/create/room/${quiz.id}`)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  padding: "8px 18px", borderRadius: 10,
                                  background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                                  color: "#fff", fontWeight: 600, fontSize: 13,
                                  border: "none", cursor: "pointer",
                                  fontFamily: "inherit",
                                  boxShadow: "0 2px 8px rgba(53,208,127,0.25)",
                                }}
                              >
                                <ExternalLink style={{ width: 13, height: 13 }} />
                                {t("dash.openRoom", lang)}
                              </button>
                            )}
                            {quiz.status === "waiting" && (
                              <button
                                onClick={() => handleCancelQuiz(quiz)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  padding: "8px 18px", borderRadius: 10,
                                  background: "rgba(239,68,68,0.08)",
                                  color: "#dc2626",
                                  border: "1.5px solid rgba(239,68,68,0.25)",
                                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                                  fontFamily: "inherit",
                                }}
                              >
                                {t("dash.cancelQuiz", lang)}
                              </button>
                            )}
                            {(quiz.status === "finished" || quiz.status === "cancelled") && (
                              <button
                                onClick={() => handleDeleteQuiz(quiz)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  padding: "8px 18px", borderRadius: 10,
                                  background: "rgba(0,0,0,0.04)",
                                  color: "#4a6357",
                                  border: "1.5px solid rgba(0,0,0,0.08)",
                                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                                  fontFamily: "inherit",
                                }}
                              >
                                <Trash2 style={{ width: 13, height: 13 }} />
                                {t("dash.deleteQuiz", lang)}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                  {t("dash.createQuiz", lang)}
                </h2>
                <p style={{ fontSize: 14, color: "#4a6357", lineHeight: 1.6, margin: "0 0 24px" }}>
                  {t("dash.createDesc", lang)}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1a9f5e", fontWeight: 700 }}>
                  <PlusCircle style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14 }}>{t("dash.startCreating", lang)}</span>
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
                  {t("dash.joinGame", lang)}
                </h2>
                <p style={{ fontSize: 14, color: "#4a6357", lineHeight: 1.6, margin: "0 0 24px" }}>
                  {t("dash.joinDesc", lang)}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7a6e00", fontWeight: 700 }}>
                  <Gamepad2 style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14 }}>{t("dash.enterArena", lang)}</span>
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
                  {t("dash.spinWheel", lang)}
                </h2>
                <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {t("dash.spinDesc", lang)}
                </p>
                <span style={{ fontSize: 13, color: "#0891b2", fontWeight: 700 }}>
                  {t("dash.spinNow", lang)}
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
                  {t("dash.liveReport", lang)}
                </h2>
                <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {t("dash.liveDesc", lang)}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a9f5e", fontWeight: 700, fontSize: 13 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#35D07F", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  {t("dash.watchMatch", lang)}
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
                  {t("dash.liveQA", lang)}
                </h2>
                <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.55, margin: "0 0 16px" }}>
                  {t("dash.qaDesc", lang)}
                </p>
                <span style={{ fontSize: 13, color: "#7a6e00", fontWeight: 700 }}>
                  {t("dash.qaAction", lang)}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Feedback Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              marginTop: 40,
              background: "#ffffff",
              border: "1.5px solid rgba(53,208,127,0.2)",
              boxShadow: "0 3px 20px rgba(53,208,127,0.05)",
              borderRadius: 24,
              padding: "36px",
              position: "relative",
              overflow: "hidden"
            }}
          >
             <div style={{
                position: "absolute", top: -60, left: -60,
                width: 200, height: 200, borderRadius: "50%",
                background: "rgba(53,208,127,0.05)", filter: "blur(40px)",
                pointerEvents: "none",
             }} />

             <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0a1a0f", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageCircle style={{ width: 20, height: 20, color: "#1a9f5e" }} />
                  {t("dash.feedback", lang)}
                </h2>
                <p style={{ fontSize: 14, color: "#4a6357", margin: "0 0 20px" }}>
                  {t("dash.feedbackDesc", lang)}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(t("dash.feedbackThanks", lang));
                    (e.target as HTMLFormElement).reset();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <textarea
                    placeholder={t("dash.feedbackPlaceholder", lang)}
                    required
                    style={{
                      width: "100%", minHeight: 120,
                      padding: "16px", borderRadius: 16,
                      background: "rgba(53,208,127,0.03)",
                      border: "1.5px solid rgba(53,208,127,0.2)",
                      color: "#0a1a0f", fontSize: 14,
                      outline: "none", resize: "vertical",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(53,208,127,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(53,208,127,0.2)")}
                  />
                  <button
                    type="submit"
                    style={{
                      alignSelf: "flex-end",
                      padding: "12px 24px", borderRadius: 12,
                      background: "linear-gradient(90deg, #35D07F, #1a9f5e)",
                      color: "#fff", fontWeight: 700, fontSize: 14,
                      border: "none", cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(53,208,127,0.3)",
                      transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(53,208,127,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(53,208,127,0.3)";
                    }}
                  >
                    {t("dash.feedbackSubmit", lang)}
                  </button>
                </form>
             </div>
          </motion.div>

          {/* Footer mini */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ textAlign: "center", paddingTop: 40, paddingBottom: 24 }}
          >
            <p style={{ fontSize: 13, color: "#4a6357" }}>
              {t("dash.footer", lang)}
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
