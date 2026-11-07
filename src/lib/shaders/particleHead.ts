export const headVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uReveal;
uniform float uMotion;
uniform float uDissolve;

attribute float aTone;
attribute float aSeed;

varying float vTone;
varying float vDepth;

void main() {
  vec3 p = position;

  // 微小粒子抖動，hover 時更明顯
  float t = uTime * 0.6 + aSeed * 6.2831853;
  vec3 jitter = vec3(
    sin(t * 1.3 + aSeed * 10.0),
    cos(t * 1.1 + aSeed * 7.0),
    sin(t * 0.9 + aSeed * 13.0)
  );
  p += jitter * (0.004 + 0.014 * uReveal) * uMotion;

  // 類比訊號橫向干擾帶
  float band = smoothstep(0.985, 1.0, sin(p.y * 4.0 - uTime * 0.8));
  p.x += band * 0.03 * uMotion;

  // 溶解：粒子向外飄散
  vec3 dir = normalize(position + vec3(0.0001, 0.0002, 0.0003));
  p += dir * uDissolve * (0.6 + aSeed) * 1.4;
  p.y += uDissolve * aSeed * 0.5;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.45 + aTone * 1.1) * (1.0 + uReveal * 0.35);
  size *= (1.0 - uDissolve * 0.6);
  gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);

  vTone = aTone;
  vDepth = -mv.z;
}
`;

export const headFragment = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uReveal;
uniform float uOpacity;

varying float vTone;
varying float vDepth;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.05, 0.5, d);

  vec3 gray = vec3(0.91, 0.90, 0.91) * (0.15 + vTone * 0.95);
  vec3 tint = mix(uAccent2, uAccent, smoothstep(0.15, 0.85, vTone));
  vec3 colored = tint * (0.4 + vTone * 1.2);
  vec3 col = mix(gray, colored, smoothstep(0.0, 1.0, uReveal));

  float depthFade = mix(0.55, 1.0, 1.0 - smoothstep(9.0, 15.0, vDepth));
  float a = soft * (0.2 + vTone * 0.8) * (1.0 + uReveal * 0.5) * uOpacity * depthFade * 0.85;

  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

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
  float ring = (1.0 - smoothstep(0.0, 0.02, abs(d - 0.62))) * 0.35;
  float a = (glow * 0.5 + ring) * uIntensity;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;

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