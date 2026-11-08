import {
  AUDIO_FILES,
  HOME_VOICE,
  SIN_VOICES,
  type CueName,
  type SynthVoice,
} from "@/data/audio";
import type { SinSlug } from "@/types/sin";

/** 音量都在這裡調 */
const MASTER_LEVEL = 0.8;
const SYNTH_LEVEL = 0.22;
const FILE_LEVEL = 0.7;

const MAX_OSC = 4;
const DETUNE = [0, 7, -6, 4];

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  synth: GainNode;
  oscs: OscillatorNode[];
  oscGains: GainNode[];
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  noiseGain: GainNode;
  noiseBuf: AudioBuffer;
}

interface FileLayer {
  url: string;
  src: AudioBufferSourceNode;
  gain: GainNode;
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.04 * w) / 1.04;
    d[i] = last * 5;
  }
  return buf;
}

class AudioEngine {
  private g: Graph | null = null;
  private on = false;
  private scene: SinSlug | null = null;
  private fileLayer: FileLayer | null = null;
  private fileToken = 0;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();

  /* ── React 外部 store ── */
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };
  getSnapshot = () => this.on;
  getServerSnapshot = () => false;
  private emit() {
    this.listeners.forEach((l) => l());
  }

  /* ── 建立音訊圖（必須在使用者點擊時呼叫） ── */
  private build(): Graph | null {
    if (this.g) return this.g;
    if (typeof window === "undefined" || !("AudioContext" in window)) return null;
    try {
      const ctx = new AudioContext();

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const synth = ctx.createGain();
      synth.gain.value = SYNTH_LEVEL;
      synth.connect(master);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 0.7;
      filter.frequency.value = HOME_VOICE.cutoff;
      filter.connect(synth);

      const oscs: OscillatorNode[] = [];
      const oscGains: GainNode[] = [];
      for (let i = 0; i < MAX_OSC; i++) {
        const osc = ctx.createOscillator();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.detune.value = DETUNE[i];
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        oscs.push(osc);
        oscGains.push(gain);
      }

      const lfo = ctx.createOscillator();
      lfo.frequency.value = HOME_VOICE.lfo;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = HOME_VOICE.cutoff * 0.35;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      const noiseBuf = makeNoise(ctx);
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      noiseSrc.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.5;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0;
      noiseSrc.connect(bp);
      bp.connect(noiseGain);
      noiseGain.connect(synth);
      noiseSrc.start();

      document.addEventListener("visibilitychange", () => {
        if (!this.g) return;
        if (document.hidden) void this.g.ctx.suspend();
        else if (this.on) void this.g.ctx.resume();
      });

      this.g = {
        ctx,
        master,
        synth,
        oscs,
        oscGains,
        filter,
        lfo,
        lfoGain,
        noiseGain,
        noiseBuf,
      };
      return this.g;
    } catch {
      return null;
    }
  }

  /* ── 公開 API ── */
  enable() {
    const first = !this.g;
    const g = this.build();
    if (!g) return;
    this.on = true;
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    void g.ctx.resume();
    g.master.gain.setTargetAtTime(MASTER_LEVEL, g.ctx.currentTime, 0.4);
    this.applyScene(first ? 0.01 : 1.2);
    this.emit();
  }

  disable() {
    const g = this.g;
    if (!g) return;
    this.on = false;
    g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.25);
    this.suspendTimer = setTimeout(() => {
      if (!this.on) void g.ctx.suspend();
    }, 1200);
    this.emit();
  }

  /** 切換場景：null = 首頁 */
  setScene(slug: SinSlug | null) {
    this.scene = slug;
    if (this.g && this.on) this.applyScene(1.2);
  }

  cue(name: CueName) {
    if (!this.g || !this.on) return;
    const url = AUDIO_FILES.cues[name];
    if (url) {
      void this.load(url).then((buf) => {
        if (!this.on) return;
        if (buf) this.playBuffer(buf);
        else this.synthCue(name);
      });
      return;
    }
    this.synthCue(name);
  }

  /* ── 場景聲音 ── */
  private applyVoice(v: SynthVoice, tc: number) {
    const g = this.g;
    if (!g) return;
    const now = g.ctx.currentTime;
    for (let i = 0; i < MAX_OSC; i++) {
      const has = i < v.ratios.length;
      g.oscs[i].frequency.setTargetAtTime(v.root * (has ? v.ratios[i] : 1), now, tc);
      g.oscGains[i].gain.setTargetAtTime(has ? 0.5 - i * 0.08 : 0, now, tc);
    }
    g.filter.frequency.setTargetAtTime(v.cutoff, now, tc);
    g.lfo.frequency.setTargetAtTime(v.lfo, now, tc);
    g.lfoGain.gain.setTargetAtTime(v.cutoff * 0.35, now, tc);
    g.noiseGain.gain.setTargetAtTime(v.noise, now, tc);
  }

  private applyScene(tc: number) {
    this.applyVoice(this.scene ? SIN_VOICES[this.scene] : HOME_VOICE, tc);
    const url =
      (this.scene && AUDIO_FILES.perSin[this.scene]) || AUDIO_FILES.ambient;
    this.setFileLayer(url ?? null);
  }

  private setFileLayer(url: string | null) {
    const g = this.g;
    if (!g) return;
    if (this.fileLayer && this.fileLayer.url === url) return;
    const token = ++this.fileToken;
    const now = g.ctx.currentTime;

    const old = this.fileLayer;
    this.fileLayer = null;
    if (old) {
      old.gain.gain.setTargetAtTime(0, now, 0.6);
      setTimeout(() => {
        try {
          old.src.stop();
        } catch {
          /* 已停止 */
        }
        old.src.disconnect();
        old.gain.disconnect();
      }, 3000);
    }

    if (!url) {
      g.synth.gain.setTargetAtTime(SYNTH_LEVEL, now, 0.8);
      return;
    }

    void this.load(url).then((buf) => {
      const cur = this.g;
      if (token !== this.fileToken || !cur) return;
      const t = cur.ctx.currentTime;
      if (!buf) {
        // 檔案載入失敗：退回合成音
        cur.synth.gain.setTargetAtTime(SYNTH_LEVEL, t, 0.8);
        return;
      }
      const src = cur.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = cur.ctx.createGain();
      gain.gain.value = 0;
      src.connect(gain);
      gain.connect(cur.master);
      src.start();
      gain.gain.setTargetAtTime(FILE_LEVEL, t, 0.8);
      cur.synth.gain.setTargetAtTime(0, t, 0.8);
      this.fileLayer = { url, src, gain };
    });
  }

  private load(url: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const p = (async () => {
      const g = this.g;
      if (!g) return null;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await g.ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        return null;
      }
    })();
    this.buffers.set(url, p);
    return p;
  }

  /* ── 提示音 ── */
  private playBuffer(buf: AudioBuffer) {
    const g = this.g;
    if (!g) return;
    const src = g.ctx.createBufferSource();
    src.buffer = buf;
    const gain = g.ctx.createGain();
    gain.gain.value = 0.6;
    src.connect(gain);
    gain.connect(g.master);
    src.onended = () => {
      src.disconnect();
      gain.disconnect();
    };
    src.start();
  }

  private noiseSweep(out: AudioNode, f0: number, f1: number, dur: number, peak: number) {
    const g = this.g;
    if (!g) return;
    const { ctx } = g;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = g.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + dur * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(env);
    env.connect(out);
    src.start(t);
    src.stop(t + dur + 0.1);
    src.onended = () => {
      src.disconnect();
      bp.disconnect();
      env.disconnect();
    };
  }

  private tone(
    out: AudioNode,
    f0: number,
    f1: number,
    dur: number,
    peak: number,
    type: OscillatorType
  ) {
    const g = this.g;
    if (!g) return;
    const { ctx } = g;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.6, dur * 0.3));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.1);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
  }

  private synthCue(name: CueName) {
    const g = this.g;
    if (!g) return;
    const out = g.master;
    const root = (this.scene ? SIN_VOICES[this.scene] : HOME_VOICE).root;

    switch (name) {
      case "enter":
        this.noiseSweep(out, 200, 2600, 1.4, 0.3);
        break;
      case "leave":
        this.noiseSweep(out, 2200, 180, 1.4, 0.26);
        break;
      case "scan":
        this.tone(out, 120, 700, 3.0, 0.05, "sawtooth");
        this.noiseSweep(out, 1500, 4000, 3.0, 0.04);
        break;
      case "reveal":
        this.tone(out, root * 4, root * 4, 3.2, 0.07, "sine");
        this.tone(out, root * 6, root * 6, 3.6, 0.05, "sine");
        break;
    }
  }
}

export const audio = new AudioEngine();