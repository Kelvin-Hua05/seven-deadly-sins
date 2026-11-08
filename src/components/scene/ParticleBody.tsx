"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Sin } from "@/types/sin";
import type { HeadState } from "@/lib/animation/sceneState";
import { BODY_STYLES, PARTICLE_STYLE } from "@/data/sinVisuals";
import { generateBodyCloud } from "@/lib/particles/proceduralBody";
import { SCAN_RANGE, SCAN_TOP } from "@/lib/sceneConfig";
import {
  bodyFragment,
  bodyVertex,
  haloVertex,
  scanFragment,
} from "@/lib/shaders/particleHead";

const BODY_SIZE = 1.4;

interface Props {
  sin: Sin;
  state: HeadState;
  count: number;
  motion: number;
}

export function ParticleBody({ sin, state, count, motion }: Props) {
  const cloud = useMemo(
    () => generateBodyCloud(count, sin.index, BODY_STYLES[sin.slug]),
    [count, sin.index, sin.slug]
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: BODY_SIZE },
      uMotion: { value: 1 },
      uScanY: { value: SCAN_TOP },
      uScanOn: { value: 0 },
      uOpacity: { value: 0 },
      uStyle: { value: PARTICLE_STYLE[sin.slug] },
      uStyleAmt: { value: 0 },
      uAccent: { value: new THREE.Color(sin.palette.primary) },
      uAccent2: { value: new THREE.Color(sin.palette.secondary) },
    }),
    [sin.palette.primary, sin.palette.secondary, sin.slug]
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
    if (!m || !sm || !scan) return;

    const scanY = SCAN_TOP - state.build * SCAN_RANGE;
    const on = state.build > 0.001 && state.build < 0.999 ? 1 : 0;

    const u = m.uniforms;
    u.uTime.value = s.clock.elapsedTime;
    u.uPixelRatio.value = s.gl.getPixelRatio();
    u.uMotion.value = motion;
    u.uScanY.value = scanY;
    u.uScanOn.value = on;
    u.uOpacity.value = state.opacity * state.intro;
    u.uStyleAmt.value = state.move * motion;

    scan.visible = on === 1;
    scan.position.set(0, scanY + 0.45, 0.12);
    sm.uniforms.uAlpha.value = on * state.opacity;
  });

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cloud.positions, 3]} />
          <bufferAttribute attach="attributes-aTone" args={[cloud.tones, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[cloud.seeds, 1]} />
          <bufferAttribute attach="attributes-aKind" args={[cloud.kinds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={bodyVertex}
          fragmentShader={bodyFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 掃描線 */}
      <mesh ref={scanRef} visible={false}>
        <planeGeometry args={[3.4, 0.9]} />
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