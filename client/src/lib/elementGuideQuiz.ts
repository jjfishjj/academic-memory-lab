import { CATEGORY_STYLE, ELEMENTS, type ElementItem } from "./elementData";
import { getElementMemoryTip } from "./elementMemoryTips";

export type ElementGuideQuizDifficulty = "simple" | "advanced" | "confusion";

export const ELEMENT_GUIDE_DIFFICULTIES: Record<ElementGuideQuizDifficulty, { label: string; description: string }> = {
  simple: { label: "簡單", description: "辨認名稱、符號與原子序" },
  advanced: { label: "進階", description: "加入週期、族、分類與英文名" },
  confusion: { label: "易混淆", description: "從相近符號與錯誤配對中辨認" },
};

export interface ElementGuideQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

function evenlySample(items: ElementItem[], count: number) {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, index) => items[Math.round(index * (items.length - 1) / (count - 1))]);
}

function nearbyElements(target: ElementItem) {
  return ELEMENTS.filter(element => element.number !== target.number)
    .sort((a, b) => Math.abs(a.number - target.number) - Math.abs(b.number - target.number));
}

function wrongValues(target: ElementItem, project: (element: ElementItem) => string) {
  return Array.from(new Set(nearbyElements(target).map(project))).slice(0, 3);
}

function interleaveAnswer(answer: string, wrong: string[], seed: number) {
  const uniqueWrong = Array.from(new Set(wrong.filter(option => option !== answer))).slice(0, 3);
  const options = [...uniqueWrong];
  options.splice(seed % (options.length + 1), 0, answer);
  return options;
}

function simpleQuestion(element: ElementItem, index: number): ElementGuideQuestion {
  const mode = index % 3;
  if (mode === 0) {
    return { id: `${element.number}-simple-symbol`, prompt: `${element.nameZh}的元素符號是？`, options: interleaveAnswer(element.symbol, wrongValues(element, item => item.symbol), index), answer: element.symbol, explanation: `${element.nameZh}是原子序 ${element.number}，元素符號 ${element.symbol}。` };
  }
  if (mode === 1) {
    return { id: `${element.number}-simple-name`, prompt: `元素符號 ${element.symbol} 代表哪個元素？`, options: interleaveAnswer(element.nameZh, wrongValues(element, item => item.nameZh), index), answer: element.nameZh, explanation: `${element.symbol} 代表${element.nameZh}（${element.nameEn}）。` };
  }
  return { id: `${element.number}-simple-number`, prompt: `${element.symbol}（${element.nameZh}）的原子序是？`, options: interleaveAnswer(String(element.number), wrongValues(element, item => String(item.number)), index), answer: String(element.number), explanation: `${element.symbol} 的原子序是 ${element.number}。` };
}

function advancedQuestion(element: ElementItem, index: number): ElementGuideQuestion {
  const mode = index % 5;
  if (mode === 0) {
    const answer = `第 ${element.period} 週期`;
    return { id: `${element.number}-advanced-period`, prompt: `${element.symbol}（${element.nameZh}）位於哪一個週期？`, options: interleaveAnswer(answer, [1, 2, 3, 4, 5, 6, 7].map(value => `第 ${value} 週期`), index), answer, explanation: `${element.nameZh}位於第 ${element.period} 週期。` };
  }
  if (mode === 1) {
    const answer = element.group ? `第 ${element.group} 族` : "內過渡元素";
    return { id: `${element.number}-advanced-group`, prompt: `${element.nameZh}在週期表的族別是？`, options: interleaveAnswer(answer, wrongValues(element, item => item.group ? `第 ${item.group} 族` : "內過渡元素"), index), answer, explanation: element.group ? `${element.nameZh}位於第 ${element.group} 族。` : `${element.nameZh}屬於週期表下方的內過渡元素。` };
  }
  if (mode === 2) {
    return { id: `${element.number}-advanced-english`, prompt: `${element.nameZh}的英文名稱是？`, options: interleaveAnswer(element.nameEn, wrongValues(element, item => item.nameEn), index), answer: element.nameEn, explanation: `${element.nameZh}的英文名稱是 ${element.nameEn}。` };
  }
  if (mode === 3) {
    const answer = CATEGORY_STYLE[element.category].label;
    const categories = Array.from(new Set(Object.values(CATEGORY_STYLE).map(item => item.label)));
    return { id: `${element.number}-advanced-category`, prompt: `${element.symbol}（${element.nameZh}）屬於哪一類元素？`, options: interleaveAnswer(answer, categories, index), answer, explanation: `${element.nameZh}的分類是${answer}。` };
  }
  const answer = `${element.symbol} · ${element.nameZh}`;
  return { id: `${element.number}-advanced-number`, prompt: `原子序 ${element.number} 對應哪個元素？`, options: interleaveAnswer(answer, wrongValues(element, item => `${item.symbol} · ${item.nameZh}`), index), answer, explanation: `原子序 ${element.number} 是 ${element.symbol}（${element.nameZh}）。` };
}

function confusionQuestion(element: ElementItem, index: number): ElementGuideQuestion {
  const answer = `${element.symbol}＝${element.nameZh}，原子序 ${element.number}`;
  const wrong = nearbyElements(element).slice(0, 3).map((item, wrongIndex) => wrongIndex % 2 === 0
    ? `${element.symbol}＝${item.nameZh}，原子序 ${item.number}`
    : `${item.symbol}＝${element.nameZh}，原子序 ${item.number}`);
  return {
    id: `${element.number}-confusion-pair`,
    prompt: `哪個選項能正確分辨 ${element.symbol}？`,
    options: interleaveAnswer(answer, wrong, index),
    answer,
    explanation: getElementMemoryTip(element.number)?.confusion ?? `${element.symbol} 是${element.nameZh}，原子序 ${element.number}。`,
  };
}

export function buildElementGuideQuiz(sequence: ElementItem[], difficulty: ElementGuideQuizDifficulty = "simple"): ElementGuideQuestion[] {
  return evenlySample(sequence, Math.min(5, sequence.length)).map((element, index) => {
    if (difficulty === "advanced") return advancedQuestion(element, index);
    if (difficulty === "confusion") return confusionQuestion(element, index);
    return simpleQuestion(element, index);
  });
}
