"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";
import { IS_TESTNET } from "@/lib/celo";
import { motion } from "framer-motion";

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const { lang } = useLanguage();

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "120px 24px 80px",
        background: "linear-gradient(150deg, #ffffff 0%, #f0fdf6 40%, #fffde8 100%)",
      }}
    >
      {/* Google Font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap"
      />
      {/* Float keyframe */}
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-grid { grid-template-columns: minmax(0,55fr) minmax(0,45fr); }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-img-col { order: -1; }
        }
      `}</style>

      {/* Glow orbs */}
      <div
        aria-hidden
        style={{
          position: "absolute", left: "20%", top: "50%",
          transform: "translate(-50%,-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "rgba(53,208,127,0.10)", filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute", right: "10%", top: "20%",
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(252,255,82,0.18)", filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Two-column inner */}
      <div
        className="hero-grid"
        style={{
          position: "relative", zIndex: 1, maxWidth: 1200, width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 55fr) minmax(0, 45fr)",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center",
        }}
      >
        {/* Left – text (55%) */}
        <div
          style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", textAlign: "center",
          }}
        >
          {/* Live badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 18px", borderRadius: 100,
              background: "rgba(53,208,127,0.10)",
              border: "1px solid rgba(53,208,127,0.3)",
              fontSize: 14, color: "#1a9f5e", fontWeight: 500,
              marginBottom: 32,
            }}
          >
            <span
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#35D07F", display: "inline-block",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            {IS_TESTNET
              ? (lang === "ENG" ? "Live on Celo Alfajores Testnet" : "Aktif di Celo Alfajores Testnet")
              : (lang === "ENG" ? "Live on Celo" : "Aktif di Celo")}
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "clamp(44px, 7vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
              background: "linear-gradient(90deg, #35D07F, #FCFF52)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            {lang === "ENG" ? "Decentralized Trivia." : "Trivia Terdesentralisasi."}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(18px, 2.5vw, 22px)", color: "#0a1a0f",
              maxWidth: 520, margin: "0 0 16px", lineHeight: 1.4,
              textAlign: "center", fontWeight: 600,
            }}
          >
            {lang === "ENG"
              ? "Earn crypto rewards for what you know."
              : "Dapatkan hadiah kripto dari pengetahuanmu."}
          </p>

          {/* Body */}
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 17px)", color: "#4a6357",
              maxWidth: 480, margin: "0 0 40px", lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            {lang === "ENG"
              ? "Join quizzes, stake your knowledge, compete with others, and win real CELO tokens — all on-chain."
              : "Ikuti kuis, unjukkan pengetahuanmu, bersaing dengan orang lain, dan menangkan token CELO nyata — semuanya on-chain."}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/dashboard">
              <button
                style={{
                  padding: "16px 36px", borderRadius: 14, border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1a9f5e, #35D07F)",
                  color: "#fff", fontWeight: 700, fontSize: 17,
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
                {lang === "ENG" ? "Start Playing" : "Mulai Main"}
              </button>
            </Link>

            <a href="#how-it-works">
              <button
                style={{
                  padding: "16px 36px", borderRadius: 14, cursor: "pointer",
                  background: "transparent",
                  border: "1.5px solid rgba(53,208,127,0.3)",
                  color: "#0a1a0f", fontWeight: 600, fontSize: 17,
                  fontFamily: "inherit",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(53,208,127,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(53,208,127,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(53,208,127,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {lang === "ENG" ? "Learn More" : "Pelajari Lebih"}
              </button>
            </a>
          </div>

          {/* Stats pills */}
          <div
            style={{
              display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
              marginTop: 48, borderTop: "1px solid rgba(53,208,127,0.15)",
              paddingTop: 24,
            }}
          >
            {[
              { icon: "🏆", label: lang === "ENG" ? "1,200+ Wallets" : "1.200+ Dompet" },
              { icon: "💰", label: "5,000 CELO Distributed" },
              { icon: "⚡", label: "Powered by Celo" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", borderRadius: 100,
                  background: "rgba(53,208,127,0.06)",
                  border: "1px solid rgba(53,208,127,0.15)",
                  fontSize: 14, color: "#4a6357", fontWeight: 500,
                }}
              >
                <span>{s.icon}</span> {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right – 3D image (45%) */}
        <div
          className="hero-img-col"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Image
            src="/quiznih-hero-3d.png"
            alt="Quiznih 3D Icon"
            width={420}
            height={420}
            priority
            style={{
              maxWidth: 420, width: "100%", height: "auto",
              animation: "hero-float 4s ease-in-out infinite",
              filter: "drop-shadow(0 20px 60px rgba(53,208,127,0.25))",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const { lang } = useLanguage();

  const steps = [
    {
      num: "01",
      title: lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet",
      desc:
        lang === "ENG"
          ? "Link your Celo wallet or use MiniPay to get started in seconds."
          : "Hubungkan dompet Celo-mu atau gunakan MiniPay untuk memulai dalam hitungan detik.",
      icon: "/icon-wallet.png",
    },
    {
      num: "02",
      title: lang === "ENG" ? "Join a Quiz" : "Ikuti Kuis",
      desc:
        lang === "ENG"
          ? "Browse upcoming quizzes, pick a topic, and stake your entry."
          : "Telusuri kuis mendatang, pilih topik, dan daftarkan dirimu.",
      icon: "/icon-quiz.png",
    },
    {
      num: "03",
      title: lang === "ENG" ? "Earn Rewards" : "Dapatkan Hadiah",
      desc:
        lang === "ENG"
          ? "Answer correctly, climb the leaderboard, and claim CELO tokens."
          : "Jawab dengan benar, panjat papan peringkat, dan klaim token CELO.",
      icon: "/icon-reward.png",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: "100px 24px", background: "#f8fffe" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 14, fontWeight: 600, color: "#1a9f5e",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12,
            }}
          >
            {lang === "ENG" ? "How It Works" : "Cara Kerjanya"}
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700,
              letterSpacing: "-0.02em", margin: 0,
              background: 'linear-gradient(90deg, #35D07F, #FCFF52)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {lang === "ENG" ? "Three steps to earning" : "Tiga langkah untuk menghasilkan"}
          </h2>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                padding: 32, borderRadius: 16, position: "relative",
                overflow: "hidden",
                background: "#ffffff",
                border: "1.5px solid rgba(53,208,127,0.18)",
                boxShadow: "0 2px 16px rgba(53,208,127,0.06)",
                transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(53,208,127,0.4)";
                el.style.boxShadow = "0 4px 24px rgba(53,208,127,0.12)";
                el.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(53,208,127,0.18)";
                el.style.boxShadow = "0 2px 16px rgba(53,208,127,0.06)";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Gradient accent bar */}
              <div
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: "linear-gradient(90deg, #35D07F, #FCFF52)",
                  borderRadius: "16px 16px 0 0",
                }}
              />
              {/* Step number */}
              <span
                style={{
                  position: "absolute", top: 20, right: 24,
                  fontFamily: "monospace", fontSize: 14, fontWeight: 700,
                  color: "rgba(53,208,127,0.18)",
                }}
              >
                {s.num}
              </span>
              <Image
                src={s.icon}
                alt={s.title}
                width={72}
                height={72}
                style={{ marginBottom: 20, objectFit: "contain" }}
              />
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0a1a0f", margin: "0 0 10px" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 15, color: "#4a6357", margin: 0, lineHeight: 1.6 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Upcoming Quizzes ────────────────────────────────────────────────────────

function UpcomingQuizzes() {
  const { lang } = useLanguage();

  const quizzes = [
    { title: "Blockchain Basics", title_id: "Dasar Blockchain", level: "BEGINNER" as const, reward: "50 CELO", players: 42, time: "2:30:00", topic: "Web3" },
    { title: "DeFi Deep Dive", title_id: "Menyelami DeFi", level: "ADVANCED" as const, reward: "200 CELO", players: 18, time: "1:15:00", topic: "DeFi" },
    { title: "Celo Ecosystem", title_id: "Ekosistem Celo", level: "INTERMEDIATE" as const, reward: "100 CELO", players: 31, time: "4:00:00", topic: "Celo" },
    { title: "Smart Contracts 101", title_id: "Smart Contract 101", level: "BEGINNER" as const, reward: "75 CELO", players: 56, time: "Live Now", topic: "Solidity" },
    { title: "NFT & Digital Art", title_id: "NFT & Seni Digital", level: "INTERMEDIATE" as const, reward: "150 CELO", players: 23, time: "6:45:00", topic: "NFTs" },
    { title: "Crypto Security", title_id: "Keamanan Kripto", level: "ADVANCED" as const, reward: "300 CELO", players: 12, time: "12:00:00", topic: "Security" },
  ];

  const levelStyles = {
    BEGINNER: { bg: "rgba(53,208,127,0.10)", color: "#1a9f5e", label: lang === "ENG" ? "BEGINNER" : "PEMULA" },
    INTERMEDIATE: { bg: "rgba(200,180,0,0.10)", color: "#7a6e00", label: lang === "ENG" ? "INTERMEDIATE" : "MENENGAH" },
    ADVANCED: { bg: "rgba(220,60,60,0.08)", color: "#cc3333", label: lang === "ENG" ? "ADVANCED" : "LANJUTAN" },
  };

  return (
    <section
      id="quizzes"
      style={{
        padding: "100px 24px",
        background: "linear-gradient(160deg, #f0fdf6, #fffde8)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 14, fontWeight: 600, color: "#1a9f5e",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12,
            }}
          >
            {lang === "ENG" ? "Upcoming" : "Mendatang"}
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700,
              letterSpacing: "-0.02em", margin: 0,
              background: 'linear-gradient(90deg, #35D07F, #FCFF52)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {lang === "ENG" ? "Join a Quiz" : "Ikuti Kuis"}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {quizzes.map((q, i) => {
            const ls = levelStyles[q.level];
            const isLive = q.time === "Live Now";
            return (
              <Link href="/play" key={i} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    padding: 24, borderRadius: 20, position: "relative",
                    overflow: "hidden", background: "#ffffff",
                    border: "1.5px solid rgba(53,208,127,0.18)",
                    boxShadow: "0 3px 18px rgba(53,208,127,0.07)",
                    transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
                    cursor: "pointer", height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "rgba(53,208,127,0.4)";
                    el.style.boxShadow = "0 6px 24px rgba(53,208,127,0.12)";
                    el.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "rgba(53,208,127,0.18)";
                    el.style.boxShadow = "0 3px 18px rgba(53,208,127,0.07)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {/* Gradient accent bar */}
                  <div
                    style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: "linear-gradient(90deg, #35D07F, #FCFF52)",
                      borderRadius: "20px 20px 0 0",
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 700, color: ls.color,
                        padding: "4px 10px", borderRadius: 6, background: ls.bg,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {ls.label}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(0,0,0,0.3)", fontFamily: "monospace" }}>
                      {q.topic}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0a1a0f", margin: "0 0 16px" }}>
                    {lang === "ENG" ? q.title : q.title_id}
                  </h3>

                  <div
                    style={{
                      borderTop: "1px solid rgba(53,208,127,0.10)", paddingTop: 12,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#1a9f5e" }}>
                      {q.reward}
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: isLive ? "#1a9f5e" : "#4a6357",
                          fontFamily: "monospace",
                          fontWeight: isLive ? 700 : 400,
                        }}
                      >
                        {isLive
                          ? "● Live Now"
                          : `${lang === "ENG" ? "Starts in" : "Mulai dalam"} ${q.time}`}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.3)", marginTop: 2 }}>
                        {q.players} {lang === "ENG" ? "players" : "pemain"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── MiniPay Banner ──────────────────────────────────────────────────────────

function MiniPayBanner() {
  const { lang } = useLanguage();

  return (
    <section style={{ padding: "100px 24px 0", background: "#ffffff", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Text + CTAs — centered */}
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto", marginBottom: 48 }}>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
              margin: "0 0 16px",
              letterSpacing: "-0.03em", lineHeight: 1.1,
              background: 'linear-gradient(90deg, #35D07F, #FCFF52)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {lang === "ENG" ? "Play with Celo MiniPay" : "Main dengan Celo MiniPay"}
          </h2>
          <p style={{ fontSize: 18, color: "#4a6357", margin: "0 0 32px", lineHeight: 1.6 }}>
            {lang === "ENG"
              ? "The fastest way to join quizzes. No seed phrase needed — just scan, connect, and play."
              : "Cara tercepat untuk bergabung dalam kuis. Tidak perlu seed phrase — cukup scan, sambungkan, dan main."}
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://www.opera.com/products/minipay"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                style={{
                  padding: "14px 32px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #1a9f5e, #35D07F)",
                  color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "inherit",
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
                {lang === "ENG" ? "Get MiniPay" : "Unduh MiniPay"}
              </button>
            </a>

            <a href="#how-it-works">
              <button
                style={{
                  padding: "14px 32px", borderRadius: 14, cursor: "pointer",
                  background: "transparent",
                  border: "1.5px solid rgba(53,208,127,0.3)",
                  color: "#0a1a0f", fontWeight: 600, fontSize: 16, fontFamily: "inherit",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(53,208,127,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(53,208,127,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(53,208,127,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {lang === "ENG" ? "Learn More" : "Pelajari Lebih"}
              </button>
            </a>
          </div>
        </div>

        {/* Phone mockup image — bleeds to bottom */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/minipay-phones.png"
            alt="MiniPay App Screenshots"
            width={1275}
            height={952}
            unoptimized
            loading="eager"
            style={{
              width: "100%", maxWidth: 900, height: "auto",
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))",
              display: "block",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function Leaderboard() {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState<number | null>(null);

  const rows = [
    { rank: 1, wallet: "0x1a2B...9f4E", score: 12450, badge: "🥇" },
    { rank: 2, wallet: "0x3c7D...2b1A", score: 11200, badge: "🥈" },
    { rank: 3, wallet: "0x8eF0...5c3D", score: 9870,  badge: "🥉" },
    { rank: 4, wallet: "0x2d4A...8e7F", score: 8340,  badge: "" },
    { rank: 5, wallet: "0x6bC1...1a9E", score: 7650,  badge: "" },
    { rank: 6, wallet: "0x9fE3...4d2B", score: 6280,  badge: "" },
  ];

  return (
    <section id="leaderboard" style={{ padding: "100px 24px", background: "#ffffff" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 14, fontWeight: 600, color: "#1a9f5e",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12,
            }}
          >
            {lang === "ENG" ? "Rankings" : "Peringkat"}
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700,
              letterSpacing: "-0.02em", margin: 0,
              background: 'linear-gradient(90deg, #35D07F, #FCFF52)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {lang === "ENG" ? "Live Leaderboard" : "Papan Peringkat"}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 24px", borderRadius: 16,
                background: "#f8fffc",
                border: "1.5px solid rgba(53,208,127,0.15)",
                transition: "border-color 0.3s, transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(53,208,127,0.4)";
                el.style.transform = "translateX(4px)";
                el.style.boxShadow = "0 4px 16px rgba(53,208,127,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(53,208,127,0.15)";
                el.style.transform = "translateX(0)";
                el.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  fontSize: r.rank <= 3 ? 28 : 16,
                  fontWeight: 800,
                  color: r.rank <= 3 ? "#1a9f5e" : "rgba(0,0,0,0.25)",
                  width: 40, textAlign: "center", flexShrink: 0,
                }}
              >
                {r.badge || `#${r.rank}`}
              </span>

              <span
                style={{
                  flex: 1, fontFamily: "monospace", fontSize: 15,
                  color: "#4a6357", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
                onClick={() => {
                  navigator.clipboard.writeText(r.wallet).catch(() => {});
                  setCopied(r.rank);
                  setTimeout(() => setCopied(null), 1500);
                }}
              >
                {r.wallet}
                <span
                  style={{
                    fontSize: 12,
                    color: copied === r.rank ? "#1a9f5e" : "rgba(0,0,0,0.2)",
                    transition: "color 0.2s",
                  }}
                >
                  {copied === r.rank ? "✓" : "⧉"}
                </span>
              </span>

              <span
                style={{
                  fontFamily: "monospace", fontSize: 18, fontWeight: 700,
                  color: "#1a9f5e",
                }}
              >
                {r.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            style={{
              padding: "12px 28px", borderRadius: 12, background: "transparent",
              border: "1.5px solid rgba(53,208,127,0.3)",
              color: "#1a9f5e", fontWeight: 600, fontSize: 15,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "#35D07F";
              el.style.borderColor = "#35D07F";
              el.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "transparent";
              el.style.borderColor = "rgba(53,208,127,0.3)";
              el.style.color = "#1a9f5e";
            }}
          >
            {lang === "ENG" ? "View All Ranks" : "Lihat Semua Peringkat"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function SiteFooter() {
  const { lang } = useLanguage();

  const platform = lang === "ENG"
    ? ["How It Works", "Quizzes", "Leaderboard", "FAQ"]
    : ["Cara Kerjanya", "Kuis", "Papan Peringkat", "FAQ"];

  const community = ["Twitter / X", "Discord", "Telegram", "GitHub"];

  return (
    <footer
      style={{
        position: "relative", padding: "60px 24px 40px",
        background: "#f8fffe",
        borderTop: "1px solid rgba(53,208,127,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: 1200, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 40,
        }}
      >
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Image
              src="/quiznih-footer-logo.png"
              alt="Quiznih"
              width={28}
              height={28}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <span style={{ fontWeight: 700, fontSize: 18, color: "#0a1a0f" }}>Quiznih</span>
          </div>
          <p style={{ fontSize: 14, color: "#4a6357", lineHeight: 1.6, margin: 0 }}>
            {lang === "ENG"
              ? "Decentralized trivia on Celo. Earn crypto for what you know."
              : "Trivia terdesentralisasi di Celo. Hasilkan kripto dari pengetahuanmu."}
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h4
            style={{
              fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.3)",
              textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px",
            }}
          >
            {lang === "ENG" ? "Platform" : "Platform"}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {platform.map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: 14, color: "#4a6357", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#1a9f5e")}
                onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#4a6357")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* Community links */}
        <div>
          <h4
            style={{
              fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.3)",
              textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px",
            }}
          >
            {lang === "ENG" ? "Community" : "Komunitas"}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {community.map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: 14, color: "#4a6357", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#1a9f5e")}
                onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#4a6357")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1200, margin: "40px auto 0",
          borderTop: "1px solid rgba(53,208,127,0.12)",
          paddingTop: 24, textAlign: "center",
        }}
      >
        <p style={{ fontSize: 13, color: "#4a6357", margin: 0 }}>
          © 2026 Quiznih.{" "}
          {lang === "ENG" ? "Built on Celo for MiniPay." : "Dibangun di atas Celo untuk MiniPay."}
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } },
};

const sectionStyle = { willChange: "transform, opacity" } as const;

export default function Home() {
  return (
    <main style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} style={sectionStyle}>
        <HowItWorks />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} style={sectionStyle}>
        <UpcomingQuizzes />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} style={sectionStyle}>
        <MiniPayBanner />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} style={sectionStyle}>
        <Leaderboard />
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} style={sectionStyle}>
        <SiteFooter />
      </motion.div>
    </main>
  );
}
