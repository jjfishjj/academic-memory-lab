import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Atom, Check, EyeOff, Flame, Lightbulb, MapPin, RotateCcw, Sparkles, Volume2 } from "lucide-react";

const alkali = [
  { n: 3, s: "Li", name: "鋰", sound: "力", icon: "🔋", line: "鋰電池用力推開樓上的門" },
  { n: 11, s: "Na", name: "鈉", sound: "拿", icon: "🧂", line: "拿起一大罐鹽往樓下走" },
  { n: 19, s: "K", name: "鉀", sound: "卡", icon: "🌳", line: "鹽罐卡在一棵巨大的樹上" },
  { n: 37, s: "Rb", name: "銣", sound: "Ruby", icon: "💎", line: "樹洞裡掉出紅寶石 Ruby" },
  { n: 55, s: "Cs", name: "銫", sound: "吃", icon: "🍽️", line: "一張大嘴把紅寶石吃下去" },
  { n: 87, s: "Fr", name: "鍅", sound: "飛人", icon: "🦸", line: "飛人衝來，救出被吃掉的寶石" },
];
const scrambled = [alkali[2], alkali[5], alkali[1], alkali[4], alkali[0], alkali[3]];
const questions = [
  { q: "Na 的正下方是哪個元素？", clue: "空間線索：往下一層", a: "K", opts: ["Li", "K", "Cs"] },
  { q: "故事裡的「Ruby 紅寶石」代表？", clue: "諧音線索：英文發音", a: "Rb", opts: ["Rb", "Fr", "Na"] },
  { q: "K 與 Cs 中間缺少哪一層？", clue: "鄰居線索：K → ? → Cs", a: "Rb", opts: ["Li", "Rb", "Fr"] },
  { q: "「吃下紅寶石」中的「吃」代表？", clue: "故事線索：Ruby → 吃", a: "Cs", opts: ["K", "Cs", "Fr"] },
  { q: "第 1 族最底下的元素是？", clue: "空間線索：六樓最下層", a: "Fr", opts: ["Fr", "Rb", "Li"] },
];

