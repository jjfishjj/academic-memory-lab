/**
 * 風格備忘：手帳拼貼學院 (Scrapbook Academia)
 * 米白紙底、teal 墨水主色、亮黃(情境)/玫瑰粉(情感)便利貼雙軌
 * 非對稱「攤開的筆記本」佈局、和紙膠帶、蠟筆下劃線、微旋轉紙卡
 */
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Heart, EyeOff, Stamp, Clock, Sparkles } from "lucide-react";
import { loadStats, type GymStats } from "@/lib/gameData";

const LOGO = "/manus-storage/memodesk-logo_c083e7cf.png";
const HERO = "/manus-storage/hero-desk_6de4c64c.png";
const CAMPUS = "/manus-storage/scene-campus_32525752.png";
const EMOTION = "/manus-storage/story-emotion_cd8d15ee.png";

function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF6EE]/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <a href="#top" className="flex items-center gap-2.5">
          <img src={LOGO} alt="MemoDesk logo" className="w-9 h-9" />
          <span className="font-display font-extrabold text-lg tracking-wide">記憶手帳社 <span className="text-primary">MemoDesk</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#problem" className="hover:text-primary transition-colors">學院痛點</a>
          <a href="#method" className="hover:text-primary transition-colors">雙卡方法</a>
          <a href="#flow" className="hover:text-primary transition-colors">任務流程</a>
          <Link href="/game">
            <Button size="sm" className="font-display font-bold rounded-full px-5">
              開始任務 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </nav>
        <Link href="/game" className="md:hidden">
          <Button size="sm" className="font-display font-bold rounded-full">開始任務</Button>
        </Link>
      </div>
    </header>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: "yellow" | "pink" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${color === "yellow" ? "bg-amber-100 text-amber-800" : "bg-pink-100 text-pink-800"}`}>
      {label} +{value}
    </span>
  );
}

export default function Home() {
  const [stats, setStats] = useState<GymStats | null>(null);
  useEffect(() => { setStats(loadStats()); }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero：左文右卡 */}
      <section className="container grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center py-14 lg:py-20">
        <div>
          <p className="font-hand text-2xl text-primary mb-3">for campus learners — 學院型態專用</p>
          <h1 className="font-display font-extrabold text-4xl lg:text-5xl leading-[1.25] mb-5">
            別再硬背了，<br />
            把知識<span className="crayon-underline">貼進校園場景</span>、<br />
            <span className="crayon-underline-pink">綁上一段情緒</span>。
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl">
            結合 FluentAI 訓練體系中的「情境鉤子卡」與「情感故事卡」，
            我們把它做成一個 8 分鐘的校園記憶小任務：先把知識點掛進你熟悉的校園角落，
            再給它一個有情緒的迷你故事，最後關掉提示回想——記憶就這樣賴著不走了。
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/game">
              <Button size="lg" className="font-display font-bold text-base rounded-full px-8 h-12 active:scale-[0.97] transition-transform">
                <Sparkles className="w-5 h-5" /> 開始雙卡記憶任務
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> 約 8 分鐘 · 免登入 · 進度自動保存
            </span>
          </div>
          {stats && stats.completedRuns > 0 && (
            <div className="mt-6 inline-flex items-center gap-3 text-sm bg-secondary rounded-lg px-4 py-2 border border-border">
              <Stamp className="w-4 h-4 text-primary" />
              已完成 {stats.completedRuns} 次任務 · 最佳連擊 {stats.bestCombo}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="paper-card tilt-r relative overflow-hidden">
            <div className="washi" />
            <img src={HERO} alt="攤開的學習手帳桌面" className="w-full h-auto rounded-md" />
          </div>
          <div className="absolute -bottom-5 -left-4 sticky-note sticky-yellow-bg tilt-l px-4 py-3 max-w-[200px]">
            <p className="font-hand text-lg leading-snug text-amber-900">"把單字貼進<br/>你的早餐桌！"</p>
          </div>
          <div className="absolute -top-4 -right-3 sticky-note sticky-pink-bg tilt-r px-4 py-3 max-w-[190px] hidden sm:block">
            <p className="font-hand text-lg leading-snug text-pink-900">"給公式一點情緒，它就賴著不走了"</p>
          </div>
        </div>
      </section>

      {/* 痛點 */}
      <section id="problem" className="py-16 bg-[#F3ECDD]/60 border-y border-border">
        <div className="container">
          <p className="font-hand text-2xl text-primary mb-2">the academic struggle</p>
          <h2 className="font-display font-extrabold text-3xl mb-10">學院學習者的三個死循環</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "🔁", title: "背了就忘", desc: "考前狂抄十遍，三天後只記得自己抄過十遍。孤立的資訊沒有掛在任何場景上，大腦自然把它當垃圾清掉。", tilt: "tilt-l" },
              { emoji: "😶", title: "無感輸入", desc: "教科書的知識又平又乾，沒有情緒波動的內容，海馬迴根本懶得標記為「重要」。", tilt: "tilt-l2" },
              { emoji: "🙈", title: "假熟練", desc: "看著課本覺得都會，蓋起來就一片空白。從沒練過「關掉提示回想」，等於從沒真正提取過記憶。", tilt: "tilt-r" },
            ].map((p) => (
              <div key={p.title} className={`paper-card ${p.tilt} p-6`}>
                <div className="text-4xl mb-3">{p.emoji}</div>
                <h3 className="font-display font-bold text-xl mb-2">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 雙卡方法論 */}
      <section id="method" className="py-16">
        <div className="container">
          <p className="font-hand text-2xl text-primary mb-2">the two-card method</p>
          <h2 className="font-display font-extrabold text-3xl mb-3">雙卡解法：一張管場景，一張管情緒</h2>
          <p className="text-muted-foreground max-w-2xl mb-12">
            這兩張卡來自 FluentAI Learning Gym 的訓練卡庫。單獨用已經有效，
            疊在一起用——場景給記憶一個「地址」，情緒給記憶一個「重量」——效果加乘。
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* 情境鉤子卡 */}
            <div className="paper-card tilt-l relative p-0 overflow-hidden">
              <div className="washi washi-yellow" />
              <img src={CAMPUS} alt="手繪校園地圖插畫" className="w-full h-44 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <h3 className="font-display font-extrabold text-2xl">情境鉤子卡</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  把詞彙或概念放進一個<b>真實校園場景</b>——圖書館的還書箱、食堂的微波爐、宿舍上鋪的梯子。
                  知識點有了空間地址，之後路過那個角落，記憶就會自己跳出來。最後關掉提示回想，完成一次真正的提取練習。
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <StatBadge label="情境編碼" value={3} color="yellow" />
                  <StatBadge label="主動回想" value={2} color="yellow" />
                  <StatBadge label="即時輸出" value={1} color="yellow" />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 原版 7 分鐘 · 產生一段情境對話 + 一個可回想場景
                </p>
              </div>
            </div>

            {/* 情感故事卡 */}
            <div className="paper-card tilt-r relative p-0 overflow-hidden">
              <div className="washi washi-pink" />
              <img src={EMOTION} alt="心與腦以線相連的拼貼插畫" className="w-full h-44 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <h3 className="font-display font-extrabold text-2xl">情感故事卡</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  把新概念放進一個<b>有人物、情緒和反應</b>的迷你故事——驚訝、爆笑、尷尬、感動都行。
                  情緒是大腦的螢光筆：杏仁核一旦被觸動，就會通知海馬迴「這個要存檔」。越誇張、越有畫面，越難忘。
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <StatBadge label="故事綁定" value={3} color="pink" />
                  <StatBadge label="情境編碼" value={1} color="pink" />
                  <StatBadge label="即時輸出" value={2} color="pink" />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 原版 8 分鐘 · 產生一段故事 + 口說/文字複述
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 任務流程 */}
      <section id="flow" className="py-16 bg-[#F3ECDD]/60 border-y border-border">
        <div className="container">
          <p className="font-hand text-2xl text-primary mb-2">the mission flow</p>
          <h2 className="font-display font-extrabold text-3xl mb-12">雙卡記憶任務 · 四步走</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", icon: "🎒", title: "選學科包", desc: "挑官方練習包，或把你自己的單字表、筆記貼進來做成專屬卡包。", tilt: "tilt-l" },
              { n: "02", icon: "📍", title: "掛進場景", desc: "選一個校園角落，或自己寫一個熟悉的地方，把知識點「掛」上去。", tilt: "tilt-r" },
              { n: "03", icon: "�propos", title: "綁上情緒", desc: "為知識點選一種情緒，用模板編一句迷你故事，讓杏仁核幫你蓋「重要」章。", tilt: "tilt-l2" },
              { n: "04", icon: "🙈", title: "遮住回想", desc: "關掉所有提示，只靠場景與情緒線索回想。答對蓋章、連擊加分。", tilt: "tilt-r" },
            ].map((s, i) => (
              <div key={s.n} className={`paper-card ${s.tilt} p-6 relative`}>
                <span className="font-hand text-3xl text-primary/40 absolute top-4 right-5">{s.n}</span>
                <div className="text-3xl mb-3">{i === 2 ? "💗" : s.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <EyeOff className="w-4 h-4" /> 遊戲全程免登入，能力值與蓋章記錄保存在你的瀏覽器
            </div>
            <Link href="/game">
              <Button size="lg" className="font-display font-bold text-base rounded-full px-10 h-12 active:scale-[0.97] transition-transform">
                進入任務 <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="" className="w-6 h-6" />
            <span className="font-display font-bold text-foreground">記憶手帳社 MemoDesk</span>
          </div>
          <p>靈感來自 FluentAI Learning Gym 的情境鉤子卡 × 情感故事卡</p>
        </div>
      </footer>
    </div>
  );
}
