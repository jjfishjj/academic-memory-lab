import { useState } from "react";
import {
  HeartHandshake,
  MessageCircle,
  ScrollText,
  Sparkles,
} from "lucide-react";

export type StoryState = {
  chapter: number;
  route: string;
  relations: Record<string, number>;
  flags: string[];
  ending: string;
};
const initial: StoryState = {
  chapter: 0,
  route: "neutral",
  relations: { taipei: 10, paris: 0, tokyo: 0 },
  flags: [],
  ending: "",
};
export function loadRallyStory(): StoryState {
  try {
    return {
      ...initial,
      ...JSON.parse(localStorage.getItem("memgenius-rally-story") || "{}"),
    };
  } catch {
    return initial;
  }
}
const scenes = [
  {
    speaker: "林若晴",
    role: "青年外交官",
    text: "三國都想優先取得同一批救援設備。臺北希望先救人口密集區，巴黎重視文化資產，東京則要求資料透明。你怎麼開場？",
    choices: [
      {
        text: "先讓三方說明最害怕失去什麼",
        route: "empathy",
        rel: { taipei: 8, paris: 8, tokyo: 8 },
        flag: "heard-all",
        result: "你將立場翻成需求，會議室第一次安靜下來。",
      },
      {
        text: "直接採用人口數作為唯一標準",
        route: "efficiency",
        rel: { taipei: 12, paris: -5, tokyo: 1 },
        flag: "population-rule",
        result: "臺北支持你，但巴黎代表認為文化損失被忽略。",
      },
      {
        text: "要求技術最強的一方統籌",
        route: "power",
        rel: { taipei: -3, paris: -3, tokyo: 14 },
        flag: "tech-lead",
        result: "東京迅速接手，但其他代表開始懷疑程序公平。",
      },
    ],
  },
  {
    speaker: "Camille Roux",
    role: "文化通譯官",
    text: "草案中的『必要資訊公開』在三種語言裡範圍不同。截止時間只剩十分鐘。",
    choices: [
      {
        text: "暫停表決，逐項建立三語定義表",
        route: "precision",
        rel: { taipei: 4, paris: 12, tokyo: 6 },
        flag: "glossary",
        result: "速度變慢了，但所有人終於在同一份定義上簽名。",
      },
      {
        text: "保留模糊文字，讓各國自行解釋",
        route: "flexible",
        rel: { taipei: 1, paris: -8, tokyo: -3 },
        flag: "ambiguity",
        result: "協議準時發布，法律團隊卻立刻發出風險警告。",
      },
    ],
  },
  {
    speaker: "水城 凛",
    role: "國際協調官",
    text: "最後一刻，匿名消息指出某國可能隱藏災情資料。你要公開指控嗎？",
    choices: [
      {
        text: "私下驗證來源，再設共同稽核機制",
        route: "trust",
        rel: { taipei: 7, paris: 7, tokyo: 10 },
        flag: "verified",
        result: "你沒有放任疑慮，也沒有讓未證實消息摧毀互信。",
      },
      {
        text: "立即公開消息施加壓力",
        route: "pressure",
        rel: { taipei: -7, paris: 2, tokyo: -5 },
        flag: "public-claim",
        result: "媒體迅速跟進，談判桌上的信任卻開始崩解。",
      },
    ],
  },
];
export default function WorldRallyStory({
  state,
  onChange,
}: {
  state: StoryState;
  onChange: (s: StoryState) => void;
}) {
  const [open, setOpen] = useState(false),
    [result, setResult] = useState("");
  const scene = scenes[Math.min(state.chapter, scenes.length - 1)];
  function choose(index: number) {
    const c = scene.choices[index],
      relations = { ...state.relations };
    Object.entries(c.rel).forEach(
      ([k, v]) => (relations[k] = (relations[k] || 0) + v)
    );
    const chapter = state.chapter + 1;
    let ending = "";
    if (chapter >= scenes.length) {
      const total = Object.values(relations).reduce((a, b) => a + b, 0);
      ending =
        state.flags.includes("heard-all") && c.flag === "verified"
          ? "萬國共感盟約"
          : total >= 45
            ? "穩健多邊秩序"
            : "脆弱的速度協定";
    }
    const next = {
      chapter,
      route: c.route,
      relations,
      flags: [...state.flags, c.flag],
      ending,
    };
    localStorage.setItem("memgenius-rally-story", JSON.stringify(next));
    onChange(next);
    setResult(c.result);
  }
  function reset() {
    localStorage.removeItem("memgenius-rally-story");
    onChange(initial);
    setResult("");
  }
  return (
    <div className="wr-story">
      <button onClick={() => setOpen(v => !v)}>
        <ScrollText />
        <span>
          <b>主線劇情・萬國救援協定</b>
          <small>
            {state.ending
              ? `結局：${state.ending}`
              : `章節 ${Math.min(state.chapter + 1, 3)} / 3・分支 ${state.route}`}
          </small>
        </span>
      </button>
      {open && (
        <div className="wr-story-panel">
          {state.ending ? (
            <div className="wr-ending">
              <Sparkles />
              <small>MULTI-END STORY</small>
              <h2>{state.ending}</h2>
              <p>
                你的外交判斷已改變三國關係。臺北 {state.relations.taipei}・巴黎{" "}
                {state.relations.paris}・東京 {state.relations.tokyo}
              </p>
              <button onClick={reset}>重新體驗其他結局</button>
            </div>
          ) : (
            <>
              <div className="wr-speaker">
                <span>{scene.speaker.slice(0, 1)}</span>
                <div>
                  <small>{scene.role}</small>
                  <b>{scene.speaker}</b>
                </div>
                <div>
                  <HeartHandshake />
                  <small>三國關係</small>
                  <b>
                    {Object.values(state.relations).reduce((a, b) => a + b, 0)}
                  </b>
                </div>
              </div>
              <p className="wr-story-text">
                <MessageCircle />「{scene.text}」
              </p>
              <div className="wr-story-choices">
                {scene.choices.map((c, i) => (
                  <button key={c.text} onClick={() => choose(i)}>
                    <i>{String.fromCharCode(65 + i)}</i>
                    {c.text}
                  </button>
                ))}
              </div>
              {result && <p className="wr-story-result">判斷結果：{result}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
