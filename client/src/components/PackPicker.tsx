/**
 * 風格備忘：手帳拼貼學院 — 共用知識點卡包選擇器
 * 官方練習包 + 我的卡包 + 自建卡包入口，供三個訓練模板重用
 */
import { useState } from "react";
import { ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  SUBJECT_PACKS, loadCustomPacks, deleteCustomPack, type SubjectPack,
} from "@/lib/gameData";
import CustomPackBuilder from "@/components/CustomPackBuilder";

interface Props {
  onPick: (pack: SubjectPack) => void;
  /** 額外說明，例如「劇本殺會取前 5 個知識點當核心詞」 */
  note?: string;
}

export default function PackPicker({ onPick, note }: Props) {
  const [customPacks, setCustomPacks] = useState<SubjectPack[]>(() => loadCustomPacks());
  const [building, setBuilding] = useState(false);

  const removeCustomPack = (id: string) => {
    deleteCustomPack(id);
    setCustomPacks(loadCustomPacks());
  };

  if (building) {
    return (
      <CustomPackBuilder
        onCreated={(p) => { setBuilding(false); setCustomPacks(loadCustomPacks()); onPick(p); }}
        onCancel={() => setBuilding(false)}
      />
    );
  }

  return (
    <div>
      {note && <p className="doodle-note text-xl mb-4">{note}</p>}

      {/* 自建卡包入口 */}
      <button onClick={() => setBuilding(true)}
        className="sticky-note sticky-yellow-bg tilt-r p-5 mb-8 w-full max-w-2xl text-left group relative block">
        <div className="washi washi-yellow" />
        <div className="flex items-center gap-4">
          <span className="text-4xl">✂️</span>
          <div className="flex-1">
            <h3 className="font-display font-bold text-xl text-amber-900 group-hover:underline decoration-wavy underline-offset-4">
              <Sparkles className="w-4 h-4 inline -mt-1" /> 做一包自己的知識點
            </h3>
            <p className="text-sm text-amber-800">單字、年份、事件、流程都可以——貼進來變成你的專屬訓練材料</p>
          </div>
          <Plus className="w-6 h-6 text-amber-700 shrink-0" />
        </div>
      </button>

      {/* 我的卡包 */}
      {customPacks.length > 0 && (
        <div className="mb-8">
          <p className="doodle-note text-xl mb-3">my packs — 我做過的卡包 ✎</p>
          <div className="grid md:grid-cols-3 gap-6">
            {customPacks.map((p, i) => (
              <div key={p.id} className={`paper-card ${i % 2 === 0 ? "tilt-l2" : "tilt-r"} p-6 relative group`}>
                <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
                <button onClick={() => removeCustomPack(p.id)} aria-label="刪除卡包"
                  className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-4xl mb-3">{p.emoji}</div>
                <h3 className="font-display font-bold text-xl mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
                <button onClick={() => onPick(p)} className="doodle-note text-xl inline-flex items-center gap-1 hover:text-primary transition-colors">
                  用這包訓練 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="doodle-note text-xl mb-3">starter packs — 官方練習包 ✎</p>
      <div className="grid md:grid-cols-3 gap-6">
        {SUBJECT_PACKS.map((p, i) => (
          <button key={p.id} onClick={() => onPick(p)}
            className={`paper-card ${i % 2 === 0 ? "tilt-l" : "tilt-r"} p-6 text-left group relative`}>
            <span className={`tape-corner ${i % 2 === 0 ? "tape-tl" : "tape-tr"}`} />
            <div className="text-4xl mb-3">{p.emoji}</div>
            <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
            <span className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              本輪 {p.items.length} 題
            </span>
            <br />
            <span className="doodle-note text-xl inline-flex items-center gap-1">就決定是你了 <ArrowRight className="w-4 h-4" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
