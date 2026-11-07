"use client";

import { useCallback, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SINS } from "@/data/sins";
import { LAYOUT_LANDSCAPE, LAYOUT_PORTRAIT } from "@/data/headLayout";
import type { DeviceCapability } from "@/hooks/useDeviceCapability";
import { HeadState, SceneFlow } from "@/lib/animation/sceneState";
import { playIntro } from "@/lib/animation/introAnimation";
import { playSelectTransition } from "@/lib/animation/selectTransition";
import gsap from "gsap";
import { ParticleHead } from "./ParticleHead";

const _v = new THREE.Vector3();

interface Props {
  cap: DeviceCapability;
  reducedMotion: boolean;
  onEnter: (slug: string) => void;
}

export function FloatingHeads({ cap, reducedMotion, onEnter }: Props) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);

  const [states] = useState(() => SINS.map(() => new HeadState()));
  const [flow] = useState(() => new SceneFlow());

  const portrait = size.width / size.height < 0.85;
  const layout = portrait ? LAYOUT_PORTRAIT : LAYOUT_LANDSCAPE;
  const motion = reducedMotion ? 0 : 1;

  // 開場：七顆頭依序浮現
  useEffect(() => {
    const stop = playIntro(states, reducedMotion);
    return () => {
      stop();
      gsap.killTweensOf(flow);
      document.body.style.cursor = "";
    };
  }, [states, flow, reducedMotion]);

  // 滑鼠位置（只處理 mouse，觸控改用點擊顯色）
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      flow.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      );
    };
    const leave = () => flow.clearPointer();
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [flow]);

  const select = useCallback(
    (i: number) => {
      if (flow.locked) return;

      // 手機：第一次點擊顯色，第二次才進入
      if (cap.isTouch && flow.activeTouch !== i) {
        flow.setActiveTouch(i);
        return;
      }

      const cam = camera as THREE.PerspectiveCamera;
      const visH = 2 * cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const visW = visH * (size.width / size.height);

      // 選中的頭移向畫面右側
      states[i].target.set(portrait ? 0 : visW * 0.2, portrait ? -0.6 : -0.1, 0);

      flow.lock(i);
      playSelectTransition(flow, reducedMotion ? 0.4 : 1.8, () =>
        onEnter(SINS[i].slug)
      );
    },
    [flow, cap.isTouch, camera, size, states, portrait, reducedMotion, onEnter]
  );

  useFrame((s, dt) => {
    const cam = s.camera as THREE.PerspectiveCamera;
    const d = Math.min(dt, 0.05);
    const aspect = s.size.width / s.size.height;

    // 鏡頭視差
    if (motion) {
      cam.position.x = THREE.MathUtils.damp(
        cam.position.x,
        flow.hasPointer ? flow.ndcX * 0.4 : 0,
        2,
        d
      );
      cam.position.y = THREE.MathUtils.damp(
        cam.position.y,
        flow.hasPointer ? flow.ndcY * 0.25 : 0,
        2,
        d
      );
      cam.lookAt(0, 0, 0);
    }

    // 過場中
    if (flow.selected >= 0) {
      states.forEach((st, i) =>
        st.applyTransition(i === flow.selected, flow.progress, d)
      );
      return;
    }

    // 找出距離游標最近的頭（只讓一顆顯色）
    let best = -1;
    let bestDist = Infinity;
    let bestR = 1;
    if (flow.hasPointer && !cap.isTouch) {
      layout.forEach((pl, i) => {
        _v.set(pl.position[0], pl.position[1], pl.position[2]);
        const dist = cam.position.distanceTo(_v);
        _v.project(cam);
        const dx = (_v.x - flow.ndcX) * aspect;
        const dy = _v.y - flow.ndcY;
        const dd = Math.hypot(dx, dy);
        const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
        const r = (0.9 * pl.scale) / (visH / 2);
        if (dd < r * 2.4 && dd < bestDist) {
          best = i;
          bestDist = dd;
          bestR = r;
        }
      });
    }

    states.forEach((st, i) => {
      let target = 0;
      if (cap.isTouch) {
        target = flow.activeTouch === i ? 1 : 0;
      } else if (i === best) {
        target =
          1 - THREE.MathUtils.smoothstep(bestDist, bestR * 0.7, bestR * 2.4);
      }
      st.follow(target, d);
      st.look(flow.hasPointer ? flow.ndcX : 0, flow.hasPointer ? flow.ndcY : 0, d);
    });
  });

  return (
    <>
      {SINS.map((sin, i) => (
        <ParticleHead
          key={sin.slug}
          index={i}
          sin={sin}
          placement={layout[i]}
          count={cap.particleCount}
          state={states[i]}
          motion={motion}
          onSelect={select}
        />
      ))}
    </>
  );
}