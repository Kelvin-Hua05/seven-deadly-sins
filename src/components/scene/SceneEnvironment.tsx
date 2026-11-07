"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createRng } from "@/lib/particles/random";
import { dustFragment, dustVertex } from "@/lib/shaders/particleHead";

const DUST = 500;

export function SceneEnvironment({ motion }: { motion: number }) {
  const { positions, seeds } = useMemo(() => {
    const r = createRng(42);
    const p = new Float32Array(DUST * 3);
    const s = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      p[i * 3] = (r() - 0.5) * 20;
      p[i * 3 + 1] = (r() - 0.5) * 11;
      p[i * 3 + 2] = -7 + r() * 11;
      s[i] = r();
    }
    return { positions: p, seeds: s };
  }, []);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    []
  );
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((s) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value = s.clock.elapsedTime * motion;
    m.uniforms.uPixelRatio.value = s.gl.getPixelRatio();
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}