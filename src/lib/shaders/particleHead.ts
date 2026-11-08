/**
 * 角色專屬粒子行為（頂點位移）。
 * uStyle：0 柔和擺動 / 1 對稱升騰 / 2 向內吸附 / 3 旋渦吞噬 / 4 緩慢下垂 / 5 破碎爆發 / 6 重影錯位
 * uStyleAmt：0–1，強度（hover 時部分顯現，角色頁全開，減少動態時為 0）
 */
const BEHAVE = /* glsl */ `
uniform float uStyle;
uniform float uStyleAmt;

vec3 behave(vec3 p, float seed, float t) {
  float k = uStyleAmt;
  float ph = seed * 6.2831853;
  if (uStyle < 0.5) {
    p.x += sin(p.y * 3.0 + t * 0.8 + ph) * 0.012 * k;
    p.z += cos(p.y * 2.0 + t * 0.6 + ph) * 0.008 * k;
  } else if (uStyle < 1.5) {
    p.x += sign(p.x) * (0.004 + 0.006 * sin(t * 0.6 + ph)) * k;
    p.y += (0.012 + 0.012 * sin(t * 0.4 + ph)) * k;
  } else if (uStyle < 2.5) {
    float pull = 0.5 + 0.5 * sin(t * 1.1 + ph);
    p.xy -= p.xy * pull * 0.06 * k;
  } else if (uStyle < 3.5) {
    float a = sin(t * 0.7 + ph) * 0.1 * k;
    float c = cos(a);
    float s = sin(a);
    p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);
    p.xy *= 1.0 - 0.05 * k * (0.5 + 0.5 * sin(t + ph));
  } else if (uStyle < 4.5) {
    p.y -= (0.5 + 0.5 * sin(t * 0.25 + ph)) * 0.05 * k * seed;
    p.x += sin(t * 0.2 + ph) * 0.006 * k;
  } else if (uStyle < 5.5) {
    float burst = pow(max(0.0, sin(t * 1.7 + seed * 3.0)), 12.0);
    vec3 d = p + vec3(0.0001, 0.0002, 0.0003);
    p += normalize(d) * burst * 0.14 * k * seed;
    p.x += (fract(sin(seed * 78.233 + floor(t * 6.0)) * 43758.5) - 0.5) * 0.02 * k;
  } else {
    if (seed > 0.55) {
      p.x += (0.05 + 0.02 * sin(t * 0.5 + ph)) * k;
      p.y -= 0.01 * k;
    }
  }
  return p;
}
`;

/* ───────── 頭 ───────── */
export const headVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uReveal;
uniform float uMotion;
uniform float uDissolve;
uniform float uDensity;
uniform float uScanY;
uniform float uScanOn;

attribute float aTone;
attribute float aSeed;
attribute float aKind;

varying float vTone;
varying float vDepth;
varying float vKind;
varying float vScan;

${BEHAVE}

void main() {
  // 皮膚粒子依密度抽稀；亮線(kind>0)永遠保留
  if (aKind < 0.5 && aSeed > uDensity) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  vec3 p = position;

  float t = uTime * 0.6 + aSeed * 6.2831853;
  vec3 jitter = vec3(
    sin(t * 1.3 + aSeed * 10.0),
    cos(t * 1.1 + aSeed * 7.0),
    sin(t * 0.9 + aSeed * 13.0)
  );
  p += jitter * (0.003 + 0.01 * uReveal) * uMotion;

  float band = smoothstep(0.985, 1.0, sin(p.y * 4.0 - uTime * 0.8));
  p.x += band * 0.03 * uMotion;

  p = behave(p, aSeed, uTime);

  vec3 dir = normalize(position + vec3(0.0001, 0.0002, 0.0003));
  p += dir * uDissolve * (0.6 + aSeed) * 1.4;
  p.y += uDissolve * aSeed * 0.5;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float dy = position.y - uScanY;
  float scan = exp(-(dy * dy) / 0.012) * uScanOn;

  float size = uSize * (0.5 + aTone * 0.9) * (1.0 + uReveal * 0.25) * (1.0 + scan * 1.2);
  if (aKind > 0.5) size *= 1.15;
  size *= (1.0 - uDissolve * 0.6);
  gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);

  vTone = aTone;
  vDepth = -mv.z;
  vKind = aKind;
  vScan = scan;
}
`;

export const headFragment = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uReveal;
uniform float uOpacity;

varying float vTone;
varying float vDepth;
varying float vKind;
varying float vScan;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.1, 0.5, d);

  vec3 gray = vec3(0.91, 0.90, 0.91) * (0.12 + vTone * 0.9);
  vec3 tint = mix(uAccent2, uAccent, smoothstep(0.1, 0.9, vTone));
  vec3 colored = tint * (0.35 + vTone * 1.25);
  vec3 col = mix(gray, colored, smoothstep(0.0, 1.0, uReveal));

  // 眼睛：揭示時發光
  if (vKind > 1.5 && vKind < 2.5) col += uAccent * 0.9 * uReveal;
  col += uAccent * vScan * 1.6;

  float depthFade = mix(0.55, 1.0, 1.0 - smoothstep(9.0, 15.0, vDepth));
  float a = soft * (0.16 + vTone * 0.7) * (1.0 + uReveal * 0.5) * uOpacity * depthFade * 0.8
          + soft * vScan * 0.4 * uOpacity;

  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

/* ───────── 身體：掃描重建 ───────── */
export const bodyVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMotion;
uniform float uScanY;
uniform float uScanOn;

attribute float aTone;
attribute float aSeed;
attribute float aKind;

varying float vTone;
varying float vKind;
varying float vFresh;
varying float vArrive;
varying float vVis;

${BEHAVE}

void main() {
  // 掃描線以下尚未生成；線以上的粒子由散落位置匯聚到定位
  float a = clamp((position.y - uScanY) / 0.55, 0.0, 1.0);
  float e = a * a * (3.0 - 2.0 * a);

  vec3 sc = vec3(sin(aSeed * 91.7), cos(aSeed * 47.3) * 0.6 + 0.3, sin(aSeed * 23.1)) * (0.4 + aSeed * 0.8);
  vec3 p = position + sc * (1.0 - e);

  float t = uTime * 0.6 + aSeed * 6.2831853;
  p += vec3(sin(t * 1.3 + aSeed * 10.0), cos(t * 1.1 + aSeed * 7.0), sin(t * 0.9 + aSeed * 13.0)) * 0.004 * uMotion;
  float band = smoothstep(0.985, 1.0, sin(p.y * 4.0 - uTime * 0.8));
  p.x += band * 0.02 * uMotion;

  p = behave(p, aSeed, uTime);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float dy = position.y - uScanY;
  float fresh = exp(-(dy * dy) / 0.012) * uScanOn;

  float size = uSize * (0.5 + aTone * 0.9) * (1.0 + fresh * 1.5);
  if (aKind > 0.5) size *= 1.15;
  gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);

  vTone = aTone;
  vKind = aKind;
  vFresh = fresh;
  vArrive = e;
  vVis = smoothstep(uScanY - 0.1, uScanY + 0.05, position.y);
}
`;

