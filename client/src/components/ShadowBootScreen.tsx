/**
 * 設計風格提醒：MemoDesk「夜自習語音手帳」——米白紙底、teal 墨水、亮黃貼紙與社團章戳。
 * 3D 場景載入時維持真實進度回報與提示輪播；這是手帳翻到夜讀頁，不是獨立霓虹產品。
 */
import { useEffect, useRef, useState } from "react";
import { AudioLines, Headphones, Mic, Sparkles, Waves } from "lucide-react";

export type BootStageId = "chunk" | "webgl" | "voice" | "frame";

export const BOOT_STAGES: { id: BootStageId; label: string; weight: number }[] = [
  { id: "chunk", label: "翻開 3D 夜讀頁", weight: 0.4 },
  { id: "webgl", label: "擺好桌上練習卡", weight: 0.25 },
  { id: "voice", label: "準備朗讀提示", weight: 0.15 },
  { id: "frame", label: "同桌學伴就位", weight: 0.2 },
];

const TIPS: { icon: typeof Headphones; title: string; body: string }[] = [
  { icon: Headphones, title: "先聽完整句，別急著開口", body: "第一遍只抓「起伏」與「停頓」，不要逐字翻譯。母語者的節奏比單字更難模仿。" },
  { icon: Mic, title: "在尾音落下前就跟上", body: "延遲越短，音韻迴路的負荷越大，記憶痕跡也越深。落後半秒就變成朗讀了。" },
  { icon: Waves, title: "重音錯了比發音錯更難懂", body: "母語者靠重音位置辨識單字。把重音敲對，即使個別音素不標準也聽得懂。" },
  { icon: Sparkles, title: "遮稿複述才算真的會", body: "看著字唸只練了發音，遮住字幕還能說出來，才是把句子搬進長期記憶。" },
  { icon: AudioLines, title: "允許自己錄得很醜", body: "評分是回饋不是評價。前三次錄音本來就會破音、卡頓，那正是矯正的起點。" },
];

export default function ShadowBootScreen({ progress, stageLabel, done }: { progress: number; stageLabel: string; done: boolean }) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [tipKey, setTipKey] = useState(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduceMotion.current) return;
    const timer = window.setInterval(() => {
      setTipIndex((previous) => (previous + 1) % TIPS.length);
      setTipKey((previous) => previous + 1);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  const tip = TIPS[tipIndex];
  const TipIcon = tip.icon;
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
      <div className={`se-boot ${done ? "is-done" : ""}`} role="status" aria-live="polite" aria-label={`MemoDesk 夜自習頁載入中 ${percent}%`}>
      <div className="se-boot-grid" aria-hidden="true" />
      <div className="se-boot-inner">
        <div className="se-boot-badge" aria-hidden="true">
          <span className="se-boot-orb" />
          <AudioLines />
        </div>
        <p className="se-boot-kicker">記憶手帳社 MEMODESK · 夜自習語音頁</p>
        <h2 className="se-boot-title">正在把朗讀貼進你的夜讀手帳</h2>

        <div className="se-boot-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} />
          <em className="se-boot-sheen" />
        </div>
        <div className="se-boot-meta">
          <span>{stageLabel}</span>
          <b>{percent}%</b>
        </div>

        <ol className="se-boot-stages">
          {BOOT_STAGES.map((stage, index) => {
            const reached = BOOT_STAGES.slice(0, index + 1).reduce((sum, item) => sum + item.weight, 0);
            const state = progress >= reached - 0.001 ? "done" : stageLabel === stage.label ? "active" : "";
            return (
              <li key={stage.id} className={state}>
                <i aria-hidden="true" />
                {stage.label}
              </li>
            );
          })}
        </ol>

        <div className="se-boot-tip" key={tipKey}>
          <span className="se-boot-tip-icon" aria-hidden="true"><TipIcon /></span>
          <div>
            <b>{tip.title}</b>
            <p>{tip.body}</p>
          </div>
        </div>
        <div className="se-boot-dots" aria-hidden="true">
          {TIPS.map((item, index) => <i key={item.title} className={index === tipIndex ? "active" : ""} />)}
        </div>
      </div>
    </div>
  );
}
