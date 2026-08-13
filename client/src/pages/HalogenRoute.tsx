import { useState } from "react";
import { ArrowLeft, ArrowRight, Atom, Check, EyeOff, Flame, Lightbulb, MapPin, RotateCcw, Sparkles, Volume2 } from "lucide-react";

const items = [
  { n: 9, s: "F", name: "氟", sound: "飛", icon: "🪽", line: "小鳥飛進一座透明水池" },
  { n: 17, s: "Cl", name: "氯", sound: "可樂", icon: "🥤", line: "池裡的可樂冒出綠色泡泡" },
  { n: 35, s: "Br", name: "溴", sound: "不然", icon: "🧹", line: "不然就拿掃把把泡泡掃走" },
  { n: 53, s: "I", name: "碘", sound: "愛", icon: "💜", line: "掃把突然愛上紫色的碘" },
  { n: 85, s: "At", name: "砈", sound: "阿童", icon: "🤖", line: "阿童木抱走紫色愛心" },
  { n: 117, s: "Ts", name: "鿬", sound: "踢死", icon: "⚽", line: "足球飛來，差點把機器人踢死" },
];
const scrambled = [items[3], items[0], items[5], items[2], items[4], items[1]];
const tests = [
  { q: "Cl 的正下方是哪個元素？", clue: "空間：往下一層", a: "Br", opts: ["F", "Br", "I"] },
  { q: "故事中的「愛上紫色」代表？", clue: "諧音：愛", a: "I", opts: ["I", "At", "Cl"] },
  { q: "Br 與 At 中間缺少哪一層？", clue: "鄰居：Br → ? → At", a: "I", opts: ["F", "I", "Ts"] },
  { q: "「阿童木」是哪個元素的鉤子？", clue: "諧音：阿童", a: "At", opts: ["At", "Ts", "Br"] },
  { q: "第 17 族最底層的元素是？", clue: "空間：第六層", a: "Ts", opts: ["Ts", "At", "F"] },
];

