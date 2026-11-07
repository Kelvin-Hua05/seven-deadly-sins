"use client";

import { useMemo, useSyncExternalStore } from "react";

export interface DeviceCapability {
  isTouch: boolean;
  isMobile: boolean;
  /** 每顆頭的粒子數 */
  particleCount: number;
  dprMax: number;
}

function snapshot(): string {
  if (typeof window === "undefined") return "000";
  const touch = window.matchMedia("(hover: none)").matches;
  const mobile = window.innerWidth < 768;
  const low = (navigator.hardwareConcurrency ?? 8) <= 4;
  return `${+touch}${+mobile}${+low}`;
}

function subscribe(cb: () => void) {
  const mql = window.matchMedia("(hover: none)");
  window.addEventListener("resize", cb);
  mql.addEventListener("change", cb);
  return () => {
    window.removeEventListener("resize", cb);
    mql.removeEventListener("change", cb);
  };
}

export function useDeviceCapability(): DeviceCapability {
  const key = useSyncExternalStore(subscribe, snapshot, () => "000");
  return useMemo(() => {
    const isTouch = key[0] === "1";
    const isMobile = key[1] === "1";
    const low = key[2] === "1";
    return {
      isTouch,
      isMobile,
      particleCount: isMobile ? 3500 : low ? 5000 : 9000,
      dprMax: isMobile ? 1.5 : 2,
    };
  }, [key]);
}