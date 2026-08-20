import { useState } from "react";
import { ArrowLeft, ArrowRight, Atom, Check, EyeOff, Flame, Lightbulb, MapPin, RotateCcw, Sparkles, Volume2 } from "lucide-react";

const gases = [
  { n:2, s:"He", name:"氦", sound:"嘿", icon:"🎈", line:"嘿！一顆氦氣球飛進房間" },
  { n:10, s:"Ne", name:"氖", sound:"你", icon:"💡", line:"你打開閃亮的霓虹燈" },
  { n:18, s:"Ar", name:"氬", sound:"啊", icon:"😮", line:"啊！燈光突然變得好亮" },
  { n:36, s:"Kr", name:"氪", sound:"客人", icon:"🚪", line:"一位神祕客人推門進來" },
  { n:54, s:"Xe", name:"氙", sound:"誰", icon:"❓", line:"大家問：他是誰？" },
  { n:86, s:"Rn", name:"氡", sound:"人", icon:"🧑", line:"那個人戴著防護面罩" },
  { n:118, s:"Og", name:"鿫", sound:"歐吉桑", icon:"👴", line:"原來是歐吉桑來參加派對" },
];
const scrambled=[gases[4],gases[1],gases[6],gases[2],gases[0],gases[5],gases[3]];
const tests=[
  {q:"Ne 的正下方是哪個元素？",clue:"空間：往下一層",a:"Ar",opts:["He","Ar","Kr"]},
  {q:"故事裡的「客人」代表？",clue:"諧音：客人",a:"Kr",opts:["Kr","Xe","Rn"]},
  {q:"Kr 與 Rn 中間缺少哪一層？",clue:"鄰居：Kr → ? → Rn",a:"Xe",opts:["Ar","Xe","Og"]},
  {q:"「那個人」代表哪個元素？",clue:"諧音：人",a:"Rn",opts:["Ne","Rn","Og"]},
  {q:"第 18 族最底層的元素是？",clue:"空間：第七層",a:"Og",opts:["Rn","Xe","Og"]},
];

