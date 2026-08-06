import type { TalentType, VarkType } from "./memoryProfile";

type Option = { label: string; talent: TalentType; vark: VarkType };
export type TalentQuestion = { title: string; options: Option[] };
const option = (label: string, talent: TalentType, vark: VarkType): Option => ({ label, talent, vark });
export const TALENT_QUESTIONS: TalentQuestion[] = [
  { title: "第一次遇到一串新站名，你最自然會怎麼記？", options: [option("畫成彩色路線圖", "visualBuilder", "visual"), option("聽報站並跟讀", "soundMimic", "auditory"), option("寫站碼站名表", "textOrganizer", "readWrite"), option("手指沿線操作", "actionContext", "kinesthetic")] },
  { title: "哪種練習最容易讓你持續？", options: [option("和別人互相出題", "socialOutput", "auditory"), option("每天短練並看數據", "systemAccumulator", "readWrite"), option("串成荒謬故事", "creativeConnector", "visual"), option("完成限時導航任務", "businessApplier", "kinesthetic")] },
  { title: "遇到轉乘站時，你想先做什麼？", options: [option("看兩條線交叉位置", "visualBuilder", "visual"), option("朗讀兩個站碼", "soundMimic", "auditory"), option("整理轉乘對照表", "textOrganizer", "readWrite"), option("模擬實際換車", "actionContext", "kinesthetic")] },
  { title: "背過卻忘記時，通常缺少什麼？", options: [option("同伴追問", "socialOutput", "auditory"), option("固定複習時間", "systemAccumulator", "readWrite"), option("有趣的聯想", "creativeConnector", "visual"), option("明確使用目標", "businessApplier", "kinesthetic")] },
  { title: "你希望系統怎麼糾正錯站？", options: [option("用顏色標出差異", "visualBuilder", "visual"), option("播放正確報站", "soundMimic", "auditory"), option("列出前後站規則", "textOrganizer", "readWrite"), option("立刻重走一次", "actionContext", "kinesthetic")] },
  { title: "最能持續的複習節奏？", options: [option("和朋友每天互問", "socialOutput", "auditory"), option("1、3、7、14 天排程", "systemAccumulator", "readWrite"), option("每次換不同故事", "creativeConnector", "visual"), option("有考核才集中挑戰", "businessApplier", "kinesthetic")] },
  { title: "路線規則最好變成什麼？", options: [option("一張圖", "visualBuilder", "visual"), option("一句節奏口訣", "soundMimic", "auditory"), option("清楚分類表", "textOrganizer", "readWrite"), option("需要完成的任務", "actionContext", "kinesthetic")] },
  { title: "哪種輸出最有成就感？", options: [option("教別人搭車", "socialOutput", "auditory"), option("連續打卡達標", "systemAccumulator", "readWrite"), option("畫出自己的路網", "creativeConnector", "visual"), option("限時完成全網挑戰", "businessApplier", "kinesthetic")] },
  { title: "你最常卡在哪裡？", options: [option("看圖仍找不到位置", "visualBuilder", "visual"), option("聽過但說不出來", "soundMimic", "auditory"), option("站碼規則混在一起", "textOrganizer", "readWrite"), option("知道答案卻反應太慢", "actionContext", "kinesthetic")] },
  { title: "要記住 BL07 板橋，你會？", options: [option("想像藍色七號橋", "creativeConnector", "visual"), option("唸 BL 七、板橋去", "soundMimic", "auditory"), option("寫進藍線表格", "systemAccumulator", "readWrite"), option("做雙手搭橋動作", "actionContext", "kinesthetic")] },
  { title: "你最想解鎖哪個功能？", options: [option("路線視覺地圖", "visualBuilder", "visual"), option("真人陪練報站", "socialOutput", "auditory"), option("完整分析報告", "textOrganizer", "readWrite"), option("全網站務員挑戰", "businessApplier", "kinesthetic")] },
  { title: "30 天後最想達到？", options: [option("腦中有完整路網", "creativeConnector", "visual"), option("聽站名立即反應", "soundMimic", "auditory"), option("養成穩定複習習慣", "systemAccumulator", "readWrite"), option("能替別人規劃路線", "socialOutput", "kinesthetic")] },
];

export function scoreTalentQuiz(answers: number[]) { const talents = {} as Record<TalentType, number>; const varks = {} as Record<VarkType, number>; TALENT_QUESTIONS.forEach((question, index) => { const answer = question.options[answers[index]]; if (!answer) return; talents[answer.talent] = (talents[answer.talent] ?? 0) + 1; varks[answer.vark] = (varks[answer.vark] ?? 0) + 1; }); const ranked = Object.entries(talents).sort((a, b) => b[1] - a[1]) as Array<[TalentType, number]>; const vark = (Object.entries(varks).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "visual") as VarkType; return { primaryTalent: ranked[0]?.[0] ?? "visualBuilder", secondaryTalent: ranked[1]?.[0] ?? "systemAccumulator", vark, talents, varks }; }
