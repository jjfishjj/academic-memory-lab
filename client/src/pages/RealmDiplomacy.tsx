import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Link } from "wouter";
import { ArrowLeft, Backpack, BookOpen, CheckCircle2, Compass, Heart, Languages, Map, RotateCcw, Shield, Sparkles, Sword, Trophy, Volume2, Wind } from "lucide-react";

type NationId = "yun" | "val" | "sakura";
type Nation = { id: NationId; name: string; title: string; language: string; color: string; accent: string; envoy: string; role: string; greeting: string; translation: string; memory: string };

const nations: Nation[] = [
  { id: "yun", name: "雲岫國", title: "浮島與靈脈之邦", language: "華語", color: "#54b6a4", accent: "#b8f2de", envoy: "沈蘭舟", role: "雲岫禮部使", greeting: "四海同風，願與諸邦共守靈脈。", translation: "Across the seas, may all nations safeguard the spirit veins together.", memory: "故事鏈：四海 → 同一陣風 → 守護發光靈脈。" },
  { id: "val", name: "瓦倫聯邦", title: "星港與機巧之邦", language: "English", color: "#e6a950", accent: "#ffe1a6", envoy: "Elara Voss", role: "Federal Sky Envoy", greeting: "Trust is the bridge no storm can break.", translation: "信任是任何風暴都無法摧毀的橋。", memory: "圖像法：把 TRUST 想成暴風中仍發光的橋。" },
  { id: "sakura", name: "櫻霞國", title: "森靈與古歌之邦", language: "日本語", color: "#dc7896", accent: "#ffd0dc", envoy: "九條澪", role: "森語通譯官", greeting: "言葉は、心を結ぶ橋です。", translation: "語言是連結心靈的橋。", memory: "場所法：在心殿門口放一座由「言葉」築成的橋。" },
];

const chapters = [
  { eyebrow: "第一章・萬國靈脈異動", title: "以言語結盟，\n以記憶守護世界。", description: "你是新任「靈語使」。穿梭各國，在文化衝突與語意迷霧中完成外交任務。", objective: "完成三國共同宣言", reward: "靈語使徽章・盟譽 +45", questions: [
    { prompt: "瓦倫使節的真正意思是？", answers: ["信任能跨越危機", "應立即關閉國境", "風暴會摧毀所有橋"], correct: 0, hint: "抓住關鍵詞 Trust、bridge、no storm can break。" },
    { prompt: "向櫻霞代表回應合作，哪句最合適？", answers: ["協力できて光栄です。", "道に迷いました。", "今日は休みです。"], correct: 0, hint: "協力＝合作；光栄＝榮幸。想像兩人合力點亮一枚勳章。" },
    { prompt: "三國盟約應優先採用哪個策略？", answers: ["確認語意，再重述共識", "逐字翻譯，不看情境", "隱藏文化差異"], correct: 0, hint: "外交通譯的順序：聽懂意圖 → 確認 → 重述。" },
  ]},
  { eyebrow: "第二章・霧境商路危機", title: "辨明真意，\n阻止邊境誤會。", description: "三國商隊在霧境失聯，一句被錯譯的警告正引發衝突。找出語意差異，讓商路重新開放。", objective: "化解霧境邊境危機", reward: "文化調停者資格・盟譽 +60", questions: [
    { prompt: "The route is compromised. 最準確的情境意思？", answers: ["路線可能已不安全", "我們接受妥協", "道路已經完成"], correct: 0, hint: "compromised 在安全情境中不是「妥協」，而是「遭破壞／不再安全」。" },
    { prompt: "「確認してから進んでください」應如何執行？", answers: ["確認之後再前進", "一邊前進一邊猜測", "立即撤銷任務"], correct: 0, hint: "把句子切塊：確認してから＝確認之後；進んで＝前進；ください＝請。" },
    { prompt: "雙方都說自己沒有敵意，調停官下一步應做什麼？", answers: ["分別重述雙方意圖並確認", "選擇聲音較大的一方", "省略關鍵警告以求快速"], correct: 0, hint: "用「雙向回譯」：A 的意思說給 B 聽，再請 A 確認是否準確。" },
  ]},
];

const missionPoints: [number, number, number][] = [[-4, .15, -3.2], [4.2, .15, -1], [0, .15, 3.8]];

