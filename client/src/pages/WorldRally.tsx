import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  ArrowLeft,
  BrainCircuit,
  Building2,
  CalendarCheck,
  ChevronRight,
  Coins,
  Flag,
  Gauge,
  Gift,
  Globe2,
  Languages,
  LockKeyhole,
  Map,
  MessageCircle,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Swords,
  Volume2,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import WorldRallyOnline from "@/components/WorldRallyOnline";
import WorldRallyStory, {
  loadRallyStory,
  type StoryState,
} from "@/components/WorldRallyStory";
import { startRallyRace, type RallyRun } from "@/lib/rallyCloud";
import "./WorldRally.css";

type MapId = "taipei" | "paris" | "tokyo";
type Phase = "lobby" | "race" | "quiz" | "boss" | "finish";
type ItemId = "turbo" | "shield" | "echo";
type Difficulty = "review" | "standard" | "challenge";
type QuestionType = "listening" | "translation" | "cloze" | "diplomacy" | "confusable";
type RallyQuestion = {
  id: string;
  type: QuestionType;
  phrase: string;
  prompt: string;
  answers: string[];
  memory: string;
};
type LearningProfile = Record<
  MapId,
  {
    level: number;
    streak: number;
    total: number;
    correct: number;
    avgMs: number;
    wrongIds: Record<string, number>;
    recent: { correct: boolean; responseMs: number; type: QuestionType; at: string }[];
  }
>;
type QuizResult = {
  correct: boolean;
  responseMs: number;
  difficulty: Difficulty;
};
type Controls = {
  left: boolean;
  right: boolean;
  boost: boolean;
  drift: boolean;
};
type Profile = {
  reputation: number;
  points: number;
  mountXp: number;
  unlocked: number;
  wins: number;
  talents: Record<string, number>;
  coins: number;
  owned: string[];
  dailyClaim: string;
  nations: Record<MapId, number>;
};

const maps = [
  {
    id: "taipei" as MapId,
    flag: "🇹🇼",
    city: "臺北",
    course: "星燈港灣線",
    color: "#25c9a8",
    sky: "#071e31",
    road: "#16465a",
    boss: "林若晴・青年外交官",
    mission: "協調城市韌性共同宣言",
    scenery: "港灣燈塔・山稜天際線",
  },
  {
    id: "paris" as MapId,
    flag: "🇫🇷",
    city: "巴黎",
    course: "光橋使館線",
    color: "#5ca8ff",
    sky: "#10162f",
    road: "#25385d",
    boss: "Camille Roux・文化通譯官",
    mission: "化解文化資產條款歧義",
    scenery: "金色橋燈・使館大道",
  },
  {
    id: "tokyo" as MapId,
    flag: "🇯🇵",
    city: "東京",
    course: "千燈未來線",
    color: "#ff719b",
    sky: "#210d2c",
    road: "#3b2849",
    boss: "水城 凛・國際協調官",
    mission: "完成科技倫理多邊協定",
    scenery: "鳥居光門・霓虹高架",
  },
];
const racers = [
  { flag: "🇹🇼", name: "林若晴", role: "外交官", color: "#25c9a8" },
  { flag: "🇫🇷", name: "Camille", role: "通譯官", color: "#5ca8ff" },
  { flag: "🇯🇵", name: "水城 凛", role: "協調官", color: "#ff719b" },
];
const jobs = [
  { icon: "🕊️", name: "外交官", bonus: "盟譽 +15%" },
  { icon: "🎧", name: "通譯官", bonus: "答錯保留護盾" },
  { icon: "🧭", name: "國際協調官", bonus: "道具時間 +20%" },
];
const gear = [
  { icon: "📜", name: "共識卷軸", stat: "談判力 +8" },
  { icon: "🎙️", name: "即時譯語器", stat: "語感 +8" },
  { icon: "🧿", name: "回憶羅盤", stat: "記憶力 +8" },
];
const talents = [
  "圖像建構",
  "文字整理",
  "聲音韻律",
  "情境行動",
  "創意連結",
  "系統累積",
  "空間導航",
  "情緒共鳴",
];
const talentEffects: Record<string, string> = {
  圖像建構: "顯示語意圖像提示",
  文字整理: "移除一個錯誤選項",
  聲音韻律: "答題渦輪 +2 秒",
  情境行動: "碰撞恢復加快",
  創意連結: "道具效果 +25%",
  系統累積: "每日任務金幣 +20%",
  空間導航: "漂移蓄能 +30%",
  情緒共鳴: "起跑時獲得文化護盾",
};
const townData: Record<
  MapId,
  {
    name: string;
    npcs: { icon: string; name: string; role: string; line: string }[];
  }
> = {
  taipei: {
    name: "星燈外交港",
    npcs: [
      {
        icon: "🧑🏻‍💼",
        name: "周映辰",
        role: "外交官公會導師",
        line: "先理解對方害怕失去什麼，才找得到共同利益。",
      },
      {
        icon: "👩🏻‍🔧",
        name: "阿岑",
        role: "風行獸培育師",
        line: "羈絆不是速度數字，是牠在彎道願不願意相信你。",
      },
    ],
  },
  paris: {
    name: "光橋使館區",
    npcs: [
      {
        icon: "👩🏼‍⚖️",
        name: "Élodie",
        role: "文化法務顧問",
        line: "一個詞在法律與日常語境裡，可能是兩份不同的條約。",
      },
      {
        icon: "🧑🏽‍🍳",
        name: "Marcel",
        role: "補給商會代表",
        line: "外交和料理一樣，比例不對，再好的材料也會衝突。",
      },
    ],
  },
  tokyo: {
    name: "千燈國際都",
    npcs: [
      {
        icon: "👨🏻‍💻",
        name: "佐藤 海",
        role: "科技倫理使節",
        line: "透明不代表公開一切，而是讓責任可以被追溯。",
      },
      {
        icon: "👩🏻‍🏫",
        name: "葵",
        role: "記憶道場師範",
        line: "真正的回想不是重看答案，而是在腦中重走一次。",
      },
    ],
  },
};
const shop = [
  {
    id: "diplomatic-pin",
    icon: "🎖️",
    name: "盟約徽章",
    cost: 120,
    effect: "起跑速度 +2",
  },
  {
    id: "memory-saddle",
    icon: "🪶",
    name: "記憶鞍具",
    cost: 180,
    effect: "漂移蓄能 +15%",
  },
  {
    id: "polyglot-charm",
    icon: "🔮",
    name: "多語護符",
    cost: 240,
    effect: "答錯首次不減速",
  },
];
const items: { id: ItemId; icon: string; name: string }[] = [
  { id: "turbo", icon: "⚡", name: "語彙渦輪" },
  { id: "shield", icon: "🛡️", name: "文化護盾" },
  { id: "echo", icon: "🔊", name: "回聲干擾" },
];
const questions: Record<
  MapId,
  RallyQuestion[]
