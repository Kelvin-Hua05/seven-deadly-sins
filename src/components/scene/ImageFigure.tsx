"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Sin } from "@/types/sin";
import { FIGURES } from "@/data/figures";
import type { HeadState } from "@/lib/animation/sceneState";
import {
  figureCount,
  getFigureData,
  type FigureData,
} from "@/lib/particles/imageCloud";
import { figureFragment, figureVertex, shockFragment } from "@/lib/shaders/figure";
import { haloVertex } from "@/lib/shaders/particleHead";

/** 粒子整體大小；覺得太細就調大 */
const SIZE_SCALE = 1.0;

const bell = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

/** 著色器的 uVariant 編號 */
const VARIANT_ID = { flow: 0, shatter: 1, mist: 2, ascend: 3, gather: 4, twin: 5, vortex: 6 } as const;

interface Props {
  sin: Sin;
  index: number;
  state: HeadState;
  bodyCount: number;
  homeDensity: number;
  motion: number;
  /** 目前被選中（要立刻用到）時為 true：不等待錯開載入 */
  eager: boolean;
  onReady: (ready: boolean) => void;
}

/**
 * 插圖角色：首頁頭像 → 臉部特寫 → 全身。
 * 全程使用同一批粒子；首頁階段由 state.reveal 控制顯色，之後由 state.build（0–1）驅動變形。
 * 變形的風格由 FIGURES[slug].variant 決定。
 */
export function ImageFigure({
  sin,
  index,
  state,
  bodyCount,
  homeDensity,
  motion,
  eager,
  onReady,
}: Props) {
  const spec = FIGURES[sin.slug];
  const variantId = VARIANT_ID[spec?.variant ?? "flow"];
  const shatter = spec?.variant === "shatter";
  const pullY = spec?.bodyCY ?? 0;
  const [data, setData] = useState<FigureData | null>(null);

  // 七個角色都有插圖時，錯開載入，避免首頁一開始同時解碼十四張圖而卡頓
  useEffect(() => {
    if (!spec) return;
    let alive = true;
    const id = window.setTimeout(
      () => {
        void getFigureData(sin.slug, spec, figureCount(bodyCount), index + 1).then((d) => {
          if (alive && d) setData(d);
        });
      },
      eager ? 0 : index * 300
    );
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [sin.slug, spec, bodyCount, index, eager]);

  useEffect(() => {
    if (!data) return;
    onReady(true);
    return () => onReady(false);
  }, [data, onReady]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uM1: { value: 0 },
      uM2: { value: 0 },
      uMotion: { value: 1 },
      uOpacity: { value: 0 },
      uSizeScale: { value: SIZE_SCALE },
      uReveal: { value: 0 },
      uDissolve: { value: 0 },
      uDensity: { value: 0.9 },
      uVariant: { value: variantId },
      uShake: { value: new THREE.Vector3() },
      uPull: { value: new THREE.Vector3(0, pullY, 0) },
      uAccent: { value: new THREE.Color(sin.palette.primary) },
    }),
    [sin.palette.primary, variantId, pullY]
  );

  const shockUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(sin.palette.glow) },
      uR1: { value: 0 },
      uA1: { value: 0 },
      uR2: { value: 0 },
      uA2: { value: 0 },
    }),
    [sin.palette.glow]
  );

  const matRef = useRef<THREE.ShaderMaterial>(null);
  const shockMatRef = useRef<THREE.ShaderMaterial>(null);
  const shockRef = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const m = matRef.current;
    if (!m || !data) return;

    const b = state.build;
    const m1 = THREE.MathUtils.clamp(b / 0.45, 0, 1);
    const m2 = THREE.MathUtils.clamp((b - 0.4) / 0.6, 0, 1);
    const t = s.clock.elapsedTime;

    const u = m.uniforms;
    u.uTime.value = t;
    u.uPixelRatio.value = s.gl.getPixelRatio();
    u.uM1.value = m1;
    u.uM2.value = m2;
    u.uMotion.value = motion;
    u.uOpacity.value = state.opacity * state.intro * state.figure;
    u.uReveal.value = state.reveal;
    u.uDissolve.value = state.dissolve;
    // 首頁階段抽稀，接近角色頁時全開
    u.uDensity.value = THREE.MathUtils.lerp(
      Math.min(1, homeDensity * 1.3),
      1,
      state.move
    );

    // 碎裂版：拼合瞬間的震動與兩道衝擊波
    const shock = shockRef.current;
    const shm = shockMatRef.current;
    if (shatter && shock && shm) {
      const amp = 0.05 * (bell(m1, 0.8, 0.16) + bell(m2, 0.72, 0.2)) * motion;
      u.uShake.value.set(Math.sin(t * 91) * amp, Math.cos(t * 77) * amp, Math.sin(t * 63) * amp);

      const q1 = THREE.MathUtils.clamp((m1 - 0.5) / 0.5, 0, 1);
      const q2 = THREE.MathUtils.clamp((m2 - 0.4) / 0.6, 0, 1);
      const su = shm.uniforms;
      su.uR1.value = 0.08 + 0.85 * Math.pow(q1, 0.7);
      su.uA1.value = q1 > 0 && q1 < 1 ? 0.8 * (1 - q1) * THREE.MathUtils.smoothstep(q1, 0, 0.08) : 0;
      su.uR2.value = 0.08 + 0.85 * Math.pow(q2, 0.7);
      su.uA2.value = q2 > 0 && q2 < 1 ? 0.7 * (1 - q2) * THREE.MathUtils.smoothstep(q2, 0, 0.08) : 0;
      shock.visible = (su.uA1.value as number) > 0.01 || (su.uA2.value as number) > 0.01;
    }
  });

  if (!data) return null;

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.p0, 3]} />
          <bufferAttribute attach="attributes-aP1" args={[data.p1, 3]} />
          <bufferAttribute attach="attributes-aP2" args={[data.p2, 3]} />
          <bufferAttribute attach="attributes-aC1" args={[data.c1, 3]} />
          <bufferAttribute attach="attributes-aC2" args={[data.c2, 3]} />
          <bufferAttribute attach="attributes-aDelay" args={[data.delay, 2]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
          <bufferAttribute attach="attributes-aHome" args={[data.home, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={figureVertex}
          fragmentShader={figureFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {shatter && (
        <mesh ref={shockRef} position={[0, spec?.headCY ?? 0, 0.2]} visible={false}>
          <planeGeometry args={[10, 10]} />
          <shaderMaterial
            ref={shockMatRef}
            vertexShader={haloVertex}
            fragmentShader={shockFragment}
            uniforms={shockUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </>
  );
}