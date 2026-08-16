import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/** 首帧偵測：真正 render 出畫面後才回報，避免進度條提前跳到 100%。 */
function FirstFrameReporter({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  const frames = useRef(0);
  useFrame(() => {
    if (fired.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      fired.current = true;
      onReady?.();
    }
  });
  return null;
}

function Coach({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.position.y = Math.sin(t * 1.45) * 0.09;
    group.current.rotation.y = pointer.x * 0.18 + Math.sin(t * 0.45) * 0.08;
    group.current.rotation.x = pointer.y * -0.05;
    if (mouth.current) mouth.current.scale.y = active ? 0.55 + Math.abs(Math.sin(t * 11)) * 1.7 : 0.45;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.35, 0]} castShadow><sphereGeometry args={[0.62, 48, 48]} /><meshStandardMaterial color="#dce8e9" roughness={0.28} metalness={0.08} /></mesh>
      <mesh position={[-0.2, 0.42, 0.56]}><sphereGeometry args={[0.055, 20, 20]} /><meshBasicMaterial color="#75e9f2" toneMapped={false} /></mesh>
      <mesh position={[0.2, 0.42, 0.56]}><sphereGeometry args={[0.055, 20, 20]} /><meshBasicMaterial color="#75e9f2" toneMapped={false} /></mesh>
      <mesh ref={mouth} position={[0, 0.18, 0.595]}><boxGeometry args={[0.18, 0.035, 0.025]} /><meshBasicMaterial color="#a7ff68" toneMapped={false} /></mesh>
      <mesh position={[0, -0.62, -0.05]} castShadow><capsuleGeometry args={[0.42, 0.78, 10, 28]} /><meshStandardMaterial color="#08131c" roughness={0.42} metalness={0.55} /></mesh>
      <pointLight position={[0, 0.35, 0.8]} color={active ? "#a7ff68" : "#75e9f2"} intensity={active ? 4 : 2.1} distance={4} />
    </group>
  );
}

function Rings({ active }: { active: boolean }) {
  const rings = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!rings.current) return;
    const pulse = active ? 1 + Math.sin(clock.getElapsedTime() * 8) * 0.06 : 1;
    rings.current.scale.setScalar(pulse);
    rings.current.rotation.z = clock.getElapsedTime() * 0.08;
  });
  return <group ref={rings} rotation={[Math.PI / 2, 0, 0]}>{[1.05, 1.55, 2.05].map((radius, index) => <mesh key={radius}><torusGeometry args={[radius, 0.008 + index * 0.003, 10, 96]} /><meshBasicMaterial color={index === 1 ? "#a7ff68" : "#75e9f2"} transparent opacity={0.18 - index * 0.035} toneMapped={false} /></mesh>)}</group>;
}

export default function ShadowCoach3D({ active, onContextReady, onFirstFrame }: { active: boolean; onContextReady?: () => void; onFirstFrame?: () => void }) {
  const canUseWebGL = useMemo(() => {
    try { const canvas = document.createElement("canvas"); return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch { return false; }
  }, []);

  // WebGL 不可用時：立刻回報就緒，讓載入畫面不會卡住。
  useEffect(() => {
    if (canUseWebGL) return;
    onContextReady?.();
    onFirstFrame?.();
  }, [canUseWebGL, onContextReady, onFirstFrame]);

  if (!canUseWebGL) return <div className={`se-coach ${active ? "is-talking" : ""}`}><div className="se-head"><i /><span /></div><div className="se-body" /></div>;
  return <Canvas className="se-canvas" dpr={[1, 1.6]} camera={{ position: [0, 0.1, 4.4], fov: 38 }} gl={{ antialias: true, alpha: true }} onCreated={() => onContextReady?.()}>
    <ambientLight intensity={0.7} /><directionalLight position={[2, 3, 4]} intensity={2.2} color="#dffcff" /><Coach active={active} /><Rings active={active} /><FirstFrameReporter onReady={onFirstFrame} />
  </Canvas>;
}
