/**
 * 風格備忘：手帳拼貼學院 — 訓練模板共用頁殼
 * 頂欄 + 索引標籤步驟指示，保持與雙卡任務一致的手帳操作感
 */
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/contexts/ThemeContext";
import { isSfxOn, subscribeSfx, toggleSfx } from "@/lib/sfx";

const LOGO = `${import.meta.env.BASE_URL}assets/memodesk-logo_c083e7cf.png`;

interface Step { id: string; label: string }

interface Props {
  title: string;
  steps: Step[];
  stepIndex: number;
  /** 每個步驟索引標籤的顏色 class（依模板主題色） */
  stepColor: (stepId: string) => string;
  badge?: string; // 右上角小字（例如 combo 或計數）
  children: React.ReactNode;
}

export default function TrainShell({ title, steps, stepIndex, stepColor, badge, children }: Props) {
  const progress = (stepIndex / (steps.length - 1)) * 100;
  const { theme, toggleTheme } = useTheme();
  const [sfxOn, setSfxOn] = useState(isSfxOn);
  useEffect(() => {
    const unsubscribe = subscribeSfx(setSfxOn);
    return () => { unsubscribe(); };
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-[#FAF6EE]/90 backdrop-blur-md transition-colors dark:bg-[#17130F]/90">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> 回首頁
          </Link>
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="" className="w-6 h-6" />
            <span className="hidden font-display font-bold text-sm sm:inline">記憶手帳社 · {title}</span>
            <span className="font-display font-bold text-xs sm:hidden">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-hand text-lg text-primary sm:inline">{badge ?? ""}</span>
            <button type="button" onClick={() => toggleSfx()}
              aria-label={sfxOn ? "關閉音效提示" : "開啟音效提示"}
              title={sfxOn ? "音效：開（點一下靜音）" : "音效：靜音（點一下開啟）"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {sfxOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-60" />}
            </button>
            {toggleTheme && (
              <button type="button" onClick={toggleTheme}
                aria-label={theme === "dark" ? "切換為淺色模式" : "切換為深色模式"}
                title={theme === "dark" ? "切換為淺色模式" : "切換為深色模式"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <div className="container pt-6">
        <div className="flex flex-wrap items-end gap-1.5 text-xs font-bold">
          {steps.map((s, i) => (
            <span key={s.id}
              className={`px-3.5 pt-1.5 rounded-t-lg border border-b-0 border-border/70 transition-all ${stepColor(s.id)} ${i === stepIndex ? "pb-2.5 shadow-sm -translate-y-0.5" : i < stepIndex ? "pb-1 opacity-80" : "pb-1 opacity-45"}`}
              style={{ transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)` }}>
              {i < stepIndex ? "✓ " : ""}{s.label}
            </span>
          ))}
        </div>
        <div className="border-b-2 border-dashed border-border -mx-1" />
      </div>

      <main className="container flex-1 py-8 max-w-4xl notebook-lines">{children}</main>
    </div>
  );
}
