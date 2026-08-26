import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import * as pc from "playcanvas";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Heart,
  LogIn,
  MessageCircle,
  Radio,
  Shield,
  Sparkles,
  Swords,
  Users,
  Wind,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useRealmIdentity, useRealmWorld } from "@/lib/realmWorld";

type Vec = { x: number; y: number; z: number; ry: number };
type Peer = Vec & { id: string; name: string; color: string; seenAt: number; action?: string };
type NetPacket = { type: "state" | "leave"; peer: Peer };
type GameApi = { attack: () => void; dodge: () => void; hit: () => void; interact: () => void; move: (key: string, down: boolean) => void };
type GameProps = {
  playerName: string;
  playerColor: string;
  peers: Peer[];
  enemyHealth: number;
  enemyPosition: { x: number; z: number };
  onPose: (pose: Vec & { action: string }) => void;
  onAttackRequest: () => void;
  onDodgeRequest: () => void;
  onNpcRange: (near: boolean) => void;
  onInteract: () => void;
  registerApi: (api: GameApi | null) => void;
};

const PLAYER_COLORS = ["#55e6c1", "#ffbb55", "#ff6e9b", "#7da6ff"];
const initialRoom = new URLSearchParams(window.location.search).get("room")?.slice(0, 12).toUpperCase() || "LINGUA";

function useRoom(room: string, name: string, color: string, connected: boolean, actorId: string) {
  const pose = useRef<Vec & { action: string }>({ x: 0, y: 0, z: 8, ry: 180, action: "idle" });
  const [peers, setPeers] = useState<Peer[]>([]);
  const [transport, setTransport] = useState<"offline" | "local" | "supabase">("offline");

  const updatePose = useCallback((next: Vec & { action: string }) => {
    pose.current = next;
  }, []);

  useEffect(() => {
    if (!connected) {
      setPeers([]);
      setTransport("offline");
      return;
    }
    const channelName = `memgenius-realm-${room.toLowerCase()}`;
    const local = new BroadcastChannel(channelName);
    let cloud: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    let cloudReady = false;
    let closed = false;

    const accept = (packet: NetPacket) => {
      if (!packet?.peer || packet.peer.id === actorId) return;
      setPeers(current => {
        if (packet.type === "leave") return current.filter(item => item.id !== packet.peer.id);
        const next = current.filter(item => item.id !== packet.peer.id);
        if (next.length >= 3) return next;
        return [...next, { ...packet.peer, seenAt: Date.now() }];
      });
    };
    local.onmessage = event => accept(event.data as NetPacket);

    if (isSupabaseConfigured && supabase) {
      cloud = supabase.channel(channelName, { config: { broadcast: { self: false } } });
      cloud.on("broadcast", { event: "pose" }, payload => accept(payload.payload as NetPacket));
      cloud.subscribe(status => {
        if (!closed && status === "SUBSCRIBED") {
          cloudReady = true;
          setTransport("supabase");
        }
      });
    } else {
      setTransport("local");
    }

    const packet = (type: NetPacket["type"]): NetPacket => ({
      type,
      peer: { id: actorId, name, color, ...pose.current, seenAt: Date.now() },
    });
    const send = (type: NetPacket["type"]) => {
      const next = packet(type);
      local.postMessage(next);
      if (cloudReady) void cloud?.send({ type: "broadcast", event: "pose", payload: next });
    };
    send("state");
    const timer = window.setInterval(() => {
      send("state");
      setPeers(current => current.filter(item => Date.now() - item.seenAt < 3500));
    }, 100);

    return () => {
      closed = true;
      send("leave");
      window.clearInterval(timer);
      local.close();
      if (cloud && supabase) void supabase.removeChannel(cloud);
    };
  }, [room, name, color, connected, actorId]);

  return { peers, transport, updatePose };
}

function material(color: string, emissive?: string) {
  const value = new pc.StandardMaterial();
  value.diffuse = new pc.Color().fromString(color);
  value.metalness = 0.08;
  value.gloss = 0.34;
  if (emissive) {
    value.emissive = new pc.Color().fromString(emissive);
    value.emissiveIntensity = 1.8;
  }
  value.update();
  return value;
}

