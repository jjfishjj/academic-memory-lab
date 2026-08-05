import { Activity, AudioLines, ChevronRight, Flame, Mic, Pause, Play, Settings2, Sparkles, Volume2, X } from "lucide-react";
import { useMemo, useState } from "react";

const lessons = [
  { text: "The city comes alive after dark.", phonetic: "/ðə ˈsɪti kʌmz əˈlaɪv ˈæftər dɑːrk/", chunks: ["The city", "comes alive", "after dark"], tip: "重音放在 CITY、ALIVE、DARK。" },
  { text: "Could you show me the nearest station?", phonetic: "/kʊd juː ʃoʊ miː ðə ˈnɪrəst ˈsteɪʃən/", chunks: ["Could you show me", "the nearest station"], tip: "Could you 連讀，語氣自然上揚。" },
  { text: "I'd like a coffee with oat milk, please.", phonetic: "/aɪd laɪk ə ˈkɔːfi wɪð oʊt mɪlk pliːz/", chunks: ["I'd like a coffee", "with oat milk", "please"], tip: "弱化 a 與 with，讓句子更流暢。" },
  { text: "The next flight leaves at seven thirty.", phonetic: "/ðə nekst flaɪt liːvz æt ˈsevən ˈθɜːrti/", chunks: ["The next flight", "leaves at", "seven thirty"], tip: "把 leaves at 當成一個節奏單位。" },
  { text: "Every small step makes a real difference.", phonetic: "/ˈevri smɔːl step meɪks ə riːl ˈdɪfrəns/", chunks: ["Every small step", "makes", "a real difference"], tip: "清楚落在 DIFFERENCE 的第一音節。" },
];

const languages = ["English", "日本語", "한국어", "Deutsch", "Français", "Español", "中文"];
const modes = ["Echo Mode", "Rhythm Mode", "Blind Recall", "Boss Round"];
const varks = ["Visual", "Auditory", "Read / Write", "Kinesthetic"];
const talents = ["Explorer", "Architect", "Melodist", "Narrator", "Connector", "Analyst", "Performer", "Visionary"];
type Scores = { rhythm: number; stress: number; flow: number; recall: number };

