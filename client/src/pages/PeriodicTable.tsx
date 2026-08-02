import { useMemo, useState } from "react";
import { Atom, Brain, ChevronRight, Flame, Lightbulb, Search, Sparkles, Trophy, Volume2, X } from "lucide-react";

type ElementItem = { n: number; s: string; name: string; group: number; period: number; type: string };

const rows = [
  ["H", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "He"],
  ["Li", "Be", "", "", "", "", "", "", "", "", "", "", "B", "C", "N", "O", "F", "Ne"],
  ["Na", "Mg", "", "", "", "", "", "", "", "", "", "", "Al", "Si", "P", "S", "Cl", "Ar"],
  ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"],
  ["Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe"],
  ["Cs", "Ba", "La", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn"],
  ["Fr", "Ra", "Ac", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"],
];
const symbols = ["H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe","Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"];
const names: Record<string,string> = {H:"氫",He:"氦",Li:"鋰",Be:"鈹",B:"硼",C:"碳",N:"氮",O:"氧",F:"氟",Ne:"氖",Na:"鈉",Mg:"鎂",Al:"鋁",Si:"矽",P:"磷",S:"硫",Cl:"氯",Ar:"氬",K:"鉀",Ca:"鈣",Fe:"鐵",Co:"鈷",Ni:"鎳",Cu:"銅",Zn:"鋅",Ag:"銀",Sn:"錫",I:"碘",Au:"金",Hg:"汞",Pb:"鉛",U:"鈾"};
const numberBySymbol = Object.fromEntries(symbols.map((s, i) => [s, i + 1]));

function kind(group: number, s: string) {
  if (s === "H") return "nonmetal";
  if (group === 1) return "alkali";
  if (group === 2) return "alkaline";
  if (group >= 3 && group <= 12) return "transition";
  if (group === 17) return "halogen";
  if (group === 18) return "noble";
  return "nonmetal";
}

const elements: ElementItem[] = rows.flatMap((row, period) => row.map((s, i) => s ? ({ n: numberBySymbol[s], s, name: names[s] || s, group: i + 1, period: period + 1, type: kind(i + 1, s) }) : null).filter(Boolean) as ElementItem[]);

const filters = [
  { id: "all", label: "全部元素", color: "#147d74" }, { id: "alkali", label: "鹼金屬", color: "#e8a54b" },
  { id: "transition", label: "過渡金屬", color: "#e98a89" }, { id: "halogen", label: "鹵素", color: "#a78bca" },
  { id: "noble", label: "惰性氣體", color: "#65a9c4" }, { id: "nonmetal", label: "非金屬", color: "#78a96b" },
];

const hooks: Record<string, { phrase: string; scene: string }> = {
  H: { phrase: "氫氣球，輕輕升空", scene: "把 H 想成兩條繩子，綁著全宇宙最輕的氣球。" },
  He: { phrase: "喝了氦氣，聲音變尖", scene: "派對氣球漏氣，你一開口就變成卡通高音。" },
  Li: { phrase: "鋰電池，手機續命", scene: "口袋裡的手機吃下一顆 Li，電量立刻滿格。" },
  C: { phrase: "碳是生命的骨架", scene: "一支碳鉛筆畫出樹、貓和你自己。" },
  O: { phrase: "氧氣圈，呼吸一口", scene: "O 像張開的嘴，深吸一口清新的氧氣。" },
  Na: { phrase: "鈉遇水，啪啦爆開", scene: "一顆鹽粒跳進水杯，瞬間放起迷你煙火。" },
  Fe: { phrase: "鐵人穿著 Fe 盔甲", scene: "鐵人胸前刻著 Fe，舉起沉重的鐵鎚。" },
  Au: { phrase: "金牌發出 Au 的光", scene: "頒獎台上的金牌大喊：Au！我最閃亮。" },
};

export default function PeriodicTable() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ElementItem>(elements[0]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const filtered = useMemo(() => elements.filter(e => (active === "all" || e.type === active) && (!query || `${e.s}${e.name}${e.n}`.toLowerCase().includes(query.toLowerCase()))), [active, query]);
  const selectedHook = hooks[selected.s] || { phrase: `${selected.s}，用圖像把它釘住`, scene: `把 ${selected.s} 寫在一張便利貼上，聯想到生活中最熟悉的物件。` };

  return <main className="chem-app">
    <header className="chem-nav">
      <a className="chem-brand" href="#top"><span className="brand-atom"><Atom size={23}/></span><span>MEM<span>GENIUS</span></span><small>記憶實驗室</small></a>
      <nav><a href="#map">元素地圖</a><a href="#method">記憶法</a><a href="#progress">我的進度</a></nav>
      <div className="nav-actions"><button className="icon-btn" aria-label="搜尋"><Search size={18}/></button><button className="streak"><Flame size={18}/> 7 天連勝</button><div className="avatar">林</div></div>
    </header>

    <section id="top" className="chem-hero">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> MEMGENIUS 新記憶方案</div><h1>把 118 個元素<br/>變成<span>忘不掉的故事</span></h1><p>不用死背！用圖像聯想、族群分塊和間隔複習，<br className="desktop"/>每天 10 分鐘，建立你的週期表記憶宮殿。</p><div className="hero-buttons"><button className="primary-btn" onClick={() => setQuizOpen(true)}>開始 10 分鐘挑戰 <ChevronRight size={19}/></button><a href="#method" className="text-btn"><Lightbulb size={18}/> 看看記憶法怎麼運作</a></div><div className="social-proof"><div className="face-stack"><i>🧑🏻</i><i>👩🏻</i><i>🧒🏻</i></div><span><b>2,840 位學習者</b><br/>本週一起練習</span></div></div>
      <div className="hero-board"><span className="tape tape-top"/><div className="formula">週期表 = 地圖 ＋ 故事 ＋ 重複</div><div className="mini-chain"><div className="mini-el h"><small>1</small><b>H</b><span>氫</span></div><span>→</span><div className="mini-el li"><small>3</small><b>Li</b><span>鋰</span></div><span>→</span><div className="mini-el na"><small>11</small><b>Na</b><span>鈉</span></div><span>→</span><div className="mini-el k"><small>19</small><b>K</b><span>鉀</span></div></div><div className="story-note">「小氫氣球，載著鋰電池，<br/>掉進鈉水池，撞上鉀樹！」</div><div className="remember-badge"><Brain size={22}/><span><b>4 個元素</b><br/>一個故事記住</span></div><span className="doodle-arrow">↝</span></div>
    </section>

    <section id="map" className="map-section">
      <div className="section-heading"><div><p>STEP 01・先看見規律</p><h2>你的元素記憶地圖</h2><span>點選元素，馬上建立一個專屬記憶鉤子。</span></div><div className="map-stat"><b>24</b><span>/ 118<br/>已記住</span><div className="ring">20%</div></div></div>
      <div className="toolbar"><div className="filter-row">{filters.map(f => <button key={f.id} className={active === f.id ? "active" : ""} onClick={() => setActive(f.id)}><i style={{background:f.color}}/>{f.label}</button>)}</div><label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜尋元素、符號或原子序"/></label></div>
      <div className="periodic-wrap"><div className="periodic-grid">{rows.flatMap((row, r) => row.map((s, c) => { if (!s) return <span key={`${r}-${c}`} />; const e = elements.find(x => x.s === s)!; const dim = !filtered.includes(e); return <button key={s} className={`element ${e.type} ${selected.s === s ? "selected" : ""} ${dim ? "dim" : ""}`} onClick={() => {setSelected(e); setAnswer(null)}}><small>{e.n}</small><b>{s}</b><em>{e.name}</em></button>}))}</div></div>
      <aside className="memory-card"><button className="close-card" aria-label="關閉"><X size={16}/></button><span className="tape tape-side"/><div className={`big-element ${selected.type}`}><small>{selected.n}</small><b>{selected.s}</b><span>{selected.name}</span></div><div className="memory-content"><p>今日記憶鉤子</p><h3>{selectedHook.phrase}</h3><div className="scene"><span>💭</span><p>{selectedHook.scene}</p></div><button className="sound-btn"><Volume2 size={17}/> 聽一遍記憶口訣</button><div className="confidence"><span>你記住了嗎？</span><div><button onClick={() => setAnswer("again")} className={answer === "again" ? "picked" : ""}>再看一次</button><button onClick={() => setAnswer("got")} className={answer === "got" ? "picked success" : ""}>記住了！</button></div></div></div></aside>
    </section>

    <section id="method" className="method-section"><div className="section-heading"><div><p>STEP 02・讓記憶黏住</p><h2>三層記憶法，從「看過」到「想得起來」</h2></div></div><div className="method-grid">{[
      ["01","🗺️","分區定位","先用顏色和位置，把 118 個元素切成 6 個容易辨認的家族。","我在哪裡？"],
      ["02","🎬","荒謬故事","把符號串成畫面。越誇張、越有動作，大腦越不容易忘記。","它像什麼？"],
      ["03","⚡","主動回想","在快要忘記前來一題，讓每次想起都把記憶路徑變得更牢。","我想得起嗎？"],
    ].map((m,i)=><article key={m[0]}><span className="method-no">{m[0]}</span><div className="method-icon">{m[1]}</div><h3>{m[2]}</h3><p>{m[3]}</p><small>{m[4]}</small>{i<2 && <b className="method-arrow">→</b>}</article>)}</div></section>

    <section id="progress" className="challenge"><div><p>今天只差一步</p><h2>用 10 分鐘，記住下一組元素</h2><span>第 1 族・鹼金屬故事線｜預計 8 分鐘</span></div><div className="challenge-progress"><span style={{width:"35%"}}/><b>3 / 8</b></div><button className="primary-btn" onClick={() => setQuizOpen(true)}>繼續我的挑戰 <ChevronRight size={19}/></button></section>

    {quizOpen && <div className="quiz-backdrop" onClick={() => setQuizOpen(false)}><div className="quiz-modal" onClick={e => e.stopPropagation()}><button className="quiz-close" onClick={() => setQuizOpen(false)}><X/></button><div className="quiz-icon"><Trophy/></div><p>快速測驗・第 1 題</p><h2>元素符號「Na」是什麼？</h2><div className="quiz-options">{["氖","鈉","氮","鎳"].map(x => <button key={x} onClick={() => setAnswer(x)} className={answer === x ? (x === "鈉" ? "correct" : "wrong") : ""}>{x}</button>)}</div>{answer && <div className="quiz-feedback">{answer === "鈉" ? "答對了！鈉遇水，啪啦爆開 💥" : "再想想：Na 是鹽裡的重要角色。"}</div>}</div></div>}
  </main>;
}
