import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, ChevronLeft, Cloud, LogOut, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  isSupabaseConfigured,
  previewCloudLearningSync,
  resolveCloudGuideConflict,
  supabase,
  syncLearningData,
  type CloudGuideResolution,
  type CloudLearningPreview,
} from "@/lib/supabase";

function routeLabel(key: string) {
  const [type, value] = key.split("-");
  return type === "period" ? `第 ${value} 週期` : `第 ${value} 族`;
}

function progressLabel(progress: { completions: number; bestQuizScore: number } | undefined) {
  return progress ? `完成 ${progress.completions} 次 · 最佳 ${progress.bestQuizScore}/5` : "沒有紀錄";
}

export default function CloudSyncPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<CloudLearningPreview | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => data.subscription.unsubscribe();
  }, []);
  const magicLink = async () => {
    if (!supabase || !email) return;
    setBusy(true);
    const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${appBase}/train/mrt/sync`,
      },
    });
    setMessage(error ? error.message : "登入連結已寄出，請到信箱完成登入。");
    setBusy(false);
  };
  const sync = async () => {
    setBusy(true);
    try {
      const cloudPreview = await previewCloudLearningSync();
      if (cloudPreview.remoteExists && cloudPreview.guideDifferences.length > 0) {
        setPreview(cloudPreview);
        setMessage(`發現 ${cloudPreview.guideDifferences.length} 條導覽路線不同，請先選擇處理方式。`);
        return;
      }
      const result = await syncLearningData();
      setMessage(
        result === "uploaded"
          ? "本機進度已上傳。"
          : result === "downloaded"
            ? "已下載較新的雲端進度，重新整理後生效。"
            : "本機與雲端已一致。"
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "同步失敗");
    } finally {
      setBusy(false);
    }
  };
  const resolveConflict = async (resolution: CloudGuideResolution) => {
    if (!preview) return;
    setBusy(true);
    try {
      await resolveCloudGuideConflict(preview, resolution);
      setPreview(null);
      setMessage(resolution === "merge" ? "已合併兩邊的完成次數、最新日期與最佳分數。" : resolution === "local" ? "已保留本機導覽進度並更新雲端。" : "已採用雲端導覽進度並更新本機。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "衝突處理失敗");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="container max-w-2xl py-8">
      <Link
        href="/memory"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
        我的記憶庫
      </Link>
      <Cloud className="w-14 h-14 text-primary mt-8" />
      <h1 className="font-display font-extrabold text-3xl mt-4">
        Supabase 雲端同步
      </h1>
      <p className="text-muted-foreground mt-2">
        同步自訂記憶主題、元素熟練度、天賦 XP、每日紀錄與其他 MemoDesk 學習資料。
      </p>
      {!isSupabaseConfigured ? (
        <div className="paper-card bg-amber-50 p-6 mt-6">
          <strong>尚未連接 Supabase 專案</strong>
          <p className="text-sm text-muted-foreground mt-2">
            複製 `.env.example` 為 `.env`，填入 Project URL 與 anon key，再執行
            migration SQL。
          </p>
        </div>
      ) : !user ? (
        <div className="paper-card p-6 mt-6">
          <label className="font-bold">Email Magic Link 登入</label>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full border rounded-xl px-4 py-3 mt-3"
          />
          <Button
            disabled={busy || !email}
            onClick={magicLink}
            className="rounded-full mt-4"
          >
            寄送登入連結
          </Button>
        </div>
      ) : (
        <div className="paper-card p-6 mt-6">
          <p className="text-sm text-muted-foreground">已登入</p>
          <strong>{user.email}</strong>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button disabled={busy} onClick={sync} className="rounded-full">
              <RefreshCw className="w-4 h-4" />
              立即同步
            </Button>
            <Button
              variant="outline"
              onClick={() => supabase?.auth.signOut()}
              className="rounded-full"
            >
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      )}
      {user && preview && (
        <section className="paper-card mt-5 overflow-hidden border-2 border-violet-200" aria-label="導覽進度差異預覽">
          <div className="bg-violet-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-violet-700">sync conflict preview</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">導覽進度有 {preview.guideDifferences.length} 項不同</h2>
            <p className="mt-2 text-sm text-muted-foreground">先比較本機與雲端，再決定這次同步方式。合併會保留兩邊路線，並取較高完成次數、較高分數與較新日期。</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white p-2"><span className="text-muted-foreground">本機更新</span><b className="mt-1 block">{new Date(preview.localUpdatedAt).toLocaleString("zh-TW")}</b></div><div className="rounded-lg bg-white p-2"><span className="text-muted-foreground">雲端更新</span><b className="mt-1 block">{preview.remoteUpdatedAt ? new Date(preview.remoteUpdatedAt).toLocaleString("zh-TW") : "尚無資料"}</b></div></div>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto p-4" aria-label="不同的導覽路線">
            {preview.guideDifferences.map(difference => <article key={difference.key} className="rounded-xl border bg-white p-3"><div className="flex items-center justify-between gap-2"><b>{routeLabel(difference.key)}</b><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold">{difference.kind === "different" ? "兩邊不同" : difference.kind === "local-only" ? "只有本機" : "只有雲端"}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-amber-50 p-2"><span className="text-amber-800">本機</span><p className="mt-1 font-bold">{progressLabel(difference.local)}</p></div><div className="rounded-lg bg-sky-50 p-2"><span className="text-sky-800">雲端</span><p className="mt-1 font-bold">{progressLabel(difference.cloud)}</p></div></div></article>)}
          </div>
          <div className="border-t bg-slate-50 p-4"><div className="grid gap-2 sm:grid-cols-3"><Button variant="outline" disabled={busy} onClick={()=>resolveConflict("local")}>保留本機</Button><Button disabled={busy} onClick={()=>resolveConflict("merge")}><CheckCircle2/>合併最佳紀錄</Button><Button variant="outline" disabled={busy} onClick={()=>resolveConflict("cloud")}>採用雲端</Button></div><button type="button" disabled={busy} onClick={()=>{setPreview(null);setMessage("尚未同步，資料維持原狀。");}} className="mt-3 w-full text-xs font-bold text-muted-foreground underline">稍後再決定</button></div>
        </section>
      )}
      {message && (
        <p className="mt-5 font-bold text-primary" aria-live="polite">
          {message}
        </p>
      )}
    </main>
  );
}