> = {
  taipei: [
    {
      id: "taipei-trust",
      type: "translation",
      phrase: "Resilience begins with trust.",
      prompt: "城市韌性的起點是？",
      answers: ["互信", "封鎖", "競爭"],
      memory: "故事鏈：城市遇到風雨，人們因互相信任而一起修復。",
    },
    {
      id: "taipei-common-ground",
      type: "diplomacy",
      phrase: "我們求同存異。",
      prompt: "最符合外交語境的英文是？",
      answers: [
        "We seek common ground while respecting differences.",
        "We erase every difference.",
        "We postpone all dialogue.",
      ],
      memory: "先找共同地面，再替差異保留座位。",
    },
    { id: "taipei-listen-cooperate", type: "listening", phrase: "We are ready to cooperate.", prompt: "你聽到的外交意圖是？", answers: ["願意合作", "拒絕會談", "要求撤離"], memory: "cooperate＝共同運作，想像代表一起推動齒輪。" },
    { id: "taipei-cloze-dialogue", type: "cloze", phrase: "Open ___ builds lasting trust.", prompt: "填入最適合的字詞。", answers: ["dialogue", "silence", "pressure"], memory: "open dialogue 是開放對話；對話讓信任能持續。" },
    { id: "taipei-confuse-resilient", type: "confusable", phrase: "resilient / resistant", prompt: "描述城市受災後恢復力，應選哪一個？", answers: ["resilient", "resistant", "reserved"], memory: "resilient 強調受衝擊後恢復；resistant 強調抵抗。" },
  ],
  paris: [
    {
      id: "paris-greeting",
      type: "translation",
      phrase: "Ravi de vous rencontrer.",
      prompt: "正式會面時表示？",
      answers: ["很高興認識您", "請立刻離開", "我不同意"],
      memory: "Ravi 像『來會』，來會面時說很高興認識您。",
    },
    {
      id: "paris-agreement",
      type: "diplomacy",
      phrase: "Trouver un terrain d'entente.",
      prompt: "談判時代表什麼？",
      answers: ["找到共識", "封鎖道路", "更換代表"],
      memory: "雙方走到同一塊 terrain（土地）上握手。",
    },
    { id: "paris-listen-thanks", type: "listening", phrase: "Merci pour votre coopération.", prompt: "對方表達了什麼？", answers: ["感謝您的合作", "拒絕您的提案", "請延後會議"], memory: "Merci 是謝謝；coopération 與英文 cooperation 同源。" },
    { id: "paris-cloze-dialogue", type: "cloze", phrase: "Nous souhaitons poursuivre le ___.", prompt: "填入『對話』。", answers: ["dialogue", "conflit", "secret"], memory: "dialogue 法文與英文拼法相同。" },
    { id: "paris-confuse-entente", type: "confusable", phrase: "entente / attente", prompt: "哪個字表示理解或協議？", answers: ["entente", "attente", "entrée"], memory: "entente＝協議；attente＝等待；entrée＝入口。" },
  ],
  tokyo: [
    {
      id: "tokyo-understanding",
      type: "translation",
      phrase: "相互理解を深めましょう。",
      prompt: "這句倡議的目標是？",
      answers: ["加深相互理解", "中止交流", "縮短會議"],
      memory: "兩個對話泡泡逐漸重疊、顏色變深。",
    },
    {
      id: "tokyo-consensus",
      type: "diplomacy",
      phrase: "合意形成が重要です。",
      prompt: "何者很重要？",
      answers: ["形成共識", "保持沉默", "單方面決定"],
      memory: "合意＝意見合在一起；形成＝塑造成形。",
    },
    { id: "tokyo-listen-thanks", type: "listening", phrase: "ご協力ありがとうございます。", prompt: "這句話的功能是？", answers: ["感謝合作", "提出抗議", "結束談判"], memory: "協力＝合作；ありがとうございます＝感謝。" },
    { id: "tokyo-cloze-dialogue", type: "cloze", phrase: "対話を___ましょう。", prompt: "填入『繼續』最合適的形式。", answers: ["続け", "閉じ", "忘れ"], memory: "続ける＝繼續；閉じる＝關閉；忘れる＝忘記。" },
    { id: "tokyo-confuse-koui", type: "confusable", phrase: "合意 / 行為", prompt: "外交協商達成『共識』應使用？", answers: ["合意", "行為", "好意"], memory: "三者都可讀作 こうい；合意才是共識。" },
  ],
};
const questionTypeLabels: Record<QuestionType, string> = {
  listening: "聽力",
  translation: "翻譯",
  cloze: "填空",
  diplomacy: "外交情境",
  confusable: "易混淆",
};
const initialLearning: LearningProfile = {
  taipei: { level: 1, streak: 0, total: 0, correct: 0, avgMs: 0, wrongIds: {}, recent: [] },
  paris: { level: 1, streak: 0, total: 0, correct: 0, avgMs: 0, wrongIds: {}, recent: [] },
  tokyo: { level: 1, streak: 0, total: 0, correct: 0, avgMs: 0, wrongIds: {}, recent: [] },
};
const difficultyLabels: Record<Difficulty, string> = {
  review: "複習 A2",
  standard: "標準 B1",
  challenge: "挑戰 B2",
};
function loadLearningProfile(): LearningProfile {
  try {
    const saved = JSON.parse(
      localStorage.getItem("memgenius-rally-learning") || "{}"
    );
    return Object.fromEntries(
      (Object.keys(initialLearning) as MapId[]).map(id => [
        id,
        { ...initialLearning[id], ...saved[id], wrongIds: saved[id]?.wrongIds || {}, recent: saved[id]?.recent || [] },
      ])
    ) as LearningProfile;
  } catch {
    return initialLearning;
  }
}
function difficultyFor(progress: LearningProfile[MapId]): Difficulty {
  const accuracy = progress.total ? progress.correct / progress.total : 0;
  if (progress.total >= 4 && accuracy >= 0.8 && progress.avgMs < 4200)
    return "challenge";
  if (progress.total >= 2 && accuracy >= 0.55) return "standard";
  return "review";
}
function adaptQuestion(
  source: RallyQuestion,
  difficulty: Difficulty,
  checkpoint: number
): RallyQuestion {
  if (difficulty === "review") {
    return {
      ...source,
      prompt: checkpoint === 0 ? `複習提示：${source.prompt}` : source.prompt,
    };
  }
  if (difficulty === "challenge") {
    return {
      ...source,
      prompt:
        checkpoint === 0
          ? `限時精準判斷：${source.prompt}`
          : `外交實務中，哪個選項最精確？`,
    };
  }
  return source;
}
const bosses: Record<
  MapId,
  { prompt: string; answers: string[]; hint: string }
> = {
  taipei: {
    prompt: "颱風後三國對救災物資分配有爭議。你先做什麼？",
    answers: ["重述各方需求並建立共同指標", "要求弱國退出", "跳過翻譯直接表決"],
    hint: "先確認語意，再建立可衡量的共同利益。",
  },
  paris: {
    prompt: "patrimoine 同時涉及遺產與文化資產，應如何處理？",
    answers: ["標記歧義並請雙方確認法律定義", "選最短的翻譯", "完全刪除此詞"],
    hint: "關鍵詞必須確認法律語境。",
  },
  tokyo: {
    prompt: "各國對 AI 透明度定義不同，最佳共識路徑是？",
    answers: [
      "提出分級透明框架並記錄保留意見",
      "假裝沒有差異",
      "讓單一國家決定",
    ],
    hint: "用結構化分級容納不同制度成熟度。",
  },
};
const initial: Profile = {
  reputation: 120,
  points: 2,
  mountXp: 0,
  unlocked: 1,
  wins: 0,
  talents: {},
  coins: 260,
  owned: [],
  dailyClaim: "",
  nations: { taipei: 20, paris: 0, tokyo: 0 },
};
function loadProfile() {
  try {
    const raw = JSON.parse(
      localStorage.getItem("memgenius-rally-profile") || "{}"
    );
    return {
      ...initial,
      ...raw,
      owned: raw.owned || [],
      nations: { ...initial.nations, ...raw.nations },
    };
  } catch {
    return initial;
  }
}

