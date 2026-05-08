"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type OrbAgentState = "idle" | "connecting" | "listening" | "speaking";

type ParticleShellProps = {
  count: number;
  innerRadius: number;
  outerRadius: number;
  size: number;
  colorA: THREE.Color;
  colorB: THREE.Color;
  swirl: number;
  noiseStrength: number;
  opacity: number;
  renderOrder?: number;
  intensityRef: React.RefObject<number>;
};

function ParticleShell({
  count,
  innerRadius,
  outerRadius,
  size,
  colorA,
  colorB,
  swirl,
  noiseStrength,
  opacity,
  renderOrder = 0,
  intensityRef,
}: ParticleShellProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      const radialBias = innerRadius === 0 ? 1.6 : 0.6;
      const r =
        innerRadius +
        Math.pow(Math.random(), radialBias) * (outerRadius - innerRadius);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      rnd[i * 3] = Math.random() * Math.PI * 2;
      rnd[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      rnd[i * 3 + 2] = Math.random();
    }

    return { positions: pos, randoms: rnd };
  }, [count, innerRadius, outerRadius]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      },
      uSize: { value: size },
      uColorA: { value: colorA.clone() },
      uColorB: { value: colorB.clone() },
      uSwirl: { value: swirl },
      uNoiseStrength: { value: noiseStrength },
      uOpacity: { value: opacity },
      uPulse: { value: 0 },
      uIntensity: { value: 0 },
    }),
    [size, colorA, colorB, swirl, noiseStrength, opacity]
  );

  useFrame(({ clock }) => {
    if (!materialRef.current || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    const intensity = intensityRef.current ?? 0;
    const u = materialRef.current.uniforms;
    u.uTime.value = t;
    u.uIntensity.value = intensity;

    u.uPulse.value = 0.5 + 0.5 * Math.sin(t * 1.6);
  });

  return (
    <points ref={pointsRef} renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          array={randoms}
          count={randoms.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

function OrbScene({
  agentState,
  audioLevelRef,
}: {
  agentState: OrbAgentState;
  audioLevelRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const intensityRef = useRef(0);
  const speakingPhase = useRef({ slow: 0, fast: 0 });

  const colors = useMemo(
    () => ({
      coreFront: new THREE.Color("#4c1d95"),
      coreBack: new THREE.Color("#a78bfa"),
      haloFront: new THREE.Color("#5b21b6"),
      haloBack: new THREE.Color("#c4b5fd"),
      mistFront: new THREE.Color("#7c3aed"),
      mistBack: new THREE.Color("#ddd6fe"),
    }),
    []
  );

  useFrame(({ clock, pointer }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    let target = 0;
    if (agentState === "idle") {
      target = 0;
    } else if (agentState === "connecting") {
      target = 0.3 + 0.2 * Math.sin(t * 1.4);
    } else if (agentState === "listening") {
      const audio = audioLevelRef.current ?? 0;
      target = 0.2 + audio * 1.2;
    } else if (agentState === "speaking") {
      speakingPhase.current.slow += delta * 3.0;
      const slow = 0.5 + 0.5 * Math.sin(speakingPhase.current.slow);
      const wobble = 0.5 + 0.5 * Math.sin(t * 5.5 + Math.sin(t * 1.7));
      target = 0.45 + 0.4 * (slow * 0.65 + wobble * 0.35);
    }

    target = Math.min(1, Math.max(0, target));
    intensityRef.current += (target - intensityRef.current) * 0.15;

    targetRotation.current.y = pointer.x * 0.4 + t * 0.18;
    targetRotation.current.x =
      -pointer.y * 0.3 + Math.sin(t * 0.25) * 0.12;

    groupRef.current.rotation.y +=
      (targetRotation.current.y - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x +=
      (targetRotation.current.x - groupRef.current.rotation.x) * 0.05;

    const breatheBase = 1 + Math.sin(t * 1.4) * 0.025;
    const reactScale = 1 + intensityRef.current * 0.18;
    groupRef.current.scale.setScalar(breatheBase * reactScale);
  });

  return (
    <group ref={groupRef}>
      <ParticleShell
        count={1800}
        innerRadius={1.3}
        outerRadius={1.65}
        size={9}
        colorA={colors.mistFront}
        colorB={colors.mistBack}
        swirl={0.8}
        noiseStrength={0.22}
        opacity={0.5}
        renderOrder={0}
        intensityRef={intensityRef}
      />
      <ParticleShell
        count={3000}
        innerRadius={0.95}
        outerRadius={1.3}
        size={13}
        colorA={colors.haloFront}
        colorB={colors.haloBack}
        swirl={0.55}
        noiseStrength={0.14}
        opacity={0.85}
        renderOrder={1}
        intensityRef={intensityRef}
      />
      <ParticleShell
        count={3500}
        innerRadius={0.0}
        outerRadius={0.95}
        size={16}
        colorA={colors.coreFront}
        colorB={colors.coreBack}
        swirl={0.35}
        noiseStrength={0.08}
        opacity={1}
        renderOrder={2}
        intensityRef={intensityRef}
      />
    </group>
  );
}

function useAudioLevel(mediaStream: MediaStream | null | undefined) {
  const levelRef = useRef(0);

  useEffect(() => {
    if (!mediaStream) {
      levelRef.current = 0;
      return;
    }

    type AudioCtor = typeof AudioContext;
    const w = window as unknown as {
      AudioContext?: AudioCtor;
      webkitAudioContext?: AudioCtor;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const source = ctx.createMediaStreamSource(mediaStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    let smoothed = 0;

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const normalized = Math.min(1, rms * 4.5);
      smoothed += (normalized - smoothed) * 0.3;
      levelRef.current = smoothed;
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      try {
        source.disconnect();
      } catch {
        /* noop */
      }
      ctx.close().catch(() => {
        /* noop */
      });
    };
  }, [mediaStream]);

  return levelRef;
}

type ParticleOrbProps = {
  className?: string;
  agentState?: OrbAgentState;
  mediaStream?: MediaStream | null;
};

export function ParticleOrb({
  className,
  agentState = "idle",
  mediaStream = null,
}: ParticleOrbProps) {
  const audioLevelRef = useAudioLevel(mediaStream);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 55 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <OrbScene agentState={agentState} audioLevelRef={audioLevelRef} />
      </Canvas>
    </div>
  );
}

const vertexShader = /* glsl */ `
  attribute vec3 aRandom;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uSwirl;
  uniform float uNoiseStrength;
  uniform float uPulse;
  uniform float uIntensity;

  varying float vDepth;
  varying float vRandom;
  varying float vIntensity;

  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(dot(hash3(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
            dot(hash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
        mix(dot(hash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
            dot(hash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x),
        u.y
      ),
      mix(
        mix(dot(hash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
            dot(hash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
        mix(dot(hash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
            dot(hash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x),
        u.y
      ),
      u.z
    );
  }

  void main() {
    vec3 pos = position;
    vec3 dir = normalize(pos);

    float angle = uTime * uSwirl + aRandom.x;
    float c = cos(angle * 0.5);
    float s = sin(angle * 0.5);
    mat3 rot = mat3(
      c, 0.0, s,
      0.0, 1.0, 0.0,
      -s, 0.0, c
    );
    pos = rot * pos;

    float n = noise3(pos * 1.4 + uTime * 0.25);
    pos += dir * n * uNoiseStrength;

    float orbit = sin(uTime * 0.6 + aRandom.x * 6.28318) * 0.04 * aRandom.y;
    pos += dir * orbit;

    float pulseScale = 1.0 + uPulse * 0.04 * aRandom.y;
    pos *= pulseScale;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    float dist = -mvPosition.z;
    vDepth = 1.0 - clamp((dist - 1.7) / 3.5, 0.0, 1.0);
    vRandom = aRandom.z;
    vIntensity = uIntensity;

    gl_Position = projectionMatrix * mvPosition;

    float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aRandom.x * 8.0);
    float depthSize = mix(0.55, 1.3, vDepth);
    float intensityBoost = 1.0 + uIntensity * 0.35;
    gl_PointSize = uSize * uPixelRatio * twinkle * depthSize * intensityBoost * (1.0 / dist);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  varying float vDepth;
  varying float vRandom;
  varying float vIntensity;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float disc = smoothstep(0.5, 0.05, d);
    float coreHot = pow(disc, 3.0);

    vec3 color = mix(uColorB, uColorA, vDepth);
    color = mix(color, color * 0.7, coreHot * vDepth * 0.4);
    color = mix(color, color * 1.12, vIntensity * 0.5);

    float alpha = disc * uOpacity * mix(0.25, 1.1, vDepth);
    alpha *= 1.0 + vIntensity * 0.18;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;
