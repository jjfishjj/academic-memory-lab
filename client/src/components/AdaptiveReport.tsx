/**
 * 設計風格提醒：MemoDesk 自適應訓練手帳頁。圖表是貼進桌面手帳的能力貼紙：米白紙、teal 墨水、
 * 亮黃索引籤與玫瑰粉回顧便條；保留資料可讀性，但不做通用 SaaS 儀表板。
 */
import { useMemo } from "react";
import { Activity, Gauge, TrendingDown, TrendingUp } from "lucide-react";

export type ReportGame = { id: string; icon: string; title: string; talent: string; color: string };
export type ReportLog = { game: string; correct: boolean; responseMs: number; difficulty: "easy" | "normal" | "hard"; at: string };
export type TrendPoint = { label: string; count: number; accuracy: number };

const DIFFICULTY_META: Record<ReportLog["difficulty"], { label: string; color: string; targetMs: number }> = {
  easy: { label: "初級", color: "#55aa83", targetMs: 6500 },
  normal: { label: "中級", color: "#efb94f", targetMs: 4500 },
  hard: { label: "高級", color: "#e0725f", targetMs: 3200 },
};

/** 依五玩法正確率算出雷達圖頂點座標（無資料時給 12% 底線，讓形狀不會塌成一點）。 */
function useRadar(games: ReportGame[], logs: ReportLog[], size: number) {
  return useMemo(() => {
    const center = size / 2;
    const radius = center - 34;
    const axes = games.map((game, index) => {
      const records = logs.filter((log) => log.game === game.id);
      const rate = records.length ? records.filter((log) => log.correct).length / records.length : 0;
      const value = records.length ? Math.max(0.12, rate) : 0.12;
      const angle = (Math.PI * 2 * index) / games.length - Math.PI / 2;
      return {
        game,
        rate,
        attempts: records.length,
        value,
        x: center + Math.cos(angle) * radius * value,
        y: center + Math.sin(angle) * radius * value,
        labelX: center + Math.cos(angle) * (radius + 20),
        labelY: center + Math.sin(angle) * (radius + 20),
        gridX: center + Math.cos(angle) * radius,
        gridY: center + Math.sin(angle) * radius,
      };
    });
    return { center, radius, axes };
  }, [games, logs, size]);
}

