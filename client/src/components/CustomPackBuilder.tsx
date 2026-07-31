/**
 * 風格備忘：手帳拼貼學院 — 自訂卡包建立器
 * 像一張攤開的空白手帳頁：使用者把自己的知識點「抄」上去
 * 支援兩種模式：逐條輸入 / 整段貼上自動解析
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardPaste, PenLine, ArrowRight, X } from "lucide-react";
import { addCustomPack, parsePastedItems, type KnowledgeItem, type SubjectPack } from "@/lib/gameData";

const EMOJI_CHOICES = ["📝", "📖", "🏛️", "🧪", "🧮", "🌏", "🎼", "⚖️", "💊", "💻"];

interface Props {
  onCreated: (pack: SubjectPack) => void;
  onCancel: () => void;
}

export default function CustomPackBuilder({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [mode, setMode] = useState<"manual" | "paste">("manual");
  const [items, setItems] = useState<KnowledgeItem[]>([
    { id: `u${Date.now()}-0`, term: "", hint: "" },
    { id: `u${Date.now()}-1`, term: "", hint: "" },
    { id: `u${Date.now()}-2`, term: "", hint: "" },
  ]);
  const [pasteText, setPasteText] = useState("");

  const updateItem = (id: string, patch: Partial<KnowledgeItem>) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addRow = () => {
    if (items.length >= 10) { toast("一輪最多 10 個知識點，先練這些吧！"); return; }
    setItems((arr) => [...arr, { id: `u${Date.now()}-${arr.length}`, term: "", hint: "" }]);
  };

  const removeRow = (id: string) => {
    setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.id !== id) : arr));
  };

  const doPaste = () => {
    const parsed = parsePastedItems(pasteText);
    if (parsed.length === 0) { toast("沒讀到內容，每行寫一個知識點試試"); return; }
    setItems(parsed.slice(0, 10));
    setMode("manual");
    toast(`已讀入 ${Math.min(parsed.length, 10)} 個知識點，確認一下再開始！`);
  };

  const create = () => {
    const valid = items.filter((it) => it.term.trim());
    if (valid.length < 2) { toast("至少要 2 個知識點才夠玩一輪喔"); return; }
    const pack: SubjectPack = {
      id: `custom-${Date.now()}`,
      name: name.trim() || "我的自訂卡包",
      emoji,
      desc: `自建卡包 · ${valid.length} 個知識點`,
      custom: true,
      items: valid.map((it) => ({ ...it, term: it.term.trim(), hint: it.hint.trim() || "（自己補上意思會更好記）" })),
    };
    addCustomPack(pack);
    onCreated(pack);
  };

  return (
    <div className="paper-card tilt-l2 relative p-6 max-w-2xl">
      <span className="tape-corner tape-tl" />
      <button onClick={onCancel} aria-label="關閉"
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary transition-colors">
        <X className="w-4 h-4" />
      </button>

      <p className="font-hand text-2xl text-primary mb-1">make your own pack ✂️</p>
      <h2 className="font-display font-extrabold text-2xl mb-4">抄一份你自己的知識點</h2>

      {/* 卡包名稱與圖示 */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <label className="text-sm font-bold mb-1 block">卡包名稱</label>
          <Input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="例：日文 N3 動詞、解剖學名詞…" className="bg-white/80" />
        </div>
        <div>
          <label className="text-sm font-bold mb-1 block">挑個貼紙</label>
          <div className="flex flex-wrap gap-1">
            {EMOJI_CHOICES.map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-9 h-9 text-lg rounded-lg border-2 transition-all active:scale-[0.94] ${emoji === e ? "border-primary bg-primary/10" : "border-transparent hover:border-border"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 模式切換 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("manual")}
          className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${mode === "manual" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
          <PenLine className="w-3.5 h-3.5 inline -mt-0.5" /> 逐條手寫
        </button>
        <button onClick={() => setMode("paste")}
          className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${mode === "paste" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
          <ClipboardPaste className="w-3.5 h-3.5 inline -mt-0.5" /> 整段貼上
        </button>
      </div>

      {mode === "paste" ? (
        <div>
          <p className="text-sm text-muted-foreground mb-2">每行一個知識點，用空格、冒號或逗號分隔「詞彙」和「意思」：</p>
          <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
            placeholder={"procrastinate 拖延\n1789 法國大革命：攻佔巴士底監獄\nNa 鈉，遇水劇烈反應"}
            className="bg-white/80 min-h-36 font-mono text-sm mb-3" />
          <Button onClick={doPaste} variant="outline" className="font-display font-bold rounded-full border-2">
            <ClipboardPaste className="w-4 h-4" /> 讀入並整理
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="flex items-center gap-2">
              <span className="font-hand text-lg text-muted-foreground w-6 text-right shrink-0">{i + 1}.</span>
              <Input value={it.term} onChange={(e) => updateItem(it.id, { term: e.target.value })}
                placeholder="知識點（單字 / 事件 / 概念）" className="bg-white/80 flex-1" />
              <Input value={it.hint} onChange={(e) => updateItem(it.id, { hint: e.target.value })}
                placeholder="意思 / 解釋（回想目標）" className="bg-white/80 flex-1" />
              <button onClick={() => removeRow(it.id)} aria-label="刪除這行"
                className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addRow}
            className="doodle-note text-xl inline-flex items-center gap-1 mt-1 hover:text-primary transition-colors">
            <Plus className="w-4 h-4" /> 再加一行（最多 10 個）
          </button>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={create}
          className="font-display font-bold rounded-full active:scale-[0.97] transition-transform">
          建好卡包，開始任務 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
