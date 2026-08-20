import { useMemo, useState } from "react";
import { ArrowLeft, Brain, CalendarClock, Check, Clock3, Flame, RotateCcw, Sparkles } from "lucide-react";
import { gradeReview, loadReviewCards, type ReviewCard } from "@/lib/reviewData";

function dueLabel(time:number){const d=time-Date.now();if(d<=0)return "現在到期";if(d<3_600_000)return `${Math.ceil(d/60_000)} 分鐘後`;if(d<86_400_000)return `${Math.ceil(d/3_600_000)} 小時後`;return `${Math.ceil(d/86_400_000)} 天後`}

export default function ReviewCenter(){
  const [cards,setCards]=useState<ReviewCard[]>(()=>loadReviewCards()),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false);
  const base=import.meta.env.BASE_URL;
  const due=useMemo(()=>cards.filter(x=>x.nextReview<=Date.now()).sort((a,b)=>b.misses-a.misses),[cards]);
  const upcoming=useMemo(()=>cards.filter(x=>x.nextReview>Date.now()).sort((a,b)=>a.nextReview-b.nextReview),[cards]);
  const active=due[index];
  const grade=(g:"again"|"hard"|"good")=>{setCards(gradeReview(active.id,g));setIndex(0);setRevealed(false)};
  return <main className="review-app"><header className="alkali-nav"><button onClick={()=>location.href=`${base}three-towers`}><ArrowLeft/>返回三塔比較</button><div><span><Brain/></span><b>MEM<span>GENIUS</span></b><small>個人複習中心</small></div><aside><Flame/> 今日複習 {due.length}</aside></header><div className="review-shell"><header><div><small>DEVICE-LOCAL REVIEW</small><h1>錯題與間隔複習</h1><p>學習紀錄只保存在這台裝置的瀏覽器中。</p></div><div className="review-stats"><span><b>{due.length}</b>現在到期</span><span><b>{upcoming.length}</b>稍後複習</span><span><b>{cards.reduce((n,c)=>n+c.misses,0)}</b>累積錯誤</span></div></header>
  {cards.length===0?<section className="review-empty"><div><Sparkles/></div><h2>目前沒有錯題</h2><p>完成三塔比較測驗後，答錯的題目會自動出現在這裡。</p><button onClick={()=>location.href=`${base}three-towers`}>開始三塔測驗</button></section>:<div className="review-grid"><section className="review-session"><div className="review-session-head"><span><Clock3/>今日複習</span><b>{Math.min(index+1,due.length)} / {due.length}</b></div>{active?<><article className={revealed?"revealed":""}><small>{active.family}・錯誤 {active.misses} 次</small><h2>{active.prompt}</h2><p>{active.hint}</p>{revealed?<div><span>正確答案</span><b>{active.answer}</b></div>:<button onClick={()=>setRevealed(true)}>顯示答案</button>}</article>{revealed&&<div className="review-grades"><button onClick={()=>grade("again")}><RotateCcw/><b>再一次</b><small>1 分鐘後</small></button><button onClick={()=>grade("hard")}><Clock3/><b>有點難</b><small>1 天後</small></button><button onClick={()=>grade("good")}><Check/><b>記住了</b><small>{Math.max(3,(active.streak+1)*3)} 天後</small></button></div>}</>:<div className="review-done"><Check/><h2>今天到期的卡片完成了！</h2><p>系統會在下一個適合的時間再次提醒你。</p></div>}</section><aside className="review-queue"><h3><CalendarClock/>複習排程</h3>{[...due.slice(index+1),...upcoming].slice(0,8).map(card=><div><span>{card.family}</span><b>{card.answer}</b><small>{dueLabel(card.nextReview)}</small></div>)}{due.length<=1&&upcoming.length===0&&<p>完成目前卡片後，新的排程會顯示在這裡。</p>}</aside></div>}
  <footer><Brain/><p><b>間隔規則</b><br/>答錯：1 分鐘後｜有點難：1 天後｜記住了：依連續正確次數延長至 3、6、9 天。</p></footer></div></main>;
}

