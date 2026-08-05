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
  const passed = (step === 1 && quiz === "11") || (step === 2 && quiz === "K") || (step === 3 && quiz === "Na") || (step === 4 && quiz === "Na");
  const predictions = [
    { title: "建立空間座標", why: "你已讀懂元素卡，下一步最有效的是把 Na 放回週期表，連接它的上下左右鄰居。", next: "預計會學：Li 在上、K 在下、Mg 在右，以及同族為何特性相似。", strengthen: "再練一次元素卡資訊" },
    { title: "把位置翻成諧音故事", why: "你已能用位置找回 K，現在要替位置加上聲音，避免只記得格子卻忘了符號。", next: "預計會學：Li＝力、Na＝拿、K＝卡，並把同族串成一段有動作的故事。", strengthen: "再做一題空間定位" },
    { title: "關掉提示，主動回想", why: "你已建立位置與諧音兩條線索。下一階段會拿掉故事提示，測試能否自己找回答案。", next: "預計會做：看到原子序 11，在沒有選字提示前先回想 Na。", strengthen: "再讀一次諧音故事" },
    { title: "進入第一條完整家族路線", why: "你已通過讀卡、空間、諧音與回想，具備獨立學習一整族元素的能力。", next: "建議從第 1 族開始：Li → Na → K → Rb → Cs → Fr。", strengthen: "重新挑戰本章測驗" },
  ];

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

          {step === 2 && <div className="space-lesson"><div className="spatial-board"><span className="paper-tape"/><div className="space-title"><small>空間定位法</small><h3>以 Na 為中心，記住它的上下左右</h3><p>不用背座標，把週期表想成一棟元素公寓。</p></div><div className="neighbor-map"><div className="neighbor be"><small>右上鄰居</small><b>Be</b><em>鈹・「背」</em></div><div className="neighbor li"><small>樓上同族</small><b>Li</b><em>鋰・「力」</em></div><div className="neighbor na"><small>我的位置</small><b>Na</b><em>鈉・「拿」</em></div><div className="neighbor mg"><small>右邊鄰居</small><b>Mg</b><em>鎂・「美肌」</em></div><div className="neighbor k"><small>樓下同族</small><b>K</b><em>鉀・「卡」</em></div><i className="line-v"/><i className="line-h"/></div><div className="space-story"><b>空間故事</b><p>樓上 <strong>Li</strong> 用力，把鹽罐 <strong>Na</strong>「拿」給右邊做「美肌」的 <strong>Mg</strong>，結果掉下去「卡」在樓下 <strong>K</strong>。</p></div></div><div className="space-side"><div className="family-strip"><small>直向＝同族、特性相似</small>{[["Li","力","鋰"],["Na","拿","鈉"],["K","卡","鉀"],["Rb","Ruby","銣"]].map((x,i)=><div key={x[0]}><button><b>{x[0]}</b><em>{x[2]}</em></button><span><strong>{x[1]}</strong>{i<3&&" ↓"}</span></div>)}<p>都柔軟、活潑，遇水反應強烈</p></div><div className="try-card"><span>空間快問快答</span><h3>Na 的樓下同族鄰居是？</h3><div className="choice-elements">{["Mg","K","Li"].map(x=><button key={x} onClick={()=>setQuiz(x)} className={quiz===x?(x==="K"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<p>{quiz==="K"?"答對！向下走一層就是 K，兩者特性也相似。":"從 Na 沿著同一條直線往下走看看。"}</p>}</div></div></div>}

          {step === 3 && <div className="sound-lesson"><div className="phonetic-wall"><div className="space-title"><small>諧音掛鉤庫</small><h3>先把符號變成「聽得見的畫面」</h3><p>選最順口的中文聲音，不必追求完全同音。</p></div><div className="phonetic-groups"><section><header><b>第 1 族・直向故事</b><span>特性相似</span></header>{[["Li","力","🔋","鋰電池用力"],["Na","拿","🧂","拿起鹽罐"],["K","卡","🌳","卡在樹上"],["Rb","Ruby","💎","紅寶石 Ruby"]].map(x=><div><button><b>{x[0]}</b><small>{x[1]}</small></button><i>{x[2]}</i><p>{x[3]}</p></div>)}</section><section><header><b>第 17 族・直向故事</b><span>鹵素家族</span></header>{[["F","飛","🪽","飛進游泳池"],["Cl","可樂","🥤","可樂冒氯氣"],["Br","不然","🧹","不然就用溴掃"],["I","愛","💜","愛上紫色碘"]].map(x=><div><button><b>{x[0]}</b><small>{x[1]}</small></button><i>{x[2]}</i><p>{x[3]}</p></div>)}</section><section><header><b>第 4 週期・橫向故事</b><span>左右鄰居</span></header>{[["Mn","猛男","💪","猛男"],["Fe","飛","🛫","飛過"],["Co","口","👄","張口"],["Ni","你","👉","指著你"],["Cu","哭","😭","大哭"],["Zn","真","✅","真的"]].map(x=><div><button><b>{x[0]}</b><small>{x[1]}</small></button><i>{x[2]}</i><p>{x[3]}</p></div>)}</section></div></div><div className="story-side"><div className="story-paper"><span className="corner-tape"/><small>橫向鄰居故事</small><h2>「<span>猛男</span> Mn <span>飛</span> Fe 過來，張<span>口</span> Co 指著<span>你</span> Ni，害你<span>哭</span> Cu：這是<span>真</span> Zn 的！」</h2><p>位置順序 ✓　符號諧音 ✓　誇張動作 ✓</p></div><div className="try-card"><span>快速檢查</span><h3>故事中的「拿起鹽罐」代表哪個元素？</h3><div className="text-choices">{["Li","Na","K"].map(x=><button key={x} onClick={()=>setQuiz(x)} className={quiz===x?(x==="Na"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<p>{quiz==="Na"?"沒錯！「拿」的發音幫你找回 Na。":"再唸一次：「拿」起鹽罐。"}</p>}</div><div className="phonetic-rule"><Lightbulb/><p><b>好諧音的三個條件</b><br/>說得順口、腦中有畫面、能和上下左右鄰居連成動作。</p></div></div></div>}

          {step === 4 && <div className="recall-lesson"><div className="recall-card"><span className="paper-tape"/><div className="blur-element">?<small>11</small></div><p>原子序 11 的元素符號是？</p><div className="recall-options">{["Na","Ne","Ni","N"].map(x=><button onClick={()=>setQuiz(x)} className={quiz===x?(x==="Na"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<div className="recall-answer">{quiz==="Na"?<><Check/>答對了！你成功從記憶中找回 Na。</>:<>快想想：「拿起鹽罐」是哪個符號？</>}</div>}</div><aside className="recall-why"><BrainIcon/><h3>為什麼要先回想？</h3><p>直接重看答案會產生「我好像會了」的錯覺。努力回想的那幾秒，才會讓記憶路徑真正變強。</p><div><b>看答案</b><span>熟悉感</span><i>→</i><b>先回想</b><span>長期記憶</span></div></aside></div>}

          {passed && <div className="next-prediction"><header><span><Sparkles size={14}/> MEMGENIUS NEXT</span><b>已根據這階段的成果，預測你的最佳下一步</b></header><div className="prediction-body"><div className="prediction-main"><small>推薦下一階段</small><h3>{predictions[step-1].title}</h3><p>{predictions[step-1].why}</p><div><ArrowRight size={15}/><span>{predictions[step-1].next}</span></div></div><aside><small>你可以選擇</small><button className="recommended-choice" onClick={next}><span><b>A</b><em>建議</em></span><div><strong>{step===4?"完成並開始新章節":"照建議繼續"}</strong><small>使用目前最佳學習路徑</small></div><ArrowRight size={16}/></button><button onClick={()=>setQuiz(null)}><span><b>B</b></span><div><strong>{predictions[step-1].strengthen}</strong><small>留在這一步加強熟練度</small></div></button><button onClick={()=>window.location.href=`${import.meta.env.BASE_URL}explore`}><span><b>C</b></span><div><strong>先看完整元素地圖</strong><small>自由探索，再回來繼續</small></div></button></aside></div><footer><Lightbulb size={14}/><span>這只是學習建議，你可以隨時選擇不同路線；課程會保留目前進度。</span></footer></div>}
          <div className="lesson-footer"><button disabled={step===1} onClick={()=>{setStep(step-1);setQuiz(null)}}><ArrowLeft/> 上一步</button><span>{step} / 4</span>{!passed && <button className="next-lesson" disabled onClick={next}>{step===4?"完成教學":"完成測驗後繼續"}<ArrowRight/></button>}</div>
          {step===1 && <div className="mini-check"><div><span>小測驗</span><h3>鈉的原子序是多少？</h3></div><div>{["10","11","12"].map(x=><button key={x} onClick={()=>setQuiz(x)} className={quiz===x?(x==="11"?"correct":"wrong"):""}>{x}</button>)}</div>{quiz&&<p>{quiz==="11"?"答對了！可以進入下一步。":"再看看卡片左上角的數字。"}</p>}</div>}
        </> : <div className="complete-screen"><div className="confetti">✦　·　✦　·　✦</div><div className="trophy-circle"><Trophy/></div><small>CHAPTER 01 完成</small><h1>你已經會「正確地記」元素了！</h1><p>你學會讀元素卡、找家族、編故事與主動回想。<br/>接下來，就用這套方法攻下第 1 族吧。</p><div className="complete-stats"><div><b>+120</b><span>學習經驗</span></div><div><b>4 / 4</b><span>完成課程</span></div><div><b>100%</b><span>測驗正確</span></div></div><button className="start-chapter" onClick={()=>location.href=`${import.meta.env.BASE_URL}alkali`}><Sparkles/> 開始「鹼金屬故事線」<ArrowRight/></button><button className="restart" onClick={()=>{setComplete(false);setStep(1);setQuiz(null)}}><RotateCcw/>重新觀看教學</button></div>}
      </section>
    </div>
  </main>;
}

function BrainIcon(){return <div className="brain-icon">🧠</div>}
