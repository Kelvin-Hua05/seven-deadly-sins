"use client";

import { Component, type ReactNode } from "react";
import { sceneSignal } from "@/lib/animation/sceneSignal";

/** 3D 場景若出錯就靜默移除，並通知文字層直接揭示 */
export class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    sceneSignal.set({ failed: true });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}