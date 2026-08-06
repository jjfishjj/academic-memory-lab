import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BrainCircuit, Check, ChevronRight, RotateCcw, Sparkles, Trophy } from "lucide-react";

type GameId = "palace" | "trail" | "bounce" | "grid" | "maze";
type Game = { id: GameId; icon: string; title: string; source: string; talent: string; description: string; color: string };

const games: Game[] = [
  { id: "palace", icon: "🏛️", title: "記憶宮殿", source: "創作沙盒 → 空間編碼", talent: "圖像建構", description: "把知識放進三個房間，再依空間位置找回順序。", color: "#ef8b6c" },
  { id: "trail", icon: "🐿️", title: "序列追蹤", source: "滑行覓食 → 工作記憶", talent: "系統累積", description: "記住一閃而過的圖示路線，照順序重走一次。", color: "#efb94f" },
  { id: "bounce", icon: "⚡", title: "聯想彈珠", source: "元素彈珠 → 語意連結", talent: "創意連結", description: "用最短時間把概念撞向正確的聯想目標。", color: "#9d79d6" },
  { id: "grid", icon: "🍉", title: "規則數陣", source: "數獨 → 規則提取", talent: "文字整理", description: "觀察重複出現的圖像規律，補上唯一缺少的符號。", color: "#55aa83" },
  { id: "maze", icon: "🗝️", title: "路徑回憶", source: "迷宮救援 → 空間導航", talent: "情境行動", description: "先看鑰匙路線，遮住提示後帶角色安全抵達。", color: "#4c91d8" },
];

const sequences: Record<GameId, string[]> = {
  palace: ["📚", "☕", "🌱", "🎧"], trail: ["🍓", "🥫", "🐟", "🥛"], bounce: ["🔥", "🧊", "⚡", "🌿"],
  grid: ["🍉"], maze: ["↑", "→", "→", "↓"],
};
const choices: Record<GameId, string[]> = {
  palace: ["📚", "☕", "🌱", "🎧", "🎒", "🪴"], trail: ["🍓", "🥫", "🐟", "🥛", "🍩", "🧀"], bounce: ["🔥", "🧊", "⚡", "🌿", "💧", "🪨"],
  grid: ["🍉", "🍋", "🍇", "🥝", "🍒", "🍊"], maze: ["↑", "↓", "←", "→"],
};
const gridPattern = ["🍉", "🍋", "🍇", "🍉", "🍋", "?"];

function loadScores(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem("memgenius-arcade-scores") || "{}"); } catch { return {}; }
}