function Mount({
  color,
  position = [0, 0.7, 2],
  scale = 1,
}: {
  color: string;
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.34, 0.76, 7, 14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.4, -0.26]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[-0.2, 0.2].map(x => (
        <mesh key={x} position={[x, 0.72, -0.28]} rotation={[0, 0, x]}>
          <coneGeometry args={[0.1, 0.44, 8]} />
          <meshStandardMaterial color="#ffd767" />
        </mesh>
      ))}
      <mesh position={[0, 0.78, 0.17]}>
        <capsuleGeometry args={[0.18, 0.4, 6, 10]} />
        <meshStandardMaterial color="#e9edf7" />
      </mesh>
      <mesh position={[0, 1.14, 0.17]}>
        <sphereGeometry args={[0.19, 14, 14]} />
        <meshStandardMaterial color="#d9a98a" />
      </mesh>
    </group>
  );
}
function RaceWorld({
  controls,
  running,
  map,
  color,
  item,
  driftPower,
  speedBonus,
  paceMultiplier,
  onTick,
  onWall,
}: {
  controls: React.MutableRefObject<Controls>;
  running: boolean;
  map: (typeof maps)[number];
  color: string;
  item: ItemId | null;
  driftPower: number;
  speedBonus: number;
  paceMultiplier: number;
  onTick: (d: number, s: number, l: number, drift: boolean) => void;
  onWall: () => void;
}) {
  const rider = useRef<THREE.Group>(null),
    world = useRef<THREE.Group>(null),
    lane = useRef(0),
    speed = useRef(0),
    distance = useRef(0),
    report = useRef(0),
    charge = useRef(0);
  useEffect(() => {
    if (!running) speed.current = 0;
  }, [running]);
  useFrame((state, dt) => {
    if (!rider.current || !world.current) return;
    const c = controls.current,
      turn = (c.right ? 1 : 0) - (c.left ? 1 : 0),
      drift = c.drift && turn !== 0;
    if (drift) charge.current = Math.min(1, charge.current + dt * driftPower);
    else if (charge.current > 0.45) {
      speed.current += charge.current * 9 * driftPower;
      charge.current = 0;
    }
    const target = running
      ? (23 +
          speedBonus +
          (c.boost ? 8 : 0) +
          (item === "turbo" ? 9 : 0) -
          (drift ? 3 : 0)) *
        paceMultiplier
      : 0;
    speed.current = THREE.MathUtils.lerp(speed.current, target, dt * 2.2);
    lane.current += turn * dt * (drift ? 6.8 : 5);
    if (Math.abs(lane.current) > 3.75) {
      lane.current = THREE.MathUtils.clamp(lane.current, -3.75, 3.75);
      speed.current *= 0.58;
      onWall();
    }
    rider.current.position.x = THREE.MathUtils.lerp(
      rider.current.position.x,
      lane.current,
      dt * 8
    );
    rider.current.position.y =
      0.06 + Math.sin(state.clock.elapsedTime * 9) * 0.045;
    rider.current.rotation.z = THREE.MathUtils.lerp(
      rider.current.rotation.z,
      -turn * (drift ? 0.48 : 0.22),
      dt * 8
    );
    world.current.position.z =
      (world.current.position.z + speed.current * dt) % 24;
    distance.current += speed.current * dt;
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      lane.current * 0.24 + Math.sin(distance.current * 0.018) * 0.7,
      dt * 2
    );
    state.camera.rotation.z = THREE.MathUtils.lerp(
      state.camera.rotation.z,
      -Math.cos(distance.current * 0.02) * 0.025,
      dt * 2
    );
    if (state.clock.elapsedTime - report.current > 0.11) {
      report.current = state.clock.elapsedTime;
      onTick(distance.current, speed.current, lane.current, drift);
    }
  });
  return (
    <>
      <color attach="background" args={[map.sky]} />
      <fog attach="fog" args={[map.sky, 15, 62]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[5, 9, 3]} intensity={2.3} />
      <mesh position={[0, -1.1, -22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 100]} />
        <meshStandardMaterial color={map.sky} />
      </mesh>
      <group ref={world}>
        {Array.from({ length: 13 }, (_, i) => (
          <group
            key={i}
            position={[Math.sin(i * 0.55) * 2.3, -0.82, -i * 8]}
            rotation={[0, Math.cos(i * 0.55) * 0.055, 0]}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[8.2, 7.7]} />
              <meshStandardMaterial color={i % 2 ? map.road : map.color} />
            </mesh>
            {[-2.7, 0, 2.7].map(x => (
              <mesh
                key={x}
                position={[x, 0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.07, 3]} />
                <meshBasicMaterial color="#fff" transparent opacity={0.35} />
              </mesh>
            ))}
            {[-4.05, 4.05].map(x => (
              <mesh key={x} position={[x, 0.25, 0]}>
                <boxGeometry args={[0.18, 0.5, 7.6]} />
                <meshStandardMaterial color="#dbe8ef" />
              </mesh>
            ))}
            {i % 4 === 2 && (
              <mesh position={[i % 3 ? -2.2 : 2.2, 0.25, 0]}>
                <boxGeometry args={[0.65, 0.65, 0.65]} />
                <meshStandardMaterial color="#ff664f" />
              </mesh>
            )}
          </group>
        ))}
      </group>
      {[
        { x: -1.7, z: -3, c: "#f0b64f" },
        { x: 1.6, z: -6, c: "#9d79d6" },
        { x: 0.2, z: -9, c: "#5ca8ff" },
      ].map((a, i) => (
        <Mount key={i} color={a.c} position={[a.x, 0.7, a.z]} scale={0.82} />
      ))}
      <group ref={rider}>
        <Mount color={color} />
        {item === "shield" && (
          <mesh position={[0, 1, 2]}>
            <sphereGeometry args={[1.05, 16, 16]} />
            <meshBasicMaterial
              color="#67d7ff"
              transparent
              opacity={0.18}
              wireframe
            />
          </mesh>
        )}
        {controls.current.drift &&
          Array.from({ length: 10 }, (_, i) => (
            <mesh
              key={i}
              position={[
                (i % 2 ? -0.42 : 0.42) + (i % 3) * 0.06,
                0.38,
                2.25 + i * 0.08,
              ]}
            >
              <sphereGeometry args={[0.035 + (i % 3) * 0.012, 6, 6]} />
              <meshBasicMaterial color={i % 2 ? "#ffd45c" : map.color} />
            </mesh>
          ))}
      </group>
    </>
  );
}

