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
 *   4 吸附：首頁看不見的粒子（頭髮、光環、金幣）從遠處被吸進來，落點閃金光；
 *           全身階段整體先向身體中心收縮再展開，成形後仍像呼吸般輕微收縮（貪婪）
 *   5 重影：粒子分裂成兩層錯位的影像再合而為一；成形後仍殘留一層偏青綠的錯位輪廓（嫉妒）
 *   6 旋渦：粒子由外而內捲成旋渦、被吞進中心，再向外膨脹成形；成形後像不斷膨脹般緩緩起伏（暴食）
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
uniform vec3 uPull;
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
// 旋渦：以 c 為中心旋轉並向內收縮，越靠近中心轉得越快；s 到 0 或 1 時完全不影響位置
vec3 swirl(vec3 p, vec3 c, float s, float spin, float pull) {
  float w = sin(PI * s);
  vec2 q = p.xy - c.xy;
  float a = spin * w / (0.6 + length(q));
  float ca = cos(a);
  float sa = sin(a);
  q = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
  q *= 1.0 - pull * w;
  return vec3(c.xy + q, p.z);
}
// 碎裂：很快爆開，停在半空，然後線性拉回，在最後一刻到位（速度不減，所以有「咔」的感覺）
float burst(float t) {
  return smoothstep(0.0, 0.22, t) * (1.0 - clamp((t - 0.5) / 0.5, 0.0, 1.0));
}

void main() {
  bool shatter = uVariant > 0.5 && uVariant < 1.5;
  bool mist = uVariant > 1.5 && uVariant < 2.5;
  bool ascend = uVariant > 2.5 && uVariant < 3.5;
  bool gather = uVariant > 3.5 && uVariant < 4.5;
  bool twin = uVariant > 4.5 && uVariant < 5.5;
  bool vortex = uVariant > 5.5;
  float span = shatter ? 0.28 : (mist ? 0.9 : (vortex ? 0.6 : ((ascend || twin) ? 0.5 : (gather ? 0.45 : 0.4))));
  // 重影版：約 18% 的粒子永遠是錯位的那一層
  float ghost = twin ? step(0.82, aSeed) : 0.0;
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
  float lay = 0.0;

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
  } else if (gather) {
    // 越接近終點越快：像被重力吸進去
    s1 = pow(r1, 2.4);
    s2 = pow(r2, 2.4);
    // 首頁看不見的粒子從遠處飛來；臉部的粒子留在原處
    vec3 farStart = aP1 + hash3(aSeed + 1.3) * vec3(4.5, 3.8, 2.0);
    vec3 start = vis0 > 0.5 ? position : farStart;
    p = mix(start, aP1, s1);
    // 全身階段：整體先向身體中心收縮，再展開到定位（像把財富攏在懷裡）
    p = mix(p, aP2, s2);
    p += (uPull - p) * 0.3 * sin(PI * s2);
  } else if (vortex) {
    s1 = ease(r1);
    s2 = ease(r2);
    // 階段 1：以頭部中心捲成旋渦、被吞進去，再展開成特寫
    p = mix(position, aP1, s1);
    p = swirl(p, vec3(0.0, 0.03, 0.0), s1, 4.5, 0.45);
    // 階段 2：以身體中心（肚子）再捲一次，再向外膨脹成全身
    p = mix(p, aP2, s2);
    p = swirl(p, uPull, s2, 6.0, 0.5);
  } else if (twin) {
    s1 = ease(r1);
    s2 = ease(r2);
    // 粒子分成左右兩層重影：飛行途中錯開，到位時合而為一
    lay = aSeed < 0.5 ? -1.0 : 1.0;
    p = mix(position, aP1, s1) + vec3(lay * 0.7, lay * 0.12, 0.0) * sin(PI * s1);
    p = mix(p, aP2, s2) + vec3(lay * 0.6, -lay * 0.18, 0.0) * sin(PI * s2);
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

  // 到位之後的餘光（碎裂、昇華、吸附版）：隨時間冷卻；第二階段開始後第一階段的餘光也退去
  if (shatter || ascend || gather) {
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

  // 吸附版：成形之後仍像呼吸般輕微地向內收縮
  if (gather) {
    p += (uPull - p) * (0.008 + 0.008 * sin(uTime * 1.1 + aSeed * 6.2831853)) * uMotion;
  }

  // 旋渦版：成形之後像不斷膨脹般緩緩起伏
  if (vortex) {
    p += (p - uPull) * 0.012 * sin(uTime * 0.9 + aSeed * 0.8) * uMotion;
  }

  // 重影版：永遠錯位的那一層，像映在水裡的影子；靠近（hover）時錯得更開
  if (twin) {
    p += vec3(0.055, -0.04, -0.05) * ghost * (0.35 + 0.65 * uReveal)
       * (1.0 + 0.25 * sin(uTime * 1.3 + aSeed * 9.0) * uMotion);
  }

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
  float flash = (shatter || mist || ascend || gather || twin || vortex) ? 0.0 : (sin(PI * s1) + sin(PI * s2));
  col += uAccent * flash * 0.35;

  // 碎裂版：飛行時發熱變橘白，落地後餘光
  col = mix(col, vec3(1.0, 0.55, 0.25), heat * 0.55);
  // 餘光顏色：碎裂版是火紅，昇華、吸附版是金色
  col += ((ascend || gather) ? vec3(1.0, 0.82, 0.45) * 0.75 : vec3(1.0, 0.45, 0.3) * 0.9) * glow;

  // 霧化版：失焦時偏冷白
  col = mix(col, vec3(0.62, 0.82, 0.95) * (0.4 + lum), fog * 0.3);

  // 重影版：分裂時右層偏青綠；永久的重影層也偏青綠
  float split = twin ? max(sin(PI * s1), sin(PI * s2)) : 0.0;
  col = mix(col, vec3(0.35, 0.95, 0.85) * (0.3 + lum), 0.3 * split * step(0.0, lay) + 0.35 * ghost);

  // 旋渦版：捲動時偏洋紅、更亮
  float vort = vortex ? max(sin(PI * s1), sin(PI * s2)) : 0.0;
  col = mix(col, vec3(0.9, 0.3, 0.75) * (0.4 + lum), vort * 0.35);

  float size0 = 2.0 * (1.0 + 0.25 * uReveal);
  float size = mix(mix(size0, 2.1, s1), 1.9, s2) * uSizeScale;
  size *= (1.0 + flash * 0.35 + heat * 0.6 + glow * 0.5 + fog * 2.4 + vort * 0.3) * vis * (1.0 - 0.6 * uDissolve);

  float a0 = (0.2 + lum * 0.7) * 0.75 * (1.0 + 0.35 * uReveal);
  float a = mix(mix(a0, 0.7, s1), 0.7, s2);
  a *= (1.0 + glow * 0.4) * (1.0 - 0.55 * fog) * (1.0 - 0.4 * ghost);

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