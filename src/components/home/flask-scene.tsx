"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei"
import * as THREE from "three"
import { labState } from "./lab-store"
import { createRng } from "@/lib/generator/random"

// The coins that bubble out of the flask: FunCoin Lab's own coin plus the example coins.
const COINS = ["funcoinlab", "sleepy", "banana", "alien", "chad", "moondog", "sleepyai", "frogking", "gooseglitch", "samosasquad", "capybro", "pizzalord", "npcgpt"].map(
  (slug) => `/coins/${slug}.webp`,
)

/** Erlenmeyer flask profile (radius, height), revolved by LatheGeometry. */
const FLASK_PROFILE: [number, number][] = [
  [0.001, -1.2], [0.9, -1.2], [1.08, -1.17], [1.2, -1.08], [1.24, -0.96],
  [1.2, -0.84], [0.46, 0.8], [0.38, 0.92], [0.36, 1.05], [0.36, 1.52], [0.4, 1.56], [0.46, 1.6], [0.46, 1.66],
]
const LIQUID_TOP = -0.25
/** Inner radius of the flask body at height y (the conical part). */
const bodyRadius = (y: number) => 1.2 - ((y + 0.84) / (0.8 + 0.84)) * (1.2 - 0.46)

function coinTexture(url: string) {
  const tex = new THREE.TextureLoader().load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function backdropTexture(theme: "dark" | "light") {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!
  const g = ctx.createRadialGradient(size * 0.55, size * 0.4, 8, size / 2, size / 2, size * 0.75)
  if (theme === "dark") {
    g.addColorStop(0, "#3a3168")
    g.addColorStop(0.4, "#1d1930")
    g.addColorStop(1, "#0e0d14")
  } else {
    g.addColorStop(0, "#ffffff")
    g.addColorStop(0.5, "#e4defc")
    g.addColorStop(1, "#f3f2f6")
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type Bubble = { x: number; z: number; y: number; speed: number; phase: number; scale: number }

function spawn(b: Bubble, initial = false, rand: () => number = Math.random) {
  const r = 0.55 * Math.sqrt(rand())
  const a = rand() * Math.PI * 2
  b.x = Math.cos(a) * r
  b.z = Math.sin(a) * r
  b.y = initial ? LIQUID_TOP - rand() * 2.5 : LIQUID_TOP - 0.1 - rand() * 0.8
  b.speed = 0.35 + rand() * 0.35
  b.phase = rand() * Math.PI * 2
  b.scale = 0.36 + rand() * 0.16
}

function CoinBubbles({ count }: { count: number }) {
  const textures = useMemo(() => COINS.map(coinTexture), [])
  const sprites = useRef<(THREE.Sprite | null)[]>([])
  const bubbles = useMemo(() => {
    const list: Bubble[] = Array.from({ length: count }, () => ({ x: 0, z: 0, y: 0, speed: 0, phase: 0, scale: 0 }))
    // Seeded so the initial layout is pure and stable; respawns later use Math.random in useFrame.
    const rng = createRng(11)
    list.forEach((b) => spawn(b, true, rng.next))
    return list
  }, [count])

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const energy = 1 + labState.boil * 4 + labState.fizz * 1.5
    bubbles.forEach((b, i) => {
      const s = sprites.current[i]
      if (!s) return
      b.y += b.speed * dt * energy
      // Squeeze toward the neck while inside the glass, drift outward once free.
      const inside = b.y < 1.6
      const maxR = b.y < 0.8 ? Math.max(0.2, bodyRadius(b.y) * 0.55) : 0.2
      const wob = Math.sin(state.clock.elapsedTime * 2 + b.phase) * 0.06
      const clamp = (v: number) => (inside ? THREE.MathUtils.clamp(v, -maxR, maxR) : v * (1 + dt * 0.6))
      b.x = clamp(b.x)
      b.z = clamp(b.z)
      s.position.set(b.x + wob, b.y, b.z)
      // Pop: swell and fade near the top, then respawn in the liquid.
      const popStart = 2.5
      const t = THREE.MathUtils.clamp((b.y - popStart) / 0.5, 0, 1)
      const neck = b.y > 0.55 && b.y < 1.7 ? 0.62 : 1
      const sc = b.scale * neck * (1 + t * 0.8)
      s.scale.set(sc, sc, sc)
      ;(s.material as THREE.SpriteMaterial).opacity = b.y < LIQUID_TOP ? 0 : 1 - t
      if (t >= 1) spawn(b)
    })
  })

  return (
    <>
      {bubbles.map((_, i) => (
        <sprite key={i} ref={(el) => void (sprites.current[i] = el)}>
          <spriteMaterial map={textures[i % textures.length]} transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  )
}

function FizzBubbles({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(() => {
    const rng = createRng(23)
    return Array.from({ length: count }, () => ({
      a: rng.next() * Math.PI * 2,
      r: rng.next(),
      y: -1.1 + rng.next() * 0.85,
      speed: 0.2 + rng.next() * 0.4,
      size: 0.015 + rng.next() * 0.035,
    }))
  }, [count])
  useFrame((_, delta) => {
    if (!mesh.current) return
    const energy = 1 + labState.boil * 5 + labState.fizz * 3
    data.forEach((d, i) => {
      d.y += d.speed * Math.min(delta, 0.05) * energy
      if (d.y > LIQUID_TOP - 0.02) d.y = -1.1
      const r = bodyRadius(Math.min(d.y, -0.84)) * 0.85 * d.r
      dummy.position.set(Math.cos(d.a) * r, d.y, Math.sin(d.a) * r)
      dummy.scale.setScalar(d.size)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
    </instancedMesh>
  )
}

function Flask({ quality, theme }: { quality: "high" | "low"; theme: "dark" | "light" }) {
  const backdrop = useMemo(() => backdropTexture(theme), [theme])
  useEffect(() => () => backdrop.dispose(), [backdrop])
  const group = useRef<THREE.Group>(null)
  const liquidMat = useRef<THREE.MeshStandardMaterial>(null)
  const target = useMemo(() => new THREE.Color(labState.color), [])
  const { pointer } = useThree()

  const glassGeo = useMemo(
    () => new THREE.LatheGeometry(FLASK_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), 96),
    [],
  )
  const liquidGeo = useMemo(() => {
    const pts = [
      [0.001, -1.13], [0.86, -1.13], [1.02, -1.1], [1.12, -1.02], [1.15, -0.93], [1.11, -0.82],
      [bodyRadius(LIQUID_TOP) * 0.93, LIQUID_TOP], [0.001, LIQUID_TOP],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 96)
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    if (group.current) {
      const g = group.current
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.22, 3, dt)
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -pointer.x * 0.18 + Math.sin(state.clock.elapsedTime * 0.6) * 0.03, 3, dt)
      g.rotation.y += dt * 0.15
      g.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.06 + labState.boil * Math.sin(state.clock.elapsedTime * 40) * 0.02
    }
    if (liquidMat.current) {
      target.set(labState.color)
      liquidMat.current.color.lerp(target, 1 - Math.exp(-4 * dt))
      liquidMat.current.emissive.copy(liquidMat.current.color)
      liquidMat.current.emissiveIntensity = 0.35 + labState.boil * 0.9 + labState.fizz * 0.3
    }
    labState.boil = Math.max(0, labState.boil - dt * 0.6)
    labState.fizz = Math.max(0, labState.fizz - dt * 0.8)
  })

  return (
    <group ref={group} position={[0, -0.45, 0]}>
      <mesh geometry={glassGeo}>
        {quality === "high" ? (
          <MeshTransmissionMaterial
            backside
            samples={6}
            resolution={512}
            thickness={0.25}
            roughness={0.04}
            ior={1.3}
            chromaticAberration={0.06}
            anisotropy={0.15}
            distortion={0.12}
            distortionScale={0.4}
            temporalDistortion={0.08}
            background={backdrop}
            color="#f6f4ff"
          />
        ) : (
          <meshPhysicalMaterial
            roughness={0.05}
            metalness={0}
            clearcoat={1}
            envMapIntensity={1.4}
            color="#f6f4ff"
            transparent
            opacity={0.22}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
      <mesh geometry={liquidGeo}>
        <meshStandardMaterial ref={liquidMat} color={labState.color} roughness={0.25} metalness={0} transparent opacity={0.92} />
      </mesh>
      <FizzBubbles count={quality === "high" ? 46 : 24} />
      <CoinBubbles count={quality === "high" ? 9 : 6} />
    </group>
  )
}

export default function FlaskScene({ onReady, className, theme = "dark" }: { onReady?: () => void; className?: string; theme?: "dark" | "light" }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [quality] = useState<"high" | "low">(() => {
    if (typeof window === "undefined") return "low"
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const cores = navigator.hardwareConcurrency ?? 4
    return coarse || cores <= 4 ? "low" : "high"
  })

  // Stop rendering entirely while the hero is off-screen.
  useEffect(() => {
    if (!wrap.current) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 })
    io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className={className}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.35, 6.8], fov: 34 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={() => requestAnimationFrame(() => onReady?.())}
        aria-hidden
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <pointLight position={[-3, -1, 2]} intensity={3} color="#7b5cff" />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={4} position={[0, 4, -4]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[0, -3, 3]} scale={[6, 1, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#7b5cff" position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={2} color="#c6f432" position={[5, -1, 0]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer form="ring" intensity={2} position={[0, 2, 5]} scale={3} />
        </Environment>
        <Flask quality={quality} theme={theme} />
      </Canvas>
    </div>
  )
}