export default function AdaptiveReport({ games, logs, trend, accuracy, averageSeconds, difficulty }: {
  games: ReportGame[];
  logs: ReportLog[];
  trend: TrendPoint[];
  accuracy: number;
  averageSeconds: string;
  difficulty: ReportLog["difficulty"];
}) {
  const SIZE = 232;
  const { center, radius, axes } = useRadar(games, logs, SIZE);
  const hasData = logs.length > 0;
  const shape = axes.map((axis) => `${axis.x.toFixed(1)},${axis.y.toFixed(1)}`).join(" ");

  // 折線圖：正確率走勢疊在局數長條之上，共用同一組 7 天座標。
  const chartW = 640;
  const chartH = 150;
  const maxCount = Math.max(1, ...trend.map((day) => day.count));
  const points = trend.map((day, index) => ({
    ...day,
    x: 34 + (index * (chartW - 58)) / Math.max(1, trend.length - 1),
    y: chartH - 18 - (day.accuracy / 100) * (chartH - 42),
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)} ${chartH - 18} L${points[0].x.toFixed(1)} ${chartH - 18} Z`;

  // 反應時間：與當前難度的自適應目標比較，決定是「已達標」還是「還要再快」。
  const target = DIFFICULTY_META[difficulty].targetMs / 1000;
  const actual = Number(averageSeconds);
  const speedRatio = actual > 0 ? Math.min(1.6, actual / target) : 0;
  const fastEnough = actual > 0 && actual <= target;

  const difficultyMix = (Object.keys(DIFFICULTY_META) as ReportLog["difficulty"][]).map((level) => {
    const count = logs.filter((log) => log.difficulty === level).length;
    return { level, count, share: logs.length ? count / logs.length : 0, ...DIFFICULTY_META[level] };
  });

  const strongest = [...axes].filter((axis) => axis.attempts > 0).sort((a, b) => b.rate - a.rate)[0];
  const weakest = [...axes].filter((axis) => axis.attempts > 0).sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="mg-viz">
      <div className="mg-viz-radar">
        <div className="mg-viz-head">
          <small>能力貼紙地圖</small>
          <h3>五種記憶能力，哪一張最亮？</h3>
          <p>{hasData ? "面積越大，代表這張能力貼紙越穩；凹陷處就是本週最值得先翻的加強卡。" : "完成任一局訓練後，這張能力貼紙會依你的正確率慢慢長出形狀。"}</p>
        </div>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mg-radar-svg" role="img" aria-label="五種記憶能力正確率雷達圖">
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <polygon
              key={ring}
              className="mg-radar-ring"
              points={axes.map((axis, index) => {
                const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
                return `${center + Math.cos(angle) * radius * ring},${center + Math.sin(angle) * radius * ring}`;
              }).join(" ")}
            />
          ))}
          {axes.map((axis) => <line key={`spoke-${axis.game.id}`} className="mg-radar-spoke" x1={center} y1={center} x2={axis.gridX} y2={axis.gridY} />)}
          <polygon className={`mg-radar-shape ${hasData ? "" : "is-empty"}`} points={shape} />
          {axes.map((axis) => <circle key={`dot-${axis.game.id}`} className="mg-radar-dot" cx={axis.x} cy={axis.y} r={4} style={{ fill: axis.game.color }} />)}
          {axes.map((axis) => (
            <text key={`label-${axis.game.id}`} className="mg-radar-label" x={axis.labelX} y={axis.labelY} textAnchor="middle" dominantBaseline="middle">
              {axis.game.icon}
            </text>
          ))}
        </svg>
        <ul className="mg-radar-legend">
          {axes.map((axis) => (
            <li key={axis.game.id}>
              <i style={{ background: axis.game.color }} aria-hidden="true" />
              <b>{axis.game.title}</b>
              <em>{axis.attempts ? `${Math.round(axis.rate * 100)}%` : "未練"}</em>
              <span className="mg-radar-track"><s style={{ width: `${axis.attempts ? Math.max(4, axis.rate * 100) : 0}%`, background: axis.game.color }} /></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mg-viz-side">
        <div className="mg-viz-card">
          <div className="mg-viz-head">
            <small>七日進步紙條</small>
            <h3>答對率和練習量一起看</h3>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="mg-curve-svg" role="img" aria-label="七日正確率折線與訓練量長條圖">
            <defs>
              <linearGradient id="mgCurveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 50, 100].map((tick) => {
              const y = chartH - 18 - (tick / 100) * (chartH - 42);
              return <g key={tick}><line className="mg-curve-grid" x1={30} y1={y} x2={chartW - 12} y2={y} /><text className="mg-curve-tick" x={4} y={y + 3}>{tick}</text></g>;
            })}
            {points.map((point) => {
              const barH = (point.count / maxCount) * (chartH - 52);
              return <rect key={`bar-${point.label}`} className="mg-curve-bar" x={point.x - 9} y={chartH - 18 - barH} width={18} height={Math.max(0, barH)} rx={4} />;
            })}
            <path className="mg-curve-area" d={area} fill="url(#mgCurveFill)" />
            <path className="mg-curve-line" d={line} />
            {points.map((point) => (
              <g key={`pt-${point.label}`}>
                <circle className="mg-curve-dot" cx={point.x} cy={point.y} r={4} />
                <text className="mg-curve-x" x={point.x} y={chartH - 4} textAnchor="middle">{point.label}</text>
              </g>
            ))}
          </svg>
          <div className="mg-curve-legend">
            <span><i className="line" aria-hidden="true" />正確率 %</span>
            <span><i className="bar" aria-hidden="true" />當日局數（最高 {maxCount} 局）</span>
          </div>
        </div>

        <div className="mg-viz-card">
          <div className="mg-viz-head">
            <small>節奏便利貼</small>
            <h3>你的反應速度，離下一張卡多近？</h3>
          </div>
          <div className="mg-pace">
            <div className="mg-pace-bar">
              <span className="mg-pace-target" style={{ left: `${(1 / 1.6) * 100}%` }} aria-hidden="true"><b>目標 {target.toFixed(1)}s</b></span>
              <i className={fastEnough ? "is-good" : "is-slow"} style={{ width: `${Math.max(4, speedRatio / 1.6 * 100)}%` }} />
            </div>
            <div className="mg-pace-meta">
              <span className={fastEnough ? "good" : "slow"}>
                {fastEnough ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {hasData ? fastEnough ? `快於目標 ${(target - actual).toFixed(1)} 秒` : `再快 ${(actual - target).toFixed(1)} 秒就能升級` : "尚無資料"}
              </span>
              <b><Gauge size={15} /> 平均 {averageSeconds}s</b>
            </div>
          </div>
          <div className="mg-mix">
            <small>難度分布</small>
            <div className="mg-mix-bar" role="img" aria-label="訓練難度分布">
              {difficultyMix.map((item) => item.share > 0 && (
                <i key={item.level} style={{ width: `${item.share * 100}%`, background: item.color }} title={`${item.label} ${item.count} 局`} />
              ))}
              {!hasData && <i className="empty" style={{ width: "100%" }} />}
            </div>
            <ul>
              {difficultyMix.map((item) => (
                <li key={item.level}><i style={{ background: item.color }} aria-hidden="true" />{item.label}<em>{item.count}</em></li>
              ))}
            </ul>
          </div>
          <p className="mg-viz-note">
            <Activity size={15} />
            {hasData && strongest && weakest
              ? strongest.game.id === weakest.game.id
                ? `目前只練過「${strongest.game.title}」，多試其他玩法才看得出能力輪廓。`
                : `最穩：${strongest.game.talent}（${Math.round(strongest.rate * 100)}%）；最需補：${weakest.game.talent}（${Math.round(weakest.rate * 100)}%）。`
              : `整體正確率 ${accuracy}%，先完成幾局讓教練抓到你的節奏。`}
          </p>
        </div>
      </div>
    </div>
  );
}
