/**
 * 插圖角色的變形著色器：
 *   階段 0  首頁頭像（特寫圖的縮小版，只顯示臉部周圍，邊緣淡出）
 *   階段 1  臉部特寫
 *   階段 2  全身圖
 * uM1 / uM2 是兩個階段的整體進度（0–1），每顆粒子再依自己的延遲錯開。
 *
 * uVariant 選擇切換動畫：
 *   0 流動：粒子弧形飛行、向外綻開，由頭頂往下掃描成形（色慾）
 *   1 碎裂：粒子爆開成碎片，再被拉回、咔地拼合，落點帶高溫餘光（暴怒）
 *   2 霧化：粒子失焦成一團霧，緩慢下垂、搖曳，再慢慢對焦成形，成形後仍緩緩下沉（怠惰）
 *   3 昇華：由中軸線向左右對稱展開並向上升騰；全身由腳下往上撐起，落點閃金光（傲慢）
 */
export const figureVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uM1;
uniform float uM2;
uniform float uMotion;
uniform float uOpacity;
uniform float uSizeScale;
uniform float uReveal;
uniform float uDissolve;
uniform float uDensity;
uniform float uVariant;
uniform vec3 uShake;
uniform vec3 uAccent;

attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aC1;
attribute vec3 aC2;
attribute vec2 aDelay;
attribute float aSeed;
attribute float aHome;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.14159265;

float prog(float m, float delay, float span) {
  return clamp((m * (1.0 + span) - delay) / span, 0.0, 1.0);
}
float ease(float t) {
  return t * t * (3.0 - 2.0 * t);
}
vec3 hash3(float s) {
  return fract(sin(vec3(s * 127.1, s * 311.7, s * 74.7)) * 43758.5453) * 2.0 - 1.0;
}
// 碎裂：很快爆開，停在半空，然後線性拉回，在最後一刻到位（速度不減，所以有「咔」的感覺）
float burst(float t) {
  return smoothstep(0.0, 0.22, t) * (1.0 - clamp((t - 0.5) / 0.5, 0.0, 1.0));
}

