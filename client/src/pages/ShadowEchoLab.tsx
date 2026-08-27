import { Activity, AudioLines, ChevronRight, Flame, Mic, Pause, Play, RotateCcw, Settings2, Sparkles, Square, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type Language = "English" | "日本語" | "한국어" | "Deutsch" | "Français" | "Español" | "中文";
type Lesson = { text: string; phonetic: string; chunks: string[]; tip: string; seconds: number; scene: string };
const languages: Language[] = ["English", "日本語", "한국어", "Deutsch", "Français", "Español", "中文"];
const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const voiceLocales: Record<Language, string> = { English: "en-US", 日本語: "ja-JP", 한국어: "ko-KR", Deutsch: "de-DE", Français: "fr-FR", Español: "es-ES", 中文: "zh-TW" };
const L = (text: string, phonetic: string, chunks: string[], tip: string, seconds: number, scene: string): Lesson => ({ text, phonetic, chunks, tip, seconds, scene });
const lessonBanks: Record<Language, Record<Difficulty, Lesson[]>> = {
  English: {
    Beginner: [L("Good morning, how are you?", "/ɡʊd ˈmɔːrnɪŋ, haʊ ɑːr juː/", ["Good morning", "how are you"], "Good 與 morning 連起來，句尾自然上揚。", 2.7, "MORNING CAFÉ"), L("I would like some water, please.", "/aɪ wʊd laɪk sʌm ˈwɔːtər pliːz/", ["I would like", "some water", "please"], "弱化 would，清楚說出 WATER。", 3.1, "CAFÉ COUNTER")],
    Intermediate: [L("The city comes alive after dark.", "/ðə ˈsɪti kʌmz əˈlaɪv ˈæftər dɑːrk/", ["The city", "comes alive", "after dark"], "重音放在 CITY、ALIVE、DARK。", 3.1, "NEON CITY"), L("Could you show me the nearest station?", "/kʊd juː ʃoʊ miː ðə ˈnɪrəst ˈsteɪʃən/", ["Could you show me", "the nearest station"], "Could you 連讀，語氣自然上揚。", 3.5, "METRO GATE")],
    Advanced: [L("Although the forecast looked uncertain, we decided to continue.", "/ɔːlˈðoʊ ðə ˈfɔːrkæst lʊkt ʌnˈsɜːrtən, wi dɪˈsaɪdɪd tə kənˈtɪnjuː/", ["Although the forecast", "looked uncertain", "we decided to continue"], "用三段意群保持長句的呼吸與對比。", 6.2, "WEATHER DECK"), L("What impressed me most was how calmly she handled the situation.", "/wʌt ɪmˈprest miː moʊst wəz haʊ ˈkɑːmli ʃiː ˈhændəld ðə ˌsɪtʃuˈeɪʃən/", ["What impressed me most", "was how calmly", "she handled the situation"], "重讀 IMPRESSED、CALMLY、SITUATION。", 6.0, "TEAM BRIEFING")],
  },
  日本語: {
    Beginner: [L("おはようございます。", "ohayō gozaimasu", ["おはよう", "ございます"], "「よう」拉長一拍，句尾保持柔和。", 2.2, "TOKYO MORNING"), L("駅はどこですか。", "eki wa doko desu ka", ["駅は", "どこですか"], "助詞「は」讀作 wa，疑問句尾微微上揚。", 2.1, "STATION STREET")],
    Intermediate: [L("おすすめの料理を教えてください。", "osusume no ryōri o oshiete kudasai", ["おすすめの料理を", "教えてください"], "「料理」的長音要完整，ください連續說。", 4.0, "IZAKAYA TABLE"), L("明日の午後なら時間があります。", "ashita no gogo nara jikan ga arimasu", ["明日の午後なら", "時間があります"], "在 nara 後做輕微停頓。", 4.1, "CALENDAR ROOM")],
    Advanced: [L("環境を守るために、私たちができることから始めましょう。", "kankyō o mamoru tame ni, watashitachi ga dekiru koto kara hajimemashō", ["環境を守るために", "私たちができることから", "始めましょう"], "長音 kankyō、hajimemashō 要維持節奏。", 7.0, "GREEN FORUM"), L("予想していたよりも、結果はずっと興味深いものでした。", "yosō shite ita yori mo, kekka wa zutto kyōmibukai mono deshita", ["予想していたよりも", "結果はずっと", "興味深いものでした"], "強調 zutto，避免句尾速度過快。", 6.5, "RESEARCH LAB")],
  },
  한국어: {
    Beginner: [L("안녕하세요, 반갑습니다.", "annyeonghaseyo, bangapseumnida", ["안녕하세요", "반갑습니다"], "兩個句尾都平穩收音，不要吞掉습니다。", 2.8, "SEOUL LOBBY"), L("물 한 잔 주세요.", "mul han jan juseyo", ["물 한 잔", "주세요"], "한 잔連續說，주세요語氣柔和。", 2.1, "CAFÉ COUNTER")],
    Intermediate: [L("지하철역까지 어떻게 가요?", "jihacheol-yeokkkaji eotteoke gayo", ["지하철역까지", "어떻게 가요"], "역까지的緊音要清楚，句尾上揚。", 3.8, "SUBWAY MAP") ,L("주말에는 친구들과 영화를 봤어요.", "jumareneun chingudeulgwa yeonghwareul bwasseoyo", ["주말에는", "친구들과", "영화를 봤어요"], "分成三個節奏組，重點落在 영화。", 4.3, "CINEMA HALL")],
    Advanced: [L("새로운 관점에서 문제를 바라보는 것이 중요합니다.", "saeroun gwanjeomeseo munjereul baraboneun geosi jungyohamnida", ["새로운 관점에서", "문제를 바라보는 것이", "중요합니다"], "長句保持三段均勻氣流，清楚收尾。", 6.5, "IDEA STUDIO"), L("예상치 못한 변화에도 유연하게 대응할 수 있어야 합니다.", "yesangchi mothan byeonhwaedo yuyeonhage daeeunghal su isseoya hamnida", ["예상치 못한 변화에도", "유연하게 대응할 수", "있어야 합니다"], "對比 변화 與 대응，避免中段含糊。", 7.0, "CONTROL ROOM")],
  },
  Deutsch: {
    Beginner: [L("Guten Morgen, wie geht es Ihnen?", "/ˈɡuːtn̩ ˈmɔʁɡn̩ viː ɡeːt ɛs ˈiːnən/", ["Guten Morgen", "wie geht es Ihnen"], "長音 guten、geht 要穩定。", 3.0, "BERLIN CAFÉ"), L("Ich hätte gern einen Kaffee.", "/ɪç ˈhɛtə ɡɛʁn ˈaɪnən ˈkafeː/", ["Ich hätte gern", "einen Kaffee"], "ich 的摩擦音輕柔，Kaffee 重讀後音節。", 3.0, "COFFEE BAR")],
    Intermediate: [L("Können Sie mir den Weg zum Bahnhof zeigen?", "/ˈkœnən ziː miːɐ̯ deːn veːk tsʊm ˈbaːnhoːf ˈtsaɪɡn̩/", ["Können Sie mir", "den Weg zum Bahnhof", "zeigen"], "Bahnhof 第一音節重讀，Weg 保持長音。", 4.5, "CITY MAP") ,L("Am Wochenende besuchen wir unsere Freunde.", "/am ˈvoːxn̩ˌɛndə bəˈzuːxn̩ viːɐ̯ ˈʊnzəʁə ˈfʁɔɪndə/", ["Am Wochenende", "besuchen wir", "unsere Freunde"], "句中動詞 besuchen 清楚重讀。", 4.2, "WEEKEND TRAIN")],
    Advanced: [L("Obwohl die Aufgabe anspruchsvoll war, fanden wir gemeinsam eine Lösung.", "/ˈoːpvoːl diː ˈaʊfɡaːbə ˈanʃpʁʊxsfɔl vaːɐ̯ ˈfandn̩ viːɐ̯ ɡəˈmaɪnzaːm ˈaɪnə ˈløːzʊŋ/", ["Obwohl die Aufgabe", "anspruchsvoll war", "fanden wir gemeinsam eine Lösung"], "從屬句後停頓，Lösung 長音要完整。", 7.0, "PROJECT ROOM"), L("Eine nachhaltige Entwicklung erfordert langfristiges Denken und entschlossenes Handeln.", "/ˈaɪnə ˈnaːxhaltɪɡə ɛntˈvɪklʊŋ ɛɐ̯ˈfɔʁdɐt ˈlaŋfʁɪstɪɡəs ˈdɛŋkn̩ ʊnt ɛntˈʃlɔsnəs ˈhandln̩/", ["Eine nachhaltige Entwicklung", "erfordert langfristiges Denken", "und entschlossenes Handeln"], "三個複合詞各自保留主要重音。", 8.0, "FUTURE FORUM")],
  },
  Français: {
    Beginner: [L("Bonjour, comment allez-vous ?", "/bɔ̃ʒuʁ kɔmɑ̃ tale vu/", ["Bonjour", "comment allez-vous"], "注意連音 comment_allez，鼻音保持共鳴。", 2.7, "PARIS CAFÉ"), L("Je voudrais un verre d'eau, s'il vous plaît.", "/ʒə vudʁɛ ɛ̃ vɛʁ do sil vu plɛ/", ["Je voudrais", "un verre d'eau", "s'il vous plaît"], "verre d'eau 連讀，句尾自然下降。", 3.7, "BISTRO TABLE")],
    Intermediate: [L("Pourriez-vous me recommander un bon restaurant ?", "/puʁje vu mə ʁəkɔmɑ̃de ɛ̃ bɔ̃ ʁɛstoʁɑ̃/", ["Pourriez-vous me recommander", "un bon restaurant"], "推薦 recommander 的尾音不要吞掉。", 4.5, "HOTEL DESK"), L("Nous avons passé une excellente journée au bord de la mer.", "/nu zavɔ̃ pase yn ɛksɛlɑ̃t ʒuʁne o bɔʁ də la mɛʁ/", ["Nous avons passé", "une excellente journée", "au bord de la mer"], "Nous_avons 連音，journée 節奏延長。", 5.0, "SEASIDE WALK")],
    Advanced: [L("Même si les circonstances étaient difficiles, elle a gardé une attitude positive.", "/mɛm si le siʁkɔ̃stɑ̃s etɛ difisil ɛl a ɡaʁde yn atityd pozitiv/", ["Même si les circonstances", "étaient difficiles", "elle a gardé une attitude positive"], "在 difficiles 後輕停，正面語氣落在 positive。", 7.0, "TEAM FORUM"), L("Il est essentiel que chacun puisse exprimer librement son point de vue.", "/il ɛt esɑ̃sjɛl kə ʃakɛ̃ pɥis ɛkspʁime libʁəmɑ̃ sɔ̃ pwɛ̃ də vy/", ["Il est essentiel", "que chacun puisse exprimer", "librement son point de vue"], "注意 est_essentiel 連音及 puisse 的圓唇音。", 7.2, "DEBATE HALL")],
  },
  Español: {
    Beginner: [L("Buenos días, ¿cómo estás?", "/ˈbwenos ˈdi.as ˈkomo esˈtas/", ["Buenos días", "cómo estás"], "días 保留兩個音節，問句尾上揚。", 2.5, "MADRID MORNING"), L("Quisiera una taza de café, por favor.", "/kiˈsjeɾa ˈuna ˈtasa ðe kaˈfe poɾ faˈβoɾ/", ["Quisiera", "una taza de café", "por favor"], "重音落在 siera、fé、vor。", 3.6, "CAFÉ PLAZA")],
    Intermediate: [L("¿Podrías decirme dónde está la estación más cercana?", "/poˈðɾi.as ðeˈsiɾme ˈðonde esˈta la estaˈsjon mas seɾˈkana/", ["Podrías decirme", "dónde está la estación", "más cercana"], "dónde está 自然連接，estación 重讀尾段。", 5.0, "METRO PLAZA"), L("Este fin de semana vamos a visitar a nuestros amigos.", "/ˈeste fin ðe seˈmana ˈβamos a βisiˈtaɾ a ˈnwestɾos aˈmiɣos/", ["Este fin de semana", "vamos a visitar", "a nuestros amigos"], "vamos_a 與 visitar_a 都要順暢連讀。", 5.1, "WEEKEND ROAD")],
    Advanced: [L("Aunque el proceso fue más complicado de lo esperado, aprendimos mucho.", "/ˈaunke el pɾoˈseso fue mas kompliˈkaðo ðe lo espeˈɾaðo apɾenˈðimos ˈmutʃo/", ["Aunque el proceso", "fue más complicado de lo esperado", "aprendimos mucho"], "長句維持母音清楚，末段語氣有結論感。", 7.0, "LEARNING LAB"), L("La capacidad de adaptarse rápidamente es fundamental en un mundo cambiante.", "/la kapaθiˈðað ðe aðapˈtaɾse rapiðaˈmente es funda menˈtal en un ˈmundo kamˈbjante/", ["La capacidad de adaptarse", "rápidamente es fundamental", "en un mundo cambiante"], "重讀 capacidad、fundamental、cambiante。", 7.4, "GLOBAL FORUM")],
  },
  中文: {
    Beginner: [L("早安，今天過得好嗎？", "zǎo ān, jīn tiān guò de hǎo ma", ["早安", "今天過得", "好嗎"], "第三聲「好」先降再升，問句尾自然上揚。", 2.5, "TAIPEI MORNING"), L("請給我一杯水，謝謝。", "qǐng gěi wǒ yì bēi shuǐ, xiè xie", ["請給我", "一杯水", "謝謝"], "「一」在杯前讀第四聲，謝謝第二字輕聲。", 2.8, "TEA HOUSE")],
    Intermediate: [L("請問最近的捷運站怎麼走？", "qǐng wèn zuì jìn de jié yùn zhàn zěn me zǒu", ["請問", "最近的捷運站", "怎麼走"], "捷運站三字節奏均勻，問句尾上揚。", 3.8, "MRT EXIT"), L("這個週末我想和朋友一起看電影。", "zhè ge zhōu mò wǒ xiǎng hé péng yǒu yì qǐ kàn diàn yǐng", ["這個週末", "我想和朋友", "一起看電影"], "朋友的「友」輕讀，重點落在看電影。", 4.4, "CINEMA STREET")],
    Advanced: [L("即使計畫臨時改變，我們仍然能夠冷靜地找到解決方法。", "jí shǐ jì huà lín shí gǎi biàn, wǒ men réng rán néng gòu lěng jìng de zhǎo dào jiě jué fāng fǎ", ["即使計畫臨時改變", "我們仍然能夠冷靜地", "找到解決方法"], "以三個意群控制呼吸，凸顯仍然與解決方法。", 7.2, "STRATEGY ROOM"), L("真正有效的溝通，不只是清楚表達，也包含耐心傾聽。", "zhēn zhèng yǒu xiào de gōu tōng, bù zhǐ shì qīng chǔ biǎo dá, yě bāo hán nài xīn qīng tīng", ["真正有效的溝通", "不只是清楚表達", "也包含耐心傾聽"], "兩個逗點都短停，結尾重讀耐心傾聽。", 7.0, "COMMUNICATION LAB")],
  },
};
const modes = ["Echo Mode", "Rhythm Mode", "Blind Recall", "Boss Round"];
const varks = ["Visual", "Auditory", "Read / Write", "Kinesthetic"];
const talents = ["Explorer", "Architect", "Melodist", "Narrator", "Connector", "Analyst", "Performer", "Visionary"];
type Scores = { rhythm: number; stress: number; flow: number; recall: number };
type RecordingState = "idle" | "countdown" | "recording" | "ready" | "scored";
type BankProgress = { bestScores: Scores; completed: number[]; currentIndex: number; attempts: number };
type PlayerProgress = {
  version: 1;
  streak: number;
  lastPracticeDate: string;
  banks: Record<string, BankProgress>;
  preferences: { language: Language; difficulty: Difficulty; mode: string; speed: string; vark: string; talent: string };
};
const STORAGE_KEY = "shadow-echo-progress-v1";
const emptyScores = (): Scores => ({ rhythm: 0, stress: 0, flow: 0, recall: 0 });
const defaultProgress = (): PlayerProgress => ({ version: 1, streak: 0, lastPracticeDate: "", banks: {}, preferences: { language: "English", difficulty: "Intermediate", mode: modes[0], speed: "Normal", vark: "Visual", talent: "Explorer" } });
const loadProgress = (): PlayerProgress => {
  try { const saved = window.localStorage.getItem(STORAGE_KEY); if (!saved) return defaultProgress(); const parsed = JSON.parse(saved) as PlayerProgress; return parsed.version === 1 ? parsed : defaultProgress(); }
  catch { return defaultProgress(); }
};
const bankKey = (language: Language, difficulty: Difficulty) => `${language}::${difficulty}`;
const getBankProgress = (progress: PlayerProgress, language: Language, difficulty: Difficulty): BankProgress => progress.banks[bankKey(language, difficulty)] ?? { bestScores: emptyScores(), completed: [], currentIndex: 0, attempts: 0 };
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const nextStreak = (progress: PlayerProgress) => {
  const today = localDate(); if (progress.lastPracticeDate === today) return progress.streak;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  return progress.lastPracticeDate === localDate(yesterday) ? progress.streak + 1 : 1;
};

function SoundStage({ active, level }: { active: boolean; level: number }) {
  const bars = Array.from({ length: 34 }, (_, i) => 18 + Math.abs(Math.sin(i * 0.78)) * 74);
  return <div className={`sound-stage ${active ? "is-playing" : ""}`} style={{ "--voice-level": Math.max(.45, level * 7) } as CSSProperties} aria-hidden="true">
    <div className="stage-orbit orbit-one" /><div className="stage-orbit orbit-two" />
    <div className="coach-avatar"><div className="coach-face"><i /><i /><span /></div><div className="coach-body" /></div>
    <div className="wave-bars">{bars.map((height, i) => <i key={i} style={{ height: `${height}%`, animationDelay: `${i * -45}ms` }} />)}</div>
    <div className="stage-floor" />
  </div>;
}

export default function ShadowEchoLab() {
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress);
  const [language, setLanguage] = useState<Language>(progress.preferences.language); const [difficulty, setDifficulty] = useState<Difficulty>(progress.preferences.difficulty);
  const initialBank = getBankProgress(progress, progress.preferences.language, progress.preferences.difficulty);
  const [index, setIndex] = useState(initialBank.currentIndex); const [phase, setPhase] = useState(0); const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState(progress.preferences.mode); const [speed, setSpeed] = useState(progress.preferences.speed);
  const [vark, setVark] = useState(progress.preferences.vark); const [talent, setTalent] = useState(progress.preferences.talent); const [setup, setSetup] = useState(false);
  const [scores, setScores] = useState<Scores>(emptyScores);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle"); const [countdown, setCountdown] = useState(3); const [recordedUrl, setRecordedUrl] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0); const [voiceLevel, setVoiceLevel] = useState(0); const [feedback, setFeedback] = useState("播放示範後，按下麥克風開始跟讀。"); const [micError, setMicError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null); const streamRef = useRef<MediaStream | null>(null); const chunksRef = useRef<Blob[]>([]); const levelsRef = useRef<number[]>([]);
  const startedAtRef = useRef(0); const meterRef = useRef<number | null>(null); const stopTimerRef = useRef<number | null>(null);
  const lessons = lessonBanks[language][difficulty];
  const lesson = lessons[index % lessons.length];
  const average = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
  const currentBank = getBankProgress(progress, language, difficulty);
  const bestAverage = Math.round(Object.values(currentBank.bestScores).reduce((a, b) => a + b, 0) / 4);
  const visibleScores = average ? scores : currentBank.bestScores;
  const daily = useMemo(() => [`${language} ${difficulty} 暖身`, `${talent} · ${vark} 提示`, `${mode.replace(" Mode", "")} · ${lesson.scene}`], [language, difficulty, talent, vark, mode, lesson.scene]);

  const cleanupStream = () => {
    if (meterRef.current) window.clearInterval(meterRef.current); if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; meterRef.current = null; stopTimerRef.current = null; setVoiceLevel(0);
  };
  useEffect(() => () => { cleanupStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, [recordedUrl]);
  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Storage can be unavailable in private browsing. */ } }, [progress]);
  useEffect(() => { setProgress(previous => ({ ...previous, preferences: { language, difficulty, mode, speed, vark, talent } })); }, [language, difficulty, mode, speed, vark, talent]);

  const resetRecording = () => {
    cleanupStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); setRecordedUrl(""); setRecordingState("idle"); setRecordingSeconds(0); setMicError(""); setFeedback("準備好後，再錄一次。");
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) { setFeedback("此瀏覽器不支援語音示範。"); return; }
    speechSynthesis.cancel(); setPlaying(true); setFeedback("仔細聽重音與句尾節奏。");
    const utterance = new SpeechSynthesisUtterance(lesson.text); utterance.lang = voiceLocales[language]; utterance.rate = speed === "Slow" ? .75 : speed === "Fast" ? 1.2 : .95;
    utterance.onend = () => { setPlaying(false); if (phase === 0) setPhase(1); setFeedback("輪到你了：按下麥克風，倒數後開始說。"); }; speechSynthesis.speak(utterance);
  };
  const stopRecording = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); };
  const scoreRecording = (duration: number, levels: number[]) => {
    const voiced = levels.filter(level => level > .025); const coverage = voiced.length / Math.max(1, levels.length); const mean = voiced.reduce((a, b) => a + b, 0) / Math.max(1, voiced.length);
    const variance = voiced.reduce((sum, level) => sum + Math.pow(level - mean, 2), 0) / Math.max(1, voiced.length); const durationFit = Math.max(0, 1 - Math.abs(duration - lesson.seconds) / lesson.seconds);
    const rhythm = Math.round(55 + durationFit * 40); const stress = Math.round(Math.min(98, 54 + mean * 520 + Math.sqrt(variance) * 190)); const flow = Math.round(Math.min(98, 48 + coverage * 48)); const recall = phase === 2 ? Math.round((rhythm + flow) / 2) : Math.max(scores.recall, 65);
    const result = { rhythm, stress, flow, recall }; setScores(result); setRecordingState("scored");
    setProgress(previous => {
      const key = bankKey(language, difficulty); const bank = getBankProgress(previous, language, difficulty);
      const bestScores = { rhythm: Math.max(bank.bestScores.rhythm, result.rhythm), stress: Math.max(bank.bestScores.stress, result.stress), flow: Math.max(bank.bestScores.flow, result.flow), recall: Math.max(bank.bestScores.recall, result.recall) };
      return { ...previous, banks: { ...previous.banks, [key]: { ...bank, bestScores, attempts: bank.attempts + 1 } } };
    });
    const weakest = Object.entries(result).sort((a, b) => a[1] - b[1])[0][0];
    setFeedback(weakest === "rhythm" ? "節奏可以更貼近示範，試著跟著三個節奏點說。" : weakest === "stress" ? "重音對比可以更明顯，把關鍵字說得更有力。" : weakest === "flow" ? "試著減少停頓，將每個語塊連成一條線。" : "表現很好！可以進入遮稿回想。 ");
  };
  const beginRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setMicError("此瀏覽器不支援錄音，請改用最新版 Chrome、Edge 或 Safari。"); return; }
    resetRecording(); setRecordingState("countdown"); setCountdown(3); setFeedback("準備錄音…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); streamRef.current = stream;
      for (let number = 3; number > 0; number--) { setCountdown(number); await new Promise(resolve => window.setTimeout(resolve, 700)); }
      const recorder = new MediaRecorder(stream); recorderRef.current = recorder; chunksRef.current = []; levelsRef.current = [];
      const context = new AudioContext(); const source = context.createMediaStreamSource(stream); const analyser = context.createAnalyser(); analyser.fftSize = 256; source.connect(analyser); const data = new Uint8Array(analyser.frequencyBinCount);
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => { const duration = (Date.now() - startedAtRef.current) / 1000; setRecordingSeconds(duration); const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); setRecordedUrl(URL.createObjectURL(blob)); setRecordingState("ready"); cleanupStream(); void context.close(); scoreRecording(duration, levelsRef.current); };
      recorder.start(200); startedAtRef.current = Date.now(); setRecordingState("recording"); setFeedback("正在錄音，說完後按停止。");
      meterRef.current = window.setInterval(() => { analyser.getByteFrequencyData(data); const level = data.reduce((a, b) => a + b, 0) / data.length / 255; levelsRef.current.push(level); setVoiceLevel(level); setRecordingSeconds((Date.now() - startedAtRef.current) / 1000); }, 100);
      stopTimerRef.current = window.setTimeout(stopRecording, 12000);
    } catch { cleanupStream(); setRecordingState("idle"); setMicError("無法使用麥克風。請允許此網站的麥克風權限後再試一次。"); setFeedback("麥克風尚未啟用。"); }
  };
  const nextPhase = () => {
    if (phase < 2) { setPhase(phase + 1); resetRecording(); return; }
    const completedIndex = index % lessons.length; const nextIndex = (completedIndex + 1) % lessons.length;
    setProgress(previous => {
      const key = bankKey(language, difficulty); const bank = getBankProgress(previous, language, difficulty);
      return { ...previous, streak: nextStreak(previous), lastPracticeDate: localDate(), banks: { ...previous.banks, [key]: { ...bank, completed: Array.from(new Set([...bank.completed, completedIndex])).sort((a, b) => a - b), currentIndex: nextIndex } } };
    });
    setIndex(nextIndex); setPhase(0); setScores(emptyScores()); resetRecording(); setFeedback("進度已保存。新句子已準備好，先聽示範。");
  };

  const changeLessonBank = (nextLanguage: Language, nextDifficulty: Difficulty) => {
    speechSynthesis.cancel(); setPlaying(false); const savedBank = getBankProgress(progress, nextLanguage, nextDifficulty); setLanguage(nextLanguage); setDifficulty(nextDifficulty); setIndex(savedBank.currentIndex); setPhase(0); setScores(emptyScores()); resetRecording(); setFeedback(`已載入 ${nextLanguage} · ${nextDifficulty} 的進度。`);
  };
  const maskText = (text: string) => text.replace(/[\p{L}\p{N}]/gu, "•");

  const primaryAction = recordingState === "recording" ? stopRecording : phase === 0 ? speak : beginRecording;
  const primaryLabel = recordingState === "countdown" ? `準備 ${countdown}` : recordingState === "recording" ? "停止錄音" : phase === 0 ? "播放示範" : recordedUrl ? "重新錄音" : "開始錄音";

  return <main className="shadow-app">
    <header className="shadow-topbar"><div className="shadow-brand"><span><AudioLines /></span><div><b>SHADOW ECHO</b><small>LANGUAGE LAB</small></div></div><div className="mission-progress"><span>{language} · {difficulty}</span><div><i style={{ width: `${(currentBank.completed.length / lessons.length) * 100}%` }} /></div><b>{currentBank.completed.length}/{lessons.length}</b></div><div className="top-actions"><button className="streak-pill"><Flame /> {progress.streak} 天連勝</button><button className="round-icon" aria-label="個人化設定" onClick={() => setSetup(true)}><Settings2 /></button></div></header>
    <section className="shadow-shell">
      <aside className="control-rail"><label>語言<select value={language} onChange={e => changeLessonBank(e.target.value as Language, difficulty)}>{languages.map(x => <option key={x}>{x}</option>)}</select></label><div><span className="rail-label">遊戲模式</span>{modes.map((item, i) => <button key={item} onClick={() => setMode(item)} className={mode === item ? "active" : ""}><i>{["◉", "♫", "◐", "◆"][i]}</i><span>{item}<small>{["逐句跟讀", "掌握重音節奏", "遮稿複述", "連續五句挑戰"][i]}</small></span></button>)}</div><label>難度<select value={difficulty} onChange={e => changeLessonBank(language, e.target.value as Difficulty)}>{difficulties.map(value => <option key={value}>{value}</option>)}</select></label><label>速度<div className="segmented">{["Slow", "Normal", "Fast"].map(x => <button type="button" className={speed === x ? "on" : ""} onClick={() => setSpeed(x)} key={x}>{x}</button>)}</div></label><div className="personal-card"><Sparkles /><span><small>你的學習組合</small><b>{vark} · {talent}</b></span><button onClick={() => setSetup(true)}>編輯</button></div></aside>
      <section className="game-stage">
        <div className="scene-label"><span>LESSON {String(index + 1).padStart(2, "0")} · {language.toUpperCase()}</span><b>{lesson.scene}</b></div><SoundStage active={playing || recordingState === "recording"} level={voiceLevel} />
        {recordingState === "countdown" && <div className="record-countdown" role="status"><small>GET READY</small><b>{countdown}</b></div>}
        <div className="floating-caption"><small>{phase === 0 ? "聆聽並捕捉節奏" : phase === 1 ? "在一秒內開始跟讀" : "遮稿回想 · 相信節奏"}</small><h1 className={phase === 2 ? "masked" : ""}>{phase === 2 ? maskText(lesson.text) : lesson.text}</h1>{(vark === "Read / Write" || phase === 0) && <p>{lesson.phonetic}</p>}<div className="beat-line">{lesson.chunks.map((chunk, i) => <span key={chunk}><i className={i === 1 ? "stress" : ""} />{phase === 2 ? `節奏 ${i + 1}` : chunk}</span>)}</div></div>
        <div className="round-tabs">{["01 聆聽", "02 跟讀", "03 回想"].map((x, i) => <span className={phase === i ? "current" : phase > i ? "done" : ""} key={x}>{phase > i ? "✓ " : ""}{x}</span>)}</div>
        <div className="recording-panel"><div className={`record-status ${recordingState}`}><i />{recordingState === "recording" ? `錄音中 ${recordingSeconds.toFixed(1)}s` : recordedUrl ? `已錄製 ${recordingSeconds.toFixed(1)}s` : "等待錄音"}</div>{recordedUrl && <audio controls src={recordedUrl} aria-label="你的跟讀錄音" />}{micError && <p className="mic-error">{micError}</p>}<p>{feedback}</p></div>
        <div className="transport"><button className="secondary-control" onClick={speak}><Volume2 /> 重播</button><button disabled={recordingState === "countdown"} className={`main-control ${playing || recordingState === "recording" ? "playing" : ""}`} onClick={primaryAction}>{recordingState === "recording" ? <Square /> : playing ? <Pause /> : phase === 0 ? <Play /> : <Mic />}<span>{primaryLabel}</span></button>{recordedUrl ? <button className="secondary-control" onClick={resetRecording}><RotateCcw /> 重錄</button> : <button className="secondary-control" onClick={nextPhase}>跳過 <ChevronRight /></button>}</div>
        <div className="coach-tip"><span>AI</span><p><b>Coach Nova</b>{lesson.tip}</p></div>
      </section>
      <aside className="score-rail"><div className="score-head"><div><small>{average ? "即時分數" : "歷史最佳"}</small><b>{average || bestAverage || "—"}</b></div><Activity /></div>{([['節奏同步', visibleScores.rhythm], ['重音準確', visibleScores.stress], ['流暢度', visibleScores.flow], ['回想力', visibleScores.recall]] as [string, number][]).map(([label,value]) => <div className="score-row" key={label}><span>{label}<b>{value || "—"}</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}<div className="saved-summary"><span><b>{currentBank.completed.length}/{lessons.length}</b><small>完成關卡</small></span><span><b>{currentBank.attempts}</b><small>錄音次數</small></span><span><b>{progress.streak}</b><small>連勝天數</small></span></div>{recordingState === "scored" && <button className="score-next" onClick={nextPhase}>進入下一階段 <ChevronRight /></button>}<div className="sentence-list"><small>課程進度 · 自動保存</small>{lessons.map((item, i) => { const completed = currentBank.completed.includes(i); return <button onClick={() => { setIndex(i); setPhase(0); setScores(emptyScores()); resetRecording(); setProgress(previous => { const key = bankKey(language, difficulty); const bank = getBankProgress(previous, language, difficulty); return { ...previous, banks: { ...previous.banks, [key]: { ...bank, currentIndex: i } } }; }); }} className={i === index ? "active" : completed ? "done" : ""} key={item.text}><span>{completed ? "✓" : i + 1}</span><p>{item.text}</p></button>; })}</div><div className="daily-card"><small>今日推薦</small>{daily.map((item, i) => <p key={item}><span>{i + 1}</span>{item}</p>)}</div></aside>
    </section>
    {setup && <div className="setup-backdrop"><div className="setup-modal"><button className="modal-close" aria-label="關閉" onClick={() => setSetup(false)}><X /></button><small>PERSONALIZE YOUR LAB</small><h2>你的記憶如何運作？</h2><p>我們會依照你的組合調整提示方式與每日任務。</p><label>VARK 學習型態</label><div className="choice-grid vark-grid">{varks.map(x => <button className={vark === x ? "selected" : ""} onClick={() => setVark(x)} key={x}>{x}</button>)}</div><label>記憶天才型態</label><div className="choice-grid">{talents.map(x => <button className={talent === x ? "selected" : ""} onClick={() => setTalent(x)} key={x}>{x}</button>)}</div><button className="enter-lab" onClick={() => setSetup(false)}>進入實驗室 <ChevronRight /></button></div></div>}
  </main>;
}
