import { Activity, AudioLines, ChevronRight, Flame, Mic, Pause, Play, RotateCcw, Settings2, Sparkles, Square, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

const lessons = [
  { text: "The city comes alive after dark.", phonetic: "/ðə ˈsɪti kʌmz əˈlaɪv ˈæftər dɑːrk/", chunks: ["The city", "comes alive", "after dark"], tip: "重音放在 CITY、ALIVE、DARK。", seconds: 3.1 },
  { text: "Could you show me the nearest station?", phonetic: "/kʊd juː ʃoʊ miː ðə ˈnɪrəst ˈsteɪʃən/", chunks: ["Could you show me", "the nearest station"], tip: "Could you 連讀，語氣自然上揚。", seconds: 3.5 },
  { text: "I'd like a coffee with oat milk, please.", phonetic: "/aɪd laɪk ə ˈkɔːfi wɪð oʊt mɪlk pliːz/", chunks: ["I'd like a coffee", "with oat milk", "please"], tip: "弱化 a 與 with，讓句子更流暢。", seconds: 3.9 },
  { text: "The next flight leaves at seven thirty.", phonetic: "/ðə nekst flaɪt liːvz æt ˈsevən ˈθɜːrti/", chunks: ["The next flight", "leaves at", "seven thirty"], tip: "把 leaves at 當成一個節奏單位。", seconds: 3.6 },
  { text: "Every small step makes a real difference.", phonetic: "/ˈevri smɔːl step meɪks ə riːl ˈdɪfrəns/", chunks: ["Every small step", "makes", "a real difference"], tip: "清楚落在 DIFFERENCE 的第一音節。", seconds: 3.7 },
];

const languages = ["English", "日本語", "한국어", "Deutsch", "Français", "Español", "中文"];
const modes = ["Echo Mode", "Rhythm Mode", "Blind Recall", "Boss Round"];
const varks = ["Visual", "Auditory", "Read / Write", "Kinesthetic"];
const talents = ["Explorer", "Architect", "Melodist", "Narrator", "Connector", "Analyst", "Performer", "Visionary"];
type Scores = { rhythm: number; stress: number; flow: number; recall: number };
type RecordingState = "idle" | "countdown" | "recording" | "ready" | "scored";

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
  const [index, setIndex] = useState(0); const [phase, setPhase] = useState(0); const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState(modes[0]); const [difficulty, setDifficulty] = useState("Intermediate"); const [speed, setSpeed] = useState("Normal");
  const [language, setLanguage] = useState("English"); const [vark, setVark] = useState("Visual"); const [talent, setTalent] = useState("Explorer"); const [setup, setSetup] = useState(false);
  const [scores, setScores] = useState<Scores>({ rhythm: 0, stress: 0, flow: 0, recall: 0 }); const [streak, setStreak] = useState(7);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle"); const [countdown, setCountdown] = useState(3); const [recordedUrl, setRecordedUrl] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0); const [voiceLevel, setVoiceLevel] = useState(0); const [feedback, setFeedback] = useState("播放示範後，按下麥克風開始跟讀。"); const [micError, setMicError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null); const streamRef = useRef<MediaStream | null>(null); const chunksRef = useRef<Blob[]>([]); const levelsRef = useRef<number[]>([]);
  const startedAtRef = useRef(0); const meterRef = useRef<number | null>(null); const stopTimerRef = useRef<number | null>(null);
  const lesson = lessons[index];
  const average = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
  const daily = useMemo(() => [`${talent} 暖身 · ${vark} 提示`, `${mode.replace(" Mode", "")} · 城市情境`, `盲讀回想 · ${difficulty} 速度`], [talent, vark, mode, difficulty]);

  const cleanupStream = () => {
    if (meterRef.current) window.clearInterval(meterRef.current); if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; meterRef.current = null; stopTimerRef.current = null; setVoiceLevel(0);
  };
  useEffect(() => () => { cleanupStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, [recordedUrl]);

  const resetRecording = () => {
    cleanupStream(); if (recordedUrl) URL.revokeObjectURL(recordedUrl); setRecordedUrl(""); setRecordingState("idle"); setRecordingSeconds(0); setMicError(""); setFeedback("準備好後，再錄一次。");
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) { setFeedback("此瀏覽器不支援語音示範。"); return; }
    speechSynthesis.cancel(); setPlaying(true); setFeedback("仔細聽重音與句尾節奏。");
    const utterance = new SpeechSynthesisUtterance(lesson.text); utterance.lang = "en-US"; utterance.rate = speed === "Slow" ? .75 : speed === "Fast" ? 1.2 : .95;
    utterance.onend = () => { setPlaying(false); if (phase === 0) setPhase(1); setFeedback("輪到你了：按下麥克風，倒數後開始說。"); }; speechSynthesis.speak(utterance);
  };
  const stopRecording = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); };
  const scoreRecording = (duration: number, levels: number[]) => {
    const voiced = levels.filter(level => level > .025); const coverage = voiced.length / Math.max(1, levels.length); const mean = voiced.reduce((a, b) => a + b, 0) / Math.max(1, voiced.length);
    const variance = voiced.reduce((sum, level) => sum + Math.pow(level - mean, 2), 0) / Math.max(1, voiced.length); const durationFit = Math.max(0, 1 - Math.abs(duration - lesson.seconds) / lesson.seconds);
    const rhythm = Math.round(55 + durationFit * 40); const stress = Math.round(Math.min(98, 54 + mean * 520 + Math.sqrt(variance) * 190)); const flow = Math.round(Math.min(98, 48 + coverage * 48)); const recall = phase === 2 ? Math.round((rhythm + flow) / 2) : Math.max(scores.recall, 65);
    const result = { rhythm, stress, flow, recall }; setScores(result); setRecordingState("scored");
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
    setStreak(value => value + 1); setIndex(value => (value + 1) % lessons.length); setPhase(0); resetRecording(); setFeedback("新句子已準備好，先聽示範。");
  };

  const primaryAction = recordingState === "recording" ? stopRecording : phase === 0 ? speak : beginRecording;
  const primaryLabel = recordingState === "countdown" ? `準備 ${countdown}` : recordingState === "recording" ? "停止錄音" : phase === 0 ? "播放示範" : recordedUrl ? "重新錄音" : "開始錄音";

  return <main className="shadow-app">
    <header className="shadow-topbar"><div className="shadow-brand"><span><AudioLines /></span><div><b>SHADOW ECHO</b><small>LANGUAGE LAB</small></div></div><div className="mission-progress"><span>今日任務</span><div><i style={{ width: `${((index * 3 + phase + 1) / 15) * 100}%` }} /></div><b>{index * 3 + phase + 1}/15</b></div><div className="top-actions"><button className="streak-pill"><Flame /> {streak} 天連勝</button><button className="round-icon" aria-label="個人化設定" onClick={() => setSetup(true)}><Settings2 /></button></div></header>
    <section className="shadow-shell">
      <aside className="control-rail"><label>語言<select value={language} onChange={e => setLanguage(e.target.value)}>{languages.map(x => <option key={x}>{x}</option>)}</select></label><div><span className="rail-label">遊戲模式</span>{modes.map((item, i) => <button key={item} onClick={() => setMode(item)} className={mode === item ? "active" : ""}><i>{["◉", "♫", "◐", "◆"][i]}</i><span>{item}<small>{["逐句跟讀", "掌握重音節奏", "遮稿複述", "連續五句挑戰"][i]}</small></span></button>)}</div><label>難度<select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>速度<div className="segmented">{["Slow", "Normal", "Fast"].map(x => <button type="button" className={speed === x ? "on" : ""} onClick={() => setSpeed(x)} key={x}>{x}</button>)}</div></label><div className="personal-card"><Sparkles /><span><small>你的學習組合</small><b>{vark} · {talent}</b></span><button onClick={() => setSetup(true)}>編輯</button></div></aside>
      <section className="game-stage">
        <div className="scene-label"><span>SCENE 01</span><b>NEON RECORDING STUDIO</b></div><SoundStage active={playing || recordingState === "recording"} level={voiceLevel} />
        {recordingState === "countdown" && <div className="record-countdown" role="status"><small>GET READY</small><b>{countdown}</b></div>}
        <div className="floating-caption"><small>{phase === 0 ? "聆聽並捕捉節奏" : phase === 1 ? "在一秒內開始跟讀" : "遮稿回想 · 相信節奏"}</small><h1 className={phase === 2 ? "masked" : ""}>{phase === 2 ? lesson.text.replace(/[A-Za-z]/g, "•") : lesson.text}</h1>{(vark === "Read / Write" || phase === 0) && <p>{lesson.phonetic}</p>}<div className="beat-line">{lesson.chunks.map((chunk, i) => <span key={chunk}><i className={i === 1 ? "stress" : ""} />{phase === 2 ? `節奏 ${i + 1}` : chunk}</span>)}</div></div>
        <div className="round-tabs">{["01 聆聽", "02 跟讀", "03 回想"].map((x, i) => <span className={phase === i ? "current" : phase > i ? "done" : ""} key={x}>{phase > i ? "✓ " : ""}{x}</span>)}</div>
        <div className="recording-panel"><div className={`record-status ${recordingState}`}><i />{recordingState === "recording" ? `錄音中 ${recordingSeconds.toFixed(1)}s` : recordedUrl ? `已錄製 ${recordingSeconds.toFixed(1)}s` : "等待錄音"}</div>{recordedUrl && <audio controls src={recordedUrl} aria-label="你的跟讀錄音" />}{micError && <p className="mic-error">{micError}</p>}<p>{feedback}</p></div>
        <div className="transport"><button className="secondary-control" onClick={speak}><Volume2 /> 重播</button><button disabled={recordingState === "countdown"} className={`main-control ${playing || recordingState === "recording" ? "playing" : ""}`} onClick={primaryAction}>{recordingState === "recording" ? <Square /> : playing ? <Pause /> : phase === 0 ? <Play /> : <Mic />}<span>{primaryLabel}</span></button>{recordedUrl ? <button className="secondary-control" onClick={resetRecording}><RotateCcw /> 重錄</button> : <button className="secondary-control" onClick={nextPhase}>跳過 <ChevronRight /></button>}</div>
        <div className="coach-tip"><span>AI</span><p><b>Coach Nova</b>{lesson.tip}</p></div>
      </section>
      <aside className="score-rail"><div className="score-head"><div><small>即時分數</small><b>{average || "—"}</b></div><Activity /></div>{([['節奏同步', scores.rhythm], ['重音準確', scores.stress], ['流暢度', scores.flow], ['回想力', scores.recall]] as [string, number][]).map(([label,value]) => <div className="score-row" key={label}><span>{label}<b>{value || "—"}</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}{recordingState === "scored" && <button className="score-next" onClick={nextPhase}>進入下一階段 <ChevronRight /></button>}<div className="sentence-list"><small>本次練習 · 5 句</small>{lessons.map((item, i) => <button onClick={() => { setIndex(i); setPhase(0); resetRecording(); }} className={i === index ? "active" : i < index ? "done" : ""} key={item.text}><span>{i < index ? "✓" : i + 1}</span><p>{item.text}</p></button>)}</div><div className="daily-card"><small>今日推薦</small>{daily.map((item, i) => <p key={item}><span>{i + 1}</span>{item}</p>)}</div></aside>
    </section>
    {setup && <div className="setup-backdrop"><div className="setup-modal"><button className="modal-close" aria-label="關閉" onClick={() => setSetup(false)}><X /></button><small>PERSONALIZE YOUR LAB</small><h2>你的記憶如何運作？</h2><p>我們會依照你的組合調整提示方式與每日任務。</p><label>VARK 學習型態</label><div className="choice-grid vark-grid">{varks.map(x => <button className={vark === x ? "selected" : ""} onClick={() => setVark(x)} key={x}>{x}</button>)}</div><label>記憶天才型態</label><div className="choice-grid">{talents.map(x => <button className={talent === x ? "selected" : ""} onClick={() => setTalent(x)} key={x}>{x}</button>)}</div><button className="enter-lab" onClick={() => setSetup(false)}>進入實驗室 <ChevronRight /></button></div></div>}
  </main>;
}
