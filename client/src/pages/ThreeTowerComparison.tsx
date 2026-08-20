import { useState } from "react";
import { ArrowLeft, ArrowRight, Atom, Check, Flame, Lightbulb, Sparkles } from "lucide-react";
import { recordMistake } from "@/lib/reviewData";

const rows=[
  [2,["Li","鋰"],["F","氟"],["Ne","氖"]],
  [3,["Na","鈉"],["Cl","氯"],["Ar","氬"]],
  [4,["K","鉀"],["Br","溴"],["Kr","氪"]],
  [5,["Rb","銣"],["I","碘"],["Xe","氙"]],
  [6,["Cs","銫"],["At","砈"],["Rn","氡"]],
  [7,["Fr","鍅"],["Ts","鿬"],["Og","鿫"]],
] as const;
const qs=[
  {id:"triple-p4",q:"第 4 週期的三塔水平組合是？",a:"K・Br・Kr",opts:["K・Br・Kr","Na・Cl・Ar","Rb・I・Xe"],hint:"沿第 4 週期由左向右掃描。"},
  {id:"triple-electron",q:"哪一族最外層電子已滿，通常不需得失電子？",a:"第 18 族",opts:["第 1 族","第 17 族","第 18 族"],hint:"最右側的穩定塔。"},
  {id:"triple-flow",q:"三塔的電子狀態順序是？",a:"送出 → 接收 → 已滿",opts:["送出 → 接收 → 已滿","接收 → 已滿 → 送出","已滿 → 送出 → 接收"],hint:"第 1 族 +1、第 17 族 −1、第 18 族穩定。"},
  {id:"triple-p6",q:"Cs 與 At 同一樓層，右側穩定鄰居是？",a:"Rn",opts:["Kr","Xe","Rn"],hint:"第 6 週期最右側。"},
];

export default function ThreeTowerComparison(){
  const [mode,setMode]=useState<"map"|"traits"|"quiz"|"done">("map"),[qi,setQi]=useState(0),[choice,setChoice]=useState<string|null>(null),[score,setScore]=useState(0);
  const base=import.meta.env.BASE_URL;
  const answer=(x:string)=>{if(choice)return;setChoice(x);const q=qs[qi];if(x===q.a)setScore(score+1);else recordMistake({id:q.id,prompt:q.q,answer:q.a,hint:q.hint,family:"三塔比較"})};
  const next=()=>{setChoice(null);if(qi<qs.length-1)setQi(qi+1);else setMode("done")};
  return <main className="compare-app triple-app"><header className="alkali-nav"><button onClick={()=>location.href=`${base}noble-gases`}><ArrowLeft/>返回第 18 族</button><div><span><Atom/></span><b>MEM<span>GENIUS</span></b><small>三塔比較訓練</small></div><aside><Flame/> 11 天連勝</aside></header><div className="compare-shell"><header className="compare-head"><div><small>MEMORY ROUTE 05</small><h1>第 1、17、18 族三塔比較</h1><p>把「送出、接收、已滿」放進同一張空間地圖。</p></div><nav>{[["map","三塔對位"],["traits","電子狀態"],["quiz","快速驗收"]].map((x,i)=><span className={mode===x[0]?"active":""}><i>{i+1}</i>{x[1]}</span>)}</nav></header>
  {mode==="map"&&<section className="triple-stage"><div className="helium-cap"><small>第 1 週期穩定頂樓</small><b>He</b><span>氦</span></div><div className="triple-labels"><div><b>第 1 族</b><span>送出 e⁻・+1</span></div><div><b>第 17 族</b><span>接收 e⁻・−1</span></div><div><b>第 18 族</b><span>外層已滿・穩定</span></div></div>{rows.map(r=><div className="triple-row"><small>第 {r[0]} 週期</small>{[r[1],r[2],r[3]].map((e,i)=><div className={`triple-element t${i+1}`}><b>{e[0]}</b><span>{e[1]}</span></div>)}<i>e⁻ →</i><em>穩定 →</em></div>)}<aside><Lightbulb/><p><b>水平口訣：</b>左塔送一顆，中塔接一顆，右塔已經坐滿了。</p></aside><button className="compare-primary" onClick={()=>setMode("traits")}>理解三種電子狀態 <ArrowRight/></button></section>}
  {mode==="traits"&&<section className="triple-traits">{[
    ["第 1 族","1 顆價電子","容易失去 1 顆","形成 +1","活潑金屬","送出者"],
    ["第 17 族","7 顆價電子","容易得到 1 顆","形成 −1","活潑非金屬","接收者"],
    ["第 18 族","外層電子已滿","通常不需移動","電荷 0","穩定氣體","旁觀者"],
  ].map((x,i)=><article className={`trait-tower t${i+1}`}><small>{x[0]}</small><h2>{x[5]}</h2><ul>{x.slice(1,5).map(y=><li><Check/>{y}</li>)}</ul></article>)}<div className="triple-equation"><span>Na</span><b>送出 e⁻ →</b><span>Cl</span><b>接收後形成</b><strong>NaCl</strong><em>Ar 在旁邊已經穩定，不必加入</em></div><button className="compare-primary" onClick={()=>setMode("quiz")}>開始三塔驗收 <ArrowRight/></button></section>}
  {mode==="quiz"&&<section className="compare-quiz"><small>第 {qi+1} / {qs.length} 題</small><h2>{qs[qi].q}</h2><p className="quiz-hint">{qs[qi].hint}</p><div>{qs[qi].opts.map(x=><button onClick={()=>answer(x)} className={choice===x?(x===qs[qi].a?"correct":"wrong"):choice&&x===qs[qi].a?"correct":""}>{x}</button>)}</div>{choice&&<aside className={choice===qs[qi].a?"good":"retry"}>{choice===qs[qi].a?<><Check/>答對！</>:<>已加入個人錯題複習：{qs[qi].a}</>}<button onClick={next}>{qi===qs.length-1?"查看成果":"下一題"}<ArrowRight/></button></aside>}</section>}
  {mode==="done"&&<section className="compare-complete"><div>🏙️</div><small>TRIPLE TOWER COMPLETE</small><h1>三座記憶塔已經連線！</h1><p>本次答對 {score} / {qs.length} 題；答錯題目已自動加入裝置上的個人複習中心。</p><section><Sparkles/><div><b>MEMGENIUS NEXT</b><h3>{score===qs.length?"開始間隔複習，維持長期記憶":"先處理剛才的錯題"}</h3><p>系統會依照你的評分安排 1 分鐘、1 天或數天後再次出現。</p></div></section><button onClick={()=>location.href=`${base}review`}>前往個人複習中心 <ArrowRight/></button><button className="ghost" onClick={()=>{setMode("quiz");setQi(0);setScore(0);setChoice(null)}}>重新驗收</button></section>}
  </div></main>;
}