function SoundStage({ active }: { active: boolean }) {
  const bars = Array.from({ length: 34 }, (_, i) => 18 + Math.abs(Math.sin(i * 0.78)) * 74);
  return <div className={`sound-stage ${active ? "is-playing" : ""}`} aria-hidden="true">
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
  const [scores, setScores] = useState<Scores>({ rhythm: 88, stress: 84, flow: 91, recall: 76 }); const [streak, setStreak] = useState(7);
  const lesson = lessons[index];
  const average = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
  const daily = useMemo(() => [`${talent} 暖身 · ${vark} 提示`, `${mode.replace(" Mode", "")} · 城市情境`, `盲讀回想 · ${difficulty} 速度`], [talent, vark, mode, difficulty]);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel(); setPlaying(true);
    const utterance = new SpeechSynthesisUtterance(lesson.text); utterance.lang = "en-US"; utterance.rate = speed === "Slow" ? .75 : speed === "Fast" ? 1.2 : .95;
    utterance.onend = () => setPlaying(false); speechSynthesis.speak(utterance);
  };
  const nextPhase = () => {
    if (phase < 2) { setPhase(phase + 1); return; }
    const base = 80 + Math.floor(Math.random() * 16); setScores({ rhythm: base, stress: Math.min(99, base + 4), flow: Math.max(72, base - 2), recall: Math.min(99, base + 1) });
    setStreak(streak + 1); setIndex((index + 1) % lessons.length); setPhase(0);
  };

  return <main className="shadow-app">
    <header className="shadow-topbar">
      <div className="shadow-brand"><span><AudioLines /></span><div><b>SHADOW ECHO</b><small>LANGUAGE LAB</small></div></div>
      <div className="mission-progress"><span>今日任務</span><div><i style={{ width: `${((index * 3 + phase + 1) / 15) * 100}%` }} /></div><b>{index * 3 + phase + 1}/15</b></div>
      <div className="top-actions"><button className="streak-pill"><Flame /> {streak} 天連勝</button><button className="round-icon" aria-label="個人化設定" onClick={() => setSetup(true)}><Settings2 /></button></div>
    </header>

    <section className="shadow-shell">
      <aside className="control-rail">
        <label>語言<select value={language} onChange={e => setLanguage(e.target.value)}>{languages.map(x => <option key={x}>{x}</option>)}</select></label>
        <div><span className="rail-label">遊戲模式</span>{modes.map((item, i) => <button key={item} onClick={() => setMode(item)} className={mode === item ? "active" : ""}><i>{["◉", "♫", "◐", "◆"][i]}</i><span>{item}<small>{["逐句跟讀", "掌握重音節奏", "遮稿複述", "連續五句挑戰"][i]}</small></span></button>)}</div>
        <label>難度<select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label>速度<div className="segmented">{["Slow", "Normal", "Fast"].map(x => <button type="button" className={speed === x ? "on" : ""} onClick={() => setSpeed(x)} key={x}>{x}</button>)}</div></label>
        <div className="personal-card"><Sparkles /><span><small>你的學習組合</small><b>{vark} · {talent}</b></span><button onClick={() => setSetup(true)}>編輯</button></div>
      </aside>

      <section className="game-stage">
        <div className="scene-label"><span>SCENE 01</span><b>NEON RECORDING STUDIO</b></div>
        <SoundStage active={playing} />
        <div className="floating-caption">
          <small>{phase === 0 ? "聆聽並捕捉節奏" : phase === 1 ? "在一秒內開始跟讀" : "遮稿回想 · 相信節奏"}</small>
          <h1 className={phase === 2 ? "masked" : ""}>{phase === 2 ? lesson.text.replace(/[A-Za-z]/g, "•") : lesson.text}</h1>
          {(vark === "Read / Write" || phase === 0) && <p>{lesson.phonetic}</p>}
          <div className="beat-line">{lesson.chunks.map((chunk, i) => <span key={chunk}><i className={i === 1 ? "stress" : ""} />{phase === 2 ? `節奏 ${i + 1}` : chunk}</span>)}</div>
        </div>
        <div className="round-tabs">{["01 聆聽", "02 跟讀", "03 回想"].map((x, i) => <span className={phase === i ? "current" : phase > i ? "done" : ""} key={x}>{phase > i ? "✓ " : ""}{x}</span>)}</div>
        <div className="transport">
          <button className="secondary-control" onClick={speak}><Volume2 /> 重播</button>
          <button className={`main-control ${playing ? "playing" : ""}`} onClick={playing ? () => { speechSynthesis.cancel(); setPlaying(false); } : phase === 0 ? speak : nextPhase}>{playing ? <Pause /> : phase === 0 ? <Play /> : <Mic />}<span>{playing ? "播放中" : phase === 0 ? "播放示範" : phase === 1 ? "完成跟讀" : "完成回想"}</span></button>
          <button className="secondary-control" onClick={nextPhase}>跳過 <ChevronRight /></button>
        </div>
        <div className="coach-tip"><span>AI</span><p><b>Coach Nova</b>{lesson.tip}</p></div>
      </section>

      <aside className="score-rail">
        <div className="score-head"><div><small>即時分數</small><b>{average}</b></div><Activity /></div>
        {([['節奏同步', scores.rhythm], ['重音準確', scores.stress], ['流暢度', scores.flow], ['回想力', scores.recall]] as [string, number][]).map(([label,value]) => <div className="score-row" key={label}><span>{label}<b>{value}</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}
        <div className="sentence-list"><small>本次練習 · 5 句</small>{lessons.map((item, i) => <button onClick={() => { setIndex(i); setPhase(0); }} className={i === index ? "active" : i < index ? "done" : ""} key={item.text}><span>{i < index ? "✓" : i + 1}</span><p>{item.text}</p></button>)}</div>
        <div className="daily-card"><small>今日推薦</small>{daily.map((item, i) => <p key={item}><span>{i + 1}</span>{item}</p>)}</div>
      </aside>
    </section>

    {setup && <div className="setup-backdrop"><div className="setup-modal"><button className="modal-close" aria-label="關閉" onClick={() => setSetup(false)}><X /></button><small>PERSONALIZE YOUR LAB</small><h2>你的記憶如何運作？</h2><p>我們會依照你的組合調整提示方式與每日任務。</p><label>VARK 學習型態</label><div className="choice-grid vark-grid">{varks.map(x => <button className={vark === x ? "selected" : ""} onClick={() => setVark(x)} key={x}>{x}</button>)}</div><label>記憶天才型態</label><div className="choice-grid">{talents.map(x => <button className={talent === x ? "selected" : ""} onClick={() => setTalent(x)} key={x}>{x}</button>)}</div><button className="enter-lab" onClick={() => setSetup(false)}>進入實驗室 <ChevronRight /></button></div></div>}
  </main>;
}
