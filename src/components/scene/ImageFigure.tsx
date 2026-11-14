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
import { figureFragment, figureVertex } from "@/lib/shaders/figure";
import { haloVertex, scanFragment } from "@/lib/shaders/particleHead";

/** 粒子整體大小；覺得太細就調大 */
const SIZE_SCALE = 1.0;
const SPAN = 0.4;

interface Props {
  sin: Sin;
  index: number;
  state: HeadState;
  bodyCount: number;
  motion: number;
  onReady: (ready: boolean) => void;
}

/** 插圖角色：程序化頭 → 臉部特寫 → 全身，由 state.build（0–1）驅動 */
export function ImageFigure({ sin, index, state, bodyCount, motion, onReady }: Props) {
  const spec = FIGURES[sin.slug];
  const [data, setData] = useState<FigureData | null>(null);

  useEffect(() => {
    if (!spec) return;
    let alive = true;
    void getFigureData(sin.slug, spec, figureCount(bodyCount), index + 1).then((d) => {
      if (alive && d) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [sin.slug, spec, bodyCount, index]);

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
      uAccent: { value: new THREE.Color(sin.palette.primary) },
      uAccent2: { value: new THREE.Color(sin.palette.secondary) },
    }),
    [sin.palette.primary, sin.palette.secondary]
  );

  const scanUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(sin.palette.glow) },
      uAlpha: { value: 0 },
    }),
    [sin.palette.glow]
  );

  const matRef = useRef<THREE.ShaderMaterial>(null);
  const scanMatRef = useRef<THREE.ShaderMaterial>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const m = matRef.current;
    const sm = scanMatRef.current;
    const scan = scanRef.current;
    if (!m || !sm || !scan || !data) return;

    const b = state.build;
    const m1 = THREE.MathUtils.clamp(b / 0.45, 0, 1);
    const m2 = THREE.MathUtils.clamp((b - 0.4) / 0.6, 0, 1);

    const u = m.uniforms;
    u.uTime.value = s.clock.elapsedTime;
    u.uPixelRatio.value = s.gl.getPixelRatio();
    u.uM1.value = m1;
    u.uM2.value = m2;
    u.uMotion.value = motion;
    u.uOpacity.value = THREE.MathUtils.smoothstep(b, 0, 0.04) * state.opacity * state.intro;

    // 掃描線跟著第二階段的前緣由頭頂往下
    const on = m2 > 0.02 && m2 < 0.98;
    const f = THREE.MathUtils.clamp((m2 * (1 + SPAN) - SPAN / 2) / 0.88, 0, 1);
    scan.visible = on;
    scan.position.set(0, data.body.top - data.body.height * f + 0.45, 0.12);
    sm.uniforms.uAlpha.value = on ? state.opacity : 0;
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
          <bufferAttribute attach="attributes-aTone0" args={[data.tone0, 1]} />
          <bufferAttribute attach="attributes-aKind0" args={[data.kind0, 1]} />
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

      <mesh ref={scanRef} visible={false}>
        <planeGeometry args={[data.body.width * 1.15, 0.9]} />
        <shaderMaterial
          ref={scanMatRef}
          vertexShader={haloVertex}
          fragmentShader={scanFragment}
          uniforms={scanUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}