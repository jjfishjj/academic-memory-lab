import { ELEMENTS, type ElementItem } from "./elementData";

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

function distractors(target: ElementItem, field: "symbol" | "nameZh" | "number") {
  const nearby = ELEMENTS.filter(element => element.number !== target.number)
    .sort((a, b) => Math.abs(a.number - target.number) - Math.abs(b.number - target.number))
    .slice(0, 3);
  return nearby.map(element => String(element[field]));
}

function interleaveAnswer(answer: string, wrong: string[], seed: number) {
  const options = [...wrong];
  options.splice(seed % 4, 0, answer);
  return options;
}

export function buildElementGuideQuiz(sequence: ElementItem[]): ElementGuideQuestion[] {
  return evenlySample(sequence, Math.min(5, sequence.length)).map((element, index) => {
    const mode = index % 3;
    if (mode === 0) {
      return { id: `${element.number}-symbol`, prompt: `${element.nameZh}的元素符號是？`, options: interleaveAnswer(element.symbol, distractors(element, "symbol"), index), answer: element.symbol, explanation: `${element.nameZh}是原子序 ${element.number}，元素符號 ${element.symbol}。` };
    }
    if (mode === 1) {
      return { id: `${element.number}-name`, prompt: `元素符號 ${element.symbol} 代表哪個元素？`, options: interleaveAnswer(element.nameZh, distractors(element, "nameZh"), index), answer: element.nameZh, explanation: `${element.symbol} 代表${element.nameZh}（${element.nameEn}）。` };
    }
    return { id: `${element.number}-number`, prompt: `${element.symbol}（${element.nameZh}）的原子序是？`, options: interleaveAnswer(String(element.number), distractors(element, "number"), index), answer: String(element.number), explanation: `${element.symbol} 的原子序是 ${element.number}。` };
  });
}
