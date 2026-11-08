"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import type { DeviceCapability } from "@/hooks/useDeviceCapability";
import { FloatingHeads } from "./FloatingHeads";
import { SceneEnvironment } from "./SceneEnvironment";

interface Props {
  slugIndex: number;
  cap: DeviceCapability;
  reducedMotion: boolean;
  onEnter: (slug: string) => void;
}

export default function MainScene({ slugIndex, cap, reducedMotion, onEnter }: Props) {
  const [degraded, setDegraded] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  return (
    <Canvas
      className="absolute inset-0"
      dpr={degraded ? 1 : [1, cap.dprMax]}
      camera={{ position: [0, 0, 10], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#080708"]} />
      {/* 持續掉幀就降低解析度；前 6 秒（著色器編譯）不計入 */}
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          if (performance.now() - startedAt.current > 6000) setDegraded(true);
        }}
      />
      <SceneEnvironment motion={reducedMotion ? 0 : 1} />
      <FloatingHeads
        slugIndex={slugIndex}
        cap={cap}
        reducedMotion={reducedMotion}
        onEnter={onEnter}
      />
    </Canvas>
  );
}