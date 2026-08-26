import { AlertTriangle, CheckCircle2, ChevronRight, RotateCcw, X } from "lucide-react";
import type { SpeechAssessment } from "@/lib/speechAssessment";

const SCORE_LABELS = ["節奏同步", "發音辨識", "流暢度", "內容準確"];

export default function ShadowAnalysisCard(props: { assessment: SpeechAssessment; scores: number[]; totalScore: number; modeName: string; primaryLabel: string; bossProgress?: string; onClose(): void; onRetry(): void; onContinue(): void }) {
  const { assessment, scores, totalScore } = props;
  return <section className="se-analysis-backdrop" role="dialog" aria-modal="true" aria-label="跟讀分析結果">
    <div className="se-analysis-card">
      <button className="se-analysis-close" onClick={props.onClose} aria-label="關閉分析"><X /></button>
      <div className="se-analysis-heading"><span className={assessment.failure ? "failure" : "success"}>{assessment.failure ? <AlertTriangle /> : <CheckCircle2 />}</span><div><small>{props.modeName}</small><h2>{assessment.failure ? "辨識未完成" : `本次得分 ${totalScore}`}</h2></div></div>
      {assessment.failure ? <div className="se-failure"><h3>{assessment.failure.title}</h3><p>{assessment.failure.detail}</p><ol>{assessment.failure.fixes.map((fix) => <li key={fix}>{fix}</li>)}</ol></div> : <>
        <div className="se-score-source"><span>{assessment.provider === "azure" ? "AZURE SPEECH · 音素級評分" : "瀏覽器備援評分"}</span>{assessment.provider === "azure" && <b>專業分析</b>}</div>
        <div className="se-analysis-scores">{SCORE_LABELS.map((label, index) => <div key={label}><span>{label}</span><strong>{scores[index]}</strong><i><em style={{ width: `${scores[index]}%` }} /></i></div>)}</div>
        <div className="se-word-analysis"><h3>逐字對照</h3><p className="se-word-legend"><span className="correct">正確</span><span className="substitute">疑似錯音</span><span className="missing">漏字／多字</span></p><div>{assessment.diff.map((token, index) => <span key={`${token.expected}-${token.actual}-${index}`} className={token.status}>{token.status === "substitute" ? `${token.expected} → ${token.actual}` : token.status === "missing" ? `− ${token.expected}` : token.status === "extra" ? `+ ${token.actual}` : token.expected}</span>)}</div></div>
        {assessment.phonemeWords?.length ? <div className="se-phoneme-analysis"><h3>音素、重音與語調</h3>{assessment.phonemeWords.map((word, index) => <div key={`${word.word}-${index}`}><b className={word.score < 60 ? "low" : ""}>{word.word}<small>{word.score}</small></b><p>{word.phonemes.map((phoneme, phonemeIndex) => <span key={`${phoneme.phoneme}-${phonemeIndex}`} className={phoneme.score < 60 ? "low" : phoneme.score < 80 ? "mid" : "high"}>/{phoneme.phoneme}/<small>{phoneme.score}</small></span>)}</p></div>)}</div> : null}
        <p className="se-analysis-feedback"><b>Coach Nova</b>{assessment.feedback}</p>{props.bossProgress && <p className="se-boss-progress">{props.bossProgress}</p>}
      </>}
      <div className="se-analysis-actions"><button className="se-secondary" onClick={props.onRetry}><RotateCcw /> 重新跟讀</button><button className="se-primary" onClick={assessment.failure ? props.onRetry : props.onContinue}>{assessment.failure ? "完成設定後重試" : props.primaryLabel}<ChevronRight /></button></div>
    </div>
  </section>;
}
