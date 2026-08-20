import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Flame, Headphones, RotateCcw, Sparkles, Trophy, Volume2, X } from "lucide-react";
import "./PhoneticMagic.css";

type Mode = "learn" | "levels" | "sprint";
type Screen = "home" | "forecast" | "languages" | "game" | "result";
type Forecast = "language" | "session";
type Word = { word: string; phonetic: string; meaning: string; mnemonic: string; phrase: string; emoji: string };

const LANGUAGES = [
  ["English", "英語", "🇬🇧"], ["日本語", "日語", "🇯🇵"], ["Español", "西班牙語", "🇪🇸"],
  ["Deutsch", "德語", "🇩🇪"], ["Français", "法語", "🇫🇷"], ["한국어", "韓語", "🇰🇷"],
  ["ไทย", "泰語", "🇹🇭"], ["Tiếng Việt", "越南語", "🇻🇳"], ["Bahasa Indonesia", "印尼語", "🇮🇩"],
  ["العربية", "阿拉伯語", "🇸🇦"], ["粵語", "粵語", "🇭🇰"], ["客家話", "客家話", "🌼"], ["台語", "台語", "🇹🇼"],
] as const;

const WORDS: Word[] = [
  { word: "Ambulance", phonetic: "/ˈæm.bjə.ləns/", meaning: "救護車", mnemonic: "俺不能死", phrase: "救護車來了，俺不能死！", emoji: "🚑" },
  { word: "Pest", phonetic: "/pest/", meaning: "害蟲", mnemonic: "拍死它", phrase: "看到害蟲，就把它拍死！", emoji: "🐛" },
  { word: "Economy", phonetic: "/ɪˈkɒn.ə.mi/", meaning: "經濟", mnemonic: "一靠農民", phrase: "經濟發展，一靠農民努力。", emoji: "📈" },
  { word: "Curious", phonetic: "/ˈkjʊə.ri.əs/", meaning: "好奇的", mnemonic: "瞧你啊斯", phrase: "瞧你啊，是不是很好奇？", emoji: "🔎" },
  { word: "Nutrition", phonetic: "/njuːˈtrɪʃ.ən/", meaning: "營養", mnemonic: "牛吹神", phrase: "牛奶吹得神，營養一定行。", emoji: "🥛" },
  { word: "Admire", phonetic: "/ədˈmaɪər/", meaning: "欣賞；欽佩", mnemonic: "額的媽呀", phrase: "額的媽呀，太厲害了，真讓人欽佩！", emoji: "👏" },
  { word: "Museum", phonetic: "/mjuːˈziː.əm/", meaning: "博物館", mnemonic: "沒有賊啊", phrase: "博物館戒備森嚴，沒有賊啊。", emoji: "🏛️" },
  { word: "Strong", phonetic: "/strɒŋ/", meaning: "強壯的", mnemonic: "死壯", phrase: "每天運動，身體壯得不得了。", emoji: "💪" },
];

const MODES = {
  learn: { icon: BookOpen, title: "學習模式", desc: "自由翻閱單字卡，沒有時間限制", accent: "mint" },
  levels: { icon: Trophy, title: "闖關模式", desc: "先記憶再作答，連勝解鎖新關卡", accent: "gold" },
  sprint: { icon: Clock3, title: "60 秒挑戰", desc: "在倒數結束前快速判斷並衝高分", accent: "coral" },
} as const;

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-US"; voice.rate = .82; speechSynthesis.speak(voice);
}

