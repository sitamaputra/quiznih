"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount, useConnect, useConnectors } from "wagmi";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Wallet2, QrCode, Keyboard, ArrowRight, Users, Trophy, Clock, CheckCircle2, XCircle, Gift, LogOut, ExternalLink, Loader2, Volume2, VolumeX
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import WalletDropdown from "@/components/WalletDropdown";
import { useCeloQuiz } from "@/hooks/useCeloQuiz";
import TopBar from "@/components/TopBar";

const BGM_URLS = [
  "https://cdn.pixabay.com/audio/2024/11/28/audio_3fac7f0464.mp3",
  "https://cdn.pixabay.com/audio/2022/10/25/audio_32ff41a00f.mp3",
  "https://cdn.pixabay.com/audio/2023/09/06/audio_13fae43d92.mp3",
];

const FLOATING_EMOJIS = ["🎯","⚡","🔥","💎","🏆","🎮","✨","🚀","💰","🎉","⭐","🎪"];
const CORRECT_SFX_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_5e5a3779f3.mp3";
const WRONG_SFX_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_b4c5a4cd9e.mp3";

export default function PlayPage() {
  const { lang } = useLanguage();
  const { address: publicKey, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();

  useEffect(() => {
    if (!publicKey && connectors.length > 0) connect({ connector: connectors[0] });
  }, [publicKey, connectors, connect]);

  const { getExplorerTxUrl: getExplorer } = useCeloQuiz();

  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinMode, setJoinMode] = useState<"select" | "qr" | "code">("select");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const codeUrl = params.get("code");
      if (codeUrl) {
        setRoomCode(codeUrl);
        setJoinMode("code");
      }
    }
  }, []);
  const [isJoined, setIsJoined] = useState(false);
  const [quizState, setQuizState] = useState<"waiting" | "playing" | "revealed" | "finished">("waiting");
  
  // Game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(3);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  // Music & SFX
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [currentBgm, setCurrentBgm] = useState(0);
  const [streak, setStreak] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<{id:number;emoji:string;x:number;delay:number}[]>([]);

  // Initialize floating emojis
  useEffect(() => {
    if (!isJoined) return;
    const emojis = Array.from({length: 12}, (_, i) => ({
      id: i, emoji: FLOATING_EMOJIS[i % FLOATING_EMOJIS.length],
      x: Math.random() * 100, delay: Math.random() * 5,
    }));
    setFloatingEmojis(emojis);
  }, [isJoined]);

  // Music toggle
  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(BGM_URLS[currentBgm]);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    if (musicOn) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setMusicOn(!musicOn);
  };

  const nextTrack = () => {
    const next = (currentBgm + 1) % BGM_URLS.length;
    setCurrentBgm(next);
    if (audioRef.current) {
      audioRef.current.src = BGM_URLS[next];
      if (musicOn) audioRef.current.play().catch(() => {});
    }
  };

  const AVATARS = [
    { emoji: "🐶", name: "Doggo", color: "#F59E0B" },
    { emoji: "🐱", name: "Kitty", color: "#EC4899" },
    { emoji: "🐸", name: "Froggy", color: "#FCFF52" },
    { emoji: "🦊", name: "Foxi", color: "#F97316" },
    { emoji: "🐼", name: "Panda", color: "#6B7280" },
    { emoji: "🦁", name: "Leo", color: "#EAB308" },
    { emoji: "🐯", name: "Tiger", color: "#F97316" },
    { emoji: "🐙", name: "Octo", color: "#35D07F" },
    { emoji: "🦄", name: "Uni", color: "#EC4899" },
    { emoji: "🐲", name: "Drago", color: "#FCFF52" },
    { emoji: "🤖", name: "Robot", color: "#60A5FA" },
    { emoji: "👾", name: "Alien", color: "#A78BFA" },
  ];

  const prevAvatar = () => setSelectedAvatar(i => (i - 1 + AVATARS.length) % AVATARS.length);
  const nextAvatar = () => setSelectedAvatar(i => (i + 1) % AVATARS.length);

  // Timer logic
  useEffect(() => {
    if (quizState === "playing" && timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizState === "playing" && selectedAnswer === null) {
      // Auto-submit wrong answer if time runs out
      handleAnswerSelection(-1); 
    }
  }, [quizState, timeLeft, selectedAnswer]);

  const handleAnswerSelection = async (index: number) => {
    setSelectedAnswer(index);
    if (!questions[currentQuestionIndex]) return;
    const correct = index === questions[currentQuestionIndex].correct_answer_index;
    setIsCorrect(correct);
    
    let newScore = score;
    if (correct) {
      // Base score + time bonus
      newScore = score + 100 + (timeLeft * 10);
      setScore(newScore);
      setStreak(s => s + 1);
      // Correct SFX
      try { new Audio(CORRECT_SFX_URL).play(); } catch(_) {}
    } else {
      setStreak(0);
      try { new Audio(WRONG_SFX_URL).play(); } catch(_) {}
    }
    
    // Attempt to update score live on Supabase
    if (quizInfo && publicKey) {
      // fire and forget update
      supabase.from("leaderboard")
        .update({ final_score: newScore })
        .eq("quiz_id", quizInfo.id)
        .eq("user_wallet", publicKey)
        .then();
    }
    
    // Add small delay before revealing answer to create suspense
    setTimeout(() => {
      setQuizState("revealed");
      setRevealCountdown(3);
    }, 1500);
  };

  // Auto-advance to next question after 3 seconds in revealed state
  useEffect(() => {
    if (quizState !== "revealed") return;
    if (revealCountdown <= 0) {
      nextQuestion();
      return;
    }
    const t = setTimeout(() => setRevealCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [quizState, revealCountdown]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimeLeft(questions[currentQuestionIndex + 1].time_limit_seconds || 15);
      setQuizState("playing");
    } else {
      setQuizState("finished");
      // Trigger confetti when finished
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#35D07F', '#FCFF52', '#FDE047']
      });
    }
  };

  // On-chain claim state
  const [claimTxSignature, setClaimTxSignature] = useState<string | null>(null);
  const [claimRewardAmount, setClaimRewardAmount] = useState<number | null>(null);
  const [claimRank, setClaimRank] = useState<number | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClaimReward = async () => {
    if (!quizInfo?.id) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      const result = await claimReward(quizInfo.id);
      
      if (result.success) {
        setHasClaimed(true);
        setClaimTxSignature(result.txSignature || null);
        setClaimRewardAmount(result.rewardAmount || null);
        setClaimRank(result.rank || null);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#FCFF52', '#35D07F', '#FDE047']
        });
      } else {
        setClaimError(result.error || "Failed to claim reward");
        // Still show success for non-CELO quizzes or demo quizzes
        if (quizInfo.id?.startsWith('demo')) {
          setHasClaimed(true);
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#FCFF52']
          });
        }
      }
    } catch (err: any) {
      console.error("Claim error:", err);
      setClaimError(err.message || "An error occurred");
    } finally {
      setIsClaiming(false);
    }
  };

  const walletShort = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : "";

  // Demo quiz data (always works, no database needed)
  const DEMO_QUIZ = {
    id: 'demo-123456',
    host_wallet: 'demo-host',
    title: 'Web3 & Celo Trivia',
    description: 'Uji pengetahuan Web3 kamu!',
    room_code: '123456',
    status: 'playing',
    reward_pool_amount: 0.5,
  };
  const DEMO_QUESTIONS = [
    {
      id: 'dq1',
      quiz_id: 'demo-123456',
      question_text: 'Siapakah pencipta Bitcoin (nama samaran)?',
      options: ['Satoshi Nakamoto', 'Vitalik Buterin', 'Elon Musk', 'Anatoly Yakovenko'],
      correct_answer_index: 0,
      time_limit_seconds: 15,
      order_number: 0,
    },
    {
      id: 'dq2',
      quiz_id: 'demo-123456',
      question_text: 'Apa kepanjangan dari NFT?',
      options: ['Non-Fungible Token', 'New Financial Technology', 'Network File Transfer', 'Next Future Tech'],
      correct_answer_index: 0,
      time_limit_seconds: 15,
      order_number: 1,
    },
    {
      id: 'dq3',
      quiz_id: 'demo-123456',
      question_text: 'Blockchain mana yang dikenal dengan kecepatan 65.000 TPS?',
      options: ['Ethereum', 'Bitcoin', 'Celo', 'Cardano'],
      correct_answer_index: 2,
      time_limit_seconds: 15,
      order_number: 2,
    },
    {
      id: 'dq4',
      quiz_id: 'demo-123456',
      question_text: 'Apa nama wallet mobile yang dibuat khusus untuk Celo?',
      options: ['MetaMask', 'Valora', 'Trust Wallet', 'Coinbase Wallet'],
      correct_answer_index: 1,
      time_limit_seconds: 15,
      order_number: 3,
    },
    {
      id: 'dq5',
      quiz_id: 'demo-123456',
      question_text: 'Apa itu DeFi?',
      options: ['Decentralized Finance', 'Digital File', 'Defined Firewall', 'Desktop Finance'],
      correct_answer_index: 0,
      time_limit_seconds: 15,
      order_number: 4,
    },
  ];

  const handleJoinWithCode = async () => {
    if (roomCode.length >= 4 && playerName.trim()) {
      setIsJoining(true);
      try {
        // Try database first
        let quizFound = false;
        try {
          const { data: quizData, error: quizError } = await supabase
            .from("quizzes")
            .select("*")
            .eq("room_code", roomCode)
            .single();

          if (!quizError && quizData) {
            const { data: qsData, error: qsError } = await supabase
              .from("questions")
              .select("*")
              .eq("quiz_id", quizData.id)
              .order("order_number", { ascending: true });

            if (!qsError && qsData && qsData.length > 0) {
              setQuizInfo(quizData);
              setQuestions(qsData);
              setTimeLeft(qsData[0].time_limit_seconds || 15);
              quizFound = true;

              // Register player
              if (publicKey) {
                const walletStr = publicKey;
                try {
                  await supabase.from("profiles").upsert(
                    { wallet_address: walletStr, username: playerName },
                    { onConflict: 'wallet_address' }
                  );
                  await supabase.from("leaderboard").upsert({
                    quiz_id: quizData.id,
                    user_wallet: walletStr,
                    player_name: playerName,
                    final_score: 0
                  });
                } catch (_) { /* non-critical */ }
              }

              // Subscribe to quiz status
              supabase
                .channel(`quiz-status-${quizData.id}`)
                .on('postgres_changes', {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'quizzes',
                  filter: `id=eq.${quizData.id}`
                }, (payload) => {
                  if (payload.new.status === 'playing') {
                    setQuizState('playing');
                  }
                })
                .subscribe();
            }
          }
        } catch (_) { /* DB failed, will use fallback */ }

        // Fallback: Demo mode for code 123456 (or if DB fails)
        if (!quizFound) {
          if (roomCode === '123456') {
            setQuizInfo(DEMO_QUIZ);
            setQuestions(DEMO_QUESTIONS);
            setTimeLeft(DEMO_QUESTIONS[0].time_limit_seconds);
            setQuizState('playing'); // Start immediately in demo
            quizFound = true;
          } else {
            throw new Error(lang === "ENG" ? "Quiz not found. Check your room code." : "Kuis tidak ditemukan. Periksa kode ruangan Anda.");
          }
        }

        setIsJoined(true);
          
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error joining:", message);
        alert(message);
      } finally {
        setIsJoining(false);
      }
    } else {
      alert(lang === "ENG" ? "Please enter room code and your name." : "Harap masukkan kode ruangan dan nama Anda.");
    }
  };

  // Generate a simple QR-like pattern using divs (no external library needed)
  const QRCodeDisplay = ({ value }: { value: string }) => {
    // Create a deterministic pattern from the value string
    const generatePattern = (str: string) => {
      const grid: boolean[][] = [];
      const size = 15;
      for (let r = 0; r < size; r++) {
        grid[r] = [];
        for (let c = 0; c < size; c++) {
          // borders + finder patterns
          if (
            (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3)
          ) {
            grid[r][c] = true;
          } else if (r === 0 || r === size - 1 || c === 0 || c === size - 1) {
            grid[r][c] = (r + c) % 2 === 0;
          } else {
            const charCode = str.charCodeAt((r * size + c) % str.length) || 0;
            grid[r][c] = (charCode + r * c) % 3 !== 0;
          }
        }
      }
      return grid;
    };

    const pattern = generatePattern(value);

    return (
      <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(15, 1fr)` }}>
          {pattern.flat().map((filled, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] ${filled ? "bg-black" : "bg-white"}`}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isJoined) {
    return (
      <main className="min-h-screen w-full text-black dark:text-white flex flex-col relative overflow-hidden">
      {/* Cyberpunk AI Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#050505]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#FCFF5210_1px,transparent_1px),linear-gradient(to_bottom,#FCFF5210_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-[#FCFF52]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[15%] right-[10%] w-[300px] h-[300px] bg-[#35D07F]/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

        {/* Floating Emojis */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {floatingEmojis.map(fe => (
            <motion.div
              key={fe.id}
              initial={{ y: "110vh", x: `${fe.x}vw`, opacity: 0.6, scale: 0.8 }}
              animate={{ y: "-10vh", opacity: [0.6, 0.9, 0.3], scale: [0.8, 1.2, 0.6], rotate: [0, 180, 360] }}
              transition={{ duration: 8 + Math.random() * 6, delay: fe.delay, repeat: Infinity, ease: "linear" }}
              className="absolute text-2xl sm:text-3xl select-none"
            >
              {fe.emoji}
            </motion.div>
          ))}
        </div>

        <TopBar />

        <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-4 flex items-center justify-between z-10">
          <button onClick={() => { setIsJoined(false); if (audioRef.current) { audioRef.current.pause(); setMusicOn(false); } }} className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group text-sm font-medium">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {lang === "ENG" ? "Leave Room" : "Keluar Ruangan"}
          </button>
          <div className="flex items-center gap-2">
            {/* Music Controls */}
            <button onClick={toggleMusic}
              className={`p-2.5 rounded-xl border transition-all ${musicOn ? "bg-[#FCFF52]/20 border-[#FCFF52]/40 text-[#FCFF52]" : "bg-white/5 border-white/10 text-gray-500 hover:text-[#FCFF52]"}`}
              title={musicOn ? "Mute" : "Play Music"}
            >
              {musicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {musicOn && (
              <button onClick={nextTrack} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-[#FCFF52] transition-all" title="Next Track">
                ⏭️
              </button>
            )}
            {/* Streak Badge */}
            <AnimatePresence>
              {streak > 1 && (
                <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B]/20 to-[#EF4444]/20 border border-[#F59E0B]/30 text-[#F59E0B] font-black text-sm"
                >
                  🔥 {streak}x
                </motion.div>
              )}
            </AnimatePresence>
            {publicKey && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#FCFF52]/30">
                <Wallet2 className="w-4 h-4 text-[#FCFF52]" />
                <span className="text-sm font-mono font-semibold">{walletShort}</span>
              </div>
            )}
          </div>
        </header>

        {/* 1. Waiting Area */}
        {quizState === "waiting" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[2.5rem] border border-[#FCFF52]/30 p-12 max-w-lg w-full text-center space-y-8"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FCFF52]/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#FCFF52]" />
                </div>
                <h2 className="text-3xl font-extrabold">
                  {lang === "ENG" ? "Waiting for Host..." : "Menunggu Host..."}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {lang === "ENG"
                    ? `You've joined room ${roomCode}. The quiz will start when the host begins the session.`
                    : `Anda sudah bergabung di ruangan ${roomCode}. Kuis akan dimulai saat host memulai sesi.`}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-8 text-center pt-4">
                <div>
                  <div className="text-2xl font-extrabold text-[#FCFF52]">12</div>
                  <div className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Players" : "Pemain"}</div>
                </div>
                <div>
                  📝 {questions.length} {lang === "ENG" ? "Questions" : "Soal"}
                  <div className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Questions" : "Soal"}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#FDE047]">{quizInfo?.reward_pool_amount || 0} CELO</div>
                  <div className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Prize Pool" : "Total Hadiah"}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <div className="w-3 h-3 rounded-full bg-[#FCFF52] animate-pulse" />
                <span className="text-sm text-gray-500 font-medium">
                  {lang === "ENG" ? "Connected & waiting..." : "Terhubung & menunggu..."}
                </span>
              </div>
              
              {/* For Demo Purposes: Auto-start button */}
              <button 
                onClick={() => setQuizState("playing")}
                className="mt-4 px-6 py-2 text-xs bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20"
              >
                (Demo: Force Start Quiz)
              </button>
            </motion.div>
          </div>
        )}

        {/* 2. Playing (Answering Question) */}
        {quizState === "playing" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full space-y-8"
            >
              {/* Progress & Timer */}
              <div className="flex items-center justify-between glass px-6 py-4 rounded-full border border-black/10 dark:border-white/10">
                <span className="font-bold text-gray-500">
                  📝 {questions.length} {lang === "ENG" ? "Questions" : "Soal"}
                </span>
                <div className="flex items-center gap-2 text-[#35D07F] font-extrabold text-xl">
                  <Clock className="w-5 h-5" />
                  {timeLeft}s
                </div>
              </div>

              {/* Question */}
              <div className="glass p-10 rounded-[2.5rem] border border-[#35D07F]/30 text-center shadow-[0_0_30px_rgba(153,69,255,0.15)]">
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
                  {questions[currentQuestionIndex]?.question_text}
                </h2>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(questions[currentQuestionIndex]?.options || []).map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerSelection(idx)}
                    className={`p-6 rounded-2xl text-lg font-bold transition-all ${
                      selectedAnswer === idx
                        ? "bg-[#35D07F] text-white shadow-[0_0_20px_rgba(153,69,255,0.4)] scale-[1.02]"
                        : "glass hover:bg-[#35D07F]/10 hover:border-[#35D07F]/50 border border-black/10 dark:border-white/10"
                    } ${selectedAnswer !== null && selectedAnswer !== idx ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        selectedAnswer === idx ? "bg-white/20" : "bg-black/5 dark:bg-white/10"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      {opt}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. Revealed Answer Feedback */}
        {quizState === "revealed" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full space-y-8 text-center"
            >
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center shadow-lg ${
                isCorrect 
                  ? "bg-[#FCFF52] shadow-[0_0_50px_rgba(20,241,149,0.5)]" 
                  : "bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]"
              }`}>
                {isCorrect ? <CheckCircle2 className="w-16 h-16 text-black" /> : <XCircle className="w-16 h-16 text-white" />}
              </div>
              
              <h2 className="text-4xl font-extrabold">
                {isCorrect 
                  ? (lang === "ENG" ? "Correct!" : "Benar!") 
                  : (lang === "ENG" ? "Incorrect" : "Salah")}
              </h2>
              
              <div className="glass p-6 rounded-[2rem] border border-black/10 dark:border-white/10 inline-block">
                <p className="text-sm text-gray-500 mb-2">{lang === "ENG" ? "Correct Answer:" : "Jawaban Benar:"}</p>
                <p className="text-xl font-bold text-[#FCFF52]">
                  {questions[currentQuestionIndex]?.options?.[questions[currentQuestionIndex]?.correct_answer_index]}
                </p>
              </div>
              
              <div className="pt-8 space-y-4">
                {/* Countdown progress bar */}
                <div className="text-sm text-gray-500 font-semibold">
                  {lang === "ENG" ? `Next question in ${revealCountdown}s...` : `Soal berikutnya dalam ${revealCountdown} detik...`}
                </div>
                <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-full bg-[#35D07F] rounded-full"
                  />
                </div>
                {/* Manual skip button */}
                <button
                  onClick={nextQuestion}
                  className="text-xs text-gray-400 hover:text-[#35D07F] transition-colors underline"
                >
                  {lang === "ENG" ? "Skip ▶" : "Lewati ▶"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Final Result & Claim Prize */}
        {quizState === "finished" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass rounded-[3rem] border border-[#FDE047]/40 p-10 max-w-md w-full text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FDE047]/20 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#FDE047] to-[#EAB308] flex items-center justify-center shadow-[0_0_40px_rgba(253,224,71,0.4)]">
                <Trophy className="w-12 h-12 text-black" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FDE047] to-[#EAB308]">
                  {lang === "ENG" ? "Quiz Completed!" : "Kuis Selesai!"}
                </h2>
                <p className="text-gray-500 font-medium">
                  {lang === "ENG" ? "Here are your final stats" : "Inilah statistik akhir Anda"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Score</div>
                  <div className="text-3xl font-black text-[#35D07F]">{score}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Rank</div>
                  <div className="text-3xl font-black text-[#FCFF52]">#{claimRank || "?"}</div>
                </div>
              </div>
              
              {/* Reward Section */}
              <div className="p-6 rounded-2xl bg-[#FCFF52]/10 border border-[#FCFF52]/30 space-y-3">
                <h3 className="font-bold text-lg mb-1">
                  {hasClaimed 
                    ? (lang === "ENG" ? "Reward Claimed!" : "Hadiah Diklaim!")
                    : (lang === "ENG" ? "Claim Your Reward" : "Klaim Hadiah Anda")}
                </h3>
                {claimRewardAmount && (
                  <div className="text-4xl font-black text-[#FCFF52] drop-shadow-sm my-2">
                    ◎ {claimRewardAmount.toFixed(4)} CELO
                  </div>
                )}
                {!claimRewardAmount && quizInfo?.reward_pool_amount && (
                  <div className="text-4xl font-black text-[#FCFF52] drop-shadow-sm my-2">
                    ◎ {quizInfo.reward_pool_amount} CELO
                  </div>
                )}
                {claimTxSignature && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-[#FCFF52] font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === "ENG" ? "On-chain transfer confirmed" : "Transfer on-chain dikonfirmasi"}</span>
                    </div>
                    <a
                      href={getExplorer(claimTxSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#35D07F]/10 border border-[#35D07F]/30 text-[#35D07F] text-xs font-bold hover:bg-[#35D07F]/20 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {lang === "ENG" ? "View on Celo Explorer" : "Lihat di Celo Explorer"}
                    </a>
                  </div>
                )}
                {!hasClaimed && (
                  <p className="text-xs text-gray-500">
                    {lang === "ENG" ? "CELO will be sent directly to your wallet." : "CELO akan dikirim langsung ke wallet Anda."}
                  </p>
                )}
              </div>

              {claimError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {claimError}
                </div>
              )}

              <button
                onClick={handleClaimReward}
                disabled={isClaiming || hasClaimed}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#FDE047] to-[#EAB308] text-black font-extrabold text-lg hover:shadow-[0_0_30px_rgba(253,224,71,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isClaiming ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {lang === "ENG" ? "Claiming on-chain..." : "Mengklaim on-chain..."}</span>
                ) : hasClaimed ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {lang === "ENG" ? "Claimed!" : "Berhasil Diklaim!"}</span>
                ) : (
                  <span className="flex items-center gap-2"><Gift className="w-5 h-5" /> {lang === "ENG" ? "Claim Reward" : "Klaim Hadiah"}</span>
                )}
              </button>
              
              <Link 
                href="/dashboard"
                className="block text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setQuizState("waiting")}
              >
                {lang === "ENG" ? "Back to Dashboard" : "Kembali ke Dasbor"}
              </Link>
            </motion.div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full text-black dark:text-white flex flex-col">
      {/* Cyberpunk AI Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#050505]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#FCFF5210_1px,transparent_1px),linear-gradient(to_bottom,#FCFF5210_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#FCFF52]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-[#35D07F]/20 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <TopBar backHref="/dashboard" />

      {publicKey && (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-2 flex justify-end relative z-40">
          <WalletDropdown />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFF52]/10 border border-[#FCFF52]/30 text-[#FCFF52] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCFF52] animate-pulse" />
            CLIENT_NODE
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase font-mono">
            {lang === "ENG" ? "Join " : "Gabung "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCFF52] to-[#35D07F]">{lang === "ENG" ? "Network" : "Jaringan"}</span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto font-mono text-sm">
            {lang === "ENG"
              ? "Scan the QR code or enter the room code to establish connection."
              : "Scan QR code atau masukkan kode ruangan untuk membuat koneksi."}
          </p>
        </motion.div>

        {joinMode === "select" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
            {/* QR Scan Option */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.03, y: -3 }}
              onClick={() => setJoinMode("qr")}
              className="bg-black/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 hover:border-[#FCFF52]/60 hover:shadow-[0_0_30px_rgba(252,255,82,0.2)] transition-all text-left space-y-5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(252,255,82,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-black border border-[#FCFF52] flex items-center justify-center shadow-[0_0_25px_rgba(252,255,82,0.25)] group-hover:shadow-[0_0_40px_rgba(252,255,82,0.4)] transition-shadow">
                <QrCode className="w-8 h-8 text-[#FCFF52]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-extrabold mb-1 font-mono text-white">
                  {lang === "ENG" ? "OPTICAL_SCAN" : "OPTICAL_SCAN"}
                </h3>
                <p className="text-sm text-gray-400 font-mono text-xs">
                  {lang === "ENG"
                    ? "Scan host's visual code"
                    : "Scan kode visual host"}
                </p>
              </div>
            </motion.button>

            {/* Code Input Option */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.03, y: -3 }}
              onClick={() => setJoinMode("code")}
              className="bg-black/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 hover:border-[#35D07F]/60 hover:shadow-[0_0_30px_rgba(53,208,127,0.2)] transition-all text-left space-y-5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(53,208,127,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-black border border-[#35D07F] flex items-center justify-center shadow-[0_0_25px_rgba(53,208,127,0.25)] group-hover:shadow-[0_0_40px_rgba(53,208,127,0.4)] transition-shadow">
                <Keyboard className="w-8 h-8 text-[#35D07F]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-extrabold mb-1 font-mono text-white">
                  {lang === "ENG" ? "MANUAL_INPUT" : "MANUAL_INPUT"}
                </h3>
                <p className="text-sm text-gray-400 font-mono text-xs">
                  {lang === "ENG"
                    ? "Enter unique 6-digit hash"
                    : "Masukkan hash 6-digit unik"}
                </p>
              </div>
            </motion.button>
          </div>
        )}

        {joinMode === "qr" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2.5rem] border border-[#FCFF52]/30 p-10 max-w-md w-full text-center space-y-8"
          >
            <h3 className="text-2xl font-bold">
              {lang === "ENG" ? "Scan QR Code" : "Scan QR Code"}
            </h3>

            {/* QR Scanner Placeholder */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-[#FCFF52]/50 bg-black/80 flex items-center justify-center">
              <div className="absolute inset-4 border-2 border-[#FCFF52] rounded-2xl border-dashed animate-pulse" />
              <QrCode className="w-16 h-16 text-[#FCFF52]/50" />

              {/* Scanning line animation */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-[#FCFF52] shadow-[0_0_10px_rgba(20,241,149,0.8)]"
                animate={{ top: ["10%", "85%", "10%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <p className="text-sm text-gray-500">
              {lang === "ENG"
                ? "Point your camera at the QR code displayed by the quiz host."
                : "Arahkan kamera Anda ke QR code yang ditampilkan oleh host kuis."}
            </p>

            {/* Manual code input as fallback */}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={lang === "ENG" ? "Your Name" : "Nama Anda"}
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-[#FCFF52]/50"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABCXYZ"
                  className="flex-1 px-5 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white font-mono text-center text-lg tracking-widest uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCFF52]/50"
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={roomCode.length < 4 || !playerName.trim() || isJoining}
                  className="px-5 py-3 rounded-xl bg-[#FCFF52] text-black font-bold hover:bg-[#0EC97F] transition-colors disabled:opacity-40 flex items-center justify-center"
                >
                  {isJoining ? <span className="animate-spin text-xl">⏳</span> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setJoinMode("select")}
              className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              ⬅️ {lang === "ENG" ? "Back" : "Kembali"}
            </button>
          </motion.div>
        )}

        {joinMode === "code" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2.5rem] border border-[#35D07F]/30 p-10 max-w-md w-full text-center space-y-6"
          >
            {/* Avatar Picker */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {lang === "ENG" ? "Pick Your Character" : "Pilih Karaktermu"}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={prevAvatar}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-2xl transition-all flex items-center justify-center border border-white/10"
                >◀</button>

                <motion.div
                  key={selectedAvatar}
                  initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="relative"
                >
                  <div
                    className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl shadow-2xl border-4 relative"
                    style={{ backgroundColor: `${AVATARS[selectedAvatar].color}22`, borderColor: AVATARS[selectedAvatar].color }}
                  >
                    <span>{AVATARS[selectedAvatar].emoji}</span>
                    {/* Glow */}
                    <div
                      className="absolute inset-0 rounded-3xl blur-xl opacity-40 -z-10"
                      style={{ backgroundColor: AVATARS[selectedAvatar].color }}
                    />
                  </div>
                  <p className="mt-2 font-extrabold text-sm" style={{ color: AVATARS[selectedAvatar].color }}>
                    {AVATARS[selectedAvatar].name}
                  </p>
                </motion.div>

                <button
                  onClick={nextAvatar}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-2xl transition-all flex items-center justify-center border border-white/10"
                >▶</button>
              </div>

              {/* Avatar strip dots */}
              <div className="flex justify-center gap-1.5 flex-wrap max-w-[200px] mx-auto">
                {AVATARS.map((av, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAvatar(i)}
                    className="text-lg transition-all hover:scale-125"
                    style={{ opacity: i === selectedAvatar ? 1 : 0.35, transform: i === selectedAvatar ? "scale(1.3)" : "scale(1)" }}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {lang === "ENG" ? "Enter Room Code" : "Masukkan Kode Ruangan"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === "ENG"
                  ? "Ask the host for the 6-character room code."
                  : "Minta kode ruangan 6 karakter dari host."}
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={lang === "ENG" ? "Your Name" : "Nama Anda"}
                className="w-full px-8 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border-2 border-[#35D07F]/30 focus:border-[#35D07F] text-black dark:text-white text-center text-xl placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none transition-all"
              />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                className="w-full px-8 py-6 rounded-2xl bg-white/50 dark:bg-white/5 border-2 border-[#35D07F]/30 focus:border-[#35D07F] text-black dark:text-white font-mono text-center text-3xl tracking-[0.3em] uppercase placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>

            <button
              onClick={handleJoinWithCode}
              disabled={roomCode.length < 4 || !playerName.trim() || isJoining}
              className="w-full py-5 rounded-2xl font-extrabold text-lg hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-black"
              style={{ background: `linear-gradient(135deg, ${AVATARS[selectedAvatar].color}, #FCFF52)` }}
            >
              {isJoining ? (
                <span className="flex items-center gap-2"><span className="animate-spin text-xl">⏳</span> {lang === "ENG" ? "Joining..." : "Bergabung..."}</span>
              ) : (
                <><span className="text-xl">{AVATARS[selectedAvatar].emoji}</span> {lang === "ENG" ? "Join Room" : "Gabung Ruangan"}</>
              )}
            </button>

            <button
              onClick={() => setJoinMode("select")}
              className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              ⬅️ {lang === "ENG" ? "Back" : "Kembali"}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