export default function AlkaliRoute() {
  const [phase, setPhase] = useState(1);
  const [placed, setPlaced] = useState<string[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const phaseDone = phase === 1 ? placed.length === 6 : phase === 2 ? storyIndex === 6 : questionIndex === questions.length;
  const progress = finished ? 100 : Math.round(((phase - 1 + (phase === 1 ? placed.length / 6 : phase === 2 ? storyIndex / 6 : questionIndex / 5)) / 3) * 100);

  const place = (s: string) => {
    if (s === alkali[placed.length]?.s) setPlaced([...placed, s]);
    else setChoice(s);
  };
  const answer = (s: string) => {
    if (choice) return;
    setChoice(s);
    if (s === questions[questionIndex].a) setScore(score + 1);
  };
  const nextQuestion = () => { setChoice(null); setQuestionIndex(questionIndex + 1); };
  const goNext = () => { if (phase < 3) { setPhase(phase + 1); setChoice(null); } else setFinished(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const base = import.meta.env.BASE_URL;

  return <main className="alkali-app">
    <header className="alkali-nav"><button onClick={()=>location.href=base}><ArrowLeft/>返回元素入門</button><div><span><Atom/></span><b>MEM<span>GENIUS</span></b><small>第 1 族記憶路線</small></div><aside><Flame/> 7 天連勝</aside></header>
    <div className="alkali-progress"><div><span>第 1 族・鹼金屬</span><b>{progress}%</b></div><i><em style={{width:`${progress}%`}}/></i></div>
    <div className="alkali-shell">
      <aside className="route-rail"><p>MEMORY ROUTE 01</p><h1>鹼金屬<br/>六層記憶塔</h1><span>Li → Na → K → Rb → Cs → Fr</span><div>{[
        [1,"空間定位","建立上下六層"],[2,"諧音故事","把位置變成畫面"],[3,"遮蔽回想","不看答案找回來"]
      ].map(x=><button className={`${phase===x[0]?"active":""} ${phase>x[0]||finished?"done":""}`}><i>{phase>x[0]||finished?<Check/>:x[0]}</i><span><b>{x[1]}</b><small>{x[2]}</small></span></button>)}</div><footer><Lightbulb/><p><b>共同特性</b><br/>柔軟、活潑、最外層只有一顆電子，遇水反應強烈。</p></footer></aside>
      <section className="route-stage">
        {!finished && <><header className="phase-head"><div><span>STAGE 0{phase} / 03</span><h2>{phase===1?"把六個元素放進正確樓層":phase===2?"沿著樓層，走完一遍諧音故事":"遮住元素，用線索把它找回來"}</h2><p>{phase===1?"從最高樓開始點選元素。每放對一個，就多一個上下鄰居線索。":phase===2?"依序點擊六個故事節點，大聲唸出符號與諧音。":"題目會隨機遮住元素；先用位置，再用諧音或共同特性回想。"}</p></div><span className="phase-badge">{phase===1?<><MapPin/>空間</>:phase===2?<><Volume2/>故事</>:<><EyeOff/>回想</>}</span></header>

        {phase===1 && <div className="space-route"><div className="element-bank"><small>點選下一個元素</small><div>{scrambled.map(e=><button disabled={placed.includes(e.s)} onClick={()=>place(e.s)} className={choice===e.s?"shake":""}><b>{e.s}</b><span>{e.name}</span></button>)}</div>{choice&&!placed.includes(choice)&&<p>這一個還不是下一層，再看看最上方從誰開始。</p>}<button className="route-reset" onClick={()=>{setPlaced([]);setChoice(null)}}><RotateCcw/>重新排列</button></div><div className="memory-tower"><span className="tower-tape"/><small>第 1 族元素公寓</small>{alkali.map((e,i)=><div className={`tower-floor ${placed[i]?"filled":""}`}><i>{i+1}F</i>{placed[i]?<><span>{e.icon}</span><b>{e.s}</b><em>{e.name}・「{e.sound}」</em></>:<><span>?</span><small>{i===0?"最高樓":i===5?"最底層":"等待入住"}</small></>}</div>)}<p>↓ 原子序愈來愈大・反應通常愈劇烈</p></div></div>}

        {phase===2 && <div className="story-route"><div className="story-track">{alkali.map((e,i)=><button className={`${i<storyIndex?"revealed":""} ${i===storyIndex?"current":""}`} disabled={i>storyIndex} onClick={()=>i===storyIndex&&setStoryIndex(storyIndex+1)}><i>{i<storyIndex?<Check/>:i+1}</i><div className="story-element"><small>{e.n}</small><b>{e.s}</b><em>{e.name}</em></div><span>{i<storyIndex?e.icon:"?"}</span><div><small>「{e.sound}」</small><p>{i<storyIndex?e.line:"點擊揭開這一幕"}</p></div>{i<5&&<strong>↓</strong>}</button>)}</div><aside className="story-summary"><span className="tower-tape"/><small>連續故事口訣</small><h3><mark>力</mark>氣十足的鋰電池，<mark>拿</mark>著鹽罐，<mark>卡</mark>在樹上；掉出 <mark>Ruby</mark>，被大嘴<mark>吃</mark>掉，最後<mark>飛人</mark>來救援！</h3><div>{alkali.map(e=><span className={storyIndex>alkali.indexOf(e)?"on":""}>{e.s}<small>{e.sound}</small></span>)}</div><button><Volume2/>播放完整故事</button></aside></div>}

        {phase===3 && questionIndex<questions.length && <div className="recall-route"><div className="masked-tower">{alkali.map((e,i)=><div className={e.s===questions[questionIndex].a?"masked":""}><small>{i+1}F</small><b>{e.s===questions[questionIndex].a?"?":e.s}</b><em>{e.s===questions[questionIndex].a?"已遮蔽":e.name}</em></div>)}</div><div className="recall-question"><span>第 {questionIndex+1} / {questions.length} 題</span><h3>{questions[questionIndex].q}</h3><p>{questions[questionIndex].clue}</p><div>{questions[questionIndex].opts.map(s=><button onClick={()=>answer(s)} className={choice===s?(s===questions[questionIndex].a?"correct":"wrong"):choice&&s===questions[questionIndex].a?"correct":""}>{s}</button>)}</div>{choice&&<aside className={choice===questions[questionIndex].a?"good":"retry"}>{choice===questions[questionIndex].a?<><Check/>答對！你成功用線索找回 {questions[questionIndex].a}。</>:<>再看一次鄰居位置，正確答案是 {questions[questionIndex].a}。</>}<button onClick={nextQuestion}>{questionIndex===4?"查看結果":"下一題"}<ArrowRight/></button></aside>}</div></div>}
        {phase===3&&questionIndex===questions.length&&<div className="recall-result"><div><Sparkles/></div><small>回想訓練完成</small><h2>{score} / 5</h2><p>{score>=4?"很棒！空間與諧音路徑已經連起來了。":"已建立基本路徑，建議再跑一次遮蔽回想。"}</p></div>}

        {phaseDone&&<div className="route-next"><header><Sparkles/> MEMGENIUS NEXT・完成階段 {phase}</header><div><section><small>系統預測的最佳下一步</small><h3>{phase===1?"用諧音為六個樓層加上畫面":phase===2?"關掉故事，測試主動回想":score>=4?"進入第 17 族鹵素路線":"再跑一次遮蔽回想"}</h3><p>{phase===1?"樓層順序已建立；現在加入聲音與動作，能避免只記得位置卻忘記符號。":phase===2?"你已走完完整故事；立刻拿掉提示，記憶鞏固效果最好。":score>=4?"第 1 族已達標，下一個適合比較的家族是 F、Cl、Br、I、At、Ts。":"錯題顯示空間鏈還不夠穩，立即重練會比換新內容有效。"}</p></section><aside><button className="route-recommended" onClick={phase<3?goNext:score>=4?()=>setFinished(true):()=>{setQuestionIndex(0);setScore(0);setChoice(null)}}><b>A</b><span><strong>{phase<3?"照建議進入下一關":score>=4?"完成本章":"再做一次回想"}</strong><small>推薦路徑</small></span><ArrowRight/></button><button onClick={()=>phase===1?setPlaced([]):phase===2?setStoryIndex(0):setQuestionIndex(0)}><b>B</b><span><strong>再練一次目前階段</strong><small>強化熟練度</small></span></button><button onClick={()=>location.href=`${base}explore`}><b>C</b><span><strong>先看完整週期表</strong><small>自由探索</small></span></button></aside></div></div>}
        </>}

        {finished&&<div className="route-complete"><div className="route-trophy">🏆</div><small>MEMORY ROUTE 01 COMPLETE</small><h1>第 1 族記憶路線完成！</h1><p>你已經能用「六層位置、連續諧音、遮蔽回想」找回<br/>Li → Na → K → Rb → Cs → Fr。</p><div>{alkali.map(e=><span><b>{e.s}</b><small>{e.sound}</small></span>)}</div><section><b>下一階段建議</b><h3>第 17 族鹵素：F → Cl → Br → I → At → Ts</h3><p>用相同方法比較另一條直向家族，建立第二條週期表記憶柱。</p></section><button onClick={()=>location.href=`${base}halogen`}>開始第 17 族</button><button className="ghost" onClick={()=>{setFinished(false);setPhase(1);setPlaced([]);setStoryIndex(0);setQuestionIndex(0);setScore(0)}}>重新挑戰</button></div>}
      </section>
    </div>
  </main>;
}
