"use client";
import { ArrowLeft, Globe2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";

interface TopBarProps {
  /** Override back destination. If not provided, uses router.back() */
  backHref?: string;
  /** Hide back button (e.g. on landing page) */
  hideBack?: boolean;
}

export default function TopBar({ backHref, hideBack = false }: TopBarProps) {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      background: "rgba(232, 253, 242, 0.85)",
      borderBottom: "1px solid rgba(53, 208, 127, 0.15)",
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
        {/* Left: Back */}
        <div>
          {!hideBack && (
            <button
              onClick={handleBack}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                color: "#4a6357", background: "none", border: "none",
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                fontFamily: "inherit", padding: "4px 8px", borderRadius: 8,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1a9f5e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4a6357")}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Right: Language */}
        <div ref={langRef} style={{ position: "relative" }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 10,
              border: "1.5px solid rgba(53,208,127,0.25)",
              background: "rgba(53,208,127,0.07)",
              color: "#1a9f5e", fontWeight: 700, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(53,208,127,0.14)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(53,208,127,0.07)")}
          >
            <span>{currentLang.flag}</span>
            <span>{lang}</span>
            <ChevronDown style={{ width: 12, height: 12, transition: "transform 0.2s", transform: langOpen ? "rotate(180deg)" : "none" }} />
          </button>

          {langOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 176, background: "#ffffff",
              border: "1.5px solid rgba(53,208,127,0.2)",
              borderRadius: 16, boxShadow: "0 8px 32px rgba(53,208,127,0.12)",
              overflow: "hidden", zIndex: 100,
            }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                    background: lang === l.code ? "rgba(53,208,127,0.08)" : "#fff",
                    color: lang === l.code ? "#1a9f5e" : "#4a6357",
                    textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (lang !== l.code) (e.currentTarget as HTMLButtonElement).style.background = "rgba(53,208,127,0.04)"; }}
                  onMouseLeave={(e) => { if (lang !== l.code) (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
                >
                  <span style={{ fontSize: 16 }}>{l.flag}</span>
                  <span style={{ flex: 1 }}>{l.label}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#4a6357", opacity: 0.6 }}>{l.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
