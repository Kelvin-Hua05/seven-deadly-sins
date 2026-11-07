"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Sin } from "@/types/sin";
import type { HeadPlacement } from "@/data/headLayout";
import type { HeadState } from "@/lib/animation/sceneState";
import { generateHeadCloud } from "@/lib/particles/proceduralHead";
import {
  haloFragment,
  haloVertex,
  headFragment,
  headVertex,
} from "@/lib/shaders/particleHead";

const BASE_SIZE = 2.6;
const lerp = THREE.MathUtils.lerp;

interface Props {
  index: number;
  sin: Sin;
  placement: HeadPlacement;
  count: number;
  state: HeadState;
  motion: number;
  onSelect: (index: number) => void;
}

export function ParticleHead({
  index,
  sin,
  placement,
  count,
  state,
  motion,
  onSelect,
}: Props) {
  const seed = index + 1;
  const cloud = useMemo(() => generateHeadCloud(count, seed), [count, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: BASE_SIZE },
      uReveal: { value: 0 },
      uMotion: { value: 1 },
      uDissolve: { value: 0 },
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

  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((s) => {
    const g = groupRef.current;
    const m = matRef.current;
    const hm = haloMatRef.current;
    const halo = haloRef.current;
    if (!g || !m || !hm || !halo) return;

    const t = s.clock.elapsedTime;
    const u = m.uniforms;
    u.uTime.value = t;
    u.uPixelRatio.value = s.gl.getPixelRatio();
    u.uReveal.value = state.reveal;
    u.uMotion.value = motion;
    u.uDissolve.value = state.dissolve;
    u.uOpacity.value = state.opacity * state.intro;

    const [bx, by, bz] = placement.position;
    const bob = Math.sin(t * 0.5 + seed * 1.7) * 0.08 * motion;
    const mv = state.move;

    g.position.set(
      lerp(bx, state.target.x, mv),
      lerp(by + bob, state.target.y, mv),
      lerp(bz, state.target.z, mv)
    );
    g.scale.setScalar(
      placement.scale * (1 + 0.08 * state.reveal + 0.85 * mv)
    );
    g.rotation.set(
      -state.lookY * 0.15,
      lerp(placement.rotY, -0.25, mv) +
        Math.sin(t * 0.3 + seed) * 0.1 * motion +
        state.lookX * 0.35,
      0
    );

    hm.uniforms.uIntensity.value =
      state.reveal * 0.55 * state.opacity * state.intro;
    halo.visible = state.reveal > 0.01;
  });

  return (
    <group
      ref={groupRef}
      position={[...placement.position]}
      scale={placement.scale}
    >
      <mesh ref={haloRef} position={[0, 0, -0.4]} visible={false}>
        <planeGeometry args={[4, 4]} />
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

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[cloud.positions, 3]}
          />
          <bufferAttribute attach="attributes-aTone" args={[cloud.tones, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[cloud.seeds, 1]} />
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

      {/* 不可見的點擊區域 */}
      <mesh
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(index);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}