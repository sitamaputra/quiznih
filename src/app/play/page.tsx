"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import {
  ArrowLeft, Wallet2, QrCode, Keyboard, ArrowRight, Users, Trophy, Clock, CheckCircle2, XCircle, Gift
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PlayPage() {
  const { lang } = useLanguage();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (!publicKey) setVisible(true);
  }, [publicKey, setVisible]);

  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinMode, setJoinMode] = useState<"select" | "qr" | "code">("select");
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
    }
    
    // Attempt to update score live on Supabase
    if (quizInfo && publicKey) {
      // fire and forget update
      supabase.from("leaderboard")
        .update({ final_score: newScore })
        .eq("quiz_id", quizInfo.id)
        .eq("user_wallet", publicKey.toString())
        .then();
    }
    
    // Add small delay before revealing answer to create suspense
    setTimeout(() => {
      setQuizState("revealed");
    }, 1500);
  };

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
        colors: ['#9945FF', '#14F195', '#FDE047']
      });
    }
  };

  const handleClaimReward = async () => {
    setIsClaiming(true);
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsClaiming(false);
    setHasClaimed(true);
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#14F195']
    });
  };

  const walletShort = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : "";

  const handleJoinWithCode = async () => {
    if (roomCode.length >= 4 && playerName.trim()) {
      setIsJoining(true);
      try {
        // Fetch Quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("room_code", roomCode)
          .single();

        if (quizError || !quizData) throw new Error("Quiz not found");
        
        // Fetch Questions
        const { data: qsData, error: qsError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizData.id)
          .order("order_number", { ascending: true });

        if (qsError || !qsData) throw new Error("Failed fetching questions");
        if (qsData.length === 0) throw new Error("Quiz has no questions");

        setQuizInfo(quizData);
        setQuestions(qsData);
        setTimeLeft(qsData[0].time_limit_seconds || 15);

        // check profile and update name
        if (publicKey) {
          const walletStr = publicKey.toString();
          await supabase.from("profiles").upsert(
            { wallet_address: walletStr, username: playerName },
            { onConflict: 'wallet_address' }
          );
          
          // Join the leaderboard immediately
          await supabase.from("leaderboard").upsert({
            quiz_id: quizData.id,
            user_wallet: walletStr,
            player_name: playerName,
            final_score: 0
          });
        }

        setIsJoined(true);
        
        // Subscribe to quiz status changes (Host starting the quiz)
        const channel = supabase
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
          
      } catch (err: any) {
        console.error("Error joining:", err);
        alert(err.message || "Failed to join room");
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
      <main className="min-h-screen w-full text-black dark:text-white flex flex-col">
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-[#14F195]/15 blur-[150px] rounded-full" />
        </div>

        <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
          <button onClick={() => setIsJoined(false)} className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{lang === "ENG" ? "Leave Room" : "Keluar Ruangan"}</span>
          </button>
          {publicKey && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#14F195]/30">
              <Wallet2 className="w-4 h-4 text-[#14F195]" />
              <span className="text-sm font-mono font-semibold">{walletShort}</span>
            </div>
          )}
        </header>

        {/* 1. Waiting Area */}
        {quizState === "waiting" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[2.5rem] border border-[#14F195]/30 p-12 max-w-lg w-full text-center space-y-8"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#14F195]/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#14F195]" />
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
                  <div className="text-2xl font-extrabold text-[#14F195]">12</div>
                  <div className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Players" : "Pemain"}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#9945FF]">{questions.length}</div>
                  <div className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Questions" : "Soal"}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#FDE047]">{quizInfo?.reward_pool_amount || 0} SOL</div>
                  <div className="text-xs text-gray-500 font-semibold">{lang === "ENG" ? "Prize Pool" : "Total Hadiah"}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <div className="w-3 h-3 rounded-full bg-[#14F195] animate-pulse" />
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
                  {lang === "ENG" ? "Question" : "Soal"} {currentQuestionIndex + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-2 text-[#9945FF] font-extrabold text-xl">
                  <Clock className="w-5 h-5" />
                  {timeLeft}s
                </div>
              </div>

              {/* Question */}
              <div className="glass p-10 rounded-[2.5rem] border border-[#9945FF]/30 text-center shadow-[0_0_30px_rgba(153,69,255,0.15)]">
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
                        ? "bg-[#9945FF] text-white shadow-[0_0_20px_rgba(153,69,255,0.4)] scale-[1.02]"
                        : "glass hover:bg-[#9945FF]/10 hover:border-[#9945FF]/50 border border-black/10 dark:border-white/10"
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
                  ? "bg-[#14F195] shadow-[0_0_50px_rgba(20,241,149,0.5)]" 
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
                <p className="text-xl font-bold text-[#14F195]">
                  {questions[currentQuestionIndex]?.options?.[questions[currentQuestionIndex]?.correct_answer_index]}
                </p>
              </div>
              
              <div className="pt-8">
                <span className="text-gray-500 animate-pulse">
                  {lang === "ENG" ? "Waiting for next question..." : "Menunggu pertanyaan berikutnya..."}
                </span>
              </div>
              
              {/* Demo auto-next fallback */}
              <button 
                onClick={nextQuestion}
                className="mt-8 px-6 py-2 text-xs bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20"
              >
                (Demo: Go to Next)
              </button>
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
                  <div className="text-3xl font-black text-[#9945FF]">{score}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Rank</div>
                  <div className="text-3xl font-black text-[#14F195]">#3</div>
                </div>
              </div>
              
              {/* Reward Section (Simulated top 3 win) */}
              <div className="p-6 rounded-2xl bg-[#14F195]/10 border border-[#14F195]/30">
                <h3 className="font-bold text-lg mb-1">
                  {lang === "ENG" ? "Congratulations! You Won" : "Selamat! Anda Menang"}
                </h3>
                <div className="text-4xl font-black text-[#14F195] drop-shadow-sm my-2">0.5 SOL</div>
                <p className="text-xs text-gray-500">
                  {lang === "ENG" ? "Reward will be deposited to your wallet." : "Hadiah akan dikirimkan ke wallet Anda."}
                </p>
              </div>

              <button
                onClick={handleClaimReward}
                disabled={isClaiming || hasClaimed}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#FDE047] to-[#EAB308] text-black font-extrabold text-lg hover:shadow-[0_0_30px_rgba(253,224,71,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isClaiming ? (
                  <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/> Processing...</span>
                ) : hasClaimed ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Claimed!</span>
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
      {/* Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#14F195]/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-[#9945FF]/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Dashboard" : "Dasbor"}</span>
        </Link>
        {publicKey && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#14F195]/30">
            <Wallet2 className="w-4 h-4 text-[#14F195]" />
            <span className="text-sm font-mono font-semibold">{walletShort}</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-3"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold">
            {lang === "ENG" ? "Join " : "Gabung "}
            <span className="text-gradient">{lang === "ENG" ? "Quiz" : "Kuis"}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {lang === "ENG"
              ? "Scan the QR code or enter the room code to join a live quiz session."
              : "Scan QR code atau masukkan kode ruangan untuk bergabung sesi kuis live."}
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
              className="glass rounded-[2rem] p-8 border border-[#14F195]/30 hover:border-[#14F195]/60 transition-all text-left space-y-5 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14F195] to-[#0EC97F] flex items-center justify-center shadow-[0_0_25px_rgba(20,241,149,0.25)] group-hover:shadow-[0_0_40px_rgba(20,241,149,0.4)] transition-shadow">
                <QrCode className="w-8 h-8 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold mb-1">
                  {lang === "ENG" ? "Scan QR Code" : "Scan QR Code"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lang === "ENG"
                    ? "Scan the code shown by host"
                    : "Scan kode yang ditampilkan host"}
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
              className="glass rounded-[2rem] p-8 border border-[#9945FF]/30 hover:border-[#9945FF]/60 transition-all text-left space-y-5 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#7B3FE4] flex items-center justify-center shadow-[0_0_25px_rgba(153,69,255,0.25)] group-hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-shadow">
                <Keyboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold mb-1">
                  {lang === "ENG" ? "Enter Code" : "Masukkan Kode"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lang === "ENG"
                    ? "Type the room code manually"
                    : "Ketik kode ruangan secara manual"}
                </p>
              </div>
            </motion.button>
          </div>
        )}

        {joinMode === "qr" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2.5rem] border border-[#14F195]/30 p-10 max-w-md w-full text-center space-y-8"
          >
            <h3 className="text-2xl font-bold">
              {lang === "ENG" ? "Scan QR Code" : "Scan QR Code"}
            </h3>

            {/* QR Scanner Placeholder */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-[#14F195]/50 bg-black/80 flex items-center justify-center">
              <div className="absolute inset-4 border-2 border-[#14F195] rounded-2xl border-dashed animate-pulse" />
              <QrCode className="w-16 h-16 text-[#14F195]/50" />

              {/* Scanning line animation */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-[#14F195] shadow-[0_0_10px_rgba(20,241,149,0.8)]"
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
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-[#14F195]/50"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABCXYZ"
                  className="flex-1 px-5 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white font-mono text-center text-lg tracking-widest uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14F195]/50"
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={roomCode.length < 4 || !playerName.trim() || isJoining}
                  className="px-5 py-3 rounded-xl bg-[#14F195] text-black font-bold hover:bg-[#0EC97F] transition-colors disabled:opacity-40 flex items-center justify-center"
                >
                  {isJoining ? <span className="animate-spin text-xl">⟳</span> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setJoinMode("select")}
              className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              ← {lang === "ENG" ? "Back" : "Kembali"}
            </button>
          </motion.div>
        )}

        {joinMode === "code" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2.5rem] border border-[#9945FF]/30 p-10 max-w-md w-full text-center space-y-8"
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#9945FF] to-[#7B3FE4] flex items-center justify-center shadow-[0_0_30px_rgba(153,69,255,0.3)]">
              <Keyboard className="w-10 h-10 text-white" />
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
                className="w-full px-8 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border-2 border-[#9945FF]/30 focus:border-[#9945FF] text-black dark:text-white text-center text-xl placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none transition-all"
              />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                className="w-full px-8 py-6 rounded-2xl bg-white/50 dark:bg-white/5 border-2 border-[#9945FF]/30 focus:border-[#9945FF] text-black dark:text-white font-mono text-center text-3xl tracking-[0.3em] uppercase placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>

            <button
              onClick={handleJoinWithCode}
              disabled={roomCode.length < 4 || !playerName.trim() || isJoining}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white dark:text-black font-extrabold text-lg hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isJoining ? (
                <span className="flex items-center gap-2"><span className="animate-spin text-xl">⟳</span> {lang === "ENG" ? "Joining..." : "Bergabung..."}</span>
              ) : (
                <><Users className="w-6 h-6" /> {lang === "ENG" ? "Join Room" : "Gabung Ruangan"}</>
              )}
            </button>

            <button
              onClick={() => setJoinMode("select")}
              className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              ← {lang === "ENG" ? "Back" : "Kembali"}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
