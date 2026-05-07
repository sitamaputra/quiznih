"use client";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MessageCircle, Send, ThumbsUp, Reply, Eye, EyeOff,
  Users, Hash, Plus, ChevronDown, Clock, Sparkles, UserCircle2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface Question {
  id: string;
  text: string;
  author: string;
  isAnonymous: boolean;
  timestamp: number;
  upvotes: number;
  upvotedBy: string[];
  replies: QuestionReply[];
  pinned: boolean;
}

interface QuestionReply {
  id: string;
  text: string;
  author: string;
  isAnonymous: boolean;
  timestamp: number;
}

const AVATAR_COLORS = [
  "#35D07F", "#FCFF52", "#60A5FA", "#F472B6", "#A78BFA",
  "#F59E0B", "#EF4444", "#10B981", "#8B5CF6", "#EC4899",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(ts: number, lang: string): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return lang === "ENG" ? "just now" : "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function QAPage() {
  const { lang } = useLanguage();
  const [roomCode, setRoomCode] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAnon, setReplyAnon] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [liveCount, setLiveCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load/save questions from localStorage per room
  const storageKey = `qa_room_${roomCode}`;

  useEffect(() => {
    if (!isJoined) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setQuestions(JSON.parse(saved)); } catch (_) {}
    }
  }, [isJoined, storageKey]);

  useEffect(() => {
    if (!isJoined || questions.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify(questions));
  }, [questions, isJoined, storageKey]);

  // Simulate live participant count
  useEffect(() => {
    if (!isJoined) return;
    setLiveCount(Math.floor(Math.random() * 10) + 3);
    const t = setInterval(() => {
      setLiveCount(prev => Math.max(2, prev + Math.floor(Math.random() * 5) - 2));
    }, 8000);
    return () => clearInterval(t);
  }, [isJoined]);

  const handleJoin = () => {
    if (!roomCode.trim() || !username.trim()) return;
    setIsJoined(true);
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    const q: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: newQuestion.trim(),
      author: isAnonymous ? (lang === "ENG" ? "Anonymous" : "Anonim") : username,
      isAnonymous,
      timestamp: Date.now(),
      upvotes: 0,
      upvotedBy: [],
      replies: [],
      pinned: false,
    };
    setQuestions(prev => [q, ...prev]);
    setNewQuestion("");
  };

  const handleUpvote = (qId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const alreadyVoted = q.upvotedBy.includes(username);
      return {
        ...q,
        upvotes: alreadyVoted ? q.upvotes - 1 : q.upvotes + 1,
        upvotedBy: alreadyVoted
          ? q.upvotedBy.filter(u => u !== username)
          : [...q.upvotedBy, username],
      };
    }));
  };

  const handleReply = (qId: string) => {
    if (!replyText.trim()) return;
    const reply: QuestionReply = {
      id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: replyText.trim(),
      author: replyAnon ? (lang === "ENG" ? "Anonymous" : "Anonim") : username,
      isAnonymous: replyAnon,
      timestamp: Date.now(),
    };
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return { ...q, replies: [...q.replies, reply] };
    }));
    setReplyText("");
    setReplyAnon(false);
    setReplyingTo(null);
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sortBy === "popular") return b.upvotes - a.upvotes;
    return b.timestamp - a.timestamp;
  });

  // ====== JOIN SCREEN ======
  if (!isJoined) {
    return (
      <main className="min-h-screen w-full text-black dark:text-white flex flex-col relative">
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#06B6D4]/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#FCFF52]/10 blur-[150px] rounded-full" />
        </div>

        <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{lang === "ENG" ? "Back" : "Kembali"}</span>
          </Link>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold">
              💬 <span className="text-gradient">{lang === "ENG" ? "Live Q&A" : "Tanya Jawab Live"}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {lang === "ENG"
                ? "Ask questions, vote, and reply — just like Slido! Anonymous mode available."
                : "Ajukan pertanyaan, vote, dan balas — seperti Slido! Bisa anonim."}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-[2.5rem] border border-[#06B6D4]/30 p-10 max-w-md w-full space-y-6"
          >
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-500">
                {lang === "ENG" ? "Your Name" : "Nama Kamu"}
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={lang === "ENG" ? "Enter your name" : "Masukkan nama"}
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-[#06B6D4]/50 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-500">
                {lang === "ENG" ? "Room Code" : "Kode Ruangan"}
              </label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. QNA123"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-2xl font-mono font-bold tracking-widest placeholder-gray-600 focus:outline-none focus:border-[#06B6D4]/50 transition-all"
              />
            </div>

            <button onClick={handleJoin} disabled={!roomCode.trim() || !username.trim()}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#06B6D4] to-[#35D07F] text-black font-extrabold text-lg hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all disabled:opacity-40 flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              {lang === "ENG" ? "Join Room" : "Masuk Ruangan"}
            </button>

            <p className="text-center text-xs text-gray-600">
              {lang === "ENG" ? "Create any room code and share it" : "Buat kode ruangan lalu bagikan"}
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  // ====== Q&A ROOM VIEW ======
  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#06B6D4]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#35D07F]/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between flex-wrap gap-4">
        <button onClick={() => setIsJoined(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Leave" : "Keluar"}</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-extrabold uppercase tracking-widest">
            <Hash className="w-3.5 h-3.5" /> {roomCode}
          </span>
          <span className="flex items-center gap-2 px-3 py-2 rounded-full glass border border-white/10 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {liveCount} <Users className="w-3.5 h-3.5 inline" />
          </span>
          <span className="px-3 py-2 rounded-full glass border border-white/10 text-xs font-bold">
            <UserCircle2 className="w-3.5 h-3.5 inline mr-1" />{username}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-32">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            💬 <span className="text-gradient">{lang === "ENG" ? "Live Q&A" : "Tanya Jawab Live"}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">{questions.length} {lang === "ENG" ? "questions" : "pertanyaan"}</p>
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10">
            <button onClick={() => setSortBy("recent")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                sortBy === "recent" ? "bg-[#06B6D4] text-white shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> {lang === "ENG" ? "Recent" : "Terbaru"}
            </button>
            <button onClick={() => setSortBy("popular")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                sortBy === "popular" ? "bg-[#FCFF52] text-black shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> {lang === "ENG" ? "Popular" : "Populer"}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedQuestions.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 space-y-4"
              >
                <div className="text-6xl">🤔</div>
                <p className="text-gray-500 font-semibold">
                  {lang === "ENG" ? "No questions yet. Be the first to ask!" : "Belum ada pertanyaan. Jadilah yang pertama!"}
                </p>
              </motion.div>
            )}

            {sortedQuestions.map((q) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`rounded-2xl border p-5 transition-all ${
                  q.pinned
                    ? "bg-[#FCFF52]/5 border-[#FCFF52]/30"
                    : "bg-white/[0.02] dark:bg-white/[0.02] border-white/5 dark:border-white/5 hover:border-[#06B6D4]/30"
                }`}
              >
                {/* Question header */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black text-black"
                    style={{ background: q.isAnonymous ? "#6B7280" : getAvatarColor(q.author) }}
                  >
                    {q.isAnonymous ? <EyeOff className="w-4 h-4 text-white" /> : q.author.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-sm">{q.author}</span>
                      {q.isAnonymous && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-500/20 text-gray-400 font-bold uppercase">
                          {lang === "ENG" ? "Anonymous" : "Anonim"}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{timeAgo(q.timestamp, lang)}</span>
                      {q.pinned && <span className="text-xs">📌</span>}
                    </div>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{q.text}</p>
                  </div>

                  {/* Upvote */}
                  <button
                    onClick={() => handleUpvote(q.id)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-shrink-0 ${
                      q.upvotedBy.includes(username)
                        ? "bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4]"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-black">{q.upvotes}</span>
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 ml-[52px]">
                  <button onClick={() => setReplyingTo(replyingTo === q.id ? null : q.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#06B6D4] font-bold transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    {lang === "ENG" ? "Reply" : "Balas"} {q.replies.length > 0 && `(${q.replies.length})`}
                  </button>
                </div>

                {/* Replies */}
                {q.replies.length > 0 && (
                  <div className="ml-[52px] mt-3 space-y-2.5">
                    {q.replies.map(r => (
                      <div key={r.id} className="flex items-start gap-2.5 pl-4 border-l-2 border-[#06B6D4]/20">
                        <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black text-black"
                          style={{ background: r.isAnonymous ? "#6B7280" : getAvatarColor(r.author) }}
                        >
                          {r.isAnonymous ? <EyeOff className="w-3 h-3 text-white" /> : r.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-xs">{r.author}</span>
                            {r.isAnonymous && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-500/20 text-gray-400 font-bold">ANON</span>
                            )}
                            <span className="text-[10px] text-gray-500">{timeAgo(r.timestamp, lang)}</span>
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                <AnimatePresence>
                  {replyingTo === q.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="ml-[52px] mt-3 overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleReply(q.id)}
                          placeholder={lang === "ENG" ? "Write a reply..." : "Tulis balasan..."}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:border-[#06B6D4]/50 transition-all"
                          autoFocus
                        />
                        <button onClick={() => setReplyAnon(!replyAnon)}
                          className={`p-2.5 rounded-xl border transition-all ${
                            replyAnon ? "bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]" : "bg-white/5 border-white/10 text-gray-500 hover:text-[#06B6D4]"
                          }`}
                          title={lang === "ENG" ? "Toggle anonymous" : "Toggle anonim"}
                        >
                          {replyAnon ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleReply(q.id)} disabled={!replyText.trim()}
                          className="p-2.5 rounded-xl bg-[#06B6D4] text-white hover:bg-[#06B6D4]/80 transition-all disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-3">
          <motion.div initial={{ y: 40 }} animate={{ y: 0 }}
            className="rounded-2xl border border-[#06B6D4]/30 bg-white/90 dark:bg-[#0a0a12]/95 backdrop-blur-xl p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmitQuestion()}
                placeholder={lang === "ENG" ? "Ask a question..." : "Ajukan pertanyaan..."}
                className="flex-1 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-base placeholder-gray-500 focus:outline-none focus:border-[#06B6D4]/50 transition-all"
              />
              <button onClick={() => setIsAnonymous(!isAnonymous)}
                className={`p-3 rounded-xl border transition-all flex-shrink-0 ${
                  isAnonymous
                    ? "bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]"
                    : "bg-white/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-gray-400 hover:text-[#06B6D4]"
                }`}
                title={isAnonymous ? (lang === "ENG" ? "Anonymous ON" : "Anonim AKTIF") : (lang === "ENG" ? "Go Anonymous" : "Mode Anonim")}
              >
                {isAnonymous ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button onClick={handleSubmitQuestion} disabled={!newQuestion.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#35D07F] text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-40 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {isAnonymous && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[11px] text-[#06B6D4] font-bold mt-2 ml-1 flex items-center gap-1"
              >
                <EyeOff className="w-3 h-3" /> {lang === "ENG" ? "Posting anonymously" : "Mengirim secara anonim"}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