void main() {
  bool shatter = uVariant > 0.5 && uVariant < 1.5;
  bool mist = uVariant > 1.5 && uVariant < 2.5;
  bool ascend = uVariant > 2.5;
  float span = shatter ? 0.28 : (mist ? 0.9 : (ascend ? 0.5 : 0.4));
  float r1 = prog(uM1, aDelay.x, span);
  float r2 = prog(uM2, aDelay.y, span);

  // 階段 0 只顯示臉部周圍：依權重與亂數抽稀，橢圓邊緣自然淡出
  float vis0 = step(aSeed, aHome * uDensity);
  float vis = mix(vis0, 1.0, smoothstep(0.0, 0.2, r1));
  if (vis < 0.01) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float s1;
  float s2;
  vec3 p;
  float heat = 0.0;
  float glow = 0.0;
  float fog = 0.0;

  if (mist) {
    s1 = ease(r1);
    s2 = ease(r2);
    vec3 sway = vec3(
      sin(uTime * 0.4 + aSeed * 20.0),
      cos(uTime * 0.33 + aSeed * 13.0) * 0.5,
      sin(uTime * 0.27 + aSeed * 9.0)
    );
    // 階段 1：先鬆散下垂、搖曳，再慢慢收攏對焦
    p = mix(position, aP1, s1) + (sway * 0.22 + vec3(0.0, -0.45 * aSeed, 0.0)) * sin(PI * s1);
    // 階段 2：像霧一樣向下沉降、重新凝聚
    p = mix(p, aP2, s2) + (sway * 0.3 + vec3(0.0, 0.35 + 0.5 * aSeed, 0.0)) * sin(PI * s2) * 0.6;
    fog = max(sin(PI * s1), sin(PI * s2));
  } else if (ascend) {
    s1 = ease(r1);
    s2 = ease(r2);
    // 以中軸線分左右：兩側對稱地向外舒展，同時向上升騰
    float side = position.x >= 0.0 ? 1.0 : -1.0;
    p = mix(position, aP1, s1) + vec3(side * 0.3, 0.45, 0.0) * sin(PI * s1);
    // 全身由下往上撐起：粒子先略往下沉，再升到定位
    p = mix(p, aP2, s2) + vec3(side * 0.22, -0.4, 0.0) * sin(PI * s2);
  } else if (!shatter) {
    s1 = ease(r1);
    s2 = ease(r2);
    vec3 arc1 = vec3(sin(aSeed * 40.0), cos(aSeed * 29.0), sin(aSeed * 17.0)) * 0.5;
    vec3 arc2 = vec3(cos(aSeed * 33.0), sin(aSeed * 21.0), cos(aSeed * 13.0)) * 0.5;
    p = mix(position, aP1, s1) + arc1 * sin(PI * s1) * 0.6;
    p = mix(p, aP2, s2) + arc2 * sin(PI * s2) * 0.5;
  } else {
    s1 = smoothstep(0.3, 1.0, r1);
    s2 = smoothstep(0.3, 1.0, r2);
    vec3 b1 = (hash3(aSeed) * vec3(1.5, 1.3, 1.0) + normalize(position + vec3(0.001)) * 0.9) * 1.1;
    vec3 b2 = hash3(aSeed + 3.7) * vec3(1.3, 0.9, 1.0) + vec3(0.0, -0.5, 0.0);
    p = mix(position, aP1, s1) + b1 * burst(r1);
    p = mix(p, aP2, s2) + b2 * burst(r2);
    heat = max(burst(r1), burst(r2));
  }

  // 到位之後的餘光（碎裂、昇華版）：隨時間冷卻；第二階段開始後第一階段的餘光也退去
  if (shatter || ascend) {
    float after1 = clamp((uM1 * (1.0 + span) - aDelay.x - span) / 0.7, 0.0, 1.0);
    float after2 = clamp((uM2 * (1.0 + span) - aDelay.y - span) / 0.7, 0.0, 1.0);
    float g1 = step(0.999, r1) * (1.0 - after1) * (1.0 - smoothstep(0.0, 0.6, uM2));
    float g2 = step(0.999, r2) * (1.0 - after2) * (1.0 - smoothstep(0.9, 1.0, uM2));
    glow = max(g1, g2);
  }

  float t = uTime * 0.6 + aSeed * 6.2831853;
  p += vec3(
    sin(t * 1.3 + aSeed * 10.0),
    cos(t * 1.1 + aSeed * 7.0),
    sin(t * 0.9 + aSeed * 13.0)
  ) * (0.003 + 0.006 * uReveal) * uMotion;

  // 整體震動（碎裂版在到位的瞬間使用）
  p += uShake;

  // 霧化版：成形之後仍然極緩慢地下沉、起伏
  if (mist) {
    p.y -= (0.5 + 0.5 * sin(uTime * 0.3 + aSeed * 6.2831853)) * 0.04 * uMotion;
    p.x += sin(uTime * 0.2 + aSeed * 11.0) * 0.012 * uMotion;
  }

  // 其他角色被選中時，這顆頭向外飄散
  vec3 dir = normalize(position + vec3(0.0001, 0.0002, 0.0003));
  p += dir * uDissolve * (0.6 + aSeed) * 1.4;
  p.y += uDissolve * aSeed * 0.5;

  // 階段 0：單色（依 uReveal 漸變成原圖色）；之後直接用原圖色
  float lum = dot(aC1, vec3(0.2126, 0.7152, 0.0722));
  vec3 gray = vec3(0.91, 0.90, 0.91) * (0.12 + lum * 1.1);
  vec3 c0 = mix(gray, aC1, smoothstep(0.0, 1.0, uReveal));

  vec3 col = mix(c0, aC1, s1);
  col = mix(col, aC2, s2);

  // 移動中的粒子帶一點亮光（流動版）
  float flash = (shatter || mist || ascend) ? 0.0 : (sin(PI * s1) + sin(PI * s2));
  col += uAccent * flash * 0.35;

  // 碎裂版：飛行時發熱變橘白，落地後餘光
  col = mix(col, vec3(1.0, 0.55, 0.25), heat * 0.55);
  // 餘光顏色：碎裂版是火紅，昇華版是金色
  col += (ascend ? vec3(1.0, 0.82, 0.45) * 0.7 : vec3(1.0, 0.45, 0.3) * 0.9) * glow;

  // 霧化版：失焦時偏冷白
  col = mix(col, vec3(0.62, 0.82, 0.95) * (0.4 + lum), fog * 0.3);

  float size0 = 2.0 * (1.0 + 0.25 * uReveal);
  float size = mix(mix(size0, 2.1, s1), 1.9, s2) * uSizeScale;
  size *= (1.0 + flash * 0.35 + heat * 0.6 + glow * 0.5 + fog * 2.4) * vis * (1.0 - 0.6 * uDissolve);

  float a0 = (0.2 + lum * 0.7) * 0.75 * (1.0 + 0.35 * uReveal);
  float a = mix(mix(a0, 0.7, s1), 0.7, s2);
  a *= (1.0 + glow * 0.4) * (1.0 - 0.55 * fog);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);

  vColor = col;
  vAlpha = a * uOpacity;
}
`;

export const figureFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.1, 0.5, d);
  gl_FragColor = vec4(vColor, soft * vAlpha);
  #include <colorspace_fragment>
}
`;

/** 衝擊波：兩道由中心向外擴散的環（碎裂版在拼合的瞬間使用） */
export const shockFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uR1;
uniform float uA1;
uniform float uR2;
uniform float uA2;
varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5) * 2.0;
  float ring1 = (1.0 - smoothstep(0.0, 0.03 + 0.05 * uR1, abs(d - uR1))) * uA1;
  float ring2 = (1.0 - smoothstep(0.0, 0.03 + 0.05 * uR2, abs(d - uR2))) * uA2;
  gl_FragColor = vec4(uColor, clamp(ring1 + ring2, 0.0, 1.0));
  #include <colorspace_fragment>
}
`;