export default function PhoneticMagic() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("learn");
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>(LANGUAGES[0]);
  const [forecast, setForecast] = useState<Forecast>("language");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [time, setTime] = useState(60);
  const timer = useRef<number | null>(null);
  const current = WORDS[index % WORDS.length];

  useEffect(() => {
    if (screen !== "game" || mode !== "sprint") return;
    timer.current = window.setInterval(() => setTime(value => {
      if (value <= 1) { if (timer.current) clearInterval(timer.current); setScreen("result"); return 0; }
      return value - 1;
    }), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [screen, mode]);

  const start = (item: (typeof LANGUAGES)[number]) => {
    setLanguage(item); setIndex(0); setScore(0); setStreak(0); setTime(60); setFlipped(false); setScreen("game");
  };
  const chooseMode = (selected: Mode) => {
    setMode(selected); setForecast("language"); setScreen("forecast");
  };
  const chooseLanguage = (item: (typeof LANGUAGES)[number]) => {
    setLanguage(item); setForecast("session"); setScreen("forecast");
  };
  const next = () => {
    if (mode !== "sprint" && index >= WORDS.length - 1) { setScreen("result"); return; }
    setIndex(value => (value + 1) % WORDS.length); setFlipped(false);
  };
  const answer = (known: boolean) => {
    if (known) { setScore(value => value + (mode === "sprint" ? 120 : 100)); setStreak(value => value + 1); }
    else setStreak(0);
    next();
  };

  return <div className="phonetic-app">
    <div className="phonetic-orb orb-one"/><div className="phonetic-orb orb-two"/>
    <header className="phonetic-nav">
      <button className="phonetic-brand" onClick={() => setScreen("home")}><span><Sparkles/></span><b>聲音記憶所</b><small>PHONETIC LAB</small></button>
      <div className="nav-score"><Flame/> 連續 <b>{streak}</b><span/>得分 <strong>{score}</strong></div>
    </header>

    {screen === "home" && <main className="phonetic-home">
      <section className="phonetic-hero-copy">
        <div className="kicker"><span>NEW</span> 用聲音，記住一個新世界</div>
        <h1>聽見單字，<br/><em>看見記憶。</em></h1>
        <p>把陌生發音變成一幕熟悉的中文小劇場。翻開卡牌，讓諧音、畫面與聲音一起住進腦海。</p>
        <div className="hero-notes"><span>🎧 真人語音</span><span>🧠 諧音聯想</span><span>✨ 3D 翻卡</span></div>
        <button className="element-story-entry" onClick={()=>location.href=`${import.meta.env.BASE_URL}story-builder`}><span>⚗️</span><div><b>元素故事工作室</b><small>選擇 3～6 個元素，建立連續記憶故事</small></div><ArrowRight/></button>
      </section>
      <section className="mode-panel"><div className="panel-top"><span>選擇今日訓練</span><small>3 MODES</small></div>
        {Object.entries(MODES).map(([key, item], i) => { const Icon = item.icon; return <button className={`mode-row ${item.accent}`} key={key} onClick={() => chooseMode(key as Mode)}>
          <span className="mode-number">0{i + 1}</span><span className="mode-icon"><Icon/></span><span className="mode-copy"><b>{item.title}</b><small>{item.desc}</small></span><ArrowRight/>
        </button>})}
        <p className="daily-note">今日已記憶 <b>12</b> 個單字 · 再學 8 個完成目標</p>
      </section>
    </main>}

    {screen === "forecast" && <main className="forecast-screen">
      <button className="back-link" onClick={() => setScreen(forecast === "language" ? "home" : "languages")}><ArrowLeft/> 返回上一步</button>
      <section className="forecast-card">
        <header><span><Sparkles/></span><div><small>NEXT STEP PREDICTION</small><b>下一階段，我預測你會做這些事</b></div></header>
        {forecast === "language" ? <>
          <div className="forecast-copy"><span>剛完成</span><b>已選擇「{MODES[mode].title}」</b><ArrowRight/><span>接下來</span><b>選語言與字庫</b></div>
          <h1>先用熟悉的英語建立第一個記憶連結</h1><p>系統會帶你進入 8 張示範卡：先聽發音、翻面看諧音，再判斷是否記住。</p>
          <div className="forecast-options">
            <button className="recommended" onClick={() => chooseLanguage(LANGUAGES[0])}><em>推薦</em><span>🇬🇧</span><div><b>快速開始英語</b><small>最完整的示範字庫 · 約 3 分鐘</small></div><ArrowRight/></button>
            <button onClick={() => setScreen("languages")}><span>🌏</span><div><b>先選其他語言</b><small>瀏覽全部 13 種語言入口</small></div><ArrowRight/></button>
            <button onClick={() => setScreen("home")}><span>↩️</span><div><b>更換訓練模式</b><small>重新比較學習、闖關與挑戰</small></div><ArrowRight/></button>
          </div>
        </> : <>
          <div className="forecast-copy"><span>剛完成</span><b>已選擇 {language[2]} {language[1]}</b><ArrowRight/><span>接下來</span><b>開始第一張卡</b></div>
          <h1>{mode === "sprint" ? "準備好在 60 秒內快速作答" : mode === "levels" ? "先建立記憶，再用答題穩固它" : "按照自己的速度聽、看、翻、記"}</h1>
          <p>第一張會是 Ambulance。建議先按「聽發音」，猜一次意思，再翻到背面看「俺不能死」的諧音畫面。</p>
          <div className="forecast-options">
            <button className="recommended" onClick={() => start(language)}><em>推薦</em><span>✨</span><div><b>照建議開始</b><small>聽發音 → 猜意思 → 翻卡 → 自評</small></div><ArrowRight/></button>
            <button onClick={() => { setMode("learn"); start(language); }}><span>🎧</span><div><b>改用無壓學習</b><small>沒有倒數，適合第一次體驗</small></div><ArrowRight/></button>
            <button onClick={() => setScreen("languages")}><span>🌐</span><div><b>重新選擇語言</b><small>回到 13 種語言清單</small></div><ArrowRight/></button>
          </div>
        </>}
        <footer><span>為什麼這樣建議？</span><p>根據你剛才的選擇，優先安排阻力最低、最容易完成的一小步。</p></footer>
      </section>
    </main>}

    {screen === "languages" && <main className="language-screen">
      <button className="back-link" onClick={() => setScreen("home")}><ArrowLeft/> 返回模式</button>
      <div className="screen-heading"><span>STEP 02</span><h1>今天想學哪一種語言？</h1><p>先從英語示範單字開始；其他語言入口已準備好，可接續擴充專屬字庫。</p></div>
      <div className="language-grid">{LANGUAGES.map((item, i) => <button key={item[0]} className={i === 0 ? "featured" : ""} onClick={() => chooseLanguage(item)}>
        <span className="language-flag">{item[2]}</span><span><b>{item[0]}</b><small>{item[1]}</small></span>{i === 0 && <em>8 WORDS</em>}<ArrowRight/>
      </button>)}</div>
    </main>}

    {screen === "game" && <main className="game-screen">
      <div className="game-toolbar"><button onClick={() => setScreen("languages")}><ArrowLeft/> 離開</button><div><span>{language[2]} {language[1]}</span><b>{MODES[mode].title}</b></div>{mode === "sprint" ? <strong className={time < 10 ? "danger" : ""}><Clock3/> {time}s</strong> : <strong>{index + 1} / {WORDS.length}</strong>}</div>
      <div className="game-progress"><i style={{width: `${mode === "sprint" ? time / 60 * 100 : (index + 1) / WORDS.length * 100}%`}}/></div>
      <section className="card-stage"><div className="card-hint"><RotateCcw/> 點擊卡牌翻面</div>
        <button className={`phonetic-card ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(!flipped)} aria-label="翻轉單字卡">
          <span className="card-face card-front"><small>WORD · {String(index + 1).padStart(2,"0")}</small><span className="word-emoji">{current.emoji}</span><b>{current.word}</b><em>{current.phonetic}</em><span className="listen" onClick={e => { e.stopPropagation(); speak(current.word); }}><Volume2/> 聽發音</span><i>FLIP TO REVEAL</i></span>
          <span className="card-face card-back"><small>MEMORY LINK</small><span className="meaning">{current.meaning}</span><b>「{current.mnemonic}」</b><p>{current.phrase}</p><span className="sound-link"><Headphones/> {current.word} ≈ {current.mnemonic}</span><i>聲音相近就好，畫面越荒謬越好記</i></span>
        </button>
        <div className="card-actions"><button className="miss" onClick={() => answer(false)}><X/> 還不熟</button><button className="flip-control" onClick={() => setFlipped(!flipped)}><RotateCcw/> 翻面</button><button className="know" onClick={() => answer(true)}><Check/> 記住了</button></div>
        <div className="card-nav"><button disabled={index === 0 || mode === "sprint"} onClick={() => { setIndex(index - 1); setFlipped(false); }}><ArrowLeft/> 上一張</button><span>{WORDS.map((_, i) => <i key={i} className={i === index ? "active" : i < index ? "done" : ""}/>)}</span><button onClick={next}>下一張 <ArrowRight/></button></div>
      </section>
    </main>}

    {screen === "result" && <main className="result-screen"><div className="result-badge"><Trophy/></div><span>SESSION COMPLETE</span><h1>你的耳朵已經<br/>記住更多了。</h1><p>這次練習完成得很好。下一步建議立即短複習，趁記憶痕跡還清楚時再加深一次。</p><div className="result-stats"><div><b>{score}</b><small>本次得分</small></div><div><b>{Math.max(streak,1)}</b><small>最高連續</small></div><div><b>{WORDS.length}</b><small>練習單字</small></div></div><section className="result-prediction"><small>NEXT STEP PREDICTION</small><b>接下來你可能會想：</b><div><button className="recommended" onClick={() => start(language)}><em>推薦</em><RotateCcw/><span>立即複習一次</span></button><button onClick={() => { setMode("sprint"); start(language); }}><Clock3/><span>挑戰 60 秒</span></button><button onClick={() => setScreen("languages")}><span>🌏</span><span>換一種語言</span></button></div></section><button className="result-home" onClick={() => setScreen("home")}>回到模式選擇</button></main>}
    <footer className="phonetic-footer"><span>聲音記憶所</span><small>LEARN BY SOUND · REMEMBER BY STORY</small></footer>
  </div>;
}
