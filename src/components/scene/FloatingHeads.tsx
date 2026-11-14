"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SINS } from "@/data/sins";
import { LAYOUT_LANDSCAPE, LAYOUT_PORTRAIT } from "@/data/headLayout";
import type { DeviceCapability } from "@/hooks/useDeviceCapability";
import { HeadState, SceneFlow } from "@/lib/animation/sceneState";
import { SceneController } from "@/lib/animation/sceneController";
import { computeSinLayout, FOV } from "@/lib/sceneConfig";
import { ParticleHead } from "./ParticleHead";
import { FIGURES } from "@/data/figures";
import { figureCount, getFigureData } from "@/lib/particles/imageCloud";

const _v = new THREE.Vector3();

interface Props {
  /** 目前路由對應的角色索引，-1 = 首頁 */
  slugIndex: number;
  cap: DeviceCapability;
  reducedMotion: boolean;
  onEnter: (slug: string) => void;
}

export function FloatingHeads({ slugIndex, cap, reducedMotion, onEnter }: Props) {
  const size = useThree((s) => s.size);
  const [states] = useState(() => SINS.map(() => new HeadState()));
  const [flow] = useState(() => new SceneFlow());
  const [controller] = useState(() => new SceneController(states, flow));
  const [bodyIndex, setBodyIndex] = useState(-1);

  const motion = reducedMotion ? 0 : 1;
  const layout = useMemo(
    () => computeSinLayout(size.width, size.height),
    [size.width, size.height]
  );

  const placements = useMemo(() => {
    const base = layout.portrait ? LAYOUT_PORTRAIT : LAYOUT_LANDSCAPE;
    const xk = layout.portrait ? 1 : Math.min(1, Math.max(0.55, layout.visW / 12.2));
    return base.map((p) => ({
      ...p,
      position: [p.position[0] * xk, p.position[1], p.position[2]] as const,
    }));
  }, [layout]);

  // 把光圈中心與半徑交給 DOM，讓四句象徵語能環繞角色排列
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--fx", `${layout.cx}px`);
    r.setProperty("--fy", `${layout.cy}px`);
    r.setProperty("--fr", `${layout.ringR}px`);
  }, [layout]);

  useEffect(() => {
    controller.bind(setBodyIndex, reducedMotion);
  }, [controller, reducedMotion]);

  useEffect(() => {
    controller.sync(slugIndex);
  }, [controller, slugIndex]);

  // 閒置時先把插圖角色的粒子備妥
  useEffect(() => {
    const id = window.setTimeout(() => {
      SINS.forEach((sin, i) => {
        const spec = FIGURES[sin.slug];
        if (spec) {
          void getFigureData(
            sin.slug,
            spec,
            figureCount(Math.round(cap.particleCount * 1.4)),
            i + 1
          );
        }
      });
    }, 2500);
    return () => window.clearTimeout(id);
  }, [cap.particleCount]);

  useEffect(
    () => () => {
      controller.dispose();
      document.body.style.cursor = "";
    },
    [controller]
  );

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
      if (controller.requestEnter(i, cap.isTouch)) onEnter(SINS[i].slug);
    },
    [controller, cap.isTouch, onEnter]
  );
  const isHome = useCallback(() => flow.mode === "home", [flow]);

  useFrame((s, dt) => {
    const cam = s.camera as THREE.PerspectiveCamera;
    const d = Math.min(dt, 0.05);
    const aspect = s.size.width / s.size.height;

    // 所有頭共用「角色頁」的目標位置與縮放
    states.forEach((st) => {
      st.target.set(layout.x, layout.y, 0);
      st.targetScale = layout.scale;
    });

    // 鏡頭視差（角色頁減弱，避免文字與角色錯位）
    if (motion) {
      const selMove = flow.selected >= 0 ? states[flow.selected].move : 0;
      const k = 1 - 0.7 * selMove;
      cam.position.x = THREE.MathUtils.damp(
        cam.position.x,
        flow.hasPointer ? flow.ndcX * 0.4 * k : 0,
        2,
        d
      );
      cam.position.y = THREE.MathUtils.damp(
        cam.position.y,
        flow.hasPointer ? flow.ndcY * 0.25 * k : 0,
        2,
        d
      );
      cam.lookAt(0, 0, 0);
    }

    // 只有首頁才做 hover 顯色
    if (flow.mode === "home") {
      let best = -1;
      let bestDist = Infinity;
      let bestR = 1;
      if (flow.hasPointer && !cap.isTouch) {
        placements.forEach((pl, i) => {
          _v.set(pl.position[0], pl.position[1], pl.position[2]);
          const dist = cam.position.distanceTo(_v);
          _v.project(cam);
          const dx = (_v.x - flow.ndcX) * aspect;
          const dy = _v.y - flow.ndcY;
          const dd = Math.hypot(dx, dy);
          const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
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
      });
    }

    states.forEach((st) =>
      st.look(flow.hasPointer ? flow.ndcX : 0, flow.hasPointer ? flow.ndcY : 0, d)
    );
  });

  return (
    <>
      {SINS.map((sin, i) => (
        <ParticleHead
          key={sin.slug}
          index={i}
          sin={sin}
          placement={placements[i]}
          count={cap.particleCount}
          bodyCount={Math.round(cap.particleCount * 1.4)}
          homeDensity={cap.homeDensity}
          state={states[i]}
          motion={motion}
          withBody={bodyIndex === i}
          isActive={isHome}
          onSelect={select}
        />
      ))}
    </>
  );
}