export default function HalogenRoute() {
  const [phase, setPhase] = useState(1);
  const [placed, setPlaced] = useState<string[]>([]);
  const [story, setStory] = useState(0);
  const [qi, setQi] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const done = phase === 1 ? placed.length === 6 : phase === 2 ? story === 6 : qi === 5;
  const progress = finished ? 100 : Math.round(((phase - 1 + (phase === 1 ? placed.length / 6 : phase === 2 ? story / 6 : qi / 5)) / 3) * 100);
  const base = import.meta.env.BASE_URL;
  const place = (s:string) => { if (s === items[placed.length].s) { setPlaced([...placed,s]); setChoice(null); } else setChoice(s); };
  const answer = (s:string) => { if(choice) return; setChoice(s); if(s===tests[qi].a) setScore(score+1); };
  const next = () => { setPhase(phase+1); setChoice(null); window.scrollTo({top:0,behavior:"smooth"}); };

  return <main className="alkali-app halogen-app">
    <header className="alkali-nav"><button onClick={()=>location.href=base}><ArrowLeft/>返回課程首頁</button><div><span><Atom/></span><b>MEM<span>GENIUS</span></b><small>第 17 族記憶路線</small></div><aside><Flame/> 8 天連勝</aside></header>
    <div className="alkali-progress"><div><span>第 17 族・鹵素</span><b>{progress}%</b></div><i><em style={{width:`${progress}%`}}/></i></div>
    <div className="alkali-shell"><aside className="route-rail"><p>MEMORY ROUTE 02</p><h1>鹵素<br/>六層記憶塔</h1><span>F → Cl → Br → I → At → Ts</span><div>{[[1,"空間定位","建立上下六層"],[2,"諧音故事","把符號變成畫面"],[3,"遮蔽回想","用線索找回答案"]].map(x=><button className={`${phase===x[0]?"active":""} ${phase>x[0]||finished?"done":""}`}><i>{phase>x[0]||finished?<Check/>:x[0]}</i><span><b>{x[1]}</b><small>{x[2]}</small></span></button>)}</div><footer><Lightbulb/><p><b>共同特性</b><br/>活潑非金屬、最外層有七顆電子，容易得到一顆電子形成鹽類。</p></footer></aside>
    <section className="route-stage">{!finished&&<><header className="phase-head"><div><span>STAGE 0{phase} / 03</span><h2>{phase===1?"建立鹵素的六層垂直座標":phase===2?"走完一遍鹵素諧音故事":"遮住元素，從鄰居與故事找回來"}</h2><p>{phase===1?"從最高樓開始依序點選。":phase===2?"逐幕揭開：飛、可樂、不然、愛、阿童、踢死。":"先想上下位置，再使用諧音線索。"}</p></div><span className="phase-badge">{phase===1?<><MapPin/>空間</>:phase===2?<><Volume2/>故事</>:<><EyeOff/>回想</>}</span></header>
    {phase===1&&<div className="space-route"><div className="element-bank"><small>點選下一個元素</small><div>{scrambled.map(e=><button disabled={placed.includes(e.s)} onClick={()=>place(e.s)} className={choice===e.s?"shake":""}><b>{e.s}</b><span>{e.name}</span></button>)}</div>{choice&&<p>樓層不對，再從 F 開始往下想。</p>}<button className="route-reset" onClick={()=>{setPlaced([]);setChoice(null)}}><RotateCcw/>重新排列</button></div><div className="memory-tower halogen-tower"><span className="tower-tape"/><small>第 17 族元素公寓</small>{items.map((e,i)=><div className={`tower-floor ${placed[i]?"filled":""}`}><i>{i+1}F</i>{placed[i]?<><span>{e.icon}</span><b>{e.s}</b><em>{e.name}・「{e.sound}」</em></>:<><span>?</span><small>{i===0?"最高樓":i===5?"最底層":"等待入住"}</small></>}</div>)}<p>↓ 原子序增加・顏色通常變深、熔沸點上升</p></div></div>}
    {phase===2&&<div className="story-route"><div className="story-track">{items.map((e,i)=><button className={`${i<story?"revealed":""} ${i===story?"current":""}`} disabled={i>story} onClick={()=>i===story&&setStory(story+1)}><i>{i<story?<Check/>:i+1}</i><div className="story-element"><small>{e.n}</small><b>{e.s}</b><em>{e.name}</em></div><span>{i<story?e.icon:"?"}</span><div><small>「{e.sound}」</small><p>{i<story?e.line:"點擊揭開這一幕"}</p></div>{i<5&&<strong>↓</strong>}</button>)}</div><aside className="story-summary halogen-story"><span className="tower-tape"/><small>鹵素連續口訣</small><h3><mark>飛</mark>進池裡喝<mark>可樂</mark>；<mark>不然</mark>拿掃把，卻<mark>愛</mark>上紫色；<mark>阿童</mark>木抱走愛心，差點被足球<mark>踢死</mark>！</h3><div>{items.map((e,i)=><span className={story>i?"on":""}>{e.s}<small>{e.sound}</small></span>)}</div><button><Volume2/>播放完整故事</button></aside></div>}
    {phase===3&&qi<5&&<div className="recall-route"><div className="masked-tower halogen-tower">{items.map((e,i)=><div className={e.s===tests[qi].a?"masked":""}><small>{i+1}F</small><b>{e.s===tests[qi].a?"?":e.s}</b><em>{e.s===tests[qi].a?"已遮蔽":e.name}</em></div>)}</div><div className="recall-question"><span>第 {qi+1} / 5 題</span><h3>{tests[qi].q}</h3><p>{tests[qi].clue}</p><div>{tests[qi].opts.map(s=><button onClick={()=>answer(s)} className={choice===s?(s===tests[qi].a?"correct":"wrong"):choice&&s===tests[qi].a?"correct":""}>{s}</button>)}</div>{choice&&<aside className={choice===tests[qi].a?"good":"retry"}>{choice===tests[qi].a?<><Check/>答對！成功找回 {tests[qi].a}。</>:<>正確答案是 {tests[qi].a}，沿著垂直樓層再走一次。</>}<button onClick={()=>{setChoice(null);setQi(qi+1)}}>{qi===4?"查看結果":"下一題"}<ArrowRight/></button></aside>}</div></div>}
    {phase===3&&qi===5&&<div className="recall-result"><div><Sparkles/></div><small>鹵素回想完成</small><h2>{score} / 5</h2><p>{score>=4?"空間與諧音路徑已建立。":"建議立刻重練一次遮蔽回想。"}</p></div>}
    {done&&<div className="route-next"><header><Sparkles/> MEMGENIUS NEXT・完成階段 {phase}</header><div><section><small>系統預測的最佳下一步</small><h3>{phase===1?"替六層座標加入諧音動作":phase===2?"關掉故事，立即主動回想":score>=4?"比較第 1 族與第 17 族":"重練鹵素遮蔽回想"}</h3><p>{phase===1?"位置已建立，現在用聲音把抽象符號黏住。":phase===2?"故事仍在工作記憶中，現在測驗效果最好。":score>=4?"比較兩條直向家族，可以理解電子數與反應特性的差異。":"錯題顯示垂直順序還不穩，立即重練最有效。"}</p></section><aside><button className="route-recommended" onClick={phase<3?next:score>=4?()=>setFinished(true):()=>{setQi(0);setScore(0);setChoice(null)}}><b>A</b><span><strong>{phase<3?"照建議進入下一關":score>=4?"完成本章":"再做一次回想"}</strong><small>推薦路徑</small></span><ArrowRight/></button><button onClick={()=>phase===1?setPlaced([]):phase===2?setStory(0):setQi(0)}><b>B</b><span><strong>再練一次目前階段</strong><small>強化熟練度</small></span></button><button onClick={()=>location.href=`${base}explore`}><b>C</b><span><strong>先看完整週期表</strong><small>自由探索</small></span></button></aside></div></div>}</>}
    {finished&&<div className="route-complete halogen-complete"><div className="route-trophy">🏆</div><small>MEMORY ROUTE 02 COMPLETE</small><h1>第 17 族鹵素路線完成！</h1><p>你已能用空間、諧音與遮蔽回想找回<br/>F → Cl → Br → I → At → Ts。</p><div>{items.map(e=><span><b>{e.s}</b><small>{e.sound}</small></span>)}</div><section><b>下一階段建議</b><h3>雙塔比較：第 1 族 vs 第 17 族</h3><p>比較左右兩端的價電子、形成離子的方向與反應特性。</p></section><button onClick={()=>location.href=`${base}alkali`}>複習第 1 族</button><button className="ghost" onClick={()=>location.href=base}>回課程首頁</button></div>}</section></div>
  </main>;
}
