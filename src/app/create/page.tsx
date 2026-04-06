"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Wallet2, Send, GripVertical, Copy, CheckCircle, Loader2, AlertTriangle, LogOut,
  Upload, Gift, Shirt, Coffee, Sticker, ImageIcon, HelpCircle, FileJson, ExternalLink, Coins, Zap, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured, supabaseUrl } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import WalletDropdown from "@/components/WalletDropdown";
import { useSolanaQuiz } from "@/hooks/useSolanaQuiz";



interface QuestionData {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

export default function CreateQuizPage() {
  const { lang } = useLanguage();
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const {
    balance,
    isDepositing,
    isDevnet,
    isAirdropping,
    fetchBalance,
    depositRewardPool,
    requestDevnetAirdrop,
    getExplorerUrl: getExplorer,
  } = useSolanaQuiz();

  // Deposit state
  const [depositTx, setDepositTx] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [escrowAddress, setEscrowAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) setVisible(true);
    else fetchBalance();
  }, [publicKey, setVisible, fetchBalance]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPool, setRewardPool] = useState("0");
  const [rewardType, setRewardType] = useState<"sol" | "kaos" | "tumbler" | "sticker" | "nft" | "lainnya">("sol");
  const [rewardDesc, setRewardDesc] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [questions, setQuestions] = useState<QuestionData[]>([
    { id: 1, text: "", options: ["", "", "", ""], correctIndex: 0, timeLimit: 20 },
  ]);

  const REWARD_TYPES = [
    { value: "sol", label: "SOL", icon: "◎", desc: "Kripto Solana" },
    { value: "kaos", label: "Kaos", icon: "👕", desc: "Merchandise Kaos" },
    { value: "tumbler", label: "Tumbler", icon: "☕", desc: "Tumbler / Botol Minum" },
    { value: "sticker", label: "Sticker", icon: "🎨", desc: "Sticker Pack" },
    { value: "nft", label: "NFT", icon: "🖼️", desc: "NFT Gift" },
    { value: "lainnya", label: "Hadiah Lain", icon: "🎁", desc: "Tentukan sendiri" },
  ];

  const QUIZ_TEMPLATES = [
    {
      label: lang === "ENG" ? "Solana Basics" : "Dasar Solana",
      data: {
        title: "Solana Quiz", description: "Test your Solana knowledge!",
        questions: [
          { id: 1, text: "Siapa pencipta Solana?", options: ["Vitalik Buterin", "Anatoly Yakovenko", "Satoshi Nakamoto", "Charles Hoskinson"], correctIndex: 1, timeLimit: 20 },
          { id: 2, text: "Berapa TPS maksimum Solana?", options: ["1.000", "10.000", "65.000", "100.000"], correctIndex: 2, timeLimit: 20 },
          { id: 3, text: "Apa mekanisme konsensus Solana?", options: ["Proof of Work", "Proof of Stake", "Proof of History", "Proof of Authority"], correctIndex: 2, timeLimit: 20 },
        ]
      }
    },
    {
      label: lang === "ENG" ? "Web3 General" : "Web3 Umum",
      data: {
        title: "Web3 Knowledge Quiz", description: "General Web3 trivia!",
        questions: [
          { id: 1, text: "Kepanjangan dari NFT adalah?", options: ["Non-Fungible Token", "New Financial Transaction", "Network File Transfer", "None"], correctIndex: 0, timeLimit: 20 },
          { id: 2, text: "Apa itu DeFi?", options: ["Defense Finance", "Decentralized Finance", "Digital Framework", "Distributed Files"], correctIndex: 1, timeLimit: 20 },
          { id: 3, text: "Smart Contract pertama kali diperkenalkan di?", options: ["Bitcoin", "Solana", "Ethereum", "Polkadot"], correctIndex: 2, timeLimit: 20 },
        ]
      }
    },
  ];

  const handleImport = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error("Format tidak valid");
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      setQuestions(parsed.questions.map((q: any, i: number) => ({
        id: Date.now() + i,
        text: q.text || q.question || "",
        options: q.options || ["", "", "", ""],
        correctIndex: q.correctIndex ?? q.correct_index ?? 0,
        timeLimit: q.timeLimit || q.time_limit || 20,
      })));
      setShowImport(false);
      setImportJson("");
    } catch (e: any) {
      setImportError(lang === "ENG" ? "Invalid JSON format. Check your data." : "Format JSON tidak valid. Periksa data Anda.");
    }
  };

  const applyTemplate = (tpl: typeof QUIZ_TEMPLATES[0]) => {
    setTitle(tpl.data.title);
    setDescription(tpl.data.description);
    setQuestions(tpl.data.questions.map((q, i) => ({ ...q, id: Date.now() + i })));
    setShowImport(false);
  };

  const handleCopyPrompt = () => {
    const aiPrompt = lang === "ENG" 
      ? `Create a multiple choice trivia quiz about [ENTER TOPIC HERE] with 5 questions.
Return ONLY a valid JSON object in this exact format (no markdown formatting, no extra text):
{
  "title": "Quiz Title",
  "description": "Short quiz description",
  "questions": [
    {
      "text": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": 0,
      "timeLimit": 20
    }
  ]
}`
      : `Buatkan kuis pilihan ganda tentang [MASUKKAN TOPIK DISINI] dengan 5 soal.
Berikan HANYA text JSON valid dengan format persis seperti di bawah ini (tanpa markdown formatting, tanpa teks awalan/akhiran):
{
  "title": "Judul Kuis",
  "description": "Deskripsi singkat kuis",
  "questions": [
    {
      "text": "Pertanyaan?",
      "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
      "correctIndex": 0,
      "timeLimit": 20
    }
  ]
}`;
    
    navigator.clipboard.writeText(aiPrompt);
    setIsPromptCopied(true);
    setTimeout(() => setIsPromptCopied(false), 2000);
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        timeLimit: 20,
      },
    ]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qId: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const [roomCode, setRoomCode] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [quizState, setQuizState] = useState<"waiting" | "playing" | "finished">("waiting");

  // Real-time Leaderboard Subscription
  useEffect(() => {
    if (!quizId || !isPublished) return;

    // 1. Initial Fetch
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("quiz_id", quizId);
      if (data) setParticipants(data);
    };
    fetchParticipants();

    // 2. Real-time Subscription
    const channel = supabase
      .channel(`leaderboard-${quizId}`)
      .on('postgres_changes', {
        event: '*', // Listen to INSERT and UPDATE
        schema: 'public',
        table: 'leaderboard',
        filter: `quiz_id=eq.${quizId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => prev.map(p => p.user_wallet === payload.new.user_wallet ? payload.new : p));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId, isPublished]);

  const handlePublish = async () => {
    if (!publicKey) return;
    setIsPublishing(true);
    setDepositError(null);
    
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const walletStr = publicKey.toString();

      // 1. Ensure Profile Exists (silently, don't block if fails)
      try {
        await supabase.from("profiles").upsert(
          { wallet_address: walletStr },
          { onConflict: 'wallet_address' }
        );
      } catch (_) {
        // Non-critical, continue
      }

      // 2. Insert Quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          host_wallet: walletStr,
          title,
          description,
          room_code: code,
          reward_pool_amount: Number(rewardPool),
          status: 'waiting',
        })
        .select()
        .single();

      if (quizError) {
        const msg = quizError.message || JSON.stringify(quizError);
        throw new Error(`Quiz insert failed: ${msg}`);
      }
      if (!quizData) throw new Error("Quiz insert returned no data.");

      // 3. Insert Questions
      const questionsToInsert = questions.map((q, idx) => ({
        quiz_id: quizData.id,
        question_text: q.text,
        options: q.options,
        correct_answer_index: q.correctIndex,
        time_limit_seconds: q.timeLimit,
        order_number: idx,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) {
        const msg = questionsError.message || JSON.stringify(questionsError);
        throw new Error(`Questions insert failed: ${msg}`);
      }

      // 4. On-chain SOL deposit (if reward type is SOL and amount > 0)
      const solAmount = Number(rewardPool);
      if (rewardType === "sol" && solAmount > 0) {
        const depositResult = await depositRewardPool(quizData.id, solAmount);
        if (!depositResult.success) {
          setDepositError(depositResult.error || "Deposit failed");
          // Quiz is still created, just not funded on-chain
          // User can retry deposit later
        } else {
          setDepositTx(depositResult.txSignature || null);
          setEscrowAddress(depositResult.escrowAddress || null);
        }
      }

      // Success
      setQuizId(quizData.id);
      setRoomCode(code);
      setIsPublished(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error publishing quiz:", message);
      alert(`${lang === "ENG" ? "Failed to publish quiz" : "Gagal mempublikasikan kuis"}:\n\n${message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quizId) return;
    setIsStarting(true);
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ status: 'playing' })
        .eq("id", quizId);
      
      if (error) throw error;
      setQuizState("playing");
    } catch (err) {
      console.error("Error starting quiz:", err);
      alert("Failed to start quiz.");
    } finally {
      setIsStarting(false);
    }
  };

  const walletShort = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : "";

  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#9945FF]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#14F195]/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between relative z-50">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Back" : "Kembali"}</span>
        </Link>
        {publicKey && <WalletDropdown />}
      </header>

      {/* Supabase Connection Diagnostic */}
      {!isSupabaseConfigured && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-bold mb-1">⚠️ Supabase Not Connected</p>
              <p>Environment variables missing on Vercel. Add these in Vercel → Settings → Environment Variables:</p>
              <code className="block mt-2 text-xs bg-black/30 p-2 rounded">
                NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co<br/>
                NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...your-anon-key
              </code>
              <p className="mt-2 text-xs">Current URL: <code>{supabaseUrl}</code></p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                {lang === "ENG" ? "Create " : "Buat "}
                <span className="text-gradient">{lang === "ENG" ? "Quiz" : "Kuis"}</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {lang === "ENG"
                  ? "Design your quiz, set rewards, and share with players."
                  : "Rancang kuis, tentukan hadiah, dan bagikan ke pemain."}
              </p>
            </div>
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#9945FF]/10 border border-[#9945FF]/40 hover:bg-[#9945FF]/20 text-[#9945FF] font-bold transition-all shrink-0"
            >
              <FileJson className="w-5 h-5" />
              {lang === "ENG" ? "Import Quiz" : "Import Kuis"}
            </button>
          </div>
        </motion.div>

        {/* Import Panel */}
        {showImport && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2rem] border border-[#9945FF]/30 p-8 mb-8 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xl">📥 {lang === "ENG" ? "Quick Import Quiz" : "Import Kuis Cepat"}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Helpers */}
              <div className="space-y-6">
                {/* AI Prompt Generator */}
                <div className="p-5 rounded-2xl bg-[#9945FF]/10 border border-[#9945FF]/30 space-y-3">
                  <div className="flex items-center gap-2 text-[#9945FF] font-bold">
                    <MessageSquare className="w-5 h-5" />
                    <h4>{lang === "ENG" ? "Generate with AI" : "Buat via AI (ChatGPT/Claude)"}</h4>
                  </div>
                  <p className="text-sm text-gray-400">
                    {lang === "ENG" 
                      ? "Copy the prompt template below and paste it into any AI to generate a ready-to-use quiz JSON." 
                      : "Salin template prompt di bawah ke AI pilihanmu untuk membuat struktur JSON kuis otomatis."}
                  </p>
                  <button
                    onClick={handleCopyPrompt}
                    className="w-full py-2.5 rounded-xl bg-[#9945FF]/20 text-[#9945FF] font-semibold text-sm hover:bg-[#9945FF]/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isPromptCopied ? (
                      <><CheckCircle className="w-4 h-4" /> {lang === "ENG" ? "Copied!" : "Disalin!"}</>
                    ) : (
                      <><Copy className="w-4 h-4" /> {lang === "ENG" ? "Copy AI Prompt" : "Salin Prompt AI"}</>
                    )}
                  </button>
                </div>

                {/* Templates */}
                <div className="p-5 rounded-2xl bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
                  <p className="text-sm font-semibold text-gray-500">{lang === "ENG" ? "Starter Templates" : "Template Siap Pakai"}</p>
                  <div className="flex flex-wrap gap-2">
                    {QUIZ_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        onClick={() => applyTemplate(tpl)}
                        className="px-4 py-2 rounded-xl bg-white/50 dark:bg-black/30 border border-black/10 dark:border-white/10 font-semibold text-xs hover:border-[#9945FF]/50 hover:text-[#9945FF] transition-all"
                      >
                        🚀 {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: JSON Paste */}
              <div className="flex flex-col h-full">
                <p className="text-sm font-semibold text-gray-500 mb-2">{lang === "ENG" ? "Paste JSON Result Here" : "Tempel Hasil JSON Disini"}</p>
                <textarea
                  value={importJson}
                  onChange={(e) => { setImportJson(e.target.value); setImportError(""); }}
                  placeholder={'{ "title": "My Quiz", "questions": [{"text":"...","options":["A","B","C","D"],"correctIndex":0,"timeLimit":20}] }'}
                  className="flex-1 w-full p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#9945FF]/50 transition-all font-mono text-xs resize-none min-h-[200px]"
                />
                {importError && <p className="text-red-400 text-sm mt-2 font-semibold">⚠️ {importError}</p>}
                <button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="mt-4 w-full py-4 rounded-xl bg-[#9945FF] text-white font-bold hover:bg-[#7B3FE4] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {lang === "ENG" ? "Apply Import Data" : "Terapkan Data Import"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isPublished ? (
          /* Published State - Host Control Room */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Success Banner */}
            <div className="glass rounded-[2.5rem] border border-[#14F195]/40 p-10 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#14F195] to-[#0EC97F] flex items-center justify-center shadow-[0_0_40px_rgba(20,241,149,0.3)]">
                <Send className="w-10 h-10 text-black" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold">
                  {lang === "ENG" ? "Quiz Published!" : "Kuis Dipublikasikan!"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {lang === "ENG"
                    ? "Share the QR code or room code with your players"
                    : "Bagikan QR code atau kode ruangan ke pemain Anda"}
                </p>
              </div>
            </div>

            {/* On-Chain Deposit Status */}
            {rewardType === "sol" && Number(rewardPool) > 0 && (
              <div className={`glass rounded-[2rem] border p-8 space-y-4 ${
                depositTx
                  ? "border-[#14F195]/40"
                  : depositError
                  ? "border-yellow-500/40"
                  : "border-[#9945FF]/30"
              }`}>
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-[#14F195]" />
                  <h3 className="text-xl font-bold">
                    {lang === "ENG" ? "On-Chain Reward Pool" : "Reward Pool On-Chain"}
                  </h3>
                </div>

                {depositTx ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#14F195] font-bold">
                      <CheckCircle className="w-5 h-5" />
                      <span>{lang === "ENG" ? "Deposit Confirmed!" : "Deposit Terkonfirmasi!"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500">TX:</span>
                      <code className="text-xs font-mono text-gray-400 bg-black/10 dark:bg-white/5 px-2 py-1 rounded">
                        {depositTx.slice(0, 20)}...{depositTx.slice(-8)}
                      </code>
                      <a
                        href={getExplorer(depositTx)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#9945FF] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Explorer
                      </a>
                    </div>
                    {escrowAddress && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500">{lang === "ENG" ? "Escrow:" : "Eskro:"}</span>
                        <code className="text-xs font-mono text-gray-400 bg-black/10 dark:bg-white/5 px-2 py-1 rounded">
                          {escrowAddress.slice(0, 12)}...{escrowAddress.slice(-8)}
                        </code>
                      </div>
                    )}
                    <div className="px-4 py-3 rounded-xl bg-[#14F195]/10 text-sm font-semibold text-[#14F195]">
                      ◎ {rewardPool} SOL {lang === "ENG" ? "locked in escrow" : "terkunci di eskro"}
                    </div>
                  </div>
                ) : depositError ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                      <span>{lang === "ENG" ? "Deposit Not Completed" : "Deposit Belum Selesai"}</span>
                    </div>
                    <p className="text-sm text-gray-500">{depositError}</p>
                    <button
                      onClick={async () => {
                        if (!quizId) return;
                        setDepositError(null);
                        const result = await depositRewardPool(quizId, Number(rewardPool));
                        if (result.success) {
                          setDepositTx(result.txSignature || null);
                          setEscrowAddress(result.escrowAddress || null);
                        } else {
                          setDepositError(result.error || "Retry failed");
                        }
                      }}
                      disabled={isDepositing}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isDepositing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "ENG" ? "Processing..." : "Memproses..."}</>
                      ) : (
                        <><Coins className="w-4 h-4" /> {lang === "ENG" ? "Retry Deposit" : "Ulangi Deposit"}</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#9945FF]" />
                    <span className="text-gray-500 font-medium">
                      {lang === "ENG" ? "Processing deposit..." : "Memproses deposit..."}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QR Code + Room Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code Card */}
              <div className="glass rounded-[2rem] border border-black/10 dark:border-white/10 p-8 flex flex-col items-center space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  📱 {lang === "ENG" ? "Scan to Join" : "Scan untuk Gabung"}
                </h3>
                {/* QR Code Visual */}
                <div className="bg-white p-5 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <QRCodeSVG value={`https://quiznih.vercel.app/play?code=${roomCode}`} size={160} />
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://quiznih.vercel.app/play?code=${roomCode}`);
                    alert(lang === "ENG" ? "Play Link Copied!" : "Tautan Kuis Disalin!");
                  }}
                  className="px-6 py-2.5 bg-[#14F195]/20 text-[#14F195] rounded-full font-bold border border-[#14F195]/50 hover:bg-[#14F195]/30 transition-all shadow-[0_0_15px_rgba(20,241,149,0.3)] w-full text-center mt-2"
                >
                  🔗 {lang === "ENG" ? "Share Link" : "Bagikan Tautan"}
                </button>
              </div>

              {/* Room Code Card */}
              <div className="glass rounded-[2rem] border border-black/10 dark:border-white/10 p-8 flex flex-col items-center justify-center space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  🔑 {lang === "ENG" ? "Room Code" : "Kode Ruangan"}
                </h3>
                <div className="px-10 py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-mono text-4xl md:text-5xl font-extrabold tracking-[0.3em] shadow-[0_0_40px_rgba(153,69,255,0.2)]">
                  {roomCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#9945FF]/10 hover:bg-[#9945FF]/20 border border-[#9945FF]/30 text-[#9945FF] font-bold text-sm transition-all flex items-center gap-2"
                >
                  {copied 
                    ? <><CheckCircle className="w-4 h-4" /> {lang === "ENG" ? "Copied!" : "Tersalin!"}</> 
                    : <><Copy className="w-4 h-4" /> {lang === "ENG" ? "Copy Code" : "Salin Kode"}</>}
                </button>
              </div>
            </div>

            {/* Host Waiting Room */}
            <div className="glass rounded-[2rem] border border-black/10 dark:border-white/10 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  👥 {lang === "ENG" ? "Waiting Room" : "Ruang Tunggu"}
                </h3>
                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/30">
                  <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                  <span className="text-sm font-semibold text-[#14F195]">
                    {participants.length} {lang === "ENG" ? "players online" : "pemain online"}
                  </span>
                </div>
              </div>
              
              {/* Participant List (Live Leaderboard) */}
              <div className="space-y-3">
                {participants.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 italic">
                    {lang === "ENG" ? "Waiting for players to join..." : "Menunggu pemain bergabung..."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {participants
                      .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
                      .map((p, idx) => (
                        <motion.div
                          key={p.user_wallet}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                              idx === 0 ? "bg-[#FDE047] text-black" : "bg-white/10 text-gray-400"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-bold truncate max-w-[120px]">{p.player_name || "Anonymous"}</span>
                          </div>
                          <span className="font-mono text-[#14F195] font-bold">{p.final_score} pts</span>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>

              {/* Quiz Summary */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="px-4 py-2 rounded-xl bg-[#9945FF]/10 text-sm font-semibold">
                  📝 {questions.length} {lang === "ENG" ? "Questions" : "Soal"}
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#14F195]/10 text-sm font-semibold">
                  💰 {rewardPool} SOL
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#FDE047]/10 text-sm font-semibold">
                  ⏱ {questions.reduce((a, q) => a + (q.timeLimit || 0), 0)}s {lang === "ENG" ? "total" : "total"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(`/create/room/${quizId}`)}
                className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white dark:text-black font-extrabold text-lg flex items-center justify-center gap-3 transition-all"
              >
                🎮 {lang === "ENG" ? "Go to Control Room" : "Ke Ruang Kontrol"}
              </button>
              <Link
                href="/manage"
                className="py-5 px-8 rounded-2xl glass border border-white/20 font-bold text-center hover:bg-white/10 transition-colors"
              >
                {lang === "ENG" ? "Manage All" : "Kelola Semua"}
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Quiz Form */
          <div className="space-y-8">
            {/* Quiz Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-[2rem] p-8 border border-black/10 dark:border-white/10 space-y-6"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                📝 {lang === "ENG" ? "Quiz Information" : "Informasi Kuis"}
              </h2>

              <div className="space-y-4">
                {/* Wallet Balance Display */}
                {publicKey && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/10 border border-[#9945FF]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                        <Wallet2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Your Balance" : "Saldo Anda"}</p>
                        <p className="text-lg font-black text-[#14F195]">
                          {balance !== null ? `◎ ${balance.toFixed(4)} SOL` : "Loading..."}
                        </p>
                      </div>
                    </div>
                    {isDevnet && (
                      <button
                        onClick={() => requestDevnetAirdrop(2)}
                        disabled={isAirdropping}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9945FF]/20 border border-[#9945FF]/30 text-[#9945FF] text-xs font-bold hover:bg-[#9945FF]/30 transition-all disabled:opacity-50"
                      >
                        {isAirdropping ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Airdrop...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Devnet Airdrop</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {lang === "ENG" ? "Quiz Title" : "Judul Kuis"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={lang === "ENG" ? "e.g. Solana Ecosystem Mastery" : "contoh: Penguasaan Ekosistem Solana"}
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF]/50 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {lang === "ENG" ? "Description" : "Deskripsi"}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder={lang === "ENG" ? "Brief description..." : "Deskripsi singkat..."}
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF]/50 transition-all resize-none"
                  />
                </div>

                {/* Reward Type Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    {lang === "ENG" ? "Reward / Prize Pool" : "Jenis Hadiah"}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                    {REWARD_TYPES.map((rt) => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => setRewardType(rt.value as any)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all font-semibold text-xs ${
                          rewardType === rt.value
                            ? "border-[#14F195] bg-[#14F195]/15 text-[#14F195]"
                            : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-500 hover:border-[#14F195]/40"
                        }`}
                      >
                        <span className="text-2xl">{rt.icon}</span>
                        <span>{rt.label}</span>
                      </button>
                    ))}
                  </div>

                  {rewardType === "sol" && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={rewardPool}
                        onChange={(e) => setRewardPool(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#14F195]/30 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14F195]/50 transition-all text-lg font-mono"
                      />
                      <span className="font-black text-[#14F195] text-xl">SOL</span>
                    </div>
                  )}
                  {rewardType !== "sol" && (
                    <input
                      type="text"
                      value={rewardDesc}
                      onChange={(e) => setRewardDesc(e.target.value)}
                      placeholder={lang === "ENG" ? `Describe the ${REWARD_TYPES.find(r=>r.value===rewardType)?.label} prize...` : `Deskripsi hadiah ${REWARD_TYPES.find(r=>r.value===rewardType)?.label}...`}
                      className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#14F195]/30 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14F195]/50 transition-all"
                    />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Questions */}
            {questions.map((q, qIdx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + qIdx * 0.05 }}
                className="glass rounded-[2rem] p-8 border border-black/10 dark:border-white/10 space-y-5 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-bold">
                      {lang === "ENG" ? `Question ${qIdx + 1}` : `Soal ${qIdx + 1}`}
                    </h3>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                  placeholder={lang === "ENG" ? "Enter your question..." : "Tulis pertanyaanmu..."}
                  className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF]/50 transition-all"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="relative">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                        placeholder={`${lang === "ENG" ? "Option" : "Opsi"} ${String.fromCharCode(65 + optIdx)}`}
                        className={`w-full px-5 py-3 rounded-xl border transition-all focus:outline-none ${
                          q.correctIndex === optIdx
                            ? "bg-[#14F195]/10 border-[#14F195]/50 ring-2 ring-[#14F195]/30"
                            : "bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10"
                        } text-black dark:text-white placeholder-gray-400`}
                      />
                      <button
                        onClick={() => updateQuestion(q.id, "correctIndex", optIdx)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded-md transition-all ${
                          q.correctIndex === optIdx
                            ? "bg-[#14F195] text-black"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-[#14F195]/50"
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-500 font-semibold">
                    ⏱ {lang === "ENG" ? "Time limit:" : "Batas waktu:"}
                  </label>
                  <select
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(q.id, "timeLimit", Number(e.target.value))}
                    className="px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white focus:outline-none"
                  >
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
              </motion.div>
            ))}

            {/* Add Question */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={addQuestion}
              className="w-full py-5 rounded-2xl border-2 border-dashed border-[#9945FF]/30 hover:border-[#9945FF]/60 text-[#9945FF] font-bold flex items-center justify-center gap-2 hover:bg-[#9945FF]/5 transition-all"
            >
              <Plus className="w-5 h-5" />
              {lang === "ENG" ? "Add Question" : "Tambah Soal"}
            </motion.button>

            {/* Publish */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handlePublish}
              disabled={!title || questions.some((q) => !q.text || q.options.some((o) => !o)) || isPublishing}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white dark:text-black font-extrabold text-lg hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isPublishing ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> {lang === "ENG" ? "Publishing..." : "Memproses..."}</>
              ) : (
                <><Send className="w-6 h-6" /> {lang === "ENG" ? "Publish Quiz" : "Publikasikan Kuis"}</>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </main>
  );
}