function primitive(
  name: string,
  type: "box" | "sphere" | "capsule" | "cylinder" | "cone" | "plane",
  scale: [number, number, number],
  position: [number, number, number],
  mat: pc.StandardMaterial,
  parent: pc.Entity,
) {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type });
  entity.setLocalScale(...scale);
  entity.setLocalPosition(...position);
  (entity.render as pc.RenderComponent).material = mat;
  entity.render!.castShadows = true;
  parent.addChild(entity);
  return entity;
}

function createDiplomat(name: string, color: string, parent: pc.Entity) {
  const root = new pc.Entity(name);
  parent.addChild(root);
  const cloth = material(color);
  const dark = material("#142b32");
  const skin = material("#edbea0");
  const gold = material("#f7c66b", "#7d4d0a");
  primitive("body", "capsule", [0.72, 1.15, 0.58], [0, 1.35, 0], cloth, root);
  primitive("head", "sphere", [0.48, 0.52, 0.48], [0, 2.55, 0], skin, root);
  primitive("hair", "sphere", [0.52, 0.28, 0.51], [0, 2.83, -0.02], dark, root);
  primitive("crest", "cone", [0.36, 0.55, 0.36], [0, 3.18, 0], cloth, root);
  const leftArm = primitive("left-arm", "capsule", [0.22, 0.7, 0.22], [-0.72, 1.55, 0], cloth, root);
  const rightArm = primitive("right-arm", "capsule", [0.22, 0.7, 0.22], [0.72, 1.55, 0], cloth, root);
  const leftLeg = primitive("left-leg", "capsule", [0.25, 0.76, 0.25], [-0.28, 0.42, 0], dark, root);
  const rightLeg = primitive("right-leg", "capsule", [0.25, 0.76, 0.25], [0.28, 0.42, 0], dark, root);
  const sword = primitive("sword", "box", [0.08, 1.05, 0.08], [0.94, 1.25, 0.05], gold, root);
  sword.setLocalEulerAngles(0, 0, -18);
  return { root, leftArm, rightArm, leftLeg, rightLeg, sword };
}

