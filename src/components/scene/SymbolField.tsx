"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Sin } from "@/types/sin";
import type { HeadState } from "@/lib/animation/sceneState";
import { SYMBOL_SHAPE } from "@/data/sinVisuals";
import { createRng } from "@/lib/particles/random";
import { symbolFragment, symbolVertex } from "@/lib/shaders/particleHead";

const COUNT = 64;

interface Props {
  sin: Sin;
  state: HeadState;
  motion: number;
}

/** 環繞角色漂浮的抽象符號（Lust 為唇形） */
export function SymbolField({ sin, state, motion }: Props) {
  const { positions, seeds } = useMemo(() => {
    const r = createRng(sin.index * 131 + 7);
    const p = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const a = r() * Math.PI * 2;
      const rad = 0.8 + r() * 1.1;
      p[i * 3] = Math.cos(a) * rad * 1.15;
      p[i * 3 + 1] = 0.03 + Math.sin(a) * rad * 0.9 - 0.2;
      p[i * 3 + 2] = -0.6 + r() * 1.2;
      s[i] = r();
    }
    return { positions: p, seeds: s };
  }, [sin.index]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uBuild: { value: 0 },
      uColor: { value: new THREE.Color(sin.palette.primary) },
      uShape: { value: SYMBOL_SHAPE[sin.slug] },
    }),
    [sin.palette.primary, sin.slug]
  );
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((s) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value = s.clock.elapsedTime * motion;
    m.uniforms.uPixelRatio.value = s.gl.getPixelRatio();
    m.uniforms.uBuild.value =
      THREE.MathUtils.smoothstep(state.build, 0.25, 0.85) * state.opacity;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={symbolVertex}
        fragmentShader={symbolFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}