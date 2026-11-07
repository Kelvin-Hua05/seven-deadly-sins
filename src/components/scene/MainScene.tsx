"use client";

import { Canvas } from "@react-three/fiber";
import type { DeviceCapability } from "@/hooks/useDeviceCapability";
import { FloatingHeads } from "./FloatingHeads";
import { SceneEnvironment } from "./SceneEnvironment";

interface Props {
  cap: DeviceCapability;
  reducedMotion: boolean;
  onEnter: (slug: string) => void;
}

export default function MainScene({ cap, reducedMotion, onEnter }: Props) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, cap.dprMax]}
      camera={{ position: [0, 0, 10], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#080708"]} />
      <SceneEnvironment motion={reducedMotion ? 0 : 1} />
      <FloatingHeads
        cap={cap}
        reducedMotion={reducedMotion}
        onEnter={onEnter}
      />
    </Canvas>
  );
}