export const bodyFragment = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uOpacity;

varying float vTone;
varying float vKind;
varying float vFresh;
varying float vArrive;
varying float vVis;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.1, 0.5, d);

  vec3 tint = mix(uAccent2, uAccent, smoothstep(0.1, 0.9, vTone));
  vec3 col = tint * (0.35 + vTone * 1.25);
  if (vKind > 2.5) {
    col = mix(uAccent, vec3(1.0), 0.25) * (0.7 + vTone * 0.7);
  } else if (vKind > 0.5) {
    col = mix(uAccent, vec3(1.0), 0.5) * (0.5 + vTone * 0.9);
  }
  col += uAccent * vFresh * 1.8;

  float a = soft * ((0.14 + vTone * 0.75) * vArrive * 0.85 + vFresh * 0.5 * vVis) * uOpacity;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

/* ───────── 光暈 / 掃描線平面 ───────── */
export const haloVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const haloFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float glow = exp(-d * d * 3.5);
  float ring = (1.0 - smoothstep(0.0, 0.025, abs(d - 0.62))) * 0.5;
  float a = (glow * 0.5 + ring) * uIntensity;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;

export const scanFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  float line = 1.0 - smoothstep(0.0, 0.035, vUv.y);
  float trail = pow(1.0 - vUv.y, 5.0) * 0.35;
  float edge = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
  gl_FragColor = vec4(uColor, (line * 0.9 + trail) * edge * uAlpha);
  #include <colorspace_fragment>
}
`;

/* ───────── 漂浮符號 ───────── */
export const symbolVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uBuild;
attribute float aSeed;
varying float vSeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * 0.12;
  p.x += sin(t * 2.0 + aSeed * 40.0) * 0.25;
  p.y += cos(t * 1.7 + aSeed * 25.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (10.0 + aSeed * 18.0) * uPixelRatio * (8.0 / -mv.z);
  vSeed = aSeed;
  vAlpha = uBuild * (0.25 + 0.5 * fract(aSeed * 7.0));
}
`;

export const symbolFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uShape;
uniform float uTime;
varying float vSeed;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float ang = vSeed * 6.2831853 + uTime * 0.1 * (vSeed - 0.5);
  float cs = cos(ang);
  float sn = sin(ang);
  c = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y);
  float m = 0.0;
  if (uShape < 0.5) {
    float e = length(c * vec2(1.0, 1.9));
    m = (1.0 - smoothstep(0.0, 0.05, abs(e - 0.42)))
      + (1.0 - smoothstep(0.0, 0.03, abs(c.y))) * step(abs(c.x), 0.3) * 0.8;
  } else if (uShape < 1.5) {
    float e = abs(c.x) + abs(c.y) * 1.4;
    m = 1.0 - smoothstep(0.0, 0.05, abs(e - 0.38));
  } else {
    m = max(
      (1.0 - smoothstep(0.0, 0.04, abs(c.x))) * step(abs(c.y), 0.3),
      (1.0 - smoothstep(0.0, 0.04, abs(c.y))) * step(abs(c.x), 0.3)
    );
  }
  if (m < 0.02) discard;
  gl_FragColor = vec4(uColor, clamp(m, 0.0, 1.0) * vAlpha);
  #include <colorspace_fragment>
}
`;

/* ───────── 背景塵埃 ───────── */
export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.15 + aSeed * 20.0) * 0.25;
  p.x += cos(uTime * 0.12 + aSeed * 31.0) * 0.2;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.2 + aSeed * 1.6) * uPixelRatio * (8.0 / -mv.z);
}
`;

export const dustFragment = /* glsl */ `
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = (1.0 - smoothstep(0.1, 0.5, d)) * 0.16;
  gl_FragColor = vec4(vec3(0.85, 0.82, 0.84), a);
  #include <colorspace_fragment>
}
`;