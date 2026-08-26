import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, AudioLines, Brain, ChevronRight, CircleStop, Flame, Gauge, Headphones, Mic, Music2, Play, RotateCcw, Settings2, Sparkles, Target } from "lucide-react";
import ShadowCoach3D from "@/components/ShadowCoach3D";
import ShadowAnalysisCard from "@/components/ShadowAnalysisCard";
import ShadowProgressCard from "@/components/ShadowProgressCard";
import { assessSpeech, type SpeechAssessment } from "@/lib/speechAssessment";
import { audioBlobToWav, mergeProfessionalAssessment, requestProfessionalAssessment } from "@/lib/pronunciationService";
import { LANGUAGE_CODES, SHADOW_CATEGORIES, SHADOW_DIFFICULTIES, dailyLessonIds, lessonsFor, type ShadowCategory, type ShadowDifficulty, type ShadowLanguage } from "@/lib/shadowEchoData";
import { completedLessonIds, loadShadowProgress, saveShadowAttempt } from "@/lib/shadowEchoProgress";

type Mode = "echo" | "rhythm" | "recall" | "boss";
type Phase = "listen" | "shadow" | "recall";
type Speed = "slow" | "normal" | "fast";
type RecognitionResultLike = { 0: { transcript: string; confidence: number }; isFinal: boolean };
type RecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResultLike> }) => void) | null; onerror: ((event: { error: string }) => void) | null; start(): void; stop(): void };
type RecognitionConstructor = new () => RecognitionLike;

const MODES = [
  { id: "echo" as const, icon: AudioLines, name: "Echo Mode", detail: "逐句跟讀" },
  { id: "rhythm" as const, icon: Music2, name: "Rhythm Mode", detail: "掌握重音節奏" },
  { id: "recall" as const, icon: Brain, name: "Blind Recall", detail: "遮稿複述" },
  { id: "boss" as const, icon: Target, name: "Boss Round", detail: "連續五句挑戰" },
];
const PHASES: { id: Phase; label: string }[] = [{ id: "listen", label: "聆聽" }, { id: "shadow", label: "跟讀" }, { id: "recall", label: "回想" }];
const SCORE_LABELS = ["節奏同步", "發音辨識", "流暢度", "內容準確"];
const SPEED_RATE: Record<Speed, number> = { slow: 0.72, normal: 0.9, fast: 1.08 };

function Waveform({ active }: { active: boolean }) {
  return <div className={`se-wave ${active ? "is-active" : ""}`} aria-hidden="true">{Array.from({ length: 27 }, (_, index) => <i key={index} style={{ "--wave-i": index } as React.CSSProperties} />)}</div>;
}

