"use client";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/translations";
import { useAccount, useConnect, useConnectors } from "wagmi";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Wallet2, QrCode, Keyboard, ArrowRight, Users, Trophy, Clock, CheckCircle2, XCircle, Gift, LogOut, ExternalLink, Loader2, Volume2, VolumeX
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import WalletDropdown from "@/components/wallet/WalletDropdown";
import { useCeloQuiz } from "@/hooks/useCeloQuiz";
import TopBar from "@/components/layout/TopBar";
import PodiumView, { type PodiumPlayer } from "@/components/shared/PodiumView";

const BGM_URLS = [
  "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", // upbeat fun
  "https://cdn.pixabay.com/audio/2022/12/28/audio_651f88db25.mp3", // game music
  "https://cdn.pixabay.com/audio/2023/10/24/audio_3327d532ab.mp3", // chiptune happy
];

const CORRECT_SFX_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_5e5a3779f3.mp3";
const WRONG_SFX_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_b4c5a4cd9e.mp3";

export default function PlayPage() {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { address: publicKey, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();

  useEffect(() => {
    if (!publicKey && connectors.length > 0) connect({ connector: connectors[0] });
  }, [publicKey, connectors, connect]);

  const { getExplorerTxUrl: getExplorer, claimReward: claimOnChain, isClaiming: isClaimingOnChain } = useCeloQuiz();

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

  // Restore session from sessionStorage after page refresh
  useEffect(() => {
    const saved = sessionStorage.getItem("quiznih_session");
    if (!saved) return;
    let session: { roomCode: string; quizId: string; playerName: string; leaderboardId: string | null; avatar: number };
    try {
      session = JSON.parse(saved);
    } catch {
      sessionStorage.removeItem("quiznih_session");
      return;
    }
    (async () => {
      // Verify leaderboard record still exists (player may have been kicked)
      if (session.leaderboardId) {
        const { data, error } = await supabase
          .from("leaderboard")
          .select("id")
          .eq("id", session.leaderboardId)
          .single();
        if (error || !data) {
          sessionStorage.removeItem("quiznih_session");
          return;
        }
      }
      // Re-fetch quiz data
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", session.quizId)
        .single();
      if (quizError || !quizData) {
        sessionStorage.removeItem("quiznih_session");
        return;
      }
      // Re-fetch questions
      const { data: qsData, error: qsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", session.quizId)
        .order("order_number", { ascending: true });
      if (qsError || !qsData?.length) {
        sessionStorage.removeItem("quiznih_session");
        return;
      }
      // Restore all state
      setRoomCode(session.roomCode);
      setPlayerName(session.playerName);
      setSelectedAvatar(session.avatar ?? 0);
      if (session.leaderboardId) setLeaderboardId(session.leaderboardId);
      setQuizInfo(quizData);
      setQuestions(qsData);
      setTimeLeft(qsData[0].time_limit_seconds || 15);
      if (quizData.status === "finished") {
        setQuizState("finished");
        sessionStorage.removeItem("quiznih_session");
      } else if (quizData.status === "playing") {
        setQuizState("playing");
      } else {
        setQuizState("waiting");
      }
      setIsJoined(true);
      // Re-subscribe to quiz status changes
      supabase
        .channel(`quiz-status-restore-${quizData.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "quizzes",
          filter: `id=eq.${quizData.id}`,
        }, (payload) => {
          if (payload.new.status === "playing") setQuizState("playing");
        })
        .subscribe();
    })();
  }, []);
  
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
  const [playerCount, setPlayerCount] = useState(0);

  // Polling fallback: cek status quiz setiap 3 detik saat waiting
  // Jaga-jaga kalau realtime Supabase miss event
  useEffect(() => {
    if (quizState !== 'waiting' || !quizInfo?.id) return;

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('quizzes')
        .select('status')
        .eq('id', quizInfo.id)
        .single();
      if (data?.status === 'playing') setQuizState('playing');

      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizInfo.id);
      if (count !== null) setPlayerCount(count);
    }, 3000);

    return () => clearInterval(poll);
  }, [quizState, quizInfo?.id]);
  const [isJoining, setIsJoining] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(3);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  // Music & SFX
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [currentBgm, setCurrentBgm] = useState(0);
  const [streak, setStreak] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<{id:number;x:number;delay:number;size:number;opacity:number}[]>([]);
  const [celebrationEmojis, setCelebrationEmojis] = useState<{id:number;emoji:string;x:number;y:number;scale:number}[]>([]);
  const [showRankPanel, setShowRankPanel] = useState(false);
  const [leaderboardId, setLeaderboardId] = useState<string | null>(null);
  const [podiumPlayers, setPodiumPlayers] = useState<PodiumPlayer[]>([]);

  // Ref holds latest values so handleLeave never has stale closure issues
  const playerDataRef = useRef({
    leaderboardId: null as string | null,
    quizInfoId: null as string | null,
    walletAddress: null as string | null,
    score: 0,
    quizState: "waiting" as string,
  });

  useEffect(() => {
    playerDataRef.current = {
      leaderboardId,
      quizInfoId: quizInfo?.id ?? null,
      walletAddress: publicKey ?? null,
      score,
      quizState,
    };
  });

  const handleLeave = useCallback(() => {
    const { leaderboardId: lbId, quizInfoId, walletAddress, score: currentScore, quizState: currentState } = playerDataRef.current;
    // Keep leaderboard entry if player already scored or completed the quiz
    if (currentScore > 0 || currentState === "finished") return;
    // If session is still saved, this unload is from a page refresh — preserve the record
    if (sessionStorage.getItem("quiznih_session")) return;
    // Delete by ID (reliable) or fall back to composite key
    if (lbId) {
      supabase.from("leaderboard").delete().eq("id", lbId).then(() => {}).catch(() => {});
    } else if (quizInfoId && walletAddress) {
      supabase.from("leaderboard").delete().eq("quiz_id", quizInfoId).eq("user_wallet", walletAddress).then(() => {}).catch(() => {});
    }
  }, []);

  // Remove player from leaderboard when they close the browser or navigate away within the app
  useEffect(() => {
    if (!isJoined) return;
    window.addEventListener("beforeunload", handleLeave);
    window.addEventListener("pagehide", handleLeave);
    return () => {
      handleLeave();
      window.removeEventListener("beforeunload", handleLeave);
      window.removeEventListener("pagehide", handleLeave);
    };
  }, [isJoined, handleLeave]);

  const CELEBRATION_CORRECT = ["🎉","🔥","💯","⚡","✅","🏆","👏","💪","🌟","😎","🥳","💎"];
  const CELEBRATION_WRONG = ["😭","💔","😢","❌","😩","🫠","😬","👀"];

  const triggerCelebration = (correct: boolean) => {
    const pool = correct ? CELEBRATION_CORRECT : CELEBRATION_WRONG;
    const count = correct ? 12 : 6;
    const burst = Array.from({length: count}, (_, i) => ({
      id: Date.now() + i,
      emoji: pool[Math.floor(Math.random() * pool.length)],
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      scale: 0.8 + Math.random() * 1.2,
    }));
    setCelebrationEmojis(burst);
    setTimeout(() => setCelebrationEmojis([]), 2000);
  };

  // Initialize floating icons
  useEffect(() => {
    if (!isJoined) return;
    const SIZES = [30, 38, 50];
    const icons = Array.from({length: 6}, (_, i) => ({
      id: i,
      x: Math.random() * 90,
      delay: Math.random() * 5,
      size: SIZES[i % SIZES.length],
      opacity: 0.85 + Math.random() * 0.15,
    }));
    setFloatingEmojis(icons);
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
      new Audio(CORRECT_SFX_URL).play().catch(() => {});
      triggerCelebration(true);
    } else {
      setStreak(0);
      new Audio(WRONG_SFX_URL).play().catch(() => {});
      triggerCelebration(false);
    }
    
    // Attempt to update score live on Supabase
    if (quizInfo && publicKey) {
      supabase.from("leaderboard")
        .update({ final_score: newScore })
        .eq("quiz_id", quizInfo.id)
        .eq("user_wallet", publicKey)
        .then(({ error }: { error: any }) => {
          if (error) console.error("Score update failed:", error);
        });
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
  const [isSignatureReady, setIsSignatureReady] = useState(false);

  // Poll sampai signature siap (backend butuh beberapa detik setelah quiz finish)
  useEffect(() => {
    if (quizState !== 'finished' || !quizInfo?.id || !publicKey || isSignatureReady || hasClaimed) return;

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('claim_signature, claim_amount_wei, rank')
        .eq('quiz_id', quizInfo.id)
        .eq('user_wallet', publicKey)
        .single();
      if (data?.claim_signature && data?.claim_amount_wei) {
        setIsSignatureReady(true);
        clearInterval(poll);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [quizState, quizInfo?.id, publicKey, isSignatureReady, hasClaimed]);

  const REWARD_SPLITS = [0.5, 0.3, 0.2];

  // When quiz finishes: save final score + fetch rank from leaderboard
  useEffect(() => {
    if (quizState !== "finished" || !quizInfo?.id || !publicKey) return;
    sessionStorage.removeItem("quiznih_session");
    const finalizeScore = async () => {
      await supabase
        .from("leaderboard")
        .update({ final_score: score, is_finished: true })
        .eq("quiz_id", quizInfo.id)
        .eq("user_wallet", publicKey);

      const { data: lb } = await supabase
        .from("leaderboard")
        .select("user_wallet, final_score, player_name")
        .eq("quiz_id", quizInfo.id)
        .order("final_score", { ascending: false });

      if (lb) {
        const idx = lb.findIndex((p: any) => p.user_wallet === publicKey);
        const rank = idx >= 0 ? idx + 1 : null;
        setClaimRank(rank);
        const pool = quizInfo.reward_pool_amount || 0;
        setClaimRewardAmount(rank && rank <= 3 ? pool * REWARD_SPLITS[rank - 1] : 0);
        setPodiumPlayers(
          lb.slice(0, 3).map((p: any) => ({
            name: p.player_name || `${p.user_wallet.slice(0, 6)}...`,
            score: p.final_score || 0,
          }))
        );
      }
    };
    finalizeScore();
  }, [quizState, quizInfo?.id, publicKey, score]);

  const handleClaimReward = async () => {
    if (!quizInfo?.id || !publicKey) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      // 1. Fetch claim signature + amount from leaderboard (set by backend after quiz ends)
      const { data: entry, error: entryErr } = await supabase
        .from("leaderboard")
        .select("claim_signature, claim_amount_wei, rank, claimed_reward")
        .eq("quiz_id", quizInfo.id)
        .eq("user_wallet", publicKey)
        .single();

      if (entryErr || !entry) {
        throw new Error("Could not find your leaderboard entry.");
      }

      if (entry.claimed_reward) {
        setHasClaimed(true);
        return;
      }

      if (!entry.claim_signature || !entry.claim_amount_wei) {
        throw new Error("Reward not ready yet. Quiz may still be processing.");
      }

      // 2. Call claimReward on-chain
      const result = await claimOnChain(
        quizInfo.id,
        entry.claim_amount_wei,
        entry.claim_signature as `0x${string}`
      );

      if (!result.success) {
        throw new Error(result.error || "On-chain claim failed");
      }

      // 3. Record claim in DB
      await fetch("/api/quiz/claim-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizInfo.id,
          userWallet: publicKey,
          txHash: result.txHash,
        }),
      });

      setClaimTxSignature(result.txHash || null);
      setHasClaimed(true);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#FCFF52', '#35D07F', '#FDE047'],
      });
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
                  const { data: lbData } = await supabase
                    .from("leaderboard")
                    .upsert(
                      {
                        quiz_id: quizData.id,
                        user_wallet: walletStr,
                        player_name: playerName,
                        final_score: 0,
                      },
                      { onConflict: 'quiz_id,user_wallet' }
                    )
                    .select("id")
                    .single();
                  if (lbData?.id) setLeaderboardId(lbData.id);
                  // Persist session so page refresh restores state without re-joining
                  sessionStorage.setItem("quiznih_session", JSON.stringify({
                    roomCode,
                    quizId: quizData.id,
                    playerName,
                    leaderboardId: lbData?.id ?? null,
                    avatar: selectedAvatar,
                  }));
                } catch (_) { /* non-critical */ }
              }

              // Fetch jumlah player saat ini
              const { count } = await supabase
                .from("leaderboard")
                .select("*", { count: "exact", head: true })
                .eq("quiz_id", quizData.id);
              setPlayerCount(count || 0);

              // Subscribe ke quiz status + perubahan jumlah player
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
                .on('postgres_changes', {
                  event: '*',
                  schema: 'public',
                  table: 'leaderboard',
                  filter: `quiz_id=eq.${quizData.id}`
                }, async () => {
                  // Update jumlah player setiap ada perubahan
                  const { count: newCount } = await supabase
                    .from("leaderboard")
                    .select("*", { count: "exact", head: true })
                    .eq("quiz_id", quizData.id);
                  setPlayerCount(newCount || 0);
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
            throw new Error(t("play.notFound", lang));
          }
        }

        setIsJoined(true);
        
        // Auto-play music on successful join
        if (!audioRef.current) {
          audioRef.current = new Audio(BGM_URLS[currentBgm]);
          audioRef.current.loop = true;
          audioRef.current.volume = 0.3;
        }
        audioRef.current.play().catch(() => console.log("Audio autoplay blocked"));
        setMusicOn(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error joining:", message);
        alert(message);
      } finally {
        setIsJoining(false);
      }
    } else {
      alert(t("play.enterCodeAndName", lang));
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
      <main className="min-h-screen w-full text-[#0a1a0f] flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f8fff9 0%, #ffffff 100%)" }}>
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', left: '5%', top: '15%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(252,255,82,0.12)', filter: 'blur(120px)' }} 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], x: [0, -60, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', right: '5%', bottom: '10%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(53,208,127,0.1)', filter: 'blur(120px)' }} 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', left: '40%', top: '40%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', filter: 'blur(100px)' }} 
        />
      </div>

        {/* Floating Icons */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {floatingEmojis.map(fe => (
            <motion.div
              key={fe.id}
              initial={{ y: "110vh", x: `${fe.x}vw`, opacity: fe.opacity, scale: 0.8 }}
              animate={{ y: "-10vh", opacity: [fe.opacity, fe.opacity, fe.opacity * 0.5], scale: [0.8, 1.1, 0.7], rotate: [0, 180, 360] }}
              transition={{ duration: 10 + fe.delay * 1.5, delay: fe.delay, repeat: Infinity, ease: "linear" }}
              className="absolute select-none"
            >
              <img src="/quiznih-hero-3d.png" width={fe.size} height={fe.size} alt="" style={{ objectFit: "contain", display: "block" }} />
            </motion.div>
          ))}
        </div>

        <TopBar />

        <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-4 flex items-center justify-between z-10">
          <button onClick={() => {
            if (window.confirm(t("play.leaveConfirm", lang))) {
              sessionStorage.removeItem("quiznih_session");
              setIsJoined(false);
              if (audioRef.current) { audioRef.current.pause(); setMusicOn(false); }
            }
          }} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group text-sm font-medium">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t("play.leaveRoom", lang)}
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
            {mounted && publicKey && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#FCFF52]/30">
                <Wallet2 className="w-4 h-4 text-[#FCFF52]" />
                <span className="text-sm font-mono font-semibold">{walletShort}</span>
              </div>
            )}
            {/* Rank Toggle */}
            <button onClick={() => setShowRankPanel(!showRankPanel)}
              className={`p-2.5 rounded-xl border transition-all ${showRankPanel ? "bg-[#35D07F]/20 border-[#35D07F]/40 text-[#1a9f5e]" : "bg-white/60 border-gray-200 text-gray-500 hover:text-[#1a9f5e]"}`}
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Celebration Emoji Burst */}
        <AnimatePresence>
          {celebrationEmojis.map(ce => (
            <motion.div
              key={ce.id}
              initial={{ opacity: 1, scale: 0, y: 0 }}
              animate={{ opacity: 0, scale: ce.scale * 2, y: -120 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="fixed pointer-events-none z-50 text-4xl sm:text-5xl"
              style={{ left: `${ce.x}%`, top: `${ce.y}%` }}
            >
              {ce.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Rank Panel (slide-out) */}
        <AnimatePresence>
          {showRankPanel && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-72 sm:w-80 z-40 pt-20 pb-8 px-4"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(53,208,127,0.15)", boxShadow: "-8px 0 30px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-[#0a1a0f] flex items-center gap-2"><Trophy className="w-5 h-5 text-[#FCFF52]" /> {t("play.leaderboard", lang)}</h3>
                <button onClick={() => setShowRankPanel(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              {/* Current Player */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#35D07F]/10 to-[#FCFF52]/10 border border-[#35D07F]/20 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#35D07F]/20 flex items-center justify-center text-xl">{AVATARS[selectedAvatar].emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#0a1a0f]">{playerName || "You"}</div>
                    <div className="text-xs text-[#4a6357]">{t("play.yourScore", lang)}</div>
                  </div>
                  <div className="text-xl font-black text-[#35D07F]">{score}</div>
                </div>
              </div>
              {/* Mock leaderboard */}
              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                {[
                  { name: playerName || "You", sc: score, avatar: AVATARS[selectedAvatar].emoji, isYou: true },
                  { name: "Alex", sc: Math.max(0, score - 50 + Math.floor(Math.random() * 100)), avatar: "🦊" },
                  { name: "Bella", sc: Math.max(0, score - 80 + Math.floor(Math.random() * 120)), avatar: "🐱" },
                  { name: "Chris", sc: Math.max(0, score - 120 + Math.floor(Math.random() * 80)), avatar: "🤖" },
                  { name: "Diana", sc: Math.max(0, score - 200 + Math.floor(Math.random() * 60)), avatar: "🦄" },
                ].sort((a, b) => b.sc - a.sc).map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${(p as any).isYou ? "bg-[#35D07F]/10 border border-[#35D07F]/20" : "bg-gray-50 border border-transparent"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? "bg-[#FCFF52] text-black" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
                      {i + 1}
                    </div>
                    <span className="text-lg">{p.avatar}</span>
                    <div className="flex-1">
                      <span className={`text-sm font-bold ${(p as any).isYou ? "text-[#1a9f5e]" : "text-[#0a1a0f]"}`}>{p.name}</span>
                    </div>
                    <span className="font-black text-sm text-[#0a1a0f]">{p.sc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Waiting Area */}
        {quizState === "waiting" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[2.5rem] p-12 max-w-lg w-full text-center space-y-8"
              style={{
                background: "#ffffff",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                border: "1.5px solid rgba(53,208,127,0.3)",
              }}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FCFF52]/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#FCFF52]" />
                </div>
                <h2 className="text-3xl font-extrabold">
                  {t("play.waitingHost", lang)}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {`${t("play.joinedRoom", lang)} ${roomCode}. ${t("play.quizWillStart", lang)}`}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-8 text-center pt-4">
                <div>
                  <div className="text-2xl font-extrabold text-[#FCFF52]">{playerCount}</div>
                  <div className="text-xs text-gray-500 font-semibold">{t("play.players", lang)}</div>
                </div>
                <div>
                  📝 {questions.length} {t("play.questions", lang)}
                  <div className="text-xs text-gray-500 font-semibold">{t("play.questions", lang)}</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#FDE047]">{quizInfo?.reward_pool_amount || 0} CELO</div>
                  <div className="text-xs text-gray-500 font-semibold">{t("play.prizePool", lang)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <div className="w-3 h-3 rounded-full bg-[#FCFF52] animate-pulse" />
                <span className="text-sm text-gray-500 font-medium">
                  {t("play.connected", lang)}
                </span>
              </div>
              
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
              <div className="flex items-center justify-between px-8 py-5 rounded-full border border-black/5 bg-white/90 shadow-sm mb-4">
                <span className="font-bold text-gray-500 font-mono tracking-wider text-sm uppercase">
                  {t("play.question", lang)} {currentQuestionIndex + 1} / {questions.length}
                </span>
                <motion.div 
                  animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1, color: timeLeft <= 5 ? ["#ef4444", "#35D07F", "#ef4444"] : "#35D07F" }}
                  transition={{ duration: 1, repeat: timeLeft <= 5 ? Infinity : 0 }}
                  className="flex items-center gap-2 font-black text-2xl font-mono"
                >
                  <Clock className="w-6 h-6" />
                  {timeLeft}s
                </motion.div>
              </div>

              {/* Question */}
              <motion.div 
                initial={{ y: 20 }} animate={{ y: 0 }}
                className="relative glass p-10 md:p-12 rounded-[2.5rem] border border-[#35D07F]/20 text-center bg-white/95 shadow-[0_10px_40px_rgba(53,208,127,0.1)] overflow-hidden mb-6"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FCFF52] via-[#35D07F] to-[#06B6D4]" />
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-[#0a1a0f] tracking-tight">
                  {questions[currentQuestionIndex]?.question_text}
                </h2>
              </motion.div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {(questions[currentQuestionIndex]?.options || []).map((opt: string, idx: number) => (
                  <motion.button
                    key={idx}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerSelection(idx)}
                    whileHover={{ scale: selectedAnswer === null ? 1.02 : 1, y: selectedAnswer === null ? -2 : 0 }}
                    whileTap={{ scale: selectedAnswer === null ? 0.98 : 1 }}
                    className={`relative p-6 md:p-8 rounded-[2rem] text-lg md:text-xl font-bold transition-all duration-300 overflow-hidden ${
                      selectedAnswer === idx
                        ? "bg-gradient-to-br from-[#35D07F] to-[#1a9f5e] text-white shadow-[0_10px_30px_rgba(53,208,127,0.4)] border-transparent"
                        : "bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-[#35D07F]/40 shadow-sm hover:shadow-md text-gray-800"
                    } ${selectedAnswer !== null && selectedAnswer !== idx ? "opacity-40 scale-95" : ""}`}
                  >
                    <div className="relative z-10 flex items-center gap-5 text-left">
                      <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black font-mono shadow-sm ${
                        selectedAnswer === idx ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="leading-snug">{opt}</span>
                    </div>
                  </motion.button>
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
                  ? t("play.correct", lang) 
                  : t("play.incorrect", lang)}
              </h2>
              
              <div className="glass p-6 rounded-[2rem] border border-black/10 dark:border-white/10 inline-block">
                <p className="text-sm text-gray-500 mb-2">{t("play.correctAnswer", lang)}</p>
                <p className="text-xl font-bold text-[#FCFF52]">
                  {questions[currentQuestionIndex]?.options?.[questions[currentQuestionIndex]?.correct_answer_index]}
                </p>
              </div>
              
              <div className="pt-8 space-y-4">
                {/* Countdown progress bar */}
                <div className="text-sm text-gray-500 font-semibold">
                  {`${t("play.nextIn", lang)} ${revealCountdown}s...`}
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
                  {t("play.skip", lang)}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Final Result & Claim Prize */}
        {quizState === "finished" && (
          <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-12 w-full max-w-2xl mx-auto space-y-8">
            {/* Podium */}
            {podiumPlayers.length > 0 && (
              <PodiumView players={podiumPlayers} />
            )}
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
                  {t("play.quizComplete", lang)}
                </h2>
                <p className="text-gray-500 font-medium">
                  {t("play.finalStats", lang)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t("play.score", lang)}</div>
                  <div className="text-3xl font-black text-[#35D07F]">{score}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t("play.rank", lang)}</div>
                  <div className="text-3xl font-black text-[#FCFF52]">#{claimRank || "?"}</div>
                </div>
              </div>
              
              {/* Reward Section */}
              <div className="p-6 rounded-2xl bg-[#FCFF52]/10 border border-[#FCFF52]/30 space-y-3">
                <h3 className="font-bold text-lg mb-1">
                  {hasClaimed
                    ? t("play.rewardClaimed", lang)
                    : t("play.claimReward", lang)}
                </h3>

                {claimRank !== null ? (
                  claimRank <= 3 ? (
                    <div className="text-4xl font-black text-[#FCFF52] drop-shadow-sm my-2">
                      ◎ {(claimRewardAmount || 0).toFixed(4)} CELO
                      <div className="text-sm font-semibold text-[#35D07F] mt-1">
                        Rank #{claimRank} · {Math.round(REWARD_SPLITS[claimRank - 1] * 100)}% of pool
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm my-2">
                      Rank #{claimRank} — tidak masuk top 3, tidak ada reward CELO
                    </p>
                  )
                ) : (
                  <div className="text-2xl font-black text-[#FCFF52]/70 my-2">
                    Prize Pool: ◎ {quizInfo?.reward_pool_amount || 0} CELO
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      (Top 1: 50% · Top 2: 30% · Top 3: 20%)
                    </div>
                  </div>
                )}

                {hasClaimed && claimRank !== null && claimRank <= 3 && (
                  <div className="flex items-center justify-center gap-2 text-[#35D07F] font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === "ENG" ? "Reward sent to your wallet!" : "Reward sudah dikirim ke wallet kamu!"}</span>
                  </div>
                )}

                {!hasClaimed && (
                  <p className="text-xs text-gray-500">
                    {t("play.celoToWallet", lang)}
                  </p>
                )}
              </div>

              {claimError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {claimError}
                </div>
              )}

              {claimRank !== null && claimRank <= 3 && !isSignatureReady && !hasClaimed && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#FCFF52] font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lang === "ENG" ? "Processing reward, please wait..." : "Memproses reward, harap tunggu..."}
                </div>
              )}

              <button
                onClick={handleClaimReward}
                disabled={isClaiming || hasClaimed || (claimRank !== null && claimRank <= 3 && !isSignatureReady)}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#FDE047] to-[#EAB308] text-black font-extrabold text-lg hover:shadow-[0_0_30px_rgba(253,224,71,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isClaiming ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {t("play.claiming", lang)}</span>
                ) : hasClaimed ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {t("play.claimed", lang)}</span>
                ) : (
                  <span className="flex items-center gap-2"><Gift className="w-5 h-5" /> {t("play.claimBtn", lang)}</span>
                )}
              </button>
              
              <Link 
                href="/dashboard"
                className="block text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setQuizState("waiting")}
              >
                {t("play.backDashboard", lang)}
              </Link>
            </motion.div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full text-[#0a1a0f] flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)" }}>
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0], x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', right: '5%', top: '15%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(252,255,82,0.1)', filter: 'blur(120px)' }} 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0], x: [0, 50, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', left: '5%', bottom: '10%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(53,208,127,0.12)', filter: 'blur(120px)' }} 
        />
      </div>

      <TopBar backHref="/dashboard" />

      {mounted && publicKey && (
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#35D07F]/10 border border-[#35D07F]/30 text-[#1a9f5e] text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-[#35D07F] animate-pulse" />
            {t("play.playerZone", lang)}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold">
            {t("play.joinArena", lang)} 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35D07F] to-[#FCFF52]">{t("play.arena", lang)} 🎮</span>
          </h1>
          <p className="text-[#4a6357] max-w-md mx-auto text-base">
            {t("play.subtitle", lang)}</p>
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
              className="glass rounded-[2rem] p-8 hover:border-[#FCFF52] transition-all text-left space-y-5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(252,255,82,0.08)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#ffffff] border border-[#35D07F] flex items-center justify-center shadow-[0_0_15px_rgba(53,208,127,0.1)] group-hover:shadow-[0_0_20px_rgba(53,208,127,0.2)] transition-shadow">
                <QrCode className="w-8 h-8 text-[#1a9f5e]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-extrabold mb-1 text-[#0a1a0f]">
                  {t("play.scanQR", lang)} 📷
                </h3>
                <p className="text-xs text-[#4a6357]">
                  {t("play.scanDesc", lang)}
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
              className="glass rounded-[2rem] p-8 hover:border-[#35D07F] transition-all text-left space-y-5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(53,208,127,0.08)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#ffffff] border border-[#FCFF52] flex items-center justify-center shadow-[0_0_15px_rgba(252,255,82,0.1)] group-hover:shadow-[0_0_20px_rgba(252,255,82,0.2)] transition-shadow">
                <Keyboard className="w-8 h-8 text-[#7a6e00]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-extrabold mb-1 text-[#0a1a0f]">
                  {t("play.enterCode", lang)} ⌨️
                </h3>
                <p className="text-xs text-[#4a6357]">
                  {t("play.enterCodeDesc", lang)}
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
              {t("play.scanQRCode", lang)}
            </h3>

            {/* QR Scanner Placeholder */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-[#1a9f5e]/50 bg-[#e8fdf2] flex items-center justify-center">
              <div className="absolute inset-4 border-2 border-[#1a9f5e] rounded-2xl border-dashed animate-pulse" />
              <QrCode className="w-16 h-16 text-[#1a9f5e]/50" />

              {/* Scanning line animation */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-[#35D07F] shadow-[0_0_10px_rgba(53,208,127,0.6)]"
                animate={{ top: ["10%", "85%", "10%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <p className="text-sm text-gray-500">
              {t("play.pointCamera", lang)}
            </p>

            {/* Manual code input as fallback */}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={t("play.yourName", lang)}
                  style={{ width: '100%', padding: '12px 20px', borderRadius: 12, border: '1.5px solid rgba(53,208,127,0.3)', outline: 'none', background: '#fff', color: '#0a1a0f', fontWeight: 600, fontFamily: 'inherit', textAlign: 'center' }}
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="ABCXYZ"
                    style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1.5px solid rgba(53,208,127,0.3)', outline: 'none', background: '#fff', color: '#0a1a0f', fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: '0.15em', textAlign: 'center', textTransform: 'uppercase' }}
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
                {t("play.pickCharacter", lang)}
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
                {t("play.enterRoomCode", lang)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("play.askHost", lang)}
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t("play.yourName", lang)}
                style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '2px solid rgba(53,208,127,0.3)', outline: 'none', background: '#fff', color: '#0a1a0f', fontSize: 18, fontWeight: 700, fontFamily: 'inherit', textAlign: 'center' }}
              />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '2px solid rgba(53,208,127,0.3)', outline: 'none', background: '#fff', color: '#0a1a0f', fontSize: 28, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.25em', textAlign: 'center', textTransform: 'uppercase' }}
              />
            </div>

            <button
              onClick={handleJoinWithCode}
              disabled={roomCode.length < 4 || !playerName.trim() || isJoining}
              className="w-full py-5 rounded-2xl font-extrabold text-lg hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-black"
              style={{ background: `linear-gradient(135deg, ${AVATARS[selectedAvatar].color}, #FCFF52)` }}
            >
              {isJoining ? (
                <span className="flex items-center gap-2"><span className="animate-spin text-xl">⏳</span> {t("play.joining", lang)}</span>
              ) : (
                <><span className="text-xl">{AVATARS[selectedAvatar].emoji}</span> {t("play.joinRoom", lang)}</>
              )}
            </button>

            <button
              onClick={() => setJoinMode("select")}
              className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              ⬅️ {t("play.back", lang)}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