export default function NobleGasRoute(){
  const [phase,setPhase]=useState(1),[placed,setPlaced]=useState<string[]>([]),[story,setStory]=useState(0),[qi,setQi]=useState(0),[choice,setChoice]=useState<string|null>(null),[score,setScore]=useState(0),[finished,setFinished]=useState(false);
  const base=import.meta.env.BASE_URL;
  const done=phase===1?placed.length===7:phase===2?story===7:qi===5;
  const progress=finished?100:Math.round(((phase-1+(phase===1?placed.length/7:phase===2?story/7:qi/5))/3)*100);
  const place=(s:string)=>{if(s===gases[placed.length].s){setPlaced([...placed,s]);setChoice(null)}else setChoice(s)};
  const answer=(s:string)=>{if(choice)return;setChoice(s);if(s===tests[qi].a)setScore(score+1)};
  const next=()=>{setPhase(phase+1);setChoice(null);window.scrollTo({top:0,behavior:"smooth"})};

  return <main className="alkali-app noble-app"><header className="alkali-nav"><button onClick={()=>location.href=`${base}compare-groups`}><ArrowLeft/>返回雙塔比較</button><div><span><Atom/></span><b>MEM<span>GENIUS</span></b><small>第 18 族記憶路線</small></div><aside><Flame/> 10 天連勝</aside></header><div className="alkali-progress"><div><span>第 18 族・惰性氣體</span><b>{progress}%</b></div><i><em style={{width:`${progress}%`}}/></i></div>
  <div className="alkali-shell"><aside className="route-rail"><p>MEMORY ROUTE 04</p><h1>惰性氣體<br/>七層穩定塔</h1><span>He → Ne → Ar → Kr → Xe → Rn → Og</span><div>{[[1,"空間定位","建立上下七層"],[2,"諧音故事","把符號變成畫面"],[3,"遮蔽回想","用線索找回答案"]].map(x=><button className={`${phase===x[0]?"active":""} ${phase>x[0]||finished?"done":""}`}><i>{phase>x[0]||finished?<Check/>:x[0]}</i><span><b>{x[1]}</b><small>{x[2]}</small></span></button>)}</div><footer><Lightbulb/><p><b>共同特性</b><br/>最外層電子已滿、非常穩定，常溫下為無色單原子氣體，通常不易反應。</p></footer></aside>
  <section className="route-stage">{!finished&&<><header className="phase-head"><div><span>STAGE 0{phase} / 03</span><h2>{phase===1?"建立最右側的七層穩定塔":phase===2?"走完惰性氣體諧音派對":"遮住元素，從樓層與故事找回來"}</h2><p>{phase===1?"從最高樓 He 開始依序點選。":phase===2?"逐幕揭開：嘿、你、啊、客人、誰、人、歐吉桑。":"利用上下鄰居與外層電子已滿的共同特性。"}</p></div><span className="phase-badge">{phase===1?<><MapPin/>空間</>:phase===2?<><Volume2/>故事</>:<><EyeOff/>回想</>}</span></header>
  {phase===1&&<div className="space-route"><div className="element-bank"><small>點選下一個元素</small><div>{scrambled.map(e=><button disabled={placed.includes(e.s)} onClick={()=>place(e.s)} className={choice===e.s?"shake":""}><b>{e.s}</b><span>{e.name}</span></button>)}</div>{choice&&<p>樓層不對，從最高樓 He 開始往下想。</p>}<button className="route-reset" onClick={()=>{setPlaced([]);setChoice(null)}}><RotateCcw/>重新排列</button></div><div className="memory-tower noble-tower"><span className="tower-tape"/><small>第 18 族穩定公寓</small>{gases.map((e,i)=><div className={`tower-floor ${placed[i]?"filled":""}`}><i>{i+1}F</i>{placed[i]?<><span>{e.icon}</span><b>{e.s}</b><em>{e.name}・「{e.sound}」</em></>:<><span>?</span><small>{i===0?"最高樓":i===6?"最底層":"等待入住"}</small></>}</div>)}<p>↓ 原子序增加・沸點通常上升，但整族依然穩定</p></div></div>}
  {phase===2&&<div className="story-route"><div className="story-track">{gases.map((e,i)=><button className={`${i<story?"revealed":""} ${i===story?"current":""}`} disabled={i>story} onClick={()=>i===story&&setStory(story+1)}><i>{i<story?<Check/>:i+1}</i><div className="story-element"><small>{e.n}</small><b>{e.s}</b><em>{e.name}</em></div><span>{i<story?e.icon:"?"}</span><div><small>「{e.sound}」</small><p>{i<story?e.line:"點擊揭開這一幕"}</p></div>{i<6&&<strong>↓</strong>}</button>)}</div><aside className="story-summary noble-story"><span className="tower-tape"/><small>穩定派對口訣</small><h3><mark>嘿</mark>！<mark>你</mark>看，<mark>啊</mark>！有位<mark>客人</mark>；他是<mark>誰</mark>？那個<mark>人</mark>原來是<mark>歐吉桑</mark>！</h3><div>{gases.map((e,i)=><span className={story>i?"on":""}>{e.s}<small>{e.sound}</small></span>)}</div><button><Volume2/>播放完整故事</button></aside></div>}
  {phase===3&&qi<5&&<div className="recall-route"><div className="masked-tower noble-tower">{gases.map((e,i)=><div className={e.s===tests[qi].a?"masked":""}><small>{i+1}F</small><b>{e.s===tests[qi].a?"?":e.s}</b><em>{e.s===tests[qi].a?"已遮蔽":e.name}</em></div>)}</div><div className="recall-question"><span>第 {qi+1} / 5 題</span><h3>{tests[qi].q}</h3><p>{tests[qi].clue}</p><div>{tests[qi].opts.map(s=><button onClick={()=>answer(s)} className={choice===s?(s===tests[qi].a?"correct":"wrong"):choice&&s===tests[qi].a?"correct":""}>{s}</button>)}</div>{choice&&<aside className={choice===tests[qi].a?"good":"retry"}>{choice===tests[qi].a?<><Check/>答對！成功找回 {tests[qi].a}。</>:<>正確答案是 {tests[qi].a}。</>}<button onClick={()=>{setChoice(null);setQi(qi+1)}}>{qi===4?"查看結果":"下一題"}<ArrowRight/></button></aside>}</div></div>}
  {phase===3&&qi===5&&<div className="recall-result"><div><Sparkles/></div><small>惰性氣體回想完成</small><h2>{score} / 5</h2><p>{score>=4?"七層穩定塔已建立。":"建議立刻重練遮蔽回想。"}</p></div>}
  {done&&<div className="route-next"><header><Sparkles/> MEMGENIUS NEXT・完成階段 {phase}</header><div><section><small>系統預測的最佳下一步</small><h3>{phase===1?"替七層座標加入派對故事":phase===2?"關掉提示，立即主動回想":score>=4?"建立第 1、17、18 族三塔比較":"重練惰性氣體遮蔽回想"}</h3><p>{phase===1?"位置已建立，加入聲音與人物能黏住符號。":phase===2?"故事還很鮮明，現在測驗最能鞏固記憶。":score>=4?"三座塔能完整呈現失去、獲得與不需移動電子的差異。":"目前錯題顯示樓層鏈不夠穩，立即重練最有效。"}</p></section><aside><button className="route-recommended" onClick={phase<3?next:score>=4?()=>setFinished(true):()=>{setQi(0);setScore(0);setChoice(null)}}><b>A</b><span><strong>{phase<3?"照建議進入下一關":score>=4?"完成本章":"再做一次回想"}</strong><small>推薦路徑</small></span><ArrowRight/></button><button onClick={()=>phase===1?setPlaced([]):phase===2?setStory(0):setQi(0)}><b>B</b><span><strong>再練一次目前階段</strong><small>強化熟練度</small></span></button><button onClick={()=>location.href=`${base}explore`}><b>C</b><span><strong>先看完整週期表</strong><small>自由探索</small></span></button></aside></div></div>}</>}
  {finished&&<div className="route-complete noble-complete"><div className="route-trophy">🏆</div><small>MEMORY ROUTE 04 COMPLETE</small><h1>第 18 族惰性氣體完成！</h1><p>你已能用七層位置、諧音派對與遮蔽回想找回<br/>He → Ne → Ar → Kr → Xe → Rn → Og。</p><div>{gases.map(e=><span><b>{e.s}</b><small>{e.sound}</small></span>)}</div><section><b>接下來可以選擇</b><h3>B｜第 1、17、18 族三塔比較</h3><p>比較失去電子、獲得電子與穩定滿層三種結構。</p><h3>C｜個人錯題與間隔複習</h3><p>保存容易混淆的樓層，安排下一次最佳複習時間。</p></section><button onClick={()=>location.href=`${base}compare-groups`}>先複習雙塔比較</button><button className="ghost" onClick={()=>location.href=base}>回課程首頁</button></div>}</section></div></main>;
}
