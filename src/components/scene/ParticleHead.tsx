"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Sin } from "@/types/sin";
import type { HeadPlacement } from "@/data/headLayout";
import type { HeadState } from "@/lib/animation/sceneState";
import { generateHeadCloud } from "@/lib/particles/proceduralHead";
import { HALO_PLANE, SCAN_RANGE, SCAN_TOP } from "@/lib/sceneConfig";
import {
  haloFragment,
  haloVertex,
  headFragment,
  headVertex,
} from "@/lib/shaders/particleHead";
import { ParticleBody } from "./ParticleBody";
import { SymbolField } from "./SymbolField";

const HEAD_SIZE = 1.5;
const lerp = THREE.MathUtils.lerp;

interface Props {
  index: number;
  sin: Sin;
  placement: HeadPlacement;
  count: number;
  bodyCount: number;
  homeDensity: number;
  state: HeadState;
  motion: number;
  withBody: boolean;
  isActive: () => boolean;
  onSelect: (index: number) => void;
}

export function ParticleHead({
  index,
  sin,
  placement,
  count,
  bodyCount,
  homeDensity,
  state,
  motion,
  withBody,
  isActive,
  onSelect,
}: Props) {
  const seed = index + 1;
  const cloud = useMemo(() => generateHeadCloud(count, seed), [count, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: HEAD_SIZE },
      uReveal: { value: 0 },
      uMotion: { value: 1 },
      uDissolve: { value: 0 },
      uDensity: { value: 0.7 },
      uScanY: { value: SCAN_TOP },
      uScanOn: { value: 0 },
      uOpacity: { value: 0 },
      uAccent: { value: new THREE.Color(sin.palette.primary) },
      uAccent2: { value: new THREE.Color(sin.palette.secondary) },
    }),
    [sin.palette.primary, sin.palette.secondary]
  );

  const haloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(sin.palette.glow) },
      uIntensity: { value: 0 },
    }),
    [sin.palette.glow]
  );

  const anchorRef = useRef<THREE.Group>(null);
  const rotRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((s) => {
    const a = anchorRef.current;
    const r = rotRef.current;
    const m = matRef.current;
    const hm = haloMatRef.current;
    const halo = haloRef.current;
    if (!a || !r || !m || !hm || !halo) return;

    const t = s.clock.elapsedTime;
    const mv = state.move;
    const [bx, by, bz] = placement.position;

    // 錨點：只負責位置與縮放（不旋轉），光圈掛在這裡所以永遠對準頭
    const bob = Math.sin(t * 0.5 + seed * 1.7) * 0.08 * motion * (1 - mv);
    a.position.set(
      lerp(bx, state.target.x, mv),
      lerp(by + bob, state.target.y, mv),
      lerp(bz, state.target.z, mv)
    );
    a.scale.setScalar(
      lerp(placement.scale, state.targetScale, mv) *
        (1 + 0.08 * state.reveal * (1 - mv))
    );

    // 旋轉只作用在頭與身體
    r.rotation.set(
      -state.lookY * 0.12 * (1 - 0.5 * mv),
      lerp(placement.rotY, 0, mv) +
        Math.sin(t * 0.3 + seed) * lerp(0.1, 0.03, mv) * motion +
        state.lookX * lerp(0.35, 0.12, mv),
      0
    );

    const u = m.uniforms;
    u.uTime.value = t;
    u.uPixelRatio.value = s.gl.getPixelRatio();
    u.uReveal.value = state.reveal;
    u.uMotion.value = motion;
    u.uDissolve.value = state.dissolve;
    u.uOpacity.value = state.opacity * state.intro;
    u.uDensity.value = lerp(homeDensity, 1, mv);
    u.uSize.value = HEAD_SIZE * (1 + 0.4 * mv);
    u.uScanY.value = SCAN_TOP - state.build * SCAN_RANGE;
    u.uScanOn.value = state.build > 0.001 && state.build < 0.999 ? 1 : 0;

    hm.uniforms.uIntensity.value =
      state.reveal * 0.55 * (1 + 0.6 * mv) * state.opacity * state.intro;
    halo.visible = state.reveal > 0.01;
  });

  return (
    <group ref={anchorRef}>
      {/* 光圈：與頭同一深度、不旋轉，中心對準頭的視覺中心 */}
      <mesh ref={haloRef} position={[0, 0.03, 0]} renderOrder={-1} visible={false}>
        <planeGeometry args={[HALO_PLANE, HALO_PLANE]} />
        <shaderMaterial
          ref={haloMatRef}
          vertexShader={haloVertex}
          fragmentShader={haloFragment}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={rotRef}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cloud.positions, 3]} />
            <bufferAttribute attach="attributes-aTone" args={[cloud.tones, 1]} />
            <bufferAttribute attach="attributes-aSeed" args={[cloud.seeds, 1]} />
            <bufferAttribute attach="attributes-aKind" args={[cloud.kinds, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={matRef}
            vertexShader={headVertex}
            fragmentShader={headFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
        {withBody && (
          <ParticleBody sin={sin} state={state} count={bodyCount} motion={motion} />
        )}
      </group>

      {withBody && <SymbolField sin={sin} state={state} motion={motion} />}

      {/* 不可見的點擊區域 */}
      <mesh
        position={[0, 0.03, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (!isActive()) return;
          e.stopPropagation();
          onSelect(index);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (!isActive()) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}