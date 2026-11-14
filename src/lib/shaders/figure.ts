/**
 * 插圖角色的變形著色器：
 *   階段 0  程序化粒子頭
 *   階段 1  臉部特寫（從臉中心向外綻開）
 *   階段 2  全身圖（由頭頂往下掃描成形）
 * uM1 / uM2 是兩個階段的整體進度（0–1），每顆粒子再依自己的延遲錯開。
 */
export const figureVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uM1;
uniform float uM2;
uniform float uMotion;
uniform float uOpacity;
uniform float uSizeScale;
uniform vec3 uAccent;
uniform vec3 uAccent2;

attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aC1;
attribute vec3 aC2;
attribute vec2 aDelay;
attribute float aSeed;
attribute float aTone0;
attribute float aKind0;

varying vec3 vColor;
varying float vAlpha;

const float SPAN = 0.4;
const float PI = 3.14159265;

float prog(float m, float delay) {
  return clamp((m * (1.0 + SPAN) - delay) / SPAN, 0.0, 1.0);
}
float ease(float t) {
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  float s1 = ease(prog(uM1, aDelay.x));
  float s2 = ease(prog(uM2, aDelay.y));

  vec3 p = mix(position, aP1, s1);
  vec3 arc1 = vec3(sin(aSeed * 40.0), cos(aSeed * 29.0), sin(aSeed * 17.0)) * 0.5;
  p += arc1 * sin(PI * s1) * 0.6;

  p = mix(p, aP2, s2);
  vec3 arc2 = vec3(cos(aSeed * 33.0), sin(aSeed * 21.0), cos(aSeed * 13.0)) * 0.5;
  p += arc2 * sin(PI * s2) * 0.5;

  float t = uTime * 0.6 + aSeed * 6.2831853;
  p += vec3(
    sin(t * 1.3 + aSeed * 10.0),
    cos(t * 1.1 + aSeed * 7.0),
    sin(t * 0.9 + aSeed * 13.0)
  ) * 0.004 * uMotion;

  // 階段 0 的顏色與程序化頭一致，讓交接時看不出跳動
  vec3 tint = mix(uAccent2, uAccent, smoothstep(0.1, 0.9, aTone0));
  vec3 c0 = tint * (0.35 + aTone0 * 1.25);
  if (aKind0 > 1.5 && aKind0 < 2.5) c0 += uAccent * 0.9;

  vec3 col = mix(c0, aC1, s1);
  col = mix(col, aC2, s2);

  // 移動中的粒子帶一點亮光
  float flash = sin(PI * s1) + sin(PI * s2);
  col += uAccent * flash * 0.35;

  float size = mix(mix(2.4, 2.1, s1), 1.9, s2) * uSizeScale;
  size *= 1.0 + flash * 0.35;

  float a0 = (0.16 + aTone0 * 0.7) * 0.4;
  float a = mix(mix(a0, 0.7, s1), 0.7, s2);

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