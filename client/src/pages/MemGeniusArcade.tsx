import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BrainCircuit, Check, ChevronRight, RotateCcw, Sparkles, Trophy } from "lucide-react";

type GameId = "palace" | "trail" | "bounce" | "grid" | "maze";
type Game = { id: GameId; icon: string; title: string; source: string; talent: string; description: string; color: string };

const games: Game[] = [
  { id: "palace", icon: "🧊", title: "記憶魔方", source: "3D 魔方 → 空間編碼", talent: "圖像建構", description: "旋轉立體魔方，記住知識物件所在的六個方位。", color: "#ef8b6c" },
  { id: "trail", icon: "▦", title: "九宮追蹤", source: "2D 九宮格 → 工作記憶", talent: "系統累積", description: "記住九宮格依序亮起的路徑，再親手重走一次。", color: "#efb94f" },
  { id: "bounce", icon: "⚡", title: "聯想彈珠", source: "概念彈珠 → 語意連結", talent: "創意連結", description: "讀懂概念線索，把彈珠撞向語意最接近的目標。", color: "#9d79d6" },
  { id: "grid", icon: "🍉", title: "規則數陣", source: "數獨 → 規則提取", talent: "文字整理", description: "觀察重複出現的圖像規律，補上唯一缺少的符號。", color: "#55aa83" },
  { id: "maze", icon: "🗝️", title: "路徑回憶", source: "迷宮救援 → 空間導航", talent: "情境行動", description: "先看鑰匙路線，遮住提示後帶角色安全抵達。", color: "#4c91d8" },
];

type Round = { expected: string[]; choices: string[]; prompt: string; focus?: string; clue?: string; pattern?: string[]; cubeFaces?: string[] };
type Difficulty = "easy" | "normal" | "hard";
type TrainingLog = { game: GameId; correct: boolean; responseMs: number; difficulty: Difficulty; round: number; at: string };
const difficultyConfig: Record<Difficulty, { label: string; seconds: number; sequence: number; distractors: number; xp: number; hint: string }> = {
  easy: { label: "初級", seconds: 8, sequence: 3, distractors: 3, xp: 80, hint: "提示較久・3 步記憶" },
  normal: { label: "中級", seconds: 5, sequence: 4, distractors: 5, xp: 100, hint: "標準時間・4 步記憶" },
  hard: { label: "高級", seconds: 3, sequence: 5, distractors: 7, xp: 140, hint: "快速遮蔽・5 步記憶" },
};
const ROUND_COUNT = 12;
const faceNames = ["正面", "背面", "右側", "左側", "頂面", "底面"];
const faceClasses = ["front", "back", "right", "left", "top", "bottom"];
const palaceItems = ["📚", "☕", "🌱", "🎧", "🧠", "⌛", "🔑", "🎨", "🧪", "🧭", "💡", "🎵"];
const trailPaths = [["1","5","9","8"],["3","5","7","4"],["1","2","5","9"],["7","5","3","6"],["2","4","5","8"],["9","6","5","1"],["4","1","2","6"],["8","9","5","3"],["1","4","8","9"],["6","3","2","5"],["7","8","5","2"],["3","6","8","7"]];
const associations = [
  ["光合作用","植物利用陽光，把二氧化碳和水轉換成養分並釋放氧氣。","🌿"], ["蒸發","液態水吸收熱量後變成氣體。","💨"], ["引力","讓物體落向地面，也維持行星軌道。","🌍"], ["導電","讓電子容易通過材料。","⚡"],
  ["冷凝","水蒸氣遇冷重新變成小水滴。","💧"], ["燃燒","物質與氧快速反應並釋放熱和光。","🔥"], ["冰點","水在特定溫度下從液態變成固態。","🧊"], ["發芽","種子吸水後長出第一株幼苗。","🌱"],
  ["聲波","物體振動，透過介質傳遞。","🔊"], ["磁力","磁鐵不接觸也能吸引特定金屬。","🧲"], ["折射","光進入不同介質時改變方向。","🌈"], ["呼吸作用","細胞分解養分並釋放可用能量。","🔋"],
];
const gridUnits = [["🍉","🍋","🍇"],["🔺","🔵","⭐"],["🐱","🐟","🥛"],["🌞","🌙","☁️"],["🚲","🚌","🚆"],["🌱","🌿","🌳"],["1️⃣","2️⃣","3️⃣"],["❤️","💛","💙"],["📕","📗","📘"],["🥁","🎸","🎹"],["🐣","🐥","🐔"],["🪨","📄","✂️"]];
const mazePaths = [["↑","→","→","↓"],["→","↑","←","↑"],["↓","→","↑","→"],["←","↑","↑","→"],["↑","←","↓","←"],["→","↓","↓","←"],["↓","←","↑","←"],["←","↓","→","↓"],["↑","↑","→","↓"],["→","→","↓","←"],["↓","↓","←","↑"],["←","←","↑","→"]];
const allCells = ["1","2","3","4","5","6","7","8","9"];
const allDirections = ["↑","↓","←","→"];
const allAssociations = associations.map((item) => item[2]);

function getRound(gameId: GameId, index: number, difficulty: Difficulty): Round {
  const i = index % ROUND_COUNT;
  const config = difficultyConfig[difficulty];
  if (gameId === "palace") {
    const focus = palaceItems[i];
    const pool = palaceItems.filter((item) => item !== focus);
    const faces = faceNames.map((_, face) => pool[(i + face) % pool.length]);
    const targetFace = i % faceNames.length;
    faces[targetFace] = focus;
    return { expected: [faceNames[targetFace]], choices: faceNames, prompt: `記住「${focus}」在哪一面。`, focus, cubeFaces: faces };
  }
  if (gameId === "trail") {
    const basePath = trailPaths[i];
    const unusedCell = allCells.find((cell) => !basePath.includes(cell)) ?? "5";
    return { expected: [...basePath, unusedCell].slice(0, config.sequence), choices: allCells, prompt: "記住數字亮起的順序。" };
  }
  if (gameId === "bounce") {
    const [concept, clue, target] = associations[i];
    const pool = allAssociations.filter((item) => item !== target);
    const distractors = Array.from({ length: config.distractors }, (_, offset) => pool[(i + offset) % pool.length]);
    return { expected: [target], choices: [target, ...distractors].sort(), prompt: concept, clue };
  }
  if (gameId === "grid") {
    const unit = gridUnits[i];
    return { expected: [unit[2]], choices: [...unit, ...gridUnits[(i + 4) % ROUND_COUNT]].slice(0, 6), prompt: "找出循環規律的下一格。", pattern: [...unit, unit[0], unit[1], "?"] };
  }
  return { expected: [...mazePaths[i], allDirections[(i + 1) % allDirections.length]].slice(0, config.sequence), choices: allDirections, prompt: "記住鑰匙移動的方向。" };
}

function loadScores(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem("memgenius-arcade-scores") || "{}"); } catch { return {}; }
}
function loadLogs(): TrainingLog[] {
  try { return JSON.parse(localStorage.getItem("memgenius-training-log") || "[]"); } catch { return []; }
}