export default function WorldRally() {
  const [mapId, setMapId] = useState<MapId>("taipei"),
    [racer, setRacer] = useState(0),
    [job, setJob] = useState(0),
    [equipment, setEquipment] = useState(0),
    [phase, setPhase] = useState<Phase>("lobby"),
    [townOpen, setTownOpen] = useState(false),
    [npc, setNpc] = useState(0),
    [countdown, setCountdown] = useState(0),
    [distance, setDistance] = useState(0),
    [speed, setSpeed] = useState(0),
    [rank, setRank] = useState(4),
    [gate, setGate] = useState(0),
    [answer, setAnswer] = useState<number | null>(null),
    [quizChoice, setQuizChoice] = useState(0),
    [quizTime, setQuizTime] = useState(7),
    [difficulty, setDifficulty] = useState<Difficulty>("review"),
    [learning, setLearning] = useState<LearningProfile>(loadLearningProfile),
    [raceQuestions, setRaceQuestions] = useState<RallyQuestion[]>(
      questions.taipei
    ),
    [quizResults, setQuizResults] = useState<QuizResult[]>([]),
    [seasonBonus, setSeasonBonus] = useState(0),
    [raceId, setRaceId] = useState(0),
    [item, setItem] = useState<ItemId | null>(null),
    [notice, setNotice] = useState(""),
    [drifting, setDrifting] = useState(false),
    [hit, setHit] = useState(false),
    [xp, setXp] = useState(0),
    [profile, setProfile] = useState<Profile>(loadProfile),
    [story, setStory] = useState<StoryState>(loadRallyStory),
    [latestRun, setLatestRun] = useState<RallyRun | null>(null),
    [dailyGhost, setDailyGhost] = useState<RallyRun | null>(null);
  const controls = useRef<Controls>({
      left: false,
      right: false,
      boost: false,
      drift: false,
    }),
    triggered = useRef(0),
    pickups = useRef(new Set<number>()),
    hazards = useRef(new Set<number>()),
    timer = useRef<number | undefined>(undefined),
    quizReturnTimer = useRef<number | undefined>(undefined),
    quizSwipeStart = useRef<number | null>(null),
    questionStarted = useRef(0),
    wallLock = useRef(false),
    runStarted = useRef(0),
    ghostPath = useRef<number[][]>([]),
    lastGhostSample = useRef(0),
    raceTicket = useRef<string | null>(null);
  const map = maps.find(m => m.id === mapId)!,
    question = raceQuestions[gate] || questions[mapId][gate],
    boss = bosses[mapId],
    canEnter = maps.findIndex(m => m.id === mapId) < profile.unlocked,
    town = townData[mapId];
  const talent = (name: string) => profile.talents[name] || 0,
    driftPower =
      1 +
      talent("空間導航") * 0.3 +
      (profile.owned.includes("memory-saddle") ? 0.15 : 0),
    itemDuration = 6000 * (1 + talent("創意連結") * 0.25),
    speedBonus =
      (profile.owned.includes("diplomatic-pin") ? 2 : 0) +
      Math.floor(profile.mountXp / 300) * 0.5;
  const visibleAnswerCount = talent("文字整理") > 0 ? 2 : 3;
  const quizDuration =
    (gate === 0 ? 7 : 6) +
    (difficulty === "review" ? 1 : difficulty === "challenge" ? -1 : 0);
  const tick = useCallback(
    (d: number, s: number, lane: number, drift: boolean) => {
      setDistance(d);
      setSpeed(s);
      setDrifting(drift);
      if (d - lastGhostSample.current >= 6) {
        lastGhostSample.current = d;
        ghostPath.current.push([
          Math.round(d),
          Math.round(lane * 100) / 100,
          Date.now() - runStarted.current,
        ]);
      }
      const ghostProgress = dailyGhost?.ghost_path?.length
        ? Number(
            dailyGhost.ghost_path.find(
              p => p[2] >= Date.now() - runStarted.current
            )?.[0] || 0
          )
        : 0;
      const ai = [
        d + Math.sin(d * 0.025) * 18 - 5,
        d + Math.sin(d * 0.018 + 2) * 22 - 8,
        ghostProgress || d + Math.sin(d * 0.021 + 4) * 16 - 12,
      ];
      setRank(1 + ai.filter(v => (item === "echo" ? v - 18 : v) > d).length);
      [58, 138, 232].forEach((at, i) => {
        if (
          d >= at &&
          d < at + 5 &&
          !pickups.current.has(i) &&
          Math.abs(lane - [-1.2, 1.2, -1.2][i]) < 1.25
        ) {
          pickups.current.add(i);
          setItem(items[i].id);
          setNotice(`${items[i].icon} 取得${items[i].name}`);
          clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            setItem(null);
            setNotice("");
          }, itemDuration);
        }
      });
      [82, 166, 248].forEach((at, i) => {
        if (
          d >= at &&
          d < at + 4 &&
          !hazards.current.has(i) &&
          Math.abs(lane - [2.2, -2.2, 2.2][i]) < 1
        ) {
          hazards.current.add(i);
          if (item === "shield") {
            setItem(null);
            setNotice("🛡️ 護盾抵擋碰撞");
          } else {
            setHit(true);
            setNotice("💥 碰撞減速");
            setTimeout(
              () => setHit(false),
              700 / (1 + talent("情境行動") * 0.25)
            );
          }
        }
      });
      const cp = Math.min(2, Math.floor(d / 100));
      if (phase === "race" && cp > triggered.current && cp <= 2) {
        triggered.current = cp;
        setGate(cp - 1);
        setAnswer(null);
        setQuizChoice(0);
        questionStarted.current = Date.now();
        setPhase("quiz");
        return;
      }
      if (phase === "race" && d >= 300 && triggered.current < 3) {
        triggered.current = 3;
        setAnswer(null);
        setPhase("boss");
      }
    },
    [item, itemDuration, profile.talents, dailyGhost, phase]
  );
  function resolveQuiz(choice: number | null) {
    if (phase !== "quiz" || answer !== null) return;
    setAnswer(choice);
    const correct = choice === 0,
      responseMs = Math.max(0, Date.now() - questionStarted.current),
      previous = learning[mapId],
      nextTotal = previous.total + 1,
      nextCorrect = previous.correct + (correct ? 1 : 0),
      nextWrongIds = { ...previous.wrongIds };
    if (correct) delete nextWrongIds[question.id];
    else nextWrongIds[question.id] = (nextWrongIds[question.id] || 0) + 1;
    const nextProgress = {
      ...previous,
      total: nextTotal,
      correct: nextCorrect,
      streak: correct ? previous.streak + 1 : 0,
      avgMs: previous.avgMs
        ? Math.round(previous.avgMs * 0.7 + responseMs * 0.3)
        : responseMs,
      wrongIds: nextWrongIds,
      recent: [
        ...previous.recent,
        { correct, responseMs, type: question.type, at: new Date().toISOString() },
      ].slice(-20),
      level: Math.min(3, 1 + Math.floor(nextCorrect / 4)),
    };
    const nextLearning = { ...learning, [mapId]: nextProgress };
    setLearning(nextLearning);
    localStorage.setItem(
      "memgenius-rally-learning",
      JSON.stringify(nextLearning)
    );
    setQuizResults(results => [
      ...results,
      { correct, responseMs, difficulty },
    ]);
    if (choice === 0) {
      if (gate === 0) {
        const rewardXp = difficulty === "challenge" ? 200 : 120;
        setXp(v => v + rewardXp);
        setItem("turbo");
        if (difficulty === "challenge") setSeasonBonus(v => v + 75);
        setNotice(
          difficulty === "challenge"
            ? "🔥 B2 精準作答！超級渦輪・賽季 +75"
            : "⚡ 答對！語彙渦輪已啟動"
        );
        clearTimeout(timer.current);
        timer.current = window.setTimeout(
          () => setItem(null),
          (difficulty === "challenge" ? 8500 : 5000) +
            talent("聲音韻律") * 2000
        );
      } else {
        setXp(v => v + (difficulty === "challenge" ? 260 : 180));
        setItem(difficulty === "challenge" ? "echo" : "shield");
        if (difficulty === "challenge") setSeasonBonus(v => v + 125);
        setNotice(
          difficulty === "challenge"
            ? "💎 B2 外交突破！稀有回聲干擾・賽季 +125"
            : "🛡️ 外交判斷成功・取得文化護盾"
        );
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setItem(null), itemDuration);
      }
    } else {
      setNotice(
        choice === null
          ? "⏱️ 未作答・賽事繼續"
          : "判斷未命中・未獲得加成，賽事繼續"
      );
    }
    clearTimeout(quizReturnTimer.current);
    quizReturnTimer.current = window.setTimeout(() => {
      setAnswer(null);
      setPhase("race");
    }, choice === null ? 0 : 650);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent, on: boolean) => {
        if (phase === "quiz" && on && e.key === "ArrowLeft") {
          e.preventDefault();
          setQuizChoice(v => (v - 1 + visibleAnswerCount) % visibleAnswerCount);
          return;
        }
        if (phase === "quiz" && on && e.key === "ArrowRight") {
          e.preventDefault();
          setQuizChoice(v => (v + 1) % visibleAnswerCount);
          return;
        }
        if (
          phase === "quiz" &&
          on &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          resolveQuiz(quizChoice);
          return;
        }
        if (["ArrowLeft", "a", "A"].includes(e.key)) controls.current.left = on;
        if (["ArrowRight", "d", "D"].includes(e.key))
          controls.current.right = on;
        if (["ArrowUp", "w", "W"].includes(e.key)) controls.current.boost = on;
        if (e.key === "Shift") controls.current.drift = on;
      },
      down = (e: KeyboardEvent) => key(e, true),
      up = (e: KeyboardEvent) => key(e, false);
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    };
  }, [phase, quizChoice, visibleAnswerCount, answer]);
  useEffect(() => {
    if (phase !== "quiz") return;
    const duration = quizDuration;
    setQuizTime(duration);
    const id = window.setInterval(() => {
      setQuizTime(value => {
        if (value <= 0.1) {
          clearInterval(id);
          return 0;
        }
        return Math.max(0, value - 0.1);
      });
    }, 100);
    const expiry = window.setTimeout(() => resolveQuiz(null), duration * 1000);
    return () => {
      clearInterval(id);
      clearTimeout(expiry);
    };
  }, [phase, gate, difficulty, quizDuration]);
  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown(v => v - 1), 900);
    return () => clearTimeout(id);
  }, [countdown]);
  function save(p: Profile) {
    setProfile(p);
    localStorage.setItem("memgenius-rally-profile", JSON.stringify(p));
  }
  function start() {
    if (!canEnter) return;
    triggered.current = 0;
    pickups.current = new Set();
    hazards.current = new Set();
    ghostPath.current = [];
    lastGhostSample.current = 0;
    runStarted.current = Date.now() + 2700;
    raceTicket.current = null;
    const nextDifficulty = difficultyFor(learning[mapId]),
      rotation = learning[mapId].total % questions[mapId].length,
      rotated = [
        ...questions[mapId].slice(rotation),
        ...questions[mapId].slice(0, rotation),
      ],
      rankedQuestions = rotated.sort(
        (a, b) =>
          (learning[mapId].wrongIds[b.id] || 0) -
          (learning[mapId].wrongIds[a.id] || 0)
      );
    setDifficulty(nextDifficulty);
    setRaceQuestions(
      rankedQuestions.slice(0, 2).map((q, i) =>
        adaptQuestion(q, nextDifficulty, i)
      )
    );
    setQuizResults([]);
    setSeasonBonus(0);
    setRaceId(id => id + 1);
    void startRallyRace(mapId)
      .then(ticket => {
        raceTicket.current = ticket;
      })
      .catch(() => {
        raceTicket.current = null;
      });
    setDistance(0);
    setSpeed(0);
    setRank(4);
    setGate(0);
    setQuizChoice(0);
    setQuizTime(7);
    setXp(0);
    setAnswer(null);
    setItem(talent("情緒共鳴") ? "shield" : null);
    setNotice("");
    setLatestRun(null);
    setCountdown(3);
    setTownOpen(false);
    setPhase("race");
  }
  function upgrade(t: string) {
    if (profile.points)
      save({
        ...profile,
        points: profile.points - 1,
        talents: { ...profile.talents, [t]: (profile.talents[t] || 0) + 1 },
      });
  }
  function hold(k: keyof Controls, on: boolean) {
    controls.current[k] = on;
  }
  function speakQuestion() {
    if (!("speechSynthesis" in window)) {
      setNotice("此裝置不支援語音播放，請使用文字提示作答");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.phrase);
    utterance.lang = mapId === "paris" ? "fr-FR" : mapId === "tokyo" ? "ja-JP" : "en-US";
    utterance.rate = difficulty === "review" ? 0.8 : 0.95;
    speechSynthesis.speak(utterance);
  }
  function wallCrash() {
    if (wallLock.current) return;
    wallLock.current = true;
    setNotice("⚠️ 擦撞賽道護欄");
    setHit(true);
    setTimeout(() => {
      wallLock.current = false;
      setHit(false);
    }, 450);
  }
  function claimDaily() {
    const today = new Date().toDateString();
    if (profile.dailyClaim === today) return;
    const reward = Math.round(100 * (1 + talent("系統累積") * 0.2));
    save({ ...profile, coins: profile.coins + reward, dailyClaim: today });
    setNotice(`每日公會委託完成・+${reward} 金幣`);
  }
  function buy(id: string, cost: number) {
    if (profile.coins < cost || profile.owned.includes(id)) return;
    save({
      ...profile,
      coins: profile.coins - cost,
      owned: [...profile.owned, id],
    });
  }
  function feedMount() {
    if (profile.coins < 60) return;
    save({
      ...profile,
      coins: profile.coins - 60,
      mountXp: profile.mountXp + 90,
    });
  }
  function finishBoss() {
    if (answer !== 0) return;
    const idx = maps.findIndex(m => m.id === mapId),
      rep = 300 + Math.max(0, 5 - rank) * 40,
      finishMs = Math.max(1000, Date.now() - runStarted.current),
      score = Math.round(1600 + xp + seasonBonus + rep - finishMs / 100),
      next = {
        ...profile,
        reputation: profile.reputation + rep,
        coins: profile.coins + 140,
        points: profile.points + 1,
        mountXp: profile.mountXp + 180,
        unlocked: Math.max(profile.unlocked, Math.min(3, idx + 2)),
        wins: profile.wins + 1,
        nations: { ...profile.nations, [mapId]: profile.nations[mapId] + 50 },
      };
    save(next);
    setLatestRun({
      display_name: "世界旅人",
      season: "S01",
      map_id: mapId,
      score: Math.max(0, score),
      finish_ms: finishMs,
      rank,
      ghost_path: ghostPath.current,
      race_ticket: raceTicket.current,
    });
    setXp(v => v + 300);
    setPhase("finish");
  }
  return (
    <main
      className={`wr-shell ${hit ? "wr-hit" : ""}`}
      style={{ "--racer": map.color } as React.CSSProperties}
    >
      <header className="wr-top">
        <Link href="/memgenius">
          <ArrowLeft size={17} /> MemGenius
        </Link>
        <div className="wr-logo">
          <Globe2 size={20} />
          <b>萬國風行賽</b>
          <span>WORLD ENVOY RALLY</span>
        </div>
        <div className="wr-resources">
          <span>
            <Coins /> {profile.coins}
          </span>
          <span>
            <Shield /> {profile.reputation}
          </span>
          <span>
            <Star /> {profile.points}
          </span>
        </div>
      </header>
      <section className="wr-stage">
        <Canvas camera={{ position: [0, 3.4, 7.4], fov: 48 }} dpr={[1, 1.5]}>
          <RaceWorld
            key={raceId}
            controls={controls}
            running={
              (phase === "race" || phase === "quiz") &&
              !hit &&
              countdown === 0
            }
            map={map}
            color={racers[racer].color}
            item={item}
            driftPower={driftPower}
            speedBonus={speedBonus}
            paceMultiplier={phase === "quiz" && gate === 1 ? 0.45 : 1}
            onWall={wallCrash}
            onTick={tick}
          />
        </Canvas>
        {phase === "lobby" && !townOpen && (
          <div className="wr-overlay wr-world">
            <div className="wr-world-head">
              <div>
                <div className="wr-kicker">
                  <Sparkles /> SEASON 01・記憶外交遠征
                </div>
                <h1>
                  選擇下一座 <em>世界舞台</em>
                </h1>
              </div>
              <div className="wr-profile">
                <span>Lv.{1 + Math.floor(profile.mountXp / 300)}</span>
                <div>
                  <b>風行獸羈絆</b>
                  <i>
                    <em style={{ width: `${(profile.mountXp % 300) / 3}%` }} />
                  </i>
                </div>
              </div>
            </div>
            <WorldRallyOnline
              mapId={mapId}
              profile={profile}
              learningProfile={learning}
              storyState={story}
              latestRun={latestRun}
              onGhost={setDailyGhost}
              onLearningRestore={remoteLearning => {
                if (!remoteLearning || typeof remoteLearning !== "object") return;
                const restored = Object.fromEntries(
                  (Object.keys(initialLearning) as MapId[]).map(id => {
                    const remote = (remoteLearning as Partial<LearningProfile>)[id];
                    return [id, {
                      ...initialLearning[id],
                      ...remote,
                      wrongIds: remote?.wrongIds || {},
                      recent: remote?.recent || [],
                    }];
                  })
                ) as LearningProfile;
                setLearning(restored);
                localStorage.setItem("memgenius-rally-learning", JSON.stringify(restored));
              }}
              onRestore={(remoteProfile, remoteStory) => {
                const restored = {
                  ...initial,
                  ...(remoteProfile as Partial<Profile>),
                  nations: {
                    ...initial.nations,
                    ...((remoteProfile as Partial<Profile>).nations || {}),
                  },
                };
                save(restored);
                if (remoteStory) {
                  setStory(remoteStory as StoryState);
                  localStorage.setItem(
                    "memgenius-rally-story",
                    JSON.stringify(remoteStory)
                  );
                }
              }}
            />
            <div className="wr-town-entry">
              <button onClick={() => setTownOpen(true)}>
                <Building2 />
                <span>
                  <b>進入 {town.name}</b>
                  <small>公會・NPC・每日任務・商店・坐騎培育</small>
                </span>
                <ChevronRight />
              </button>
              <div>
                <span>{map.flag} 國家聲望</span>
                <b>{profile.nations[mapId]}</b>
              </div>
            </div>
            <div className="wr-map-grid">
              {maps.map((m, i) => (
                <button
                  key={m.id}
                  disabled={i >= profile.unlocked}
                  className={mapId === m.id ? "active" : ""}
                  onClick={() => setMapId(m.id)}
                  style={{ "--map": m.color } as React.CSSProperties}
                >
                  <span>
                    {i >= profile.unlocked ? <LockKeyhole /> : m.flag}
                  </span>
                  <small>STAGE 0{i + 1}</small>
                  <b>
                    {m.city}・{m.course}
                  </b>
                  <i>{i >= profile.unlocked ? "完成前一關解鎖" : m.scenery}</i>
                </button>
              ))}
            </div>
            <div className="wr-prep">
              <section>
                <small>CHARACTER</small>
                <div className="wr-choice-row">
                  {racers.map((r, i) => (
                    <button
                      key={r.name}
                      className={i === racer ? "active" : ""}
                      onClick={() => setRacer(i)}
                    >
                      <span>{r.flag}</span>
                      <b>{r.name}</b>
                      <i>{r.role}</i>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <small>CLASS & GEAR</small>
                <div className="wr-selectors">
                  <button onClick={() => setJob((job + 1) % 3)}>
                    <span>{jobs[job].icon}</span>
                    <b>{jobs[job].name}</b>
                    <i>{jobs[job].bonus}</i>
                  </button>
                  <button onClick={() => setEquipment((equipment + 1) % 3)}>
                    <span>{gear[equipment].icon}</span>
                    <b>{gear[equipment].name}</b>
                    <i>{gear[equipment].stat}</i>
                  </button>
                </div>
              </section>
            </div>
            <div className="wr-talents">
              <div>
                <BrainCircuit />
                <span>八大記憶天賦</span>
                <small>升級後直接影響賽事・可用 {profile.points} 點</small>
              </div>
              {talents.map(t => (
                <button
                  key={t}
                  title={talentEffects[t]}
                  disabled={!profile.points}
                  onClick={() => upgrade(t)}
                >
                  <b>{t}</b>
                  <span>{"◆".repeat(profile.talents[t] || 0) || "◇"}</span>
                  <i>{talentEffects[t]}</i>
                </button>
              ))}
            </div>
            <div className="wr-mission">
              <div>
                <small>BOSS DIPLOMACY</small>
                <b>{map.boss}</b>
                <span>{map.mission}</span>
              </div>
              <button
                className="wr-primary"
                disabled={!canEnter}
                onClick={start}
              >
                進入 {map.city} 大獎賽 <ChevronRight />
              </button>
            </div>
          </div>
        )}
        {phase === "lobby" && townOpen && (
          <div className="wr-overlay wr-town">
            <div className="wr-town-head">
              <button onClick={() => setTownOpen(false)}>
                <ArrowLeft /> 世界地圖
              </button>
              <div>
                <div className="wr-kicker">
                  <Building2 /> {map.flag} MMORPG HUB
                </div>
                <h1>{town.name}</h1>
              </div>
              <div>
                <small>國家聲望</small>
                <b>{profile.nations[mapId]}</b>
              </div>
            </div>
            <WorldRallyStory state={story} onChange={setStory} />
            <section className="wr-learning-dashboard" aria-label="語言學習分析">
              <div className="wr-learning-head">
                <span>
                  <BrainCircuit />
                  <b>語言情報室</b>
                </span>
                <small>最近 20 題・自適應學習模型</small>
              </div>
              <div className="wr-mastery-grid">
                {maps.map(country => {
                  const data = learning[country.id],
                    accuracy = data.total
                      ? Math.round((data.correct / data.total) * 100)
                      : 0;
                  return (
                    <article key={country.id}>
                      <span>{country.flag}</span>
                      <div>
                        <b>{country.city}・Lv.{data.level}</b>
                        <i><em style={{ width: `${accuracy}%` }} /></i>
                        <small>{data.total ? `正確率 ${accuracy}%・${(data.avgMs / 1000).toFixed(1)} 秒` : "尚未建立學習資料"}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="wr-learning-detail">
                <div>
                  <b>反應時間趨勢</b>
                  <div className="wr-response-bars">
                    {learning[mapId].recent.slice(-10).map((result, i) => (
                      <i
                        key={`${result.at}-${i}`}
                        className={result.correct ? "correct" : "wrong"}
                        title={`${(result.responseMs / 1000).toFixed(1)} 秒`}
                        style={{ height: `${Math.max(12, Math.min(100, result.responseMs / 80))}%` }}
                      />
                    ))}
                    {!learning[mapId].recent.length && <small>完成題目後顯示</small>}
                  </div>
                </div>
                <div>
                  <b>待複習詞彙</b>
                  <div className="wr-review-list">
                    {Object.entries(learning[mapId].wrongIds).length ? (
                      Object.entries(learning[mapId].wrongIds)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([id, count]) => (
                          <span key={id}>
                            {questions[mapId].find(q => q.id === id)?.phrase || id}
                            <small>錯 {count} 次</small>
                          </span>
                        ))
                    ) : <small>目前沒有待複習詞彙</small>}
                  </div>
                </div>
              </div>
            </section>
            <div className="wr-town-scene">
              <div className="wr-guild">
                <span>🏛️</span>
                <small>外交官公會</small>
                <b>今日委託：完成一場語言巡迴賽</b>
                <p>獎勵會受「系統累積」天賦加成，同一天只能領取一次。</p>
                <button
                  disabled={profile.dailyClaim === new Date().toDateString()}
                  onClick={claimDaily}
                >
                  <CalendarCheck />
                  {profile.dailyClaim === new Date().toDateString()
                    ? "今日已領取"
                    : "領取今日委託獎勵"}
                </button>
              </div>
              <div className="wr-npcs">
                {town.npcs.map((n, i) => (
                  <button
                    key={n.name}
                    className={npc === i ? "active" : ""}
                    onClick={() => setNpc(i)}
                  >
                    <span>{n.icon}</span>
                    <b>{n.name}</b>
                    <small>{n.role}</small>
                  </button>
                ))}
                <div className="wr-dialogue">
                  <MessageCircle />
                  <p>「{town.npcs[npc].line}」</p>
                </div>
              </div>
            </div>
            <div className="wr-town-services">
              <section>
                <div className="wr-service-title">
                  <ShoppingBag />
                  <span>
                    <b>盟約商店</b>
                    <small>持有 {profile.coins} 金幣</small>
                  </span>
                </div>
                {shop.map(s => (
                  <button
                    key={s.id}
                    disabled={
                      profile.coins < s.cost || profile.owned.includes(s.id)
                    }
                    onClick={() => buy(s.id, s.cost)}
                  >
                    <span>{s.icon}</span>
                    <b>{s.name}</b>
                    <small>{s.effect}</small>
                    <em>
                      {profile.owned.includes(s.id) ? "已裝備" : `${s.cost} G`}
                    </em>
                  </button>
                ))}
              </section>
              <section>
                <div className="wr-service-title">
                  <span>🐾</span>
                  <span>
                    <b>風行獸培育所</b>
                    <small>
                      羈絆 Lv.{1 + Math.floor(profile.mountXp / 300)}
                    </small>
                  </span>
                </div>
                <div className="wr-stable">
                  <span>🦜</span>
                  <div>
                    <b>羈絆經驗 {profile.mountXp}</b>
                    <i>
                      <em
                        style={{ width: `${(profile.mountXp % 300) / 3}%` }}
                      />
                    </i>
                    <small>每次照料 +90 XP；等級會增加最高速度。</small>
                  </div>
                </div>
                <button
                  className="wr-feed"
                  disabled={profile.coins < 60}
                  onClick={feedMount}
                >
                  照料坐騎・60 G
                </button>
              </section>
            </div>
          </div>
        )}
        {(phase === "race" || phase === "quiz") && (
          <>
            <div className="wr-race-hud">
              <div>
                <small>
                  {map.flag} {map.course}
                </small>
                <b>
                  第 {rank} 名 <span>/ 4</span>
                </b>
              </div>
              <div className="wr-opponents">
                <span>Astra</span>
                <span>Noor</span>
                <span>
                  {dailyGhost ? `👻 ${dailyGhost.display_name}` : "Mateo"}
                </span>
              </div>
              <div className="wr-lap">
                <span>FINISH</span>
                <b>{Math.min(100, Math.round(distance / 3))}%</b>
              </div>
            </div>
            <div className="wr-progress">
              <span style={{ width: `${Math.min(100, distance / 3)}%` }} />
            </div>
            <div className="wr-minimap">
              <Map />
              <svg viewBox="0 0 100 70" aria-label="賽道小地圖">
                <path d="M15 58 C5 25 25 8 50 18 S95 45 76 60 S35 50 45 30" />
                <circle
                  cx={15 + Math.min(75, distance / 4)}
                  cy={58 - Math.sin(distance * 0.03) * 30}
                  r="4"
                />
              </svg>
              <small>{Math.round(distance)} / 300 m</small>
            </div>
            <div className="wr-speed">
              <Gauge />
              <b>{Math.round(speed * 7.2)}</b>
              <span>KM/H</span>
            </div>
            <div className="wr-item-slot">
              <Gift />
              <span>{item ? items.find(x => x.id === item)?.icon : "?"}</span>
              <small>
                {item ? items.find(x => x.id === item)?.name : "拾取道具"}
              </small>
            </div>
            {notice && <div className="wr-toast">{notice}</div>}
            <div className={`wr-drift-meter ${drifting ? "active" : ""}`}>
              <span>DRIFT ×{driftPower.toFixed(1)}</span>
              <i />
            </div>
            <div className="wr-keyhint">
              {phase === "quiz"
                ? "A/D 繼續轉向・← → 選答案・ENTER 確認"
                : "A/D 轉向・W 加速・SHIFT 漂移"}
            </div>
            {countdown > 0 && (
              <div className="wr-countdown">
                <span>{countdown}</span>
                <small>GET READY</small>
              </div>
            )}
          </>
        )}
        {phase === "quiz" && (
          <aside
            className={`wr-quiz-hud ${gate === 0 ? "language" : "checkpoint"}`}
            aria-label={gate === 0 ? "路上語言快問" : "外交檢查點"}
            onPointerDown={event => {
              quizSwipeStart.current = event.clientX;
            }}
            onPointerUp={event => {
              if (quizSwipeStart.current === null || answer !== null) return;
              const delta = event.clientX - quizSwipeStart.current;
              quizSwipeStart.current = null;
              if (Math.abs(delta) < 38) return;
              setQuizChoice(value =>
                delta < 0
                  ? (value + 1) % visibleAnswerCount
                  : (value - 1 + visibleAnswerCount) % visibleAnswerCount
              );
            }}
          >
            <div className="wr-quiz-hud-head">
              <div className="wr-kicker">
                {gate === 0 ? <Languages /> : <Building2 />}
                {gate === 0
                  ? `路上語言快問・${map.city}`
                  : `外交檢查點・${map.city} 補給站`}
              </div>
              <span className={`wr-difficulty ${difficulty}`}>
                {difficultyLabels[difficulty]}
              </span>
              <span className="wr-question-type">
                {questionTypeLabels[question.type]}
              </span>
              <b>{quizTime.toFixed(1)}s</b>
            </div>
            <div className="wr-quiz-timer">
              <span
                style={{ width: `${(quizTime / quizDuration) * 100}%` }}
              />
            </div>
            <h2>
              {map.flag}{" "}
              {question.type === "listening" ? "聽音選擇正確意思" : `「${question.phrase}」`}
            </h2>
            {question.type === "listening" && (
              <button className="wr-listen-button" onClick={speakQuestion}>
                <Volume2 /> 播放語音
                {difficulty === "review" && <small>{question.phrase}</small>}
              </button>
            )}
            <p>
              {question.prompt}
              {gate === 1 && <small>答對取得補給；答錯不扣分</small>}
            </p>
            {talent("圖像建構") > 0 && (
              <div className="wr-visual-hint">
                🖼️ 圖像建構：想像兩國代表在發光的橋中央握手
              </div>
            )}
            <div className="wr-active-talents">
              {talent("文字整理") > 0 && (
                <span>文字整理：已排除一個干擾選項</span>
              )}
              {talent("聲音韻律") > 0 && <span>聲音韻律：答對延長渦輪</span>}
            </div>
            <div className="wr-quick-answers">
              {question.answers
                .slice(0, visibleAnswerCount)
                .map((a, i) => (
                  <button
                    key={a}
                    onClick={() => {
                      setQuizChoice(i);
                      resolveQuiz(i);
                    }}
                    className={
                      answer === i
                        ? i === 0
                          ? "right"
                          : "wrong"
                        : quizChoice === i
                          ? "selected"
                          : ""
                    }
                  >
                    <i>{String.fromCharCode(65 + i)}</i>
                    {a}
                  </button>
                ))}
            </div>
            <div className="wr-quiz-instruction">
              {answer === null
                ? "← → 選擇・Enter 確認・手機可左右滑動"
                : answer === 0
                  ? gate === 0
                    ? difficulty === "challenge"
                      ? "+200 XP・超級渦輪・賽季 +75"
                      : "+120 XP・語彙渦輪啟動"
                    : difficulty === "challenge"
                      ? "+260 XP・稀有道具・賽季 +125"
                      : "+180 XP・文化護盾取得"
                  : question.memory}
            </div>
          </aside>
        )}
        {phase === "boss" && (
          <div className="wr-overlay wr-boss">
            <span>⚔️</span>
            <div className="wr-kicker">
              <Swords /> BOSS 外交事件・{map.boss}
            </div>
            <h2>{boss.prompt}</h2>
            <div className="wr-answers">
              {boss.answers.map((a, i) => (
                <button
                  key={a}
                  onClick={() => setAnswer(i)}
                  className={answer === i ? (i === 0 ? "right" : "wrong") : ""}
                >
                  <i>{String.fromCharCode(65 + i)}</i>
                  {a}
                </button>
              ))}
            </div>
            {answer !== null && answer !== 0 && (
              <div className="wr-memory">
                <BrainCircuit />
                <span>{boss.hint}</span>
              </div>
            )}
            <button
              className="wr-primary"
              disabled={answer !== 0}
              onClick={finishBoss}
            >
              締結盟約・領取關卡獎勵
            </button>
          </div>
        )}
        {phase === "finish" && (
          <div className="wr-overlay wr-finish">
            <span>🏆</span>
            <div className="wr-kicker">
              <Flag /> STAGE CLEAR
            </div>
            <h1>
              {map.city}盟約 <em>締結成功</em>
            </h1>
            <p>
              你以第 {rank} 名抵達終點，並完成 {map.boss} 的外交考驗。
            </p>
            <div className="wr-results">
              <div>
                <small>本場經驗</small>
                <b>{xp} XP</b>
              </div>
              <div>
                <small>盟譽</small>
                <b>{profile.reputation}</b>
              </div>
              <div>
                <small>坐騎羈絆</small>
                <b>+180</b>
              </div>
              <div>
                <small>挑戰賽季分</small>
                <b>+{seasonBonus}</b>
              </div>
            </div>
            <div className="wr-learning-summary">
              <div>
                <span>🧠 本場學習分析</span>
                <b>{difficultyLabels[difficulty]}</b>
              </div>
              <p>
                答對 {quizResults.filter(result => result.correct).length}/
                {quizResults.length} 題・平均反應{" "}
                {quizResults.length
                  ? (
                      quizResults.reduce(
                        (sum, result) => sum + result.responseMs,
                        0
                      ) /
                      quizResults.length /
                      1000
                    ).toFixed(1)
                  : "—"}
                秒
              </p>
              <small>
                {difficultyFor(learning[mapId]) === "challenge"
                  ? "下一場提升為挑戰題：提示更少、作答時間更短。"
                  : Object.keys(learning[mapId].wrongIds).length
                    ? "錯題已加入優先複習，下一場會提高出現機率。"
                    : "維持穩定答對與快速反應，即可提升語言難度。"}
              </small>
            </div>
            <button className="wr-primary" onClick={() => setPhase("lobby")}>
              <Globe2 /> 返回世界地圖
            </button>
            <button className="wr-secondary" onClick={start}>
              <RotateCcw /> 再跑一場
            </button>
          </div>
        )}
        <div className="wr-touch" aria-label="觸控賽車控制">
          <button
            onPointerDown={() => hold("left", true)}
            onPointerUp={() => hold("left", false)}
          >
            ←
          </button>
          <button
            onPointerDown={() => hold("drift", true)}
            onPointerUp={() => hold("drift", false)}
          >
            DRIFT
          </button>
          <button
            className="boost"
            onPointerDown={() => hold("boost", true)}
            onPointerUp={() => hold("boost", false)}
          >
            <Zap />
            BOOST
          </button>
          <button
            onPointerDown={() => hold("right", true)}
            onPointerUp={() => hold("right", false)}
          >
            →
          </button>
        </div>
      </section>
    </main>
  );
}