function Explorer({ nation, target, unlocked, attackTick, dodgeTick, onArrive, onDamage, onEnemyDefeat }: { nation: Nation; target: number; unlocked: boolean; attackTick: number; dodgeTick: number; onArrive: () => void; onDamage: () => void; onEnemyDefeat: () => void }) {
  const player = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const arrived = useRef(unlocked);
  const enemy = useRef<THREE.Group>(null);
  const enemyHp = useRef(3);
  const [enemyDown, setEnemyDown] = useState(false);
  const invulnerableUntil = useRef(0);
  const lastDamage = useRef(0);
  const targetPosition = missionPoints[target];
  useEffect(() => { arrived.current = unlocked; }, [unlocked, target]);
  useEffect(() => { enemyHp.current = 3; setEnemyDown(false); }, [target]);
  useEffect(() => {
    if (!player.current || !enemy.current || enemyDown) return;
    if (player.current.position.distanceTo(enemy.current.position) < 1.8) {
      enemyHp.current -= 1; enemy.current.scale.setScalar(1.35);
      window.setTimeout(() => enemy.current?.scale.setScalar(1), 120);
      if (enemyHp.current <= 0) { setEnemyDown(true); onEnemyDefeat(); }
    }
  }, [attackTick]);
  useEffect(() => { invulnerableUntil.current = performance.now() + 700; }, [dodgeTick]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase(); keys.current.add(key);
      if (!event.repeat && player.current) {
        const taps: Record<string, [number, number]> = { w: [0, -.34], arrowup: [0, -.34], s: [0, .34], arrowdown: [0, .34], a: [-.34, 0], arrowleft: [-.34, 0], d: [.34, 0], arrowright: [.34, 0] };
        const step = taps[key];
        if (step) { player.current.position.x = THREE.MathUtils.clamp(player.current.position.x + step[0], -6.3, 6.3); player.current.position.z = THREE.MathUtils.clamp(player.current.position.z + step[1], -5.3, 5.3); }
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  useFrame(({ camera, clock }, delta) => {
    if (!player.current) return;
    const direction = new THREE.Vector3(
      Number(keys.current.has("d") || keys.current.has("arrowright")) - Number(keys.current.has("a") || keys.current.has("arrowleft")),
      0,
      Number(keys.current.has("s") || keys.current.has("arrowdown")) - Number(keys.current.has("w") || keys.current.has("arrowup")),
    );
    if (direction.lengthSq()) {
      direction.normalize(); player.current.position.addScaledVector(direction, delta * 3.2);
      player.current.position.x = THREE.MathUtils.clamp(player.current.position.x, -6.3, 6.3);
      player.current.position.z = THREE.MathUtils.clamp(player.current.position.z, -5.3, 5.3);
      player.current.rotation.y = Math.atan2(direction.x, direction.z);
      player.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 9)) * .08;
    }
    camera.position.lerp(new THREE.Vector3(player.current.position.x, 6.8, player.current.position.z + 7.5), .055);
    camera.lookAt(player.current.position.x, 0, player.current.position.z - .5);
    const distance = player.current.position.distanceTo(new THREE.Vector3(...targetPosition));
    if (distance < 1.25 && !arrived.current) { arrived.current = true; onArrive(); }
    if (beacon.current) { beacon.current.rotation.y += delta * 1.4; beacon.current.position.y = .25 + Math.sin(clock.elapsedTime * 2.5) * .12; }
    if (enemy.current && !enemyDown) {
      enemy.current.position.x = Math.sin(clock.elapsedTime * .65 + target) * 3.6;
      enemy.current.position.z = Math.cos(clock.elapsedTime * .48 + target) * 2.7;
      enemy.current.rotation.y += delta;
      if (player.current.position.distanceTo(enemy.current.position) < 1.05 && performance.now() > invulnerableUntil.current && performance.now() - lastDamage.current > 900) { lastDamage.current = performance.now(); onDamage(); }
    }
  });
  const props = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: ((i * 3.7) % 12) - 6, z: ((i * 5.3) % 10) - 5, h: .45 + (i % 4) * .22 })), []);
  return <>
    <color attach="background" args={["#06151c"]} /><fog attach="fog" args={["#06151c", 9, 19]} />
    <ambientLight intensity={.85} /><directionalLight position={[4, 9, 3]} intensity={2.4} color={nation.accent} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 13, 10, 10]} /><meshStandardMaterial color="#102f31" roughness={.92} /></mesh>
    <gridHelper args={[14, 14, nation.color, "#16383a"]} position={[0, .015, 0]} />
    {props.map((p, i) => <group key={i} position={[p.x, 0, p.z]}><mesh position={[0, p.h / 2, 0]}><cylinderGeometry args={[.12 + i % 2 * .06, .18, p.h, 6]} /><meshStandardMaterial color={i % 3 ? "#244849" : nation.color} /></mesh><mesh position={[0, p.h + .16, 0]}><coneGeometry args={[.35, .55, 7]} /><meshStandardMaterial color="#173b37" /></mesh></group>)}
    <group ref={beacon} position={targetPosition} visible={!unlocked}>
      <mesh position={[0, .65, 0]}><octahedronGeometry args={[.32]} /><meshStandardMaterial color={nation.accent} emissive={nation.color} emissiveIntensity={2} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.72, .045, 10, 40]} /><meshBasicMaterial color={nation.color} toneMapped={false} /></mesh>
      <pointLight color={nation.color} intensity={7} distance={4} />
    </group>
    {missionPoints.map((point, i) => <group key={i} position={point} visible={i !== target}><mesh position={[0, .5, 0]}><boxGeometry args={[.65, 1, .65]} /><meshStandardMaterial color="#263f42" /></mesh><mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[.75, .75, .18]} /><meshStandardMaterial color={i < target ? nation.color : "#3b4d4f"} /></mesh></group>)}
    <group ref={enemy} visible={!enemyDown} position={[2.5, 0, 0]}>
      <mesh position={[0, .55, 0]}><dodecahedronGeometry args={[.48]} /><meshStandardMaterial color="#8f3650" emissive="#4d1022" emissiveIntensity={1.2} /></mesh>
      <mesh position={[0, 1.03, 0]}><coneGeometry args={[.36, .6, 5]} /><meshStandardMaterial color="#d85b73" /></mesh>
      <mesh position={[-.18, .62, .42]}><sphereGeometry args={[.055]} /><meshBasicMaterial color="#ffec8c" toneMapped={false} /></mesh><mesh position={[.18, .62, .42]}><sphereGeometry args={[.055]} /><meshBasicMaterial color="#ffec8c" toneMapped={false} /></mesh>
      <pointLight color="#ff4168" intensity={4} distance={2.5} />
    </group>
    <group ref={player} position={[0, 0, 4.8]}>
      <mesh position={[0, .65, 0]} castShadow><capsuleGeometry args={[.25, .62, 8, 16]} /><meshStandardMaterial color="#e7e4d0" /></mesh>
      <mesh position={[0, 1.2, 0]}><sphereGeometry args={[.24, 20, 20]} /><meshStandardMaterial color="#f0c7a7" /></mesh>
      <mesh position={[0, 1.42, 0]}><coneGeometry args={[.38, .36, 8]} /><meshStandardMaterial color={nation.color} /></mesh>
      <mesh position={[0, .72, -.28]}><boxGeometry args={[.42, .6, .15]} /><meshStandardMaterial color="#7a5535" /></mesh>
      <pointLight position={[0, 1, .4]} color={nation.accent} intensity={2} distance={2.5} />
    </group>
  </>;
}