export default function MemGeniusArcade() {
  const [active, setActive] = useState<GameId | null>(null);
  const [phase, setPhase] = useState<"ready" | "memorize" | "recall" | "result">("ready");
  const [answer, setAnswer] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>(loadScores);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => (localStorage.getItem("memgenius-difficulty") as Difficulty) || "normal");
  const [logs, setLogs] = useState<TrainingLog[]>(loadLogs);
  const [countdown, setCountdown] = useState(difficultyConfig.normal.seconds);
  const [cubeTurn, setCubeTurn] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [recallStartedAt, setRecallStartedAt] = useState(0);
  const game = games.find((item) => item.id === active);
  const round = active ? getRound(active, roundIndex, difficulty) : getRound("palace", 0, difficulty);
  const expected = round.expected;
  const correct = phase === "result" && answer.join("") === expected.join("");
  const total = useMemo(() => Object.values(scores).reduce((sum, value) => sum + value, 0), [scores]);
  const accuracy = logs.length ? Math.round((logs.filter((item) => item.correct).length / logs.length) * 100) : 0;
  const averageSeconds = logs.length ? (logs.reduce((sum, item) => sum + item.responseMs, 0) / logs.length / 1000).toFixed(1) : "0.0";
  const todayKey = new Date().toDateString();
  const todayCount = logs.filter((item) => new Date(item.at).toDateString() === todayKey).length;
  const weakestGame = games.map((item) => { const records = logs.filter((log) => log.game === item.id); return { ...item, rate: records.length ? records.filter((log) => log.correct).length / records.length : 1, attempts: records.length }; }).filter((item) => item.attempts).sort((a, b) => a.rate - b.rate)[0];

  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) { beginRecall(); return; }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown]);

  function chooseDifficulty(value: Difficulty) { setDifficulty(value); localStorage.setItem("memgenius-difficulty", value); }
  function beginRecall() { setRecallStartedAt(Date.now()); setPhase("recall"); }
  function start(id: GameId) { setActive(id); setRoundIndex((current) => { let next = Math.floor(Math.random() * ROUND_COUNT); if (next === current) next = (next + 1) % ROUND_COUNT; return next; }); setAnswer([]); setCountdown(difficultyConfig[difficulty].seconds); setCubeTurn(0); setPhase("memorize"); }
  function pick(value: string) {
    if (!active || phase !== "recall") return;
    if (active === "grid" || active === "palace" || active === "bounce") { setAnswer([value]); return; }
    if (active === "trail" && answer.includes(value)) return;
    if (answer.length < expected.length) setAnswer((items) => [...items, value]);
  }
  function submit() {
    if (!active) return;
    const isCorrect = answer.join("") === expected.join("");
    const earned = isCorrect ? difficultyConfig[difficulty].xp : Math.round((answer.filter((v, i) => v === expected[i]).length / expected.length) * 60);
    const next = { ...scores, [active]: Math.max(scores[active] || 0, earned) };
    const entry: TrainingLog = { game: active, correct: isCorrect, responseMs: Math.max(0, Date.now() - recallStartedAt), difficulty, round: roundIndex, at: new Date().toISOString() };
    const nextLogs = [entry, ...logs].slice(0, 200);
    setScores(next); setLogs(nextLogs); localStorage.setItem("memgenius-arcade-scores", JSON.stringify(next)); localStorage.setItem("memgenius-training-log", JSON.stringify(nextLogs)); setPhase("result");
  }
  function reset() { setRoundIndex((value) => (value + 1) % ROUND_COUNT); setAnswer([]); setCountdown(difficultyConfig[difficulty].seconds); setCubeTurn(0); setPhase("memorize"); }

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
          <section className="mg-difficulty" aria-label="選擇訓練難度"><div><small>TRAINING LEVEL</small><h2>選擇今天的大腦負重</h2></div><div className="mg-levels">{(Object.keys(difficultyConfig) as Difficulty[]).map((level) => <button key={level} className={difficulty === level ? "active" : ""} onClick={() => chooseDifficulty(level)}><b>{difficultyConfig[level].label}</b><span>{difficultyConfig[level].hint}</span><em>{difficultyConfig[level].xp} XP</em></button>)}</div></section>
          <section className="mg-summary"><div><small>今日完成</small><strong>{todayCount}<span> 局</span></strong></div><div><small>整體正確率</small><strong>{accuracy}<span>%</span></strong></div><div><small>平均反應</small><strong>{averageSeconds}<span> 秒</span></strong></div></section>
          <section className="mg-grid">{games.map((g, index) => <button key={g.id} className="mg-card" style={{ "--game": g.color } as React.CSSProperties} onClick={() => start(g.id)}><span className="mg-number">0{index + 1}</span><span className="mg-icon">{g.icon}</span><span className="mg-score">{scores[g.id] !== undefined ? `${scores[g.id]} XP` : "NEW"}</span><h2>{g.title}</h2><small>{g.source} · 12 組題庫</small><p>{g.description}</p><span className="mg-play">開始{difficultyConfig[difficulty].label}訓練 <ChevronRight size={17}/></span></button>)}</section>
          <section className="mg-records"><div><small>TRAINING INSIGHT</small><h2>你的訓練紀錄</h2><p>{logs.length ? `已累積 ${logs.length} 次作答。${weakestGame ? `目前最需要加強的是「${weakestGame.title}」，建議下一局從這裡開始。` : ""}` : "完成第一局後，這裡會顯示正確率、反應時間和弱項。"}</p></div><div className="mg-record-list">{logs.slice(0, 5).map((log, index) => { const item = games.find((g) => g.id === log.game); return <div key={`${log.at}-${index}`}><span>{item?.icon}</span><b>{item?.title}</b><small>{difficultyConfig[log.difficulty].label} · {(log.responseMs / 1000).toFixed(1)}s</small><em className={log.correct ? "good" : "miss"}>{log.correct ? "答對" : "待加強"}</em></div>; })}</div></section>
        </div>
      ) : (
        <div className="mg-stage-wrap">
          <button className="mg-close" onClick={() => { setActive(null); setPhase("ready"); }}>×</button>
          <div className="mg-stage-head"><span className="mg-stage-icon" style={{ background: game?.color }}>{game?.icon}</span><div><small>{game?.source} · {difficultyConfig[difficulty].label} · 題庫 {roundIndex + 1}/{ROUND_COUNT}</small><h1>{game?.title}</h1></div><span className="mg-timer">{phase === "memorize" ? `${countdown}s` : phase === "recall" ? "回想中" : "完成"}</span></div>
          <section className="mg-gameboard">
            {phase === "memorize" && <>
              {active === "palace" ? <><p className="mg-instruction">旋轉魔方觀察六個方位，{round.prompt}</p><div className="mg-cube-scene"><div className="mg-cube" style={{ transform: `rotateX(-18deg) rotateY(${cubeTurn}deg)` }}>{round.cubeFaces?.map((item, i) => <span key={faceClasses[i]} className={faceClasses[i]}>{item}<small>{faceNames[i]}</small></span>)}</div></div><div className="mg-cube-controls"><button onClick={() => setCubeTurn((v) => v - 90)}>↶ 向左轉</button><button onClick={() => setCubeTurn((v) => v + 90)}>向右轉 ↷</button></div></> : active === "trail" ? <><p className="mg-instruction">{round.prompt}等等在空白九宮格重走。</p><div className="mg-nine-grid">{round.choices.map((cell) => { const step = expected.indexOf(cell); return <span key={cell} className={step >= 0 ? "lit" : ""}>{step >= 0 ? step + 1 : ""}</span>; })}</div></> : active === "bounce" ? <><p className="mg-instruction">概念線索：{round.clue}</p><div className="mg-concept-orbit"><span>⚡</span><b>{round.prompt}</b><i>哪一個目標連結最強？</i></div></> : <><p className="mg-instruction">{active === "grid" ? "觀察兩輪循環規律，等等補上第六格。" : round.prompt + "倒數後提示會消失。"}</p><div className={`mg-sequence mg-${active}`}>{(active === "grid" ? (round.pattern ?? []) : expected).map((item, i) => <div key={i}><b>{i + 1}</b><span>{item}</span></div>)}</div></>}
              <button className="mg-skip" onClick={beginRecall}>{active === "grid" ? "我看懂規律了" : "開始作答"}</button>
            </>}
            {phase === "recall" && <>
              <p className="mg-instruction">{active === "palace" ? `剛才的 ${round.focus} 位於魔方哪一面？` : active === "trail" ? "依照剛才 1 → 2 → 3 → 4 的路徑點選九宮格。" : active === "bounce" ? `把「${round.prompt}」彈珠撞向語意最相關的目標。` : active === "grid" ? "依照剛才的循環規律，第六格應該是哪一個？" : "請依剛才看到的順序點選"}</p>
              {active === "trail" ? <div className="mg-nine-grid interactive">{round.choices.map((cell) => <button key={cell} onClick={() => pick(cell)} className={answer.includes(cell) ? "selected" : ""}>{answer.includes(cell) ? answer.indexOf(cell) + 1 : ""}</button>)}</div> : <>{active === "grid" && <div className="mg-grid-clue">{round.pattern?.map((item, i) => <span key={i} className={i === (round.pattern?.length ?? 0) - 1 ? "missing" : ""}>{i === (round.pattern?.length ?? 0) - 1 ? (answer[0] || "?") : item}</span>)}</div>}<div className={(active === "grid" || active === "palace" || active === "bounce") ? "mg-answer sr-only" : "mg-answer"}>{expected.map((_, i) => <span key={i}>{answer[i] || "?"}</span>)}</div><div className={`mg-choices mg-choices-${active}`}>{round.choices.map((item) => <button key={item} onClick={() => pick(item)} className={answer[0] === item ? "selected" : ""}>{item}</button>)}</div></>}
              <div className="mg-actions"><button onClick={() => setAnswer([])}><RotateCcw size={16}/> 重選</button><button className="primary" disabled={answer.length !== expected.length} onClick={submit}>送出答案 <ChevronRight size={16}/></button></div>
            </>}
            {phase === "result" && <div className="mg-result"><div className={correct ? "mg-result-mark good" : "mg-result-mark"}>{correct ? <Check size={42}/> : "再來一次"}</div><span>{correct ? "神經連線成功！" : "差一點，大腦正在長肌肉"}</span><h2>{correct ? `${difficultyConfig[difficulty].xp} XP` : `${scores[active] || 0} XP`}</h2><p>本局鍛鍊：{game?.talent}能力 · 反應時間 {((logs[0]?.responseMs ?? 0) / 1000).toFixed(1)} 秒。短暫遮蔽後主動回想，比重看提示更能強化提取路徑。</p><div className="mg-actions center"><button onClick={reset}><RotateCcw size={16}/> 下一題</button><button className="primary" onClick={() => { setActive(null); setPhase("ready"); }}><Sparkles size={16}/> 查看紀錄</button></div></div>}
          </section>
        </div>
      )}
    </main>
  );
}