export default function MemGeniusArcade() {
  const [active, setActive] = useState<GameId | null>(null);
  const [phase, setPhase] = useState<"ready" | "memorize" | "recall" | "result">("ready");
  const [answer, setAnswer] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>(loadScores);
  const [countdown, setCountdown] = useState(5);
  const game = games.find((item) => item.id === active);
  const expected = active ? sequences[active] : [];
  const correct = phase === "result" && answer.join("") === expected.join("");
  const total = useMemo(() => Object.values(scores).reduce((sum, value) => sum + value, 0), [scores]);

  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) { setPhase("recall"); return; }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown]);

  function start(id: GameId) { setActive(id); setAnswer([]); setCountdown(5); setPhase("memorize"); }
  function pick(value: string) {
    if (!active || phase !== "recall") return;
    if (active === "grid") { setAnswer([value]); return; }
    if (answer.length < expected.length) setAnswer((items) => [...items, value]);
  }
  function submit() {
    if (!active) return;
    const isCorrect = answer.join("") === expected.join("");
    const next = { ...scores, [active]: Math.max(scores[active] || 0, isCorrect ? 100 : Math.round((answer.filter((v, i) => v === expected[i]).length / expected.length) * 70)) };
    setScores(next); localStorage.setItem("memgenius-arcade-scores", JSON.stringify(next)); setPhase("result");
  }
  function reset() { setAnswer([]); setCountdown(5); setPhase("memorize"); }

  return (
    <main className="mg-arcade min-h-screen">
      <header className="mg-topbar">
        <Link href="/" className="mg-back"><ArrowLeft size={17} /> 回到記憶手帳社</Link>
        <div className="mg-brand"><BrainCircuit size={22} /><b>MemGenius</b><span>PLAY LAB</span></div>
        <div className="mg-points"><Trophy size={16} /> {total} XP</div>
      </header>

      {!active ? (
        <div className="mg-wrap">
          <section className="mg-hero">
            <div><span className="mg-kicker">把遊戲，變成大腦的健身器材</span><h1>五種玩法，找出你的<br/><em>記憶超能力</em></h1><p>每局只要 30 秒。遊戲會測量空間、序列、聯想、規則與路徑記憶，成績只保存在你的裝置。</p></div>
            <div className="mg-orbit"><span>🧠</span>{games.map((g, i) => <i key={g.id} style={{ "--i": i } as React.CSSProperties}>{g.icon}</i>)}</div>
          </section>
          <section className="mg-summary"><div><small>今日訓練</small><strong>{Object.keys(scores).length}<span>/5</span></strong></div><div><small>累積經驗</small><strong>{total}<span> XP</span></strong></div><div><small>推薦能力</small><strong className="mg-talent">{Object.keys(scores).length ? [...games].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0))[0].talent : "等待測定"}</strong></div></section>
          <section className="mg-grid">{games.map((g, index) => <button key={g.id} className="mg-card" style={{ "--game": g.color } as React.CSSProperties} onClick={() => start(g.id)}><span className="mg-number">0{index + 1}</span><span className="mg-icon">{g.icon}</span><span className="mg-score">{scores[g.id] !== undefined ? `${scores[g.id]} 分` : "NEW"}</span><h2>{g.title}</h2><small>{g.source}</small><p>{g.description}</p><span className="mg-play">開始訓練 <ChevronRight size={17}/></span></button>)}</section>
        </div>
      ) : (
        <div className="mg-stage-wrap">
          <button className="mg-close" onClick={() => { setActive(null); setPhase("ready"); }}>×</button>
          <div className="mg-stage-head"><span className="mg-stage-icon" style={{ background: game?.color }}>{game?.icon}</span><div><small>{game?.source}</small><h1>{game?.title}</h1></div><span className="mg-timer">{phase === "memorize" ? `${countdown}s` : phase === "recall" ? "回想中" : "完成"}</span></div>
          <section className="mg-gameboard">
            {phase === "memorize" && <><p className="mg-instruction">{active === "grid" ? "前三格會循環重複。觀察兩輪規律，等等補上第六格。" : "記住順序與位置，倒數結束後提示會消失。"}</p><div className={`mg-sequence mg-${active}`}>{(active === "grid" ? gridPattern : expected).map((item, i) => <div key={i}><b>{i + 1}</b><span>{item}</span></div>)}</div><button className="mg-skip" onClick={() => setPhase("recall")}>{active === "grid" ? "我看懂規律了" : "我記好了"}</button></>}
            {phase === "recall" && <><p className="mg-instruction">{active === "grid" ? "🍉 → 🍋 → 🍇 不斷循環；第六格應該是哪一個？" : "請依剛才看到的順序點選"}</p>{active === "grid" && <div className="mg-grid-clue" aria-label="西瓜、檸檬、葡萄、西瓜、檸檬、待填答案">{gridPattern.map((item, i) => <span key={i} className={i === gridPattern.length - 1 ? "missing" : ""}>{i === gridPattern.length - 1 ? (answer[0] || "?") : item}</span>)}</div>}<div className={active === "grid" ? "mg-answer sr-only" : "mg-answer"}>{expected.map((_, i) => <span key={i}>{answer[i] || "?"}</span>)}</div><div className="mg-choices">{choices[active].map((item) => <button key={item} onClick={() => pick(item)} aria-label={active === "grid" ? `選擇 ${item} 作為第六格` : undefined}>{item}</button>)}</div><div className="mg-actions"><button onClick={() => setAnswer([])}><RotateCcw size={16}/> 重選</button><button className="primary" disabled={answer.length !== (active === "grid" ? 1 : expected.length)} onClick={submit}>送出答案 <ChevronRight size={16}/></button></div></>}
            {phase === "result" && <div className="mg-result"><div className={correct ? "mg-result-mark good" : "mg-result-mark"}>{correct ? <Check size={42}/> : "再來一次"}</div><span>{correct ? "神經連線成功！" : "差一點，大腦正在長肌肉"}</span><h2>{correct ? "100 XP" : `${scores[active] || 0} XP`}</h2><p>本局鍛鍊：{game?.talent}能力。短暫遮蔽後主動回想，比重看提示更能強化提取路徑。</p><div className="mg-actions center"><button onClick={reset}><RotateCcw size={16}/> 再練一次</button><button className="primary" onClick={() => { setActive(null); setPhase("ready"); }}><Sparkles size={16}/> 選下一項</button></div></div>}
          </section>
        </div>
      )}
    </main>
  );
}
