import { useState } from "react";
import { ArrowLeft, ArrowRight, Atom, Check, Clock3, Flame, HelpCircle, Home, Lightbulb, LockKeyhole, RotateCcw, Sparkles, Trophy, Volume2 } from "lucide-react";

const lessons = [
  { n: 1, title: "先看懂元素卡", sub: "認識每個數字與符號", time: "2 分鐘" },
  { n: 2, title: "找到元素的家", sub: "用族群顏色快速定位", time: "3 分鐘" },
  { n: 3, title: "串成荒謬故事", sub: "把抽象符號變成畫面", time: "4 分鐘" },
  { n: 4, title: "閉眼主動回想", sub: "讓記憶真正變牢固", time: "3 分鐘" },
];

const facts = [
  { key: "number", label: "原子序", value: "11", note: "它是第 11 號元素", x: "top" },
  { key: "symbol", label: "元素符號", value: "Na", note: "來自拉丁文 Natrium", x: "middle" },
  { key: "name", label: "中文名稱", value: "鈉", note: "生活中常見於食鹽", x: "bottom" },
];

export default function PeriodicTutorial() {
  const [step, setStep] = useState(1);
  const [fact, setFact] = useState("number");
  const [quiz, setQuiz] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const progress = complete ? 100 : step * 25;

  const next = () => {
    if (step === 1 && quiz !== "11") return;
    if (step < 4) { setStep(step + 1); setQuiz(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else setComplete(true);
  };

  return <main className="tutorial-app">
    <header className="tutorial-nav">
      <div className="tutorial-brand"><span><Atom size={22}/></span><b>MEM<span>GENIUS</span></b><small>元素記憶教室</small></div>
      <div className="course-progress"><div><span>課程進度</span><b>{progress}%</b></div><i><em style={{ width: `${progress}%` }}/></i></div>
      <div className="tutorial-actions"><button><HelpCircle size={17}/> 學習幫助</button><div><Flame size={17}/><b>7</b><small>連續天數</small></div><span className="tutorial-avatar">林</span></div>
    </header>

    <div className="tutorial-shell">
      <aside className="lesson-sidebar">
        <button className="back-course"><ArrowLeft size={16}/> 返回課程地圖</button>
        <div className="chapter-label">CHAPTER 01</div><h2>元素入門</h2><p>從一張元素卡開始，建立你的週期表地圖。</p>
        <div className="lesson-list">{lessons.map(l => <button key={l.n} onClick={() => l.n <= step && setStep(l.n)} className={`${step === l.n ? "active" : ""} ${l.n < step || complete ? "done" : ""} ${l.n > step ? "locked" : ""}`}>
          <span>{l.n < step || complete ? <Check size={15}/> : l.n > step ? <LockKeyhole size={13}/> : l.n}</span><div><b>{l.title}</b><small>{l.sub}</small><em><Clock3 size={11}/>{l.time}</em></div>
        </button>)}</div>
        <div className="sidebar-note"><Lightbulb size={21}/><div><b>學習小提醒</b><p>不用一次記住全部。先理解，再用回想把記憶加深。</p></div></div>
      </aside>

      <section className="lesson-stage">
        {!complete ? <>
          <div className="lesson-topline"><div><span>LESSON 0{step}</span><h1>{lessons[step-1].title}</h1><p>{step === 1 ? "先學會讀懂一張元素卡。點擊卡片上的區域，看看每個資訊代表什麼。" : step === 2 ? "顏色就是地圖。相同顏色的元素，通常擁有相似的化學性格。" : step === 3 ? "把元素符號變成人物和動作，故事越荒謬，大腦越喜歡。" : "蓋住答案，努力從腦中找回來。這個動作才是真正的學習。"}</p></div><div className="lesson-time"><Clock3/> 約 {lessons[step-1].time}</div></div>

          {step === 1 && <div className="learn-layout">
            <div className="demo-panel"><div className="demo-label"><Sparkles size={14}/> 互動示範</div><p className="tap-hint">點擊元素卡上的不同位置</p><div className="element-demo-wrap"><span className="paper-tape"/><button className="demo-element" aria-label="鈉元素卡">
              <span onClick={() => setFact("number")} className={fact === "number" ? "focus" : ""}>11</span><b onClick={() => setFact("symbol")} className={fact === "symbol" ? "focus" : ""}>Na</b><em onClick={() => setFact("name")} className={fact === "name" ? "focus" : ""}>鈉</em><small>22.990</small>
            </button><div className={`fact-callout ${facts.find(f=>f.key===fact)?.x}`}><small>{facts.find(f=>f.key===fact)?.label}</small><b>{facts.find(f=>f.key===fact)?.value}</b><p>{facts.find(f=>f.key===fact)?.note}</p></div></div>
            <div className="fact-tabs">{facts.map(f => <button key={f.key} onClick={() => setFact(f.key)} className={fact === f.key ? "active" : ""}><i>{fact === f.key && <Check size={12}/>}</i>{f.label}</button>)}</div></div>
            <div className="explain-panel"><span className="corner-tape"/><div className="explain-head"><div className="tiny-element">11<br/><b>Na</b></div><div><small>你正在看</small><h3>{facts.find(f=>f.key===fact)?.label}</h3></div></div><p>{fact === "number" ? "原子序就像每個元素的身分證號碼。它代表原子核裡有幾顆質子，也決定元素在週期表上的順序。" : fact === "symbol" ? "元素符號是全世界化學家的共同語言。第一個字母大寫，第二個字母必須小寫。" : "中文名稱常藏著元素的狀態線索：金字旁多為金屬，氣字頭多為氣體，石字旁則多為固體非金屬。"}</p><div className="memory-tip"><Lightbulb/><div><b>記憶鉤子</b><p>{fact === "number" ? "11 像兩根筷子，正好夾起鹹鹹的鈉鹽。" : fact === "symbol" ? "Na 就想成「拿」：拿起鹽罐，就是鈉。" : "鈉的金字旁提醒你：它是一種閃亮的金屬。"}</p></div></div><button className="listen-btn"><Volume2 size={17}/> 播放語音解說</button></div>
          </div>}

          {step === 2 && <div className="family-lesson"><div className="family-board"><span className="paper-tape"/><p>同一家族，排在同一條直線上</p><div className="family-row">{[["3","Li","鋰"],["11","Na","鈉"],["19","K","鉀"],["37","Rb","銣"]].map((x,i)=><div key={x[1]}><button><small>{x[0]}</small><b>{x[1]}</b><em>{x[2]}</em></button>{i<3&&<span>↓</span>}</div>)}</div><div className="family-caption"><b>第 1 族・鹼金屬</b><span>活潑、柔軟，遇水會產生激烈反應</span></div></div><div className="try-card"><span>輪到你了</span><h3>下面哪一個也屬於第 1 族？</h3><div className="choice-elements">{["Ca","K","Ne"].map(x=><button onClick={()=>setQuiz(x)} className={quiz===x?(x==="K"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<p>{quiz==="K"?"答對了！K 和 Li、Na 排在同一族。":"再看看直行的位置和顏色喔。"}</p>}</div></div>}

          {step === 3 && <div className="story-lesson"><div className="story-chain"><p>把符號唸成畫面</p><div>{[["Li","鋰","🪫"],["Na","鈉","🧂"],["K","鉀","🌳"]].map((x,i)=><span key={x[0]}><button><small>{x[1]}</small><b>{x[0]}</b><em>{x[2]}</em></button>{i<2&&<i>＋</i>}</span>)}</div></div><div className="story-paper"><span className="corner-tape"/><small>你的第一個元素故事</small><h2>「鋰電池沒電，我<span>拿</span>起鹽罐，<br/>爬上巨大的<span>鉀</span>樹充電！」</h2><p>荒謬 ✓　有動作 ✓　有畫面 ✓</p></div><div className="try-card"><span>快速檢查</span><h3>故事中的「拿起鹽罐」代表哪個元素？</h3><div className="text-choices">{["Li","Na","K"].map(x=><button onClick={()=>setQuiz(x)} className={quiz===x?(x==="Na"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<p>{quiz==="Na"?"沒錯！「拿」的發音幫你找回 Na。":"再唸一次：「拿」起鹽罐。"}</p>}</div></div>}

          {step === 4 && <div className="recall-lesson"><div className="recall-card"><span className="paper-tape"/><div className="blur-element">?<small>11</small></div><p>原子序 11 的元素符號是？</p><div className="recall-options">{["Na","Ne","Ni","N"].map(x=><button onClick={()=>setQuiz(x)} className={quiz===x?(x==="Na"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<div className="recall-answer">{quiz==="Na"?<><Check/>答對了！你成功從記憶中找回 Na。</>:<>快想想：「拿起鹽罐」是哪個符號？</>}</div>}</div><aside className="recall-why"><BrainIcon/><h3>為什麼要先回想？</h3><p>直接重看答案會產生「我好像會了」的錯覺。努力回想的那幾秒，才會讓記憶路徑真正變強。</p><div><b>看答案</b><span>熟悉感</span><i>→</i><b>先回想</b><span>長期記憶</span></div></aside></div>}

          <div className="lesson-footer"><button disabled={step===1} onClick={()=>{setStep(step-1);setQuiz(null)}}><ArrowLeft/> 上一步</button><span>{step} / 4</span><button className="next-lesson" disabled={(step===1&&quiz!=="11")||(step===2&&quiz!=="K")||(step===3&&quiz!=="Na")||(step===4&&quiz!=="Na")} onClick={next}>{step===4?"完成教學":"下一步"}<ArrowRight/></button></div>
          {step===1 && <div className="mini-check"><div><span>小測驗</span><h3>鈉的原子序是多少？</h3></div><div>{["10","11","12"].map(x=><button key={x} onClick={()=>setQuiz(x)} className={quiz===x?(x==="11"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<p>{quiz==="11"?"答對了！可以進入下一步。":"再看看卡片左上角的數字。"}</p>}</div>}
        </> : <div className="complete-screen"><div className="confetti">✦　·　✦　·　✦</div><div className="trophy-circle"><Trophy/></div><small>CHAPTER 01 完成</small><h1>你已經會「正確地記」元素了！</h1><p>你學會讀元素卡、找家族、編故事與主動回想。<br/>接下來，就用這套方法攻下第 1 族吧。</p><div className="complete-stats"><div><b>+120</b><span>學習經驗</span></div><div><b>4 / 4</b><span>完成課程</span></div><div><b>100%</b><span>測驗正確</span></div></div><button className="start-chapter"><Sparkles/> 開始「鹼金屬故事線」<ArrowRight/></button><button className="restart" onClick={()=>{setComplete(false);setStep(1);setQuiz(null)}}><RotateCcw/>重新觀看教學</button></div>}
      </section>
    </div>
  </main>;
}

function BrainIcon(){return <div className="brain-icon">🧠</div>}