function PlayCanvasWorld({
  playerName,
  playerColor,
  peers,
  enemyHealth,
  enemyPosition,
  onPose,
  onAttackRequest,
  onDodgeRequest,
  onNpcRange,
  onInteract,
  registerApi,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peersRef = useRef(peers);
  const enemyHealthRef = useRef(enemyHealth);
  const enemyPositionRef = useRef(enemyPosition);
  const callbacks = useRef({ onPose, onAttackRequest, onDodgeRequest, onNpcRange, onInteract });
  useEffect(() => { peersRef.current = peers; }, [peers]);
  useEffect(() => { enemyHealthRef.current = enemyHealth; }, [enemyHealth]);
  useEffect(() => { enemyPositionRef.current = enemyPosition; }, [enemyPosition]);
  useEffect(() => { callbacks.current = { onPose, onAttackRequest, onDodgeRequest, onNpcRange, onInteract }; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const app = new pc.Application(canvas, { mouse: new pc.Mouse(canvas), touch: new pc.TouchDevice(canvas) });
    app.setCanvasFillMode(pc.FILLMODE_NONE);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.scene.ambientLight = new pc.Color(0.16, 0.27, 0.31);
    app.scene.fog.type = pc.FOG_LINEAR;
    app.scene.fog.color = new pc.Color(0.025, 0.09, 0.12);
    app.scene.fog.start = 18;
    app.scene.fog.end = 37;

    const groundMat = material("#153b38");
    const stoneMat = material("#31555a");
    const woodMat = material("#6b4d35");
    const leafMat = material("#1b6858");
    const tealGlow = material("#64ead0", "#2f9f8d");
    const danger = material("#a72d4d", "#6d0c27");
    const ivory = material("#e9d9ac");
    const root = app.root;

    primitive("island", "box", [27, 0.7, 20], [0, -0.48, 0], groundMat, root);
    primitive("central-road", "box", [5.2, 0.12, 19], [0, -0.05, 0], stoneMat, root);
    primitive("cross-road", "box", [22, 0.13, 3.4], [0, -0.04, -5.4], stoneMat, root);
    for (let i = 0; i < 18; i += 1) {
      const x = ((i * 7.1) % 23) - 11.5;
      const z = ((i * 5.7) % 17) - 8.5;
      if (Math.abs(x) < 3 || (z < -4 && z > -7)) continue;
      const tree = new pc.Entity(`tree-${i}`);
      tree.setPosition(x, 0, z);
      root.addChild(tree);
      primitive("trunk", "cylinder", [0.28, 1.3, 0.28], [0, 0.65, 0], woodMat, tree);
      primitive("crown", "cone", [1.05, 2.25, 1.05], [0, 2.05, 0], leafMat, tree);
    }
    [-9, 9].forEach((x, side) => {
      const embassy = new pc.Entity(`embassy-${side}`);
      embassy.setPosition(x, 0, -5.6);
      root.addChild(embassy);
      primitive("hall", "box", [4.3, 2.9, 3.1], [0, 1.45, 0], side ? material("#4a344b") : material("#364c57"), embassy);
      primitive("roof", "cone", [3.2, 1.7, 3.2], [0, 3.7, 0], side ? material("#b85878") : tealGlow, embassy);
      primitive("door", "box", [0.8, 1.7, 0.25], [0, 0.85, 1.58], woodMat, embassy);
    });
    for (let i = -2; i <= 2; i += 1) {
      primitive(`lantern-${i}`, "cylinder", [0.16, 1.6, 0.16], [i * 4.1, 0.8, -3.2], woodMat, root);
      primitive(`light-${i}`, "sphere", [0.32, 0.32, 0.32], [i * 4.1, 2.15, -3.2], tealGlow, root);
    }

    const camera = new pc.Entity("camera");
    camera.addComponent("camera", { clearColor: new pc.Color(0.02, 0.08, 0.11), farClip: 80, fov: 48 });
    camera.camera!.toneMapping = pc.TONEMAP_ACES;
    camera.setPosition(0, 12, 18);
    root.addChild(camera);
    const sun = new pc.Entity("sun");
    sun.addComponent("light", { type: "directional", color: new pc.Color(0.76, 0.92, 0.88), intensity: 1.8, castShadows: true });
    sun.setEulerAngles(48, -32, 0);
    root.addChild(sun);

    const player = createDiplomat(playerName, playerColor, root);
    player.root.setPosition(0, 0, 8);
    const npc = createDiplomat("NPC-沈蘭舟", "#d7a64c", root);
    npc.root.setPosition(8.4, 0, -5.2);
    npc.root.setEulerAngles(0, -90, 0);
    primitive("npc-aura", "cylinder", [1.35, 0.04, 1.35], [8.4, 0.05, -5.2], tealGlow, root);

    const enemy = new pc.Entity("霧魘");
    root.addChild(enemy);
    enemy.setPosition(-7, 0, 2);
    primitive("enemy-body", "sphere", [0.95, 1.15, 0.95], [0, 1.1, 0], danger, enemy);
    primitive("enemy-head", "cone", [0.8, 1.35, 0.8], [0, 2.1, 0], danger, enemy);
    primitive("enemy-eye-l", "sphere", [0.12, 0.12, 0.12], [-0.28, 1.35, 0.8], ivory, enemy);
    primitive("enemy-eye-r", "sphere", [0.12, 0.12, 0.12], [0.28, 1.35, 0.8], ivory, enemy);

    const keys = new Set<string>();
    const remoteEntities = new Map<string, ReturnType<typeof createDiplomat>>();
    let action = "idle";
    let actionUntil = 0;
    let npcNear = false;
    let elapsed = 0;
    let lastPose = 0;
    const vec = new pc.Vec3();

    const setAction = (next: string, duration: number) => {
      action = next;
      actionUntil = performance.now() + duration;
    };
    const attack = () => {
      setAction("attack", 480);
      if (enemyHealthRef.current <= 0 || player.root.getPosition().distance(enemy.getPosition()) > 2.55) return;
      callbacks.current.onAttackRequest();
      enemy.setLocalScale(1.3, 0.72, 1.3);
      window.setTimeout(() => enemyHealthRef.current > 0 && enemy.setLocalScale(1, 1, 1), 120);
    };
    const dodge = () => {
      setAction("dodge", 650);
      callbacks.current.onDodgeRequest();
      const forward = player.root.forward.clone().mulScalar(-2.3);
      player.root.translate(forward);
    };
    const interact = () => {
      if (!npcNear || enemyHealthRef.current > 0) return;
      setAction("talk", 850);
      callbacks.current.onInteract();
    };
    const step = (key: string) => {
      const taps: Record<string, [number, number]> = { w: [0, -0.38], arrowup: [0, -0.38], s: [0, 0.38], arrowdown: [0, 0.38], a: [-0.38, 0], arrowleft: [-0.38, 0], d: [0.38, 0], arrowright: [0.38, 0] };
      const delta = taps[key];
      if (!delta) return;
      const position = player.root.getPosition();
      player.root.setPosition(pc.math.clamp(position.x + delta[0], -12.3, 12.3), 0, pc.math.clamp(position.z + delta[1], -8.8, 8.8));
    };
    const move = (key: string, down: boolean) => {
      if (down) { keys.add(key); step(key); }
      else keys.delete(key);
    };
    registerApi({ attack, dodge, hit: () => setAction("hit", 420), interact, move });

    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        keys.add(key);
        if (!event.repeat) step(key);
      }
      if (!event.repeat && key === "j") attack();
      if (!event.repeat && key === "e") interact();
      if (!event.repeat && event.code === "Space") { event.preventDefault(); dodge(); }
    };
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = Math.max(1, parent.clientWidth * Math.min(devicePixelRatio, 1.5));
      canvas.height = Math.max(1, parent.clientHeight * Math.min(devicePixelRatio, 1.5));
      app.resizeCanvas(canvas.width, canvas.height);
    };
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    resize();

    const handle = app.on("update", (dt: number) => {
      elapsed += dt;
      const now = performance.now();
      if (now > actionUntil) action = "idle";
      const dx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
      const dz = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
      if ((dx || dz) && action !== "dodge") {
        vec.set(dx, 0, dz).normalize().mulScalar(dt * 5.2);
        player.root.translate(vec);
        const position = player.root.getPosition();
        player.root.setPosition(pc.math.clamp(position.x, -12.3, 12.3), 0, pc.math.clamp(position.z, -8.8, 8.8));
        player.root.setEulerAngles(0, Math.atan2(dx, dz) * pc.math.RAD_TO_DEG, 0);
        action = "run";
      }
      const phase = elapsed * (action === "run" ? 11 : 3);
      const stride = action === "run" ? Math.sin(phase) * 38 : Math.sin(phase) * 3;
      player.leftArm.setLocalEulerAngles(stride, 0, 0);
      player.rightArm.setLocalEulerAngles(action === "attack" ? -105 : -stride, 0, action === "talk" ? -58 : 0);
      player.leftLeg.setLocalEulerAngles(-stride, 0, 0);
      player.rightLeg.setLocalEulerAngles(stride, 0, 0);
      player.sword.setLocalEulerAngles(action === "attack" ? 78 : 0, 0, action === "attack" ? -70 : -18);
      player.root.setLocalScale(1, action === "dodge" ? 0.68 : 1, 1);

      const enemyAlive = enemyHealthRef.current > 0;
      enemy.enabled = enemyAlive;
      if (enemyAlive) {
        const targetX = enemyPositionRef.current.x;
        const targetZ = enemyPositionRef.current.z;
        const enemyPos = enemy.getPosition();
        enemy.setPosition(pc.math.lerp(enemyPos.x, targetX, dt * 7), 0.08 + Math.sin(elapsed * 5) * 0.08, pc.math.lerp(enemyPos.z, targetZ, dt * 7));
        enemy.rotateLocal(0, dt * 36, 0);
      }

      const near = player.root.getPosition().distance(npc.root.getPosition()) < 2.45;
      if (near !== npcNear) {
        npcNear = near;
        callbacks.current.onNpcRange(near);
      }
      npc.leftArm.setLocalEulerAngles(0, 0, Math.sin(elapsed * 2) * 5 - 18);
      npc.rightArm.setLocalEulerAngles(0, 0, -Math.sin(elapsed * 2) * 5 + 18);

      const p = player.root.getPosition();
      const desired = new pc.Vec3(p.x, 10.5, p.z + 13.5);
      camera.setPosition(camera.getPosition().lerp(camera.getPosition(), desired, 0.07));
      camera.lookAt(p.x, 1.2, p.z - 1.8);
      if (now - lastPose > 90) {
        lastPose = now;
        callbacks.current.onPose({ x: p.x, y: p.y, z: p.z, ry: player.root.getEulerAngles().y, action });
      }

      const active = new Set(peersRef.current.map(peer => peer.id));
      remoteEntities.forEach((rig, peerId) => {
        if (!active.has(peerId)) { rig.root.destroy(); remoteEntities.delete(peerId); }
      });
      peersRef.current.forEach(peer => {
        let rig = remoteEntities.get(peer.id);
        if (!rig) {
          rig = createDiplomat(peer.name, peer.color, root);
          remoteEntities.set(peer.id, rig);
        }
        const current = rig.root.getPosition();
        rig.root.setPosition(pc.math.lerp(current.x, peer.x, 0.28), 0, pc.math.lerp(current.z, peer.z, 0.28));
        rig.root.setEulerAngles(0, peer.ry, 0);
        const remoteStride = peer.action === "run" ? Math.sin(elapsed * 11) * 38 : 0;
        rig.leftLeg.setLocalEulerAngles(-remoteStride, 0, 0);
        rig.rightLeg.setLocalEulerAngles(remoteStride, 0, 0);
        rig.leftArm.setLocalEulerAngles(remoteStride, 0, 0);
        rig.rightArm.setLocalEulerAngles(peer.action === "attack" ? -105 : -remoteStride, 0, 0);
      });
    });
    app.start();

    return () => {
      registerApi(null);
      handle.off();
      observer.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      app.destroy();
    };
  }, [playerColor, playerName, registerApi]);

  return <canvas ref={canvasRef} aria-label="PlayCanvas 語界仙盟可探索世界" />;
}

