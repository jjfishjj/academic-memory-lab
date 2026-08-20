import { useState } from "react";
import { ArrowLeft, ArrowRight, Atom, Check, Flame, Lightbulb, Sparkles } from "lucide-react";

const periods = [
  { p: 2, left: ["Li", "鋰"], right: ["F", "氟"] },
  { p: 3, left: ["Na", "鈉"], right: ["Cl", "氯"] },
  { p: 4, left: ["K", "鉀"], right: ["Br", "溴"] },
  { p: 5, left: ["Rb", "銣"], right: ["I", "碘"] },
  { p: 6, left: ["Cs", "銫"], right: ["At", "砈"] },
  { p: 7, left: ["Fr", "鍅"], right: ["Ts", "鿬"] },
];

const questions = [
  { q: "同在第 3 週期、分居左右兩塔的是？", a: "Na ＋ Cl", options: ["Li ＋ F", "Na ＋ Cl", "K ＋ Br"] },
  { q: "容易失去 1 顆電子、形成 +1 離子的是？", a: "第 1 族", options: ["第 1 族", "第 17 族", "兩者皆是"] },
  { q: "容易得到 1 顆電子、形成 −1 離子的是？", a: "第 17 族", options: ["第 1 族", "第 17 族", "兩者皆是"] },
];

export default function GroupComparison() {
  const [step, setStep] = useState(1);
  const [qi, setQi] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const base = import.meta.env.BASE_URL;
  const answer = (value:string) => { if (choice) return; setChoice(value); if (value === questions[qi].a) setScore(score + 1); };
  const advance = () => { setChoice(null); if (qi < questions.length - 1) setQi(qi + 1); else setStep(3); };

  return <main className="compare-app">
    <header className="alkali-nav"><button onClick={()=>location.href=`${base}halogen`}><ArrowLeft/>返回第 17 族</button><div><span><Atom/></span><b>MEM<span>GENIUS</span></b><small>雙塔比較訓練</small></div><aside><Flame/> 9 天連勝</aside></header>
    <div className="compare-shell">
      <header className="compare-head"><div><small>MEMORY ROUTE 03</small><h1>第 1 族 vs 第 17 族</h1><p>把週期表最左與最右的兩座塔並排，利用同一週期的水平對應理解電子移動。</p></div><nav>{["雙塔對位","特性比較","快速驗收"].map((x,i)=><span className={step===i+1?"active":step>i+1?"done":""}><i>{step>i+1?<Check/>:i+1}</i>{x}</span>)}</nav></header>

      {step===1&&<section className="dual-tower-stage"><div className="dual-tower-label left"><small>第 1 族・鹼金屬</small><b>向外送出 1 顆電子</b><span>形成 +1</span></div><div className="dual-tower-label right"><small>第 17 族・鹵素</small><b>接收 1 顆電子</b><span>形成 −1</span></div><div className="dual-grid">{periods.map(row=><div className="dual-row"><div className="dual-element alk"><small>第 {row.p} 週期</small><b>{row.left[0]}</b><span>{row.left[1]}</span></div><div className="electron-path"><span>e⁻</span><i>→</i><small>同一樓層</small></div><div className="dual-element halo"><small>第 {row.p} 週期</small><b>{row.right[0]}</b><span>{row.right[1]}</span></div></div>)}</div><aside className="comparison-story"><Lightbulb/><p><b>空間口訣</b><br/>左塔「放手」，右塔「接手」；同一樓層左右配對，就能形成常見鹽類。</p></aside><button className="compare-primary" onClick={()=>setStep(2)}>看兩族特性如何相反 <ArrowRight/></button></section>}

      {step===2&&<section className="trait-compare"><div className="trait-column alk"><small>第 1 族</small><h2>「少一顆，送出去」</h2><ul><li><b>價電子</b><span>1 顆</span></li><li><b>離子方向</b><span>失去 e⁻</span></li><li><b>常見電荷</b><span>+1</span></li><li><b>元素類型</b><span>活潑金屬</span></li><li><b>族內趨勢</b><span>向下反應增強</span></li></ul><p>Li「力」→ Na「拿」→ K「卡」→ Rb「Ruby」→ Cs「吃」→ Fr「飛人」</p></div><div className="trait-center"><span>送出 e⁻</span><b>⇄</b><span>接收 e⁻</span><em>互補形成穩定化合物</em></div><div className="trait-column halo"><small>第 17 族</small><h2>「差一顆，接進來」</h2><ul><li><b>價電子</b><span>7 顆</span></li><li><b>離子方向</b><span>得到 e⁻</span></li><li><b>常見電荷</b><span>−1</span></li><li><b>元素類型</b><span>活潑非金屬</span></li><li><b>族內趨勢</b><span>向下反應減弱</span></li></ul><p>F「飛」→ Cl「可樂」→ Br「不然」→ I「愛」→ At「阿童」→ Ts「踢死」</p></div><button className="compare-primary" onClick={()=>setStep(3)}>開始雙塔驗收 <ArrowRight/></button></section>}

      {step===3&&qi<questions.length&&<section className="compare-quiz"><div className="compare-mini-map"><div>第 1 族<br/><b>+1</b></div><span>e⁻ →</span><div>第 17 族<br/><b>−1</b></div></div><small>第 {qi+1} / {questions.length} 題</small><h2>{questions[qi].q}</h2><div>{questions[qi].options.map(option=><button onClick={()=>answer(option)} className={choice===option?(option===questions[qi].a?"correct":"wrong"):choice&&option===questions[qi].a?"correct":""}>{option}</button>)}</div>{choice&&<aside className={choice===questions[qi].a?"good":"retry"}>{choice===questions[qi].a?<><Check/>答對！雙塔對應正確。</>:<>正確答案是「{questions[qi].a}」。</>}<button onClick={advance}>{qi===questions.length-1?"查看成果":"下一題"}<ArrowRight/></button></aside>}</section>}

      {step===3&&qi===questions.length&&<section className="compare-complete"><div>⚡</div><small>DUAL TOWER COMPLETE</small><h1>兩座記憶塔已經連線！</h1><p>你完成 {score} / 3 題。現在不只記得順序，也能利用左右位置解釋電子移動。</p><section><Sparkles/><div><b>MEMGENIUS NEXT</b><h3>{score===3?"建議進入第 18 族惰性氣體":"再做一次雙塔快速驗收"}</h3><p>{score===3?"接著學習最右側的穩定家族，理解為何它們通常不需要得失電子。":"再強化左右塔的 +1／−1 與同週期配對。"}</p></div></section><button onClick={()=>score===3?location.href=`${base}explore`:(setQi(0),setScore(0),setChoice(null))}>{score===3?"前往完整元素地圖":"重新驗收"}<ArrowRight/></button><button className="ghost" onClick={()=>location.href=base}>回課程首頁</button></section>}
    </div>
  </main>;
}
