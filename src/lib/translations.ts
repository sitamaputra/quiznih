import type { Lang } from "@/context/LanguageContext";

/**
 * Central translation dictionary for all UI strings.
 * Each key maps to an object with translations for each supported language.
 * Usage: t("key", lang)
 */
const dict: Record<string, Record<Lang, string>> = {
  // ======== DASHBOARD ========
  "dash.badge": { ENG: "Your Command Center", ID: "Pusat Komando Anda", JP: "コマンドセンター", CN: "控制中心", KR: "커맨드 센터", FR: "Centre de commande" },
  "dash.title1": { ENG: "What would you like", ID: "Apa yang ingin", JP: "今日は何を", CN: "你今天想", KR: "오늘 무엇을", FR: "Que souhaitez-vous" },
  "dash.title2": { ENG: "to do today?", ID: "kamu lakukan hari ini?", JP: "しますか？", CN: "做什么？", KR: "하시겠습니까?", FR: "faire aujourd'hui ?" },
  "dash.subtitle": { ENG: "Host quizzes, join games, spin the wheel — all on Celo blockchain.", ID: "Buat kuis, ikut game, putar roda — semuanya di blockchain Celo.", JP: "クイズを作成、ゲームに参加、ルーレットを回す — すべてCeloブロックチェーン上で。", CN: "创建测验、参与游戏、转动转盘 — 一切都在Celo区块链上。", KR: "퀴즈 만들기, 게임 참여, 룰렛 돌리기 — 모두 Celo 블록체인에서.", FR: "Créez des quiz, rejoignez des jeux, tournez la roue — tout sur la blockchain Celo." },
  "dash.createQuiz": { ENG: "Create Quiz", ID: "Buat Kuis", JP: "クイズ作成", CN: "创建测验", KR: "퀴즈 만들기", FR: "Créer un Quiz" },
  "dash.createDesc": { ENG: "Build an interactive quiz room, set CELO rewards, and challenge your friends!", ID: "Bikin ruang kuis interaktif, atur hadiah CELO, dan tantang teman-temanmu!", JP: "インタラクティブなクイズルームを作成し、CELO報酬を設定して友達に挑戦！", CN: "创建互动测验室，设置CELO奖励，挑战你的朋友！", KR: "인터랙티브 퀴즈룸을 만들고 CELO 보상을 설정하고 친구에게 도전하세요!", FR: "Créez une salle de quiz interactive, définissez des récompenses CELO et défiez vos amis !" },
  "dash.startCreating": { ENG: "Start Creating →", ID: "Mulai Buat →", JP: "作成開始 →", CN: "开始创建 →", KR: "만들기 시작 →", FR: "Commencer →" },
  "dash.manageQuizzes": { ENG: "Manage Quizzes", ID: "Kelola Kuis", JP: "クイズ管理", CN: "管理测验", KR: "퀴즈 관리", FR: "Gérer les Quiz" },
  "dash.joinGame": { ENG: "Join Game", ID: "Main Kuis", JP: "ゲーム参加", CN: "加入游戏", KR: "게임 참가", FR: "Rejoindre" },
  "dash.joinDesc": { ENG: "Enter a room code to join the action. Answer fast and win real CELO prizes!", ID: "Masukkan kode ruangan untuk beraksi. Jawab cepat dan menangkan hadiah CELO!", JP: "ルームコードを入力してアクションに参加。素早く答えてCELO賞金を獲得！", CN: "输入房间代码加入行动。快速回答赢取真正的CELO奖励！", KR: "룸 코드를 입력하여 참여하세요. 빠르게 답하고 CELO 상금을 획득하세요!", FR: "Entrez un code de salle pour rejoindre l'action. Répondez vite et gagnez des prix CELO !" },
  "dash.enterArena": { ENG: "Enter Arena →", ID: "Masuk Arena →", JP: "アリーナ入場 →", CN: "进入竞技场 →", KR: "아레나 입장 →", FR: "Entrer dans l'arène →" },
  "dash.spinWheel": { ENG: "Spin Wheel", ID: "Roda Putar", JP: "ルーレット", CN: "转盘", KR: "룰렛", FR: "Roue de la chance" },
  "dash.spinDesc": { ENG: "Can't decide a winner? Let fate spin the prize!", ID: "Bingung pilih pemenang? Biarkan takdir yang memilih!", JP: "勝者が決まらない？運命にお任せ！", CN: "无法决定赢家？让命运来转动奖品！", KR: "우승자를 정할 수 없나요? 운명에 맡기세요!", FR: "Impossible de décider ? Laissez le destin tourner !" },
  "dash.spinNow": { ENG: "Spin Now →", ID: "Putar Sekarang →", JP: "今すぐ回す →", CN: "立即旋转 →", KR: "지금 돌리기 →", FR: "Tourner →" },
  "dash.liveReport": { ENG: "Live Report", ID: "Laporan Live", JP: "ライブレポート", CN: "实时报告", KR: "실시간 보고서", FR: "Rapport en direct" },
  "dash.liveDesc": { ENG: "Watch the leaderboard update in real-time.", ID: "Tonton skor secara real-time dan rasakan ketegangan.", JP: "リアルタイムでリーダーボードを確認。", CN: "实时观看排行榜更新。", KR: "실시간으로 리더보드 업데이트를 확인하세요.", FR: "Regardez le classement se mettre à jour en temps réel." },
  "dash.watchMatch": { ENG: "Watch Match →", ID: "Tonton Match →", JP: "試合観戦 →", CN: "观看比赛 →", KR: "경기 관전 →", FR: "Regarder →" },
  "dash.liveQA": { ENG: "Live Q&A", ID: "Tanya Jawab", JP: "ライブQ&A", CN: "实时问答", KR: "실시간 Q&A", FR: "Q&R en direct" },
  "dash.qaDesc": { ENG: "Create an interactive Q&A space. Ask, vote, and discuss!", ID: "Buat ruang Q&A interaktif. Ajukan pertanyaan dan diskusi!", JP: "インタラクティブQ&Aスペースを作成。質問、投票、議論！", CN: "创建互动问答空间。提问、投票和讨论！", KR: "인터랙티브 Q&A 공간을 만드세요. 질문, 투표, 토론!", FR: "Créez un espace Q&R interactif. Posez des questions et discutez !" },
  "dash.qaAction": { ENG: "Create / Join Q&A →", ID: "Buat / Gabung Q&A →", JP: "Q&A作成/参加 →", CN: "创建/加入问答 →", KR: "Q&A 만들기/참가 →", FR: "Créer / Rejoindre →" },
  "dash.footer": { ENG: "Powered by Celo blockchain · Rewards paid on-chain", ID: "Didukung blockchain Celo · Hadiah dibayar on-chain", JP: "Celoブロックチェーン搭載 · 報酬はオンチェーン", CN: "由Celo区块链驱动 · 奖励链上发放", KR: "Celo 블록체인 기반 · 보상 온체인 지급", FR: "Propulsé par la blockchain Celo · Récompenses on-chain" },
  "dash.feedback": { ENG: "Got Feedback?", ID: "Punya Masukan?", JP: "フィードバックはありますか？", CN: "有反馈吗？", KR: "피드백이 있으신가요?", FR: "Des commentaires ?" },
  "dash.feedbackDesc": { ENG: "Help us improve your Quiznih experience. Report bugs or suggest features!", ID: "Bantu kami meningkatkan pengalaman Quiznih Anda. Laporkan bug atau sarankan fitur!", JP: "Quiznih体験の向上にご協力ください。バグ報告や機能提案をお願いします！", CN: "帮助我们改善您的Quiznih体验。报告Bug或建议新功能！", KR: "Quiznih 경험 개선에 도움을 주세요. 버그 신고 또는 기능 제안!", FR: "Aidez-nous à améliorer votre expérience Quiznih. Signalez des bugs ou suggérez des fonctionnalités !" },
  "dash.feedbackPlaceholder": { ENG: "Share your thoughts or report a bug...", ID: "Bagikan pendapat atau laporkan bug...", JP: "ご意見やバグ報告をお書きください...", CN: "分享您的想法或报告Bug...", KR: "의견을 공유하거나 버그를 신고하세요...", FR: "Partagez vos idées ou signalez un bug..." },
  "dash.feedbackSubmit": { ENG: "Send Feedback", ID: "Kirim Masukan", JP: "送信する", CN: "提交反馈", KR: "피드백 보내기", FR: "Envoyer" },
  "dash.feedbackThanks": { ENG: "Thank you for your feedback!", ID: "Terima kasih atas masukan Anda!", JP: "フィードバックありがとうございます！", CN: "感谢您的反馈！", KR: "피드백 감사합니다!", FR: "Merci pour vos commentaires !" },

  // ======== PLAY PAGE ========
  "play.playerZone": { ENG: "Player Zone", ID: "Zona Pemain", JP: "プレイヤーゾーン", CN: "玩家区域", KR: "플레이어 존", FR: "Zone Joueur" },
  "play.joinArena": { ENG: "Join the", ID: "Masuk", JP: "参加する", CN: "加入", KR: "참가하기", FR: "Rejoindre l'" },
  "play.arena": { ENG: "Arena!", ID: "Arena!", JP: "アリーナ！", CN: "竞技场！", KR: "아레나!", FR: "Arène !" },
  "play.subtitle": { ENG: "Scan the QR code or enter the room code to jump into the game.", ID: "Scan QR code atau masukkan kode ruangan untuk masuk ke permainan.", JP: "QRコードをスキャンするかルームコードを入力してゲームに参加。", CN: "扫描二维码或输入房间代码加入游戏。", KR: "QR 코드를 스캔하거나 방 코드를 입력하세요.", FR: "Scannez le QR code ou entrez le code de la salle." },
  "play.scanQR": { ENG: "Scan QR", ID: "Scan QR", JP: "QRスキャン", CN: "扫描QR", KR: "QR 스캔", FR: "Scanner QR" },
  "play.scanDesc": { ENG: "Scan the host's QR code", ID: "Scan QR code dari host", JP: "ホストのQRコードをスキャン", CN: "扫描主持人的二维码", KR: "호스트의 QR 코드를 스캔", FR: "Scannez le QR code de l'hôte" },
  "play.enterCode": { ENG: "Enter Code", ID: "Masukkan Kode", JP: "コード入力", CN: "输入代码", KR: "코드 입력", FR: "Entrer le code" },
  "play.enterCodeDesc": { ENG: "Type the 6-digit room code", ID: "Ketik kode ruangan 6 digit", JP: "6桁のルームコードを入力", CN: "输入6位房间代码", KR: "6자리 방 코드를 입력", FR: "Tapez le code à 6 chiffres" },
  "play.leaveRoom": { ENG: "Leave Room", ID: "Keluar Ruangan", JP: "退室", CN: "离开房间", KR: "방 나가기", FR: "Quitter la salle" },
  "play.leaveConfirm": { ENG: "Are you sure you want to leave the room?", ID: "Yakin ingin keluar dari ruangan kuis ini?", JP: "本当に部屋を退出しますか？", CN: "确定要离开房间吗？", KR: "정말로 방을 나가시겠습니까?", FR: "Êtes-vous sûr de vouloir quitter la salle ?" },
  "play.waitingHost": { ENG: "Waiting for Host...", ID: "Menunggu Host...", JP: "ホスト待機中...", CN: "等待主持人...", KR: "호스트 대기 중...", FR: "En attente de l'hôte..." },
  "play.joinedRoom": { ENG: "You've joined room", ID: "Anda sudah bergabung di ruangan", JP: "ルームに参加しました", CN: "您已加入房间", KR: "방에 참가했습니다", FR: "Vous avez rejoint la salle" },
  "play.quizWillStart": { ENG: "The quiz will start when the host begins the session.", ID: "Kuis akan dimulai saat host memulai sesi.", JP: "ホストがセッションを開始するとクイズが始まります。", CN: "主持人开始后测验将开始。", KR: "호스트가 세션을 시작하면 퀴즈가 시작됩니다.", FR: "Le quiz commencera quand l'hôte lancera la session." },
  "play.players": { ENG: "Players", ID: "Pemain", JP: "プレイヤー", CN: "玩家", KR: "플레이어", FR: "Joueurs" },
  "play.questions": { ENG: "Questions", ID: "Soal", JP: "問題", CN: "题目", KR: "문제", FR: "Questions" },
  "play.prizePool": { ENG: "Prize Pool", ID: "Total Hadiah", JP: "賞金プール", CN: "奖池", KR: "상금 풀", FR: "Cagnotte" },
  "play.connected": { ENG: "Connected & waiting...", ID: "Terhubung & menunggu...", JP: "接続済み・待機中...", CN: "已连接，等待中...", KR: "연결됨 & 대기 중...", FR: "Connecté & en attente..." },
  "play.question": { ENG: "Question", ID: "Soal", JP: "問題", CN: "题目", KR: "문제", FR: "Question" },
  "play.correct": { ENG: "Correct!", ID: "Benar!", JP: "正解！", CN: "正确！", KR: "정답!", FR: "Correct !" },
  "play.incorrect": { ENG: "Incorrect", ID: "Salah", JP: "不正解", CN: "错误", KR: "오답", FR: "Incorrect" },
  "play.correctAnswer": { ENG: "Correct Answer:", ID: "Jawaban Benar:", JP: "正解：", CN: "正确答案：", KR: "정답:", FR: "Bonne réponse :" },
  "play.nextIn": { ENG: "Next question in", ID: "Soal berikutnya dalam", JP: "次の問題まで", CN: "下一题在", KR: "다음 문제까지", FR: "Prochaine question dans" },
  "play.skip": { ENG: "Skip ▶", ID: "Lewati ▶", JP: "スキップ ▶", CN: "跳过 ▶", KR: "건너뛰기 ▶", FR: "Passer ▶" },
  "play.quizComplete": { ENG: "Quiz Completed!", ID: "Kuis Selesai!", JP: "クイズ完了！", CN: "测验完成！", KR: "퀴즈 완료!", FR: "Quiz terminé !" },
  "play.finalStats": { ENG: "Here are your final stats", ID: "Inilah statistik akhir Anda", JP: "最終結果はこちら", CN: "这是您的最终统计", KR: "최종 통계입니다", FR: "Voici vos statistiques finales" },
  "play.score": { ENG: "Score", ID: "Skor", JP: "スコア", CN: "得分", KR: "점수", FR: "Score" },
  "play.rank": { ENG: "Rank", ID: "Peringkat", JP: "ランク", CN: "排名", KR: "순위", FR: "Rang" },
  "play.rewardClaimed": { ENG: "Reward Claimed!", ID: "Hadiah Diklaim!", JP: "報酬獲得済み！", CN: "奖励已领取！", KR: "보상 수령 완료!", FR: "Récompense réclamée !" },
  "play.claimReward": { ENG: "Claim Your Reward", ID: "Klaim Hadiah Anda", JP: "報酬を受け取る", CN: "领取您的奖励", KR: "보상 받기", FR: "Réclamez votre récompense" },
  "play.onchainConfirmed": { ENG: "On-chain transfer confirmed", ID: "Transfer on-chain dikonfirmasi", JP: "オンチェーン転送確認済み", CN: "链上转账已确认", KR: "온체인 전송 확인됨", FR: "Transfert on-chain confirmé" },
  "play.viewExplorer": { ENG: "View on Celo Explorer", ID: "Lihat di Celo Explorer", JP: "Celo Explorerで確認", CN: "在Celo Explorer查看", KR: "Celo Explorer에서 보기", FR: "Voir sur Celo Explorer" },
  "play.celoToWallet": { ENG: "CELO will be sent directly to your wallet.", ID: "CELO akan dikirim langsung ke wallet Anda.", JP: "CELOはウォレットに直接送金されます。", CN: "CELO将直接发送到您的钱包。", KR: "CELO가 지갑으로 직접 전송됩니다.", FR: "CELO sera envoyé directement à votre portefeuille." },
  "play.claiming": { ENG: "Claiming on-chain...", ID: "Mengklaim on-chain...", JP: "オンチェーン請求中...", CN: "链上领取中...", KR: "온체인 청구 중...", FR: "Réclamation on-chain..." },
  "play.claimed": { ENG: "Claimed!", ID: "Berhasil Diklaim!", JP: "獲得済み！", CN: "已领取！", KR: "수령 완료!", FR: "Réclamé !" },
  "play.claimBtn": { ENG: "Claim Reward", ID: "Klaim Hadiah", JP: "報酬を受け取る", CN: "领取奖励", KR: "보상 받기", FR: "Réclamer" },
  "play.backDashboard": { ENG: "Back to Dashboard", ID: "Kembali ke Dasbor", JP: "ダッシュボードに戻る", CN: "返回仪表盘", KR: "대시보드로 돌아가기", FR: "Retour au tableau de bord" },
  "play.scanQRCode": { ENG: "Scan QR Code", ID: "Scan QR Code", JP: "QRコードスキャン", CN: "扫描二维码", KR: "QR 코드 스캔", FR: "Scanner le QR Code" },
  "play.pointCamera": { ENG: "Point your camera at the QR code displayed by the quiz host.", ID: "Arahkan kamera Anda ke QR code yang ditampilkan oleh host kuis.", JP: "ホストが表示したQRコードにカメラを向けてください。", CN: "将相机对准主持人显示的二维码。", KR: "퀴즈 호스트가 표시한 QR 코드에 카메라를 향하세요.", FR: "Pointez votre caméra vers le QR code affiché par l'hôte." },
  "play.yourName": { ENG: "Your Name", ID: "Nama Anda", JP: "お名前", CN: "您的名字", KR: "이름", FR: "Votre nom" },
  "play.back": { ENG: "Back", ID: "Kembali", JP: "戻る", CN: "返回", KR: "뒤로", FR: "Retour" },
  "play.pickCharacter": { ENG: "Pick Your Character", ID: "Pilih Karaktermu", JP: "キャラクターを選択", CN: "选择你的角色", KR: "캐릭터 선택", FR: "Choisissez votre personnage" },
  "play.enterRoomCode": { ENG: "Enter Room Code", ID: "Masukkan Kode Ruangan", JP: "ルームコードを入力", CN: "输入房间代码", KR: "방 코드 입력", FR: "Entrez le code de salle" },
  "play.askHost": { ENG: "Ask the host for the 6-character room code.", ID: "Minta kode ruangan 6 karakter dari host.", JP: "ホストに6文字のルームコードを聞いてください。", CN: "向主持人索取6位房间代码。", KR: "호스트에게 6자리 방 코드를 요청하세요.", FR: "Demandez le code à 6 caractères à l'hôte." },
  "play.joining": { ENG: "Joining...", ID: "Bergabung...", JP: "参加中...", CN: "加入中...", KR: "참가 중...", FR: "Connexion..." },
  "play.joinRoom": { ENG: "Join Room", ID: "Gabung Ruangan", JP: "参加する", CN: "加入房间", KR: "방 참가", FR: "Rejoindre" },
  "play.enterCodeAndName": { ENG: "Please enter room code and your name.", ID: "Harap masukkan kode ruangan dan nama Anda.", JP: "ルームコードとお名前を入力してください。", CN: "请输入房间代码和您的名字。", KR: "방 코드와 이름을 입력하세요.", FR: "Veuillez entrer le code et votre nom." },
  "play.notFound": { ENG: "Quiz not found. Check your room code.", ID: "Kuis tidak ditemukan. Periksa kode ruangan Anda.", JP: "クイズが見つかりません。ルームコードを確認してください。", CN: "未找到测验。请检查房间代码。", KR: "퀴즈를 찾을 수 없습니다. 방 코드를 확인하세요.", FR: "Quiz introuvable. Vérifiez le code de salle." },
  "play.leaderboard": { ENG: "Leaderboard", ID: "Peringkat", JP: "リーダーボード", CN: "排行榜", KR: "리더보드", FR: "Classement" },
  "play.yourScore": { ENG: "Your Score", ID: "Skor Anda", JP: "あなたのスコア", CN: "您的得分", KR: "내 점수", FR: "Votre score" },
};

/**
 * Translation helper function.
 * Returns the translation for the given key and language.
 * Falls back to English if the key or language is not found.
 */
export function t(key: string, lang: Lang): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] || entry["ENG"] || key;
}