const branches = [
  { id: "listen", label: "先傾聽證詞", text: "請把你親眼看見的情況告訴我，我會先確認每個關鍵詞。", trust: 48, tension: 54 },
  { id: "verify", label: "要求雙向回譯", text: "我會把雙方意思重述一次，再請各位確認是否一致。", trust: 58, tension: 45 },
  { id: "pressure", label: "指出矛盾施壓", text: "這份譯文與現場證據矛盾，請立即交出原始訊息。", trust: 32, tension: 74 },
];

const skills = [
  { id: "mirror", name: "鏡語回譯", line: "The route is compromised—not surrendered. 路線遭到破壞，不代表投降。" },
  { id: "empathy", name: "文化共感", line: "誤譯讓每一方都受傷；我們先確認共同想保護的人。" },
  { id: "pressure", name: "威信施壓", line: "以盟約第七條要求各方立即退讓。" },
];

export default function RealmPlayCanvas() {
  const identity = useRealmIdentity();
  const actorId = identity.actorId ?? "identity-pending";
  const [name, setName] = useState(() => localStorage.getItem("realm-pc-name") || `靈語使${Math.floor(Math.random() * 90 + 10)}`);
  const [draftName, setDraftName] = useState(name);
  const [draftRoom, setDraftRoom] = useState(initialRoom);
  const [room, setRoom] = useState(initialRoom);
  const [connected, setConnected] = useState(true);
  const color = useMemo(() => PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)], []);
  const identityReady = Boolean(identity.actorId) && identity.status !== "error";
  const { peers, transport, updatePose } = useRoom(room, name, color, connected && identityReady, actorId);
  const { world, self, status: authorityStatus, memberCount, isOwner, error: worldError, pending, act, syncPose } = useRealmWorld(room, identity.actorId, name, connected && identityReady);
  const authorityError = identity.error ?? worldError;
  const api = useRef<GameApi | null>(null);
  const [nearNpc, setNearNpc] = useState(false);
  const [dialogueDismissed, setDialogueDismissed] = useState(false);
  const [battleLog, setBattleLog] = useState("前往紅色霧魘巡邏區，先完成戰鬥。 ");
  const [copied, setCopied] = useState(false);
  const enemyHealth = world.enemy_health;
  const enemyDefeated = enemyHealth <= 0;
  const dialogueOpen = ["dialogue", "diplomacy"].includes(world.quest_stage) && !dialogueDismissed;
  const branch = branches.find(item => item.id === world.dialogue_branch) ?? null;
  const trust = world.trust;
  const tension = world.tension;
  const won = world.won;
  const health = self.health;
  const previousHealth = useRef(health);
  const registerApi = useCallback((value: GameApi | null) => { api.current = value; }, []);

  const poseUpdate = useCallback((pose: Vec & { action: string }) => {
    updatePose(pose);
    syncPose(pose);
  }, [syncPose, updatePose]);
  const npcRange = useCallback((near: boolean) => setNearNpc(near), []);
  const openDialogue = useCallback(() => {
    void act("open_dialogue");
  }, [act]);
  const requestAttack = useCallback(() => {
    void act("attack");
  }, [act]);
  const requestDodge = useCallback(() => {
    void act("dodge");
  }, [act]);

  useEffect(() => {
    if (health < previousHealth.current) api.current?.hit();
    previousHealth.current = health;
  }, [health]);

  useEffect(() => {
    setDialogueDismissed(false);
    const actor = world.last_actor_name || "隊伍";
    if (world.last_action === "world_created") setBattleLog("共同世界已建立。前往巡邏區迎戰霧魘。");
    else if (world.last_action === "attack_hit") setBattleLog(world.enemy_health === 0 ? `${actor} 完成最後一擊，霧魘已淨化！` : `${world.last_combat_result}；共享生命剩餘 ${world.enemy_health}%。`);
    else if (world.last_action === "attack_miss") setBattleLog(world.last_combat_result);
    else if (world.last_action === "enemy_hit") setBattleLog(`${world.last_combat_result}。霧魘正鎖定 ${world.enemy_target_name ?? "隊伍"}。`);
    else if (world.last_action === "enemy_evaded") setBattleLog(`${world.last_combat_result}！伺服器已判定本次攻擊無效。`);
    else if (world.last_action === "dodge") setBattleLog(`${actor} 進入 0.7 秒伺服器閃避窗口。`);
    else if (world.last_action === "open_dialogue") setBattleLog(`${actor} 代表隊伍開啟了沈蘭舟的共同對話。`);
    else if (world.last_action.startsWith("choose_branch:")) setBattleLog(`${actor} 選擇了共同開場立場，外交局勢已同步。`);
    else if (world.last_action.startsWith("skill:")) setBattleLog(world.won ? `${actor} 完成外交協定，全隊通關！` : `${actor} 施放外交技能，信任 ${world.trust}／緊張 ${world.tension}。`);
    else if (world.last_action === "reset") setBattleLog(`${actor} 重置了共同世界。`);
  }, [world.version, world.last_action, world.last_actor_name, world.last_combat_result, world.enemy_health, world.enemy_target_name, world.trust, world.tension, world.won]);

  useEffect(() => {
    if (authorityError) setBattleLog(authorityError);
  }, [authorityError]);

  function joinRoom() {
    const next = draftRoom.replace(/[^A-Za-z0-9-]/g, "").slice(0, 12).toUpperCase();
    if (!next || !draftName.trim()) return;
    localStorage.setItem("realm-pc-name", draftName.trim());
    setName(draftName.trim());
    setRoom(next);
    setDraftRoom(next);
    setConnected(true);
    window.history.replaceState(null, "", `${window.location.pathname}?room=${next}`);
  }

  function chooseBranch(item: (typeof branches)[number]) {
    void act("choose_branch", item.id);
  }

  function useSkill(index: number) {
    void act("skill", skills[index].id);
  }

  function copyInvite() {
    const url = `${window.location.origin}${window.location.pathname}?room=${room}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  const stage = ({ combat: 0, npc: 1, dialogue: 2, diplomacy: 3, complete: 4 } as const)[world.quest_stage];

  return (
    <main className="rpc-shell" style={{ "--player": color } as React.CSSProperties}>
      <header className="rpc-topbar">
        <Link href="/realm-diplomacy"><ArrowLeft size={17} /> R3F 原型</Link>
        <div className="rpc-brand"><Sparkles size={18} /><b>語界仙盟</b><span>PLAYCANVAS VERTICAL SLICE</span></div>
        <div className="rpc-vitals"><span><Heart size={15} /> {health}</span><span><Shield size={15} /> {won ? 130 : 100}</span></div>
      </header>

      <section className="rpc-stage">
        <div className="rpc-viewport">
          <PlayCanvasWorld
            playerName={name}
            playerColor={color}
            peers={peers}
            enemyHealth={enemyHealth}
            enemyPosition={{ x: world.enemy_x, z: world.enemy_z }}
            onPose={poseUpdate}
            onAttackRequest={requestAttack}
            onDodgeRequest={requestDodge}
            onNpcRange={npcRange}
            onInteract={openDialogue}
            registerApi={registerApi}
          />
          <div className="rpc-engine-badge"><i /> PLAYCANVAS ENGINE 2.21</div>
          <div className={`rpc-authority-badge ${authorityStatus}`}>
            <Shield size={12} />
            {authorityStatus === "server" ? `SERVER AUTH · v${world.version}` : authorityStatus === "connecting" ? "連接權威世界…" : authorityStatus === "local" ? "本機模擬" : "同步錯誤"}
          </div>
          <div className="rpc-objective">
            <small>霧港協定 · 垂直切片</small>
            <b>{won ? "外交協定已簽署" : enemyDefeated ? "與沈蘭舟交涉" : "淨化巡邏霧魘"}</b>
            <div>{["戰鬥", "接觸", "分支", "外交", "完成"].map((label, index) => <span key={label} className={index <= stage ? "active" : ""}>{index < stage ? "✓" : index + 1} {label}</span>)}</div>
          </div>
          <div className="rpc-log">{battleLog}</div>
          <div className="rpc-controls"><span>WASD 移動</span><span>J 攻擊</span><span>Space 閃避</span><span>E 交談</span></div>
          <div className="rpc-action-buttons">
            <button disabled={pending || authorityStatus === "connecting" || health <= 0} onClick={() => api.current?.attack()}><Swords size={18} />攻擊</button>
            <button disabled={pending || health <= 0} onClick={() => api.current?.dodge()}><Wind size={18} />閃避</button>
            <button disabled={pending || !nearNpc || !enemyDefeated} onClick={() => api.current?.interact()}><MessageCircle size={18} />交談</button>
          </div>
          <div className="rpc-dpad">
            {[["▲", "w"], ["◀", "a"], ["▼", "s"], ["▶", "d"]].map(([label, key]) => <button key={key} onPointerDown={() => api.current?.move(key, true)} onPointerUp={() => api.current?.move(key, false)} onPointerLeave={() => api.current?.move(key, false)}>{label}</button>)}
          </div>
        </div>

        <aside className="rpc-sidebar">
          <section className="rpc-room">
            <header><div><Radio size={17} /><b>權威共同世界</b></div><span className={authorityStatus === "server" ? "online" : ""}>{authorityStatus === "server" ? "伺服器裁決" : authorityStatus === "connecting" ? "連線中" : authorityStatus === "local" ? "本機模擬" : "需要重連"}</span></header>
            <div className="rpc-room-form"><input aria-label="玩家名稱" value={draftName} maxLength={14} onChange={event => setDraftName(event.target.value)} /><input aria-label="房號" value={draftRoom} maxLength={12} onChange={event => setDraftRoom(event.target.value.toUpperCase())} /><button onClick={joinRoom}><LogIn size={15} />加入</button></div>
            <div className="rpc-room-code"><div><small>房號</small><b>{room}</b></div><button onClick={copyInvite}><Copy size={14} />{copied ? "已複製" : "邀請"}</button></div>
            <p className={`rpc-identity-note ${identity.status}`}><Shield size={13} />{identity.status === "anonymous" ? `匿名玩家已驗證 · ${actorId.slice(0, 8)}` : identity.status === "authenticated" ? `帳號玩家已驗證 · ${actorId.slice(0, 8)}` : identity.status === "local" ? "本機臨時身分" : identity.status === "error" ? identity.error : "正在取得安全玩家身分…"}</p>
            <div className="rpc-party"><small><Users size={14} />隊伍 {Math.min(4, Math.max(memberCount, peers.length + 1))} / 4</small><div><span style={{ background: color }}>{name.slice(0, 1)}</span><b>{name}</b><em>{isOwner ? "房主" : "你"}</em></div>{peers.map(peer => <div key={peer.id}><span style={{ background: peer.color }}>{peer.name.slice(0, 1)}</span><b>{peer.name}</b><em>{peer.action === "run" ? "移動中" : "在線"}</em></div>)}{Array.from({ length: Math.max(0, 3 - peers.length) }, (_, index) => <div className="empty" key={index}><span>+</span><b>等待盟友加入</b></div>)}</div>
            {authorityStatus === "local" && <p className="rpc-network-note">目前為本機狀態機；設定 Supabase 後會自動切換成資料庫權威裁決。</p>}
            {authorityStatus === "error" && <p className="rpc-network-note error">{authorityError} 請更換房號後重新加入。</p>}
            {authorityStatus === "server" && <p className="rpc-network-note success">身分、位置、距離、命中、閃避與敵人 AI 由伺服器裁決；動畫透過 {transport === "supabase" ? "Realtime" : "本機頻道"} 平滑呈現。</p>}
          </section>

          <section className="rpc-quest-card">
            <header><small>共享敵人 · 霧魘</small><b>{enemyHealth > 0 ? `${enemyHealth}%` : "全隊已淨化"}</b></header>
            <i><em style={{ width: `${enemyHealth}%` }} /></i>
            <p>{enemyHealth > 0 ? `仇恨目標：${world.enemy_target_name ?? "巡邏中"} · 座標 ${world.enemy_x.toFixed(1)}, ${world.enemy_z.toFixed(1)}` : "最後一擊已為全隊解鎖 NPC。"}</p>
          </section>

          <section className="rpc-animation-card">
            <small>角色動畫狀態</small>
            <div>{["待機", "跑步", "攻擊", "閃避", "受擊", "交談"].map(item => <span key={item}>{item}</span>)}</div>
          </section>
        </aside>
      </section>

      {dialogueOpen && !won && (
        <div className="rpc-modal-backdrop">
          <section className="rpc-dialogue-modal">
            <header><div className="rpc-npc-avatar">沈</div><div><small>共同 NPC 對話 · 全隊同步</small><h2>沈蘭舟</h2></div><button aria-label="關閉對話" onClick={() => setDialogueDismissed(true)}>×</button></header>
            {!branch ? <>
              <blockquote>「商隊把 compromised 譯成『接受妥協』，雙方已開始集結。靈語使，你準備如何開口？」</blockquote>
              <div className="rpc-branches">{branches.map(item => <button disabled={pending} key={item.id} onClick={() => chooseBranch(item)}><b>{item.label}</b><span>「{item.text}」</span></button>)}</div>
            </> : <>
              <div className="rpc-duel-title"><div><small>全隊外交技能戰 · v{world.version}</small><h3>校正「compromised」的邊境語意</h3></div><button disabled={pending} onClick={() => void act("choose_branch", "verify")}>採用雙向回譯</button></div>
              <div className="rpc-meters"><label>信任 <i><em style={{ width: `${trust}%` }} /></i><b>{trust}</b></label><label>緊張 <i className="danger"><em style={{ width: `${tension}%` }} /></i><b>{tension}</b></label></div>
              <div className="rpc-skills">{skills.map((skill, index) => <button disabled={pending} key={skill.name} onClick={() => useSkill(index)}><span>{index + 1}</span><div><b>{skill.name}</b><small>{skill.line}</small></div></button>)}</div>
              <p className="rpc-win-rule">勝利條件：信任 ≥ 82 且緊張 ≤ 25</p>
            </>}
          </section>
        </div>
      )}

      {won && <div className="rpc-victory"><CheckCircle2 size={34} /><div><small>AUTHORITATIVE WORLD CLEAR · v{world.version}</small><h2>《霧港共同譯文》已由全隊簽署</h2><p>{world.last_actor_name} 完成最後一次有效行動；所有玩家已取得同一通關狀態。</p></div><button disabled={!isOwner || pending} title={isOwner ? "重置全隊進度" : "只有房主能重置"} onClick={() => void act("reset")}>{isOwner ? "重置共同世界" : "等待房主重置"}</button></div>}
    </main>
  );
}
