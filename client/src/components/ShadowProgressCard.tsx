import { TrendingUp } from "lucide-react";
import { shadowProgressSummary, type ShadowProgress } from "@/lib/shadowEchoProgress";

export default function ShadowProgressCard({ progress }: { progress: ShadowProgress }) {
  const summary = shadowProgressSummary(progress);
  const points = summary.recentScores.map((score, index) => `${summary.recentScores.length === 1 ? 50 : index * 100 / (summary.recentScores.length - 1)},${100 - score}`).join(" ");
  return <section className="se-progress-card" aria-label="學習進步曲線">
    <div><span><TrendingUp />學習趨勢</span><b>{summary.average || "—"}<small>近 10 次平均</small></b></div>
    {summary.recentScores.length ? <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`最近分數：${summary.recentScores.join("、")}`}><line x1="0" y1="40" x2="100" y2="40" /><line x1="0" y1="70" x2="100" y2="70" /><polyline points={points} /></svg> : <p>完成第一次跟讀後，這裡會顯示進步曲線。</p>}
    <footer><span>累積 {summary.attempts} 次</span><span className={summary.improvement >= 0 ? "up" : "down"}>{summary.improvement >= 0 ? "+" : ""}{summary.improvement} 分</span></footer>
    {summary.commonIssues.length > 0 && <div className="se-common-issues"><small>常錯音</small>{summary.commonIssues.map(([issue, count]) => <span key={issue}>{issue}<b>{count}</b></span>)}</div>}
  </section>;
}