export default function ShadowEcho() {
  const [language, setLanguage] = useState<ShadowLanguage>("English");
  const [difficulty, setDifficulty] = useState<ShadowDifficulty>("Intermediate");
  const [category, setCategory] = useState<ShadowCategory | undefined>();
  const [speed, setSpeed] = useState<Speed>("normal");
  const [mode, setMode] = useState<Mode>("echo");
  const [phase, setPhase] = useState<Phase>("listen");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("先聽一次，注意句子的高低起伏與停頓。");
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [transcript, setTranscript] = useState("");
  const [assessment, setAssessment] = useState<SpeechAssessment | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [bossCompleted, setBossCompleted] = useState(0);
  const [bossScores, setBossScores] = useState<number[]>([]);
  const [progress, setProgress] = useState(loadShadowProgress);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const transcriptRef = useRef("");
  const recognitionPartsRef = useRef<string[]>([]);
  const confidenceRef = useRef(0);
  const energyRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const lessons = useMemo(() => mode === "boss" ? lessonsFor(language) : lessonsFor(language, difficulty, category), [language, difficulty, category, mode]);
  const lesson = lessons[lessonIndex % lessons.length];
  const totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const phaseIndex = PHASES.findIndex((item) => item.id === phase);
  const dailyIds = useMemo(() => dailyLessonIds(), []);
  const completedIds = useMemo(() => completedLessonIds(progress), [progress]);
  const dailyDone = dailyIds.filter((id) => completedIds.has(id)).length;
  const displaySentence = useMemo(() => phase === "recall" || mode === "recall" ? lesson.sentence.replace(/[A-Za-z0-9\u3040-\u30ff\u3400-\u9fff]/g, "•") : lesson.sentence, [lesson.sentence, phase, mode]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    void audioContextRef.current?.close();
  }, []);

  function speak() {
    if (!("speechSynthesis" in window)) { setMessage("目前瀏覽器不支援語音播放，請直接依照節奏點跟讀。"); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.sentence);
    utterance.lang = LANGUAGE_CODES[language];
    utterance.rate = SPEED_RATE[speed];
    utterance.onstart = () => { setPlaying(true); setMessage("播放中：先聽節奏，再在尾音後立刻跟上。"); };
    utterance.onend = () => { setPlaying(false); if (phase === "listen") { setPhase("shadow"); setMessage(mode === "rhythm" ? "自動進入節奏跟讀：跟著三個節奏錨點說一次。" : "已自動進入跟讀：按下開始跟讀，複製剛才的節奏與重音。"); } };
    utterance.onerror = () => { setPlaying(false); setMessage("語音播放未成功，請再試一次。"); };
    window.speechSynthesis.speak(utterance);
  }

  async function completeRecording() {
    setRecording(false);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    void audioContextRef.current?.close();
    const durationMs = Math.max(500, Date.now() - startedAtRef.current);
    const energy = energyRef.current;
    const average = energy.reduce((sum, value) => sum + value, 0) / Math.max(1, energy.length);
    const energyVariation = Math.sqrt(energy.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, energy.length));
    let result = assessSpeech({ expected: lesson.sentence, transcript: transcriptRef.current, language, confidence: confidenceRef.current, durationMs, targetSeconds: lesson.targetSeconds, energyVariation });
    const recordedAudio = new Blob(recordedChunksRef.current, { type: recorderRef.current?.mimeType || "audio/webm" });
    if (recordedAudio.size) {
      setMessage("正在進行音素、重音與語調分析…");
      try {
        const professional = await requestProfessionalAssessment({ audio: await audioBlobToWav(recordedAudio), expected: lesson.sentence, locale: LANGUAGE_CODES[language] });
        if (professional) result = mergeProfessionalAssessment(result, professional, lesson.sentence, language);
      } catch { result = { ...result, feedback: `${result.feedback} 專業音素服務暫時無法連線，本次顯示瀏覽器備援評分。` }; }
    }
    setAssessment(result);
    setScores(result.failure ? [0, 0, 0, 0] : result.scores);
    setTranscript(result.transcript);
    if (!result.transcript) {
      setMessage("辨識失敗：請打開分析卡查看原因與修復方式。");
    } else {
      setMessage(`辨識結果符合 ${result.matchedPercent}%。${result.feedback}`);
      const phonemeIssues = result.phonemeWords?.flatMap((word) => word.phonemes.filter((phoneme) => phoneme.score < 60).map((phoneme) => `/${phoneme.phoneme}/`)) ?? [];
      const wordIssues = result.diff.filter((token) => token.status === "substitute" || token.status === "missing").map((token) => token.expected).filter((word): word is string => Boolean(word));
      setProgress(saveShadowAttempt({ lessonId: lesson.id, at: new Date().toISOString(), transcript: result.transcript, scores: result.scores, durationMs, mode, provider: result.provider, issues: Array.from(new Set([...phonemeIssues, ...wordIssues])).slice(0, 8) }));
      if (mode === "boss") setBossScores((previous) => [...previous, Math.round(result.scores.reduce((sum, score) => sum + score, 0) / 4)]);
    }
    setShowAnalysis(true);
  }

  async function startRecording() {
    if (recording) { if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) { setMessage("此瀏覽器不支援錄音，因此無法進行真實語音評分。請改用最新版 Chrome 或 Edge。"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const browserWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor; webkitAudioContext?: typeof AudioContext };
      const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
      transcriptRef.current = ""; recognitionPartsRef.current = []; confidenceRef.current = 0; energyRef.current = []; recordedChunksRef.current = []; startedAtRef.current = Date.now();
      setTranscript(""); setScores([0, 0, 0, 0]);
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = LANGUAGE_CODES[language]; recognition.continuous = true; recognition.interimResults = true; recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
          let confidence = 0;
          for (let index = event.resultIndex; index < event.results.length; index += 1) { recognitionPartsRef.current[index] = event.results[index][0].transcript; confidence = Math.max(confidence, event.results[index][0].confidence || 0); }
          transcriptRef.current = recognitionPartsRef.current.filter(Boolean).join(" ").trim(); confidenceRef.current = Math.max(confidenceRef.current, confidence); setTranscript(transcriptRef.current);
        };
        recognition.onerror = (event) => setMessage(`語音辨識暫停：${event.error}。錄音仍會保留節奏分析。`);
        recognition.start(); recognitionRef.current = recognition;
      }
      const AudioContextConstructor = window.AudioContext ?? browserWindow.webkitAudioContext;
      if (AudioContextConstructor) {
        const audioContext = new AudioContextConstructor(); audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream); const analyser = audioContext.createAnalyser(); analyser.fftSize = 256; source.connect(analyser);
        const values = new Uint8Array(analyser.frequencyBinCount);
        const sampleEnergy = () => { analyser.getByteTimeDomainData(values); energyRef.current.push(Math.sqrt(values.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / values.length)); animationRef.current = requestAnimationFrame(sampleEnergy); };
        sampleEnergy();
      }
      recorderRef.current = recorder; recorder.ondataavailable = (event) => { if (event.data.size) recordedChunksRef.current.push(event.data); }; recorder.onstop = () => { void completeRecording(); }; recorder.start();
      setRecording(true); setPhase("shadow"); setMessage(Recognition ? "正在辨識你的跟讀…完成後按下停止，或等待自動分析。" : "正在錄音，但此瀏覽器沒有 Speech Recognition；完成後只會顯示支援說明。");
      timerRef.current = window.setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, Math.max(6500, lesson.targetSeconds * 1800));
    } catch { setMessage("尚未取得麥克風權限。你仍可使用播放、分段與回想練習。"); }
  }

  function chooseLesson(index: number) { window.speechSynthesis?.cancel(); setLessonIndex(index); setPhase(mode === "recall" ? "recall" : "listen"); setPlaying(false); setTranscript(""); setScores([0, 0, 0, 0]); setAssessment(null); setShowAnalysis(false); setMessage(mode === "recall" ? "Blind Recall：不播放示範，直接把遮住的句子完整說出來。" : "新句子已就緒。先聽一次，系統會自動進入跟讀。"); }
  function nextLesson() { chooseLesson((lessonIndex + 1) % lessons.length); }
  function resetCourse() { setLessonIndex(0); setPhase(mode === "recall" ? "recall" : "listen"); setTranscript(""); setScores([0, 0, 0, 0]); setAssessment(null); setShowAnalysis(false); setBossCompleted(0); setBossScores([]); }
  function selectMode(nextMode: Mode) {
    setMode(nextMode); setLessonIndex(0); setBossCompleted(0); setBossScores([]); setAssessment(null); setShowAnalysis(false); setTranscript(""); setScores([0, 0, 0, 0]);
    setPhase(nextMode === "recall" ? "recall" : "listen");
    const instructions: Record<Mode, string> = { echo: "Echo Mode：播放示範後會自動進入逐句跟讀。", rhythm: "Rhythm Mode：評分會優先檢查節奏、語速與重音變化。", recall: "Blind Recall：句子已遮住，直接錄下你記得的內容。", boss: "Boss Round：連續完成五句，每句分析後進入下一關。" };
    setMessage(instructions[nextMode]);
  }
  function retryFromAnalysis() { setShowAnalysis(false); setAssessment(null); setTranscript(""); setScores([0, 0, 0, 0]); setPhase(mode === "recall" ? "recall" : "shadow"); setMessage("已準備重新錄製。按下開始，完整說一次。"); }
  function continueFromAnalysis() {
    setShowAnalysis(false);
    if (mode === "echo") { setPhase("recall"); setMessage("進入回想：句子已遮住。現在不看提示，再完整說一次。"); return; }
    if (mode === "boss") {
      const nextCompleted = bossCompleted + 1;
      if (nextCompleted < Math.min(5, lessons.length)) { setBossCompleted(nextCompleted); chooseLesson((lessonIndex + 1) % lessons.length); }
      else { setBossCompleted(0); setBossScores([]); nextLesson(); setMessage("Boss Round 完成！已開始新的回合。"); }
      return;
    }
    nextLesson();
  }

  return <main className="se-lab">
    <header className="se-topbar">
      <Link href="/" className="se-brand" aria-label="返回記憶手帳社首頁"><span className="se-logo"><AudioLines /></span><span><b>SHADOW ECHO</b><small>LANGUAGE LAB</small></span></Link>
      <div className="se-daily"><span>今日任務</span><div><i style={{ width: `${Math.max(8, (dailyDone / dailyIds.length) * 100)}%` }} /></div><b>{dailyDone}/{dailyIds.length}</b></div>
      <div className="se-head-actions"><button className="se-streak"><Flame /> {progress.streak} 天連勝</button><button className="se-round-button" aria-label="個人化設定"><Settings2 /></button></div>
    </header>
    <div className="se-layout">
      <aside className="se-sidebar">
        <Link href="/" className="se-back"><ArrowLeft /> 返回 MemoDesk</Link>
        <label>語言<select value={language} onChange={(event) => { setLanguage(event.target.value as ShadowLanguage); resetCourse(); }}>{Object.keys(LANGUAGE_CODES).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>情境<select value={category ?? "all"} onChange={(event) => { setCategory(event.target.value === "all" ? undefined : event.target.value as ShadowCategory); resetCourse(); }}><option value="all">全部情境</option>{SHADOW_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="se-label">遊戲模式</div><div className="se-mode-list">{MODES.map((item) => { const Icon = item.icon; return <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => selectMode(item.id)}><Icon /><span><b>{item.name}</b><small>{item.detail}</small></span></button>; })}</div>
        <label>難度<select value={difficulty} onChange={(event) => { setDifficulty(event.target.value as ShadowDifficulty); resetCourse(); }}>{SHADOW_DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="se-label">速度</div><div className="se-speed" role="group" aria-label="語音速度">{(["slow", "normal", "fast"] as Speed[]).map((item) => <button key={item} className={speed === item ? "active" : ""} onClick={() => setSpeed(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
        <div className="se-profile"><Sparkles /><span><small>你的學習組合</small><b>Visual · Explorer</b></span><button>編輯</button></div>
      </aside>
      <section className="se-stage">
        <div className="se-scene-title"><span>SCENE {String(lessonIndex + 1).padStart(2, "0")}</span><b>NEON RECORDING STUDIO · WEBGL</b></div>
        <div className="se-visual" aria-label="會隨音訊反應的 3D 教練"><ShadowCoach3D active={playing || recording} /></div><Waveform active={playing || recording} />
        <div className="se-instruction">{mode === "boss" ? `BOSS ${bossCompleted + 1}/${Math.min(5, lessons.length)} · ${phase === "listen" ? "先聽" : "完成本句"}` : phase === "listen" ? "聆聽並捕捉節奏" : phase === "shadow" ? mode === "rhythm" ? "跟著節奏錨點說一次" : "跟上節奏，複製語氣" : "不看提示，完整說一次"}</div>
        <h1 aria-live="polite">{displaySentence}</h1><p className="se-ipa">{phase === "recall" ? "回想完成後可點擊重播確認" : lesson.ipa}</p>
        <div className="se-chunks">{lesson.chunks.map((chunk, index) => <span key={chunk}><i />{phase === "recall" ? `${index + 1} / ${lesson.chunks.length}` : chunk}</span>)}</div>
        <div className="se-phases" role="group" aria-label="練習階段">{PHASES.map((item, index) => <button key={item.id} className={phase === item.id ? "active" : index < phaseIndex ? "done" : ""} onClick={() => setPhase(item.id)}><b>0{index + 1}</b> {item.label}</button>)}</div>
        <div className="se-controls"><button className="se-secondary" onClick={speak}><RotateCcw /> {mode === "recall" ? "偷看示範" : "重播"}</button>{phase === "listen" && mode !== "recall" ? <button className="se-primary" onClick={speak}><Play /> 播放示範</button> : <button className={`se-primary ${recording ? "recording" : ""}`} onClick={startRecording}>{recording ? <CircleStop /> : <Mic />}{recording ? "停止並分析" : mode === "recall" || phase === "recall" ? "開始回想錄音" : mode === "rhythm" ? "開始節奏跟讀" : "開始跟讀"}</button>}<button className="se-secondary" onClick={nextLesson}>跳過 <ChevronRight /></button></div>
        <div className="se-coach-tip" aria-live="polite"><span>AI</span><p><b>Coach Nova</b>{message}{transcript && <em>你說：{transcript}</em>}<small>{lesson.tip}</small></p></div>
      </section>
      <aside className="se-results">
        <div className="se-score-title"><span>真實評分<strong>{totalScore}</strong></span><Gauge /></div><div className="se-metrics">{SCORE_LABELS.map((label, index) => <div key={label}><span>{label}<b>{scores[index]}</b></span><i><em style={{ width: `${scores[index]}%` }} /></i></div>)}</div>
        <div className="se-session-label">{lesson.category} · {difficulty} · {lessons.length} 句</div><div className="se-lesson-list">{lessons.map((item, index) => <button key={item.id} className={lessonIndex === index ? "active" : completedIds.has(item.id) ? "done" : ""} onClick={() => chooseLesson(index)}><span>{completedIds.has(item.id) ? "✓" : index + 1}</span><p>{item.sentence}</p></button>)}</div>
        <ShadowProgressCard progress={progress} />
        <div className="se-recommend"><b>今日推薦 · 已完成 {dailyDone}/{dailyIds.length}</b><p><span>1</span> Explorer 暖身 · Visual 提示</p><p><span>2</span> Echo · {lesson.category}</p><p><span>3</span> 盲讀回想 · {difficulty}</p></div>
      </aside>
    </div>
    {showAnalysis && assessment && <ShadowAnalysisCard assessment={assessment} scores={scores} totalScore={totalScore} modeName={mode === "boss" ? `BOSS ROUND ${bossCompleted + 1}` : MODES.find((item) => item.id === mode)?.name ?? mode} primaryLabel={mode === "echo" ? "進入回想" : mode === "boss" ? bossCompleted + 1 < Math.min(5, lessons.length) ? "下一句挑戰" : "完成回合" : "前往下一句"} bossProgress={mode === "boss" ? `回合平均：${Math.round([...bossScores, totalScore].reduce((sum, score) => sum + score, 0) / (bossScores.length + 1))} · 已完成 ${bossCompleted + 1}/${Math.min(5, lessons.length)}` : undefined} onClose={() => setShowAnalysis(false)} onRetry={retryFromAnalysis} onContinue={continueFromAnalysis} />}
    <div className="se-mobile-nav"><button onClick={speak}><Headphones /><span>聆聽</span></button><button onClick={startRecording}><Mic /><span>跟讀</span></button><button onClick={() => selectMode("recall")}><Brain /><span>回想</span></button><button onClick={nextLesson}><ChevronRight /><span>下一句</span></button></div>
  </main>;
}