export default function RealmDiplomacy() {
  const [nationId, setNationId] = useState<NationId>("val");
  const [quest, setQuest] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [chapterIndex, setChapterIndex] = useState(() => Math.min(Number(localStorage.getItem("realm-chapter") || 0), chapters.length - 1));
  const [chapterComplete, setChapterComplete] = useState(() => localStorage.getItem("realm-chapter-complete") === "true");
  const [encounterReady, setEncounterReady] = useState(false);
  const [runes, setRunes] = useState(0);
  const [health, setHealth] = useState(100);
  const [attackTick, setAttackTick] = useState(0);
  const [dodgeTick, setDodgeTick] = useState(0);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({ tea: 2, seal: 1, shard: 0 });
  const [dialogueBranch, setDialogueBranch] = useState<number | null>(null);
  const [trust, setTrust] = useState(25);
  const [tension, setTension] = useState(75);
  const [battleMessage, setBattleMessage] = useState("選擇你的外交立場。");
  const [reputation, setReputation] = useState(() => Number(localStorage.getItem("realm-reputation") || 35));
  const [completed, setCompleted] = useState(() => Number(localStorage.getItem("realm-completed") || 0));
  const nation = nations.find(n => n.id === nationId)!;
  const chapter = chapters[chapterIndex];
  const question = chapter.questions[quest];
  const correct = choice === question.correct;
  const diplomacyWon = trust >= 80 || tension <= 15;

  useEffect(() => {
    const actionKeys = (event: KeyboardEvent) => { if (event.key.toLowerCase() === "j") attack(); if (event.code === "Space") { event.preventDefault(); dodge(); } if (event.key.toLowerCase() === "i") setInventoryOpen(value => !value); };
    window.addEventListener("keydown", actionKeys); return () => window.removeEventListener("keydown", actionKeys);
  });

  function attack() { setAttackTick(value => value + 1); setBattleMessage("你揮出靈語劍氣。靠近敵人才會命中！"); }
  function dodge() { setDodgeTick(value => value + 1); setBattleMessage("風行步：0.7 秒內免疫傷害。"); }
  function takeDamage() { setHealth(value => Math.max(0, value - 12)); setBattleMessage("霧魘命中你！使用閃避或喝靈茶恢復。"); }
  function defeatEnemy() { setEnemyDefeated(true); setInventory(value => ({ ...value, shard: value.shard + 1 })); setBattleMessage("擊敗巡邏霧魘，獲得記憶碎片 ×1！"); }
  function chooseBranch(index: number) { setDialogueBranch(index); const starts = [{ trust: 40, tension: 60, text: "你先傾聽各方證詞，對方願意降低戒心。" }, { trust: 30, tension: 70, text: "你直接指出矛盾，談判進入高壓狀態。" }, { trust: 50, tension: 55, text: "你分享自身經驗，快速建立情感連結。" }][index]; setTrust(starts.trust); setTension(starts.tension); setBattleMessage(starts.text); }
  function useDiplomacySkill(index: number) { const good = index === question.correct; setChoice(index); setTrust(value => Math.min(100, value + (good ? 28 : 7))); setTension(value => Math.max(0, value - (good ? 24 : 5))); setBattleMessage(good ? `技能奏效：${question.hint}` : "對方認為你沒有掌握語境，壓力只稍微下降。"); }
  function useItem(id: "tea" | "seal") { if (!inventory[id]) return; setInventory(value => ({ ...value, [id]: value[id] - 1 })); if (id === "tea") { setHealth(value => Math.min(100, value + 35)); setBattleMessage("飲用靈脈茶，生命恢復 35。"); } else { setTrust(value => Math.min(100, value + 25)); setBattleMessage("使用同心印，外交信任提升 25。"); } }

  function confirm() {
    if (!diplomacyWon) return;
    const nextRep = Math.min(100, reputation + 15);
    const nextCompleted = Math.max(completed, quest + 1);
    setReputation(nextRep); setCompleted(nextCompleted);
    localStorage.setItem("realm-reputation", String(nextRep)); localStorage.setItem("realm-completed", String(nextCompleted));
    if (quest < chapter.questions.length - 1) { setQuest(q => q + 1); setChoice(null); setEncounterReady(false); setEnemyDefeated(false); setDialogueBranch(null); setTrust(25); setTension(75); }
    else { setChapterComplete(true); localStorage.setItem("realm-chapter-complete", "true"); }
  }

  function nextChapter() { const next = Math.min(chapterIndex + 1, chapters.length - 1); setChapterIndex(next); setQuest(0); setChoice(null); setCompleted(0); setChapterComplete(false); setEncounterReady(false); setRunes(0); setNationId("yun"); localStorage.setItem("realm-chapter", String(next)); localStorage.setItem("realm-completed", "0"); localStorage.removeItem("realm-chapter-complete"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function replayChapter() { setQuest(0); setChoice(null); setCompleted(0); setChapterComplete(false); setEncounterReady(false); setRunes(0); localStorage.setItem("realm-completed", "0"); localStorage.removeItem("realm-chapter-complete"); }
  function reset() { setQuest(0); setChoice(null); setChapterIndex(0); setChapterComplete(false); setEncounterReady(false); setRunes(0); setReputation(35); setCompleted(0); ["realm-reputation", "realm-completed", "realm-chapter", "realm-chapter-complete"].forEach(key => localStorage.removeItem(key)); }
  function arrive() { if (!enemyDefeated) { setBattleMessage("巡邏霧魘封鎖了代表！先用 J 攻擊、Space 閃避擊敗它。"); return; } setEncounterReady(true); setRunes(value => value + 1); }
  function pressKey(key: string, down: boolean) { window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key })); }

  return <main className="rd-shell" style={{ "--nation": nation.color, "--nation-soft": nation.accent } as React.CSSProperties}>
    <header className="rd-top"><Link href="/memgenius" className="rd-back"><ArrowLeft size={17} /> 返回 MemGenius</Link><div className="rd-logo"><Sparkles size={18} /><b>語界仙盟</b><span>MEMGENIUS MMORPG</span><Link href="/realm-playcanvas" className="rd-next">試玩 PlayCanvas 新版 →</Link></div><div className="rd-player-stats"><span><Heart size={14} />{health}</span><button onClick={() => setInventoryOpen(true)}><Backpack size={15} />背包 <b>{Object.values(inventory).reduce((a, b) => a + b, 0)}</b></button><span><Shield size={14} />盟譽 {reputation}</span></div></header>
    <section className="rd-world">
      <div className="rd-canvas" tabIndex={0}><Canvas camera={{ position: [0, 6.8, 12.3], fov: 48 }} dpr={[1, 1.5]} shadows><Explorer nation={nation} target={quest} unlocked={encounterReady || chapterComplete} attackTick={attackTick} dodgeTick={dodgeTick} onArrive={arrive} onDamage={takeDamage} onEnemyDefeat={defeatEnemy} /></Canvas><div className="rd-location"><Compass size={15} /><span>探索任務</span><b>{encounterReady ? `${nation.envoy} 已發現` : enemyDefeated ? `前往發光符文・${quest + 1}/3` : "擊敗巡邏霧魘"}</b></div><div className="rd-controls"><span>移動</span><b>WASD</b><b>J 攻擊</b><b>SPACE 閃避</b><em>符文 {runes}/3</em></div><div className="rd-combat-actions"><button onClick={attack}><Sword size={16} />攻擊 <kbd>J</kbd></button><button onClick={dodge}><Wind size={16} />閃避 <kbd>SPACE</kbd></button></div><div className="rd-dpad"><button aria-label="向上移動" onPointerDown={() => pressKey("w", true)} onPointerUp={() => pressKey("w", false)} onPointerLeave={() => pressKey("w", false)}>▲</button><button aria-label="向左移動" onPointerDown={() => pressKey("a", true)} onPointerUp={() => pressKey("a", false)} onPointerLeave={() => pressKey("a", false)}>◀</button><button aria-label="向下移動" onPointerDown={() => pressKey("s", true)} onPointerUp={() => pressKey("s", false)} onPointerLeave={() => pressKey("s", false)}>▼</button><button aria-label="向右移動" onPointerDown={() => pressKey("d", true)} onPointerUp={() => pressKey("d", false)} onPointerLeave={() => pressKey("d", false)}>▶</button></div><div className="rd-battle-log">{battleMessage}</div></div>
      <aside className="rd-hud">
        <div className="rd-eyebrow">{chapter.eyebrow}</div><h1>{chapter.title.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h1><p>{chapter.description}</p>
        <div className="rd-objective"><span>主線任務</span><b>{chapter.objective}</b><small>{completed} / 3 外交節點</small><i><em style={{ width: `${completed / 3 * 100}%` }} /></i></div>
        <div className="rd-nations">{nations.map(n => <button key={n.id} onClick={() => setNationId(n.id)} className={nationId === n.id ? "active" : ""}><span style={{ background: n.color }}>{n.name.slice(0, 1)}</span><div><b>{n.name}</b><small>{n.language}</small></div></button>)}</div>
      </aside>
    </section>
    <section className="rd-console">
      <div className={`rd-envoy ${!encounterReady && !chapterComplete ? "locked" : ""}`}><div className="rd-avatar">{encounterReady || chapterComplete ? nation.envoy.slice(0, 1) : "?"}</div><div><small>{encounterReady || chapterComplete ? nation.role : "尚未接觸"}</small><h2>{encounterReady || chapterComplete ? nation.envoy : "尋找任務代表"}</h2><p>{encounterReady || chapterComplete ? `「${nation.greeting}」` : "移動角色，走進地圖上的發光符文。"}</p>{(encounterReady || chapterComplete) && <button onClick={() => speechSynthesis?.speak(new SpeechSynthesisUtterance(nation.greeting))}><Volume2 size={14} /> 聆聽原句</button>}</div></div>
      <div className={`rd-lexicon ${!encounterReady && !chapterComplete ? "locked" : ""}`}><Languages size={18} /><small>通譯官筆記</small>{encounterReady || chapterComplete ? <><p>{nation.translation}</p><div><BookOpen size={15} /><span>{nation.memory}</span></div></> : <p>取得任務符文後解鎖語句與記憶法。</p>}</div>
      <div className="rd-quest">{chapterComplete ? <div className="rd-complete"><Trophy size={34} /><small>CHAPTER CLEAR</small><h2>{chapter.objective}・完成</h2><p>三國代表已確認你的通譯紀錄。你獲得：</p><b>{chapter.reward}</b><div>{chapterIndex < chapters.length - 1 ? <button className="rd-confirm" onClick={nextChapter}><Map size={15} /> 前往第二章：霧境商路</button> : <button className="rd-confirm" onClick={replayChapter}><RotateCcw size={14} /> 再次巡查霧境</button>}<button className="rd-secondary" onClick={replayChapter}>重玩本章</button><Link href="/memgenius">返回 MemGenius 訓練館</Link></div></div> : !encounterReady ? <div className="rd-explore-gate"><Compass size={28} /><small>WORLD QUEST</small><h2>{enemyDefeated ? "前往符文接觸代表" : "霧魘正在巡邏"}</h2><p>{enemyDefeated ? "敵人已清除。走進旋轉光柱，取得記憶符文並開始交涉。" : "靠近紅色霧魘後按 J 攻擊；它接近時按 Space 閃避。擊敗後會掉落道具。"}</p><div><span>01 戰鬥</span><i>→</i><span>02 探索</span><i>→</i><span>03 外交</span></div></div> : dialogueBranch === null ? <div className="rd-dialogue"><small>NPC 對話分支</small><h2>{nation.envoy} 正在觀察你的態度</h2><p>「在開始談判前，告訴我你打算如何面對這場危機。」</p><button onClick={() => chooseBranch(0)}>先傾聽：「請說明各方看到的情況。」</button><button onClick={() => chooseBranch(1)}>直接質疑：「這份翻譯存在明顯矛盾。」</button><button onClick={() => chooseBranch(2)}>建立共感：「我也曾因誤譯失去盟友。」</button></div> : <div className="rd-diplomacy"><div className="rd-duel-head"><span>外交技能戰 {quest + 1}/3</span><b>{question.prompt}</b></div><div className="rd-meters"><label>信任 <i><em style={{width:`${trust}%`}} /></i><b>{trust}</b></label><label>緊張 <i className="danger"><em style={{width:`${tension}%`}} /></i><b>{tension}</b></label></div><div className="rd-answers">{question.answers.map((answer, index) => <button key={answer} className={choice === index ? (index === question.correct ? "right" : "wrong") : ""} onClick={() => useDiplomacySkill(index)}><i>{["聽","述","橋"][index]}</i>{answer}{choice === index && index === question.correct && <CheckCircle2 size={17} />}</button>)}</div><p className="rd-hint">{battleMessage}</p><div className="rd-actions"><button onClick={() => setDialogueBranch(null)}>更換立場</button><button className="rd-confirm" disabled={!diplomacyWon} onClick={confirm}>{diplomacyWon ? "達成外交共識" : "信任需達 80"}</button></div></div>}</div>
    </section>
    {inventoryOpen && <div className="rd-inventory-backdrop" onClick={() => setInventoryOpen(false)}><aside className="rd-inventory" onClick={event => event.stopPropagation()}><header><Backpack size={20} /><div><small>INVENTORY</small><h2>靈語使背包</h2></div><button onClick={() => setInventoryOpen(false)}>×</button></header><div><article><span>🍵</span><b>靈脈茶</b><small>恢復 35 生命</small><em>×{inventory.tea}</em><button disabled={!inventory.tea || health === 100} onClick={() => useItem("tea")}>使用</button></article><article><span>🔮</span><b>同心印</b><small>外交信任 +25</small><em>×{inventory.seal}</em><button disabled={!inventory.seal || !encounterReady} onClick={() => useItem("seal")}>使用</button></article><article><span>💠</span><b>記憶碎片</b><small>巡邏霧魘戰利品</small><em>×{inventory.shard}</em></article></div></aside></div>}
  </main>;
}
