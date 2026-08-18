'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Cloud, ContactShadows } from '@react-three/drei'
import type { DetectionSite } from '@/lib/mdmis-data'
import { MINERAL_HEX, getResolvedTerrainConfig } from '@/lib/site-terrain'
import { fbm2D, hash2, seedFromString } from '@/lib/noise'
import { buildTerrainBlock, buildOreBlob } from '@/lib/terrain-geometry'

const SIZE = 26
const SEGMENTS = 56
const CUT_DEPTH = 10

interface SceneProps {
  site: DetectionSite
  xray: boolean
}

function Vein({
  position,
  length,
  axis,
  color,
}: {
  position: [number, number, number]
  length: number
  axis: 'x' | 'z'
  color: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const m = ref.current?.material as THREE.MeshStandardMaterial | undefined
    if (m) m.emissiveIntensity = 0.9 + Math.sin(clock.elapsedTime * 1.6) * 0.35
  })
  const dims: [number, number, number] = axis === 'x' ? [length, 0.5, 0.16] : [0.16, 0.5, length]
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={dims} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} />
    </mesh>
  )
}

function OreBlob({
  position,
  radius,
  color,
  seed,
}: {
  position: [number, number, number]
  radius: number
  color: string
  seed: number
}) {
  const geo = useMemo(() => buildOreBlob(radius, seed), [radius, seed])
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const m = ref.current?.material as THREE.MeshStandardMaterial | undefined
    if (m) m.emissiveIntensity = 0.65 + Math.sin(clock.elapsedTime * 1.3) * 0.3
  })
  return (
    <mesh ref={ref} geometry={geo} position={position} castShadow>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.4} metalness={0.1} toneMapped={false} />
    </mesh>
  )
}

function Trees({
  seed,
  half,
  heightAt,
  amplitude,
  density,
  colors,
}: {
  seed: number
  half: number
  heightAt: (nx: number, nz: number) => number
  amplitude: number
  density: number
  colors: string[]
}) {
  const trees = useMemo(() => {
    const count = Math.round(density * 90)
    const items: { x: number; y: number; z: number; scale: number; color: string }[] = []
    for (let i = 0; i < count; i++) {
      const nx = fbm2D(i * 3.1, 0.7, seed + 300, 1) * 2 - 1
      const nz = fbm2D(0.4, i * 2.7, seed + 600, 1) * 2 - 1
      if (Math.max(Math.abs(nx), Math.abs(nz)) > 0.86) continue
      const h = heightAt(nx, nz)
      const t = h / amplitude
      if (t > 0.72) continue // no trees above the tree line
      const jitter = fbm2D(i * 5.2, i * 1.3, seed + 900, 1)
      items.push({
        x: nx * half,
        y: h,
        z: nz * half,
        scale: 0.55 + jitter * 0.5,
        color: colors[i % colors.length],
      })
    }
    return items
  }, [seed, half, heightAt, amplitude, density, colors])

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]} scale={t.scale}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <coneGeometry args={[0.32, 0.7, 6]} />
            <meshStandardMaterial color={t.color} flatShading />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.14, 5]} />
            <meshStandardMaterial color="#5b4632" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Houses({
  seed,
  half,
  heightAt,
  amplitude,
}: {
  seed: number
  half: number
  heightAt: (nx: number, nz: number) => number
  amplitude: number
}) {
  const houses = useMemo(() => {
    // find a flattish spot for the settlement by sampling a handful of candidates
    let anchor = { nx: 0.35, nz: 0.3, h: Infinity }
    for (let i = 0; i < 16; i++) {
      const nx = 0.1 + hash2(seed + i * 7, 11) * 0.5
      const nz = 0.05 + hash2(seed + i * 7, 23) * 0.5
      const h = heightAt(nx, nz)
      if (h < anchor.h) anchor = { nx, nz, h }
    }

    const roofColors = ['#8a4a3a', '#6b3f30', '#a5583f']
    const items: { x: number; y: number; z: number; rot: number; roof: string }[] = []
    for (let i = 0; i < 9; i++) {
      const ox = (hash2(seed + i * 3, 41) - 0.5) * 0.18
      const oz = (hash2(seed + i * 3, 59) - 0.5) * 0.18
      const nx = anchor.nx + ox
      const nz = anchor.nz + oz
      const h = heightAt(nx, nz)
      if (h / amplitude > 0.38) continue
      items.push({
        x: nx * half,
        y: h,
        z: nz * half,
        rot: hash2(seed + i, 71) * Math.PI * 2,
        roof: roofColors[i % roofColors.length],
      })
    }
    return items
  }, [seed, half, heightAt, amplitude])

  return (
    <group>
      {houses.map((h, i) => (
        <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.rot, 0]} scale={0.5}>
          <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.44, 0.42]} />
            <meshStandardMaterial color="#ded2b6" flatShading />
          </mesh>
          <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.4, 0.3, 4]} />
            <meshStandardMaterial color={h.roof} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Graduated depth ruler planted beside the block, translating the cutaway's
 *  world-space Y down to real meters below surface so the deposit's depth
 *  reads as a measurement, not just a number in a tooltip. Ticks span the
 *  same 0–80m range the vein-depth mapping (site.depthMeters / 80) uses, so
 *  the highlighted marker lines up exactly with the glowing vein/blob. */
function DepthScale({
  cutDepth,
  markerHeight,
  veinY,
  siteDepthM,
  veinColor,
  half,
}: {
  cutDepth: number
  markerHeight: number
  veinY: number
  siteDepthM: number
  veinColor: string
  half: number
}) {
  const maxMeters = 80
  const metersToY = (m: number) => -cutDepth * (m / maxMeters)
  const ticks = [0, 20, 40, 60, 80]
  const poleX = half + 1.6
  const poleZ = half + 1.6

  return (
    <group position={[poleX, 0, poleZ]}>
      <mesh position={[0, (markerHeight - cutDepth) / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, markerHeight + cutDepth, 8]} />
        <meshBasicMaterial color="#c9d1d9" transparent opacity={0.5} />
      </mesh>

      {ticks.map((m) => (
        <group key={m} position={[0, metersToY(m), 0]}>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.56, 0.03, 0.03]} />
            <meshBasicMaterial color="#c9d1d9" transparent opacity={0.7} />
          </mesh>
          <Html distanceFactor={24} position={[0.7, 0, 0]} occlude={false}>
            <div className="pointer-events-none whitespace-nowrap rounded border border-white/10 bg-[#1a1d23]/80 px-1.5 py-0.5 font-mono text-[9px] text-white/70">
              {m}m
            </div>
          </Html>
        </group>
      ))}

      {/* this site's actual deposit depth, pinned to the same scale */}
      <group position={[0, veinY, 0]}>
        <mesh>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={veinColor} />
        </mesh>
        <Html distanceFactor={22} position={[0.85, 0, 0]} occlude={false}>
          <div
            className="pointer-events-none whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold text-[#1a1408] shadow"
            style={{ background: veinColor }}
          >
            ▶ {siteDepthM}m deposit
          </div>
        </Html>
      </group>
    </group>
  )
}

function TerrainScene({ site, xray }: SceneProps) {
  const seed = seedFromString(site.id)
  const half = SIZE / 2
  const { biome, strata, colors, amplitude, frequency, elevationM } = useMemo(
    () => getResolvedTerrainConfig(site.id, seed),
    [site.id, seed],
  )

  const { surfaceGeometry, wallGeometry, bottomGeometry, maxHeight, heightAt } = useMemo(
    () =>
      buildTerrainBlock({
        seed,
        size: SIZE,
        segments: SEGMENTS,
        amplitude,
        frequency,
        biomeColors: colors,
        cutDepth: CUT_DEPTH,
        strataBands: strata.bands,
      }),
    [seed, amplitude, frequency, colors, strata],
  )

  const veinColor = MINERAL_HEX[site.primaryMineral]
  const veinDepthRatio = Math.min(Math.max(site.depthMeters / 80, 0.15), 0.88)
  const veinY = -CUT_DEPTH * veinDepthRatio
  const blobRadius = Math.min(Math.max(Math.sqrt(site.estimatedTonnage) / 95, 0.75), 2.3)

  const markerHeight = heightAt(0, 0)
  const waterX = -half * 0.55
  const waterZ = half * 0.4

  const groundMaterialProps = xray
    ? { transparent: true, opacity: 0.15, depthWrite: false }
    : { transparent: false, opacity: 1, depthWrite: true }

  return (
    <>
      <color attach="background" args={[biome.skyTint]} />
      <fog attach="fog" args={[biome.skyTint, 28, 60]} />

      <ambientLight intensity={xray ? 0.9 : 0.7} />
      <directionalLight position={[14, 22, 10]} intensity={1.3} castShadow />
      <hemisphereLight args={['#ffffff', '#546047', 0.4]} />

      <mesh geometry={surfaceGeometry} receiveShadow={!xray} castShadow={!xray} renderOrder={xray ? 2 : 0}>
        <meshStandardMaterial vertexColors flatShading {...groundMaterialProps} />
      </mesh>
      <mesh geometry={wallGeometry} renderOrder={xray ? 2 : 0}>
        <meshStandardMaterial vertexColors flatShading side={THREE.DoubleSide} {...groundMaterialProps} />
      </mesh>
      <mesh geometry={bottomGeometry} renderOrder={xray ? 2 : 0}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} {...groundMaterialProps} />
      </mesh>

      {biome.hasWater && (
        <>
          <mesh position={[waterX, 0.03, waterZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[half * 0.28, half * 0.35, 32]} />
            <meshStandardMaterial color="#d9c9a0" roughness={1} />
          </mesh>
          <mesh position={[waterX, 0.05, waterZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[half * 0.28, 32]} />
            <meshPhysicalMaterial color={biome.waterColor} transparent opacity={0.88} roughness={0.15} metalness={0.05} clearcoat={0.6} />
          </mesh>
        </>
      )}

      <Trees seed={seed} half={half} heightAt={heightAt} amplitude={maxHeight} density={biome.treeDensity} colors={biome.treeColors} />
      <Houses seed={seed} half={half} heightAt={heightAt} amplitude={maxHeight} />

      {/* exposed ore vein on the two visible cutaway faces */}
      <Vein position={[0, veinY, -half]} length={SIZE * 0.7} axis="x" color={veinColor} />
      <Vein position={[half, veinY, 0]} length={SIZE * 0.7} axis="z" color={veinColor} />

      {/* the true 3D deposit shape, hidden behind solid ground until X-Ray is toggled on */}
      <OreBlob position={[half * 0.3, veinY, -half * 0.28]} radius={blobRadius} color={veinColor} seed={seed} />

      {/* depth guide from surface marker down to the vein */}
      <mesh position={[0, (markerHeight + veinY) / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, markerHeight - veinY, 6]} />
        <meshBasicMaterial color={veinColor} transparent opacity={0.5} />
      </mesh>

      {/* graduated depth scale beside the block, in meters below surface */}
      <DepthScale
        cutDepth={CUT_DEPTH}
        markerHeight={markerHeight}
        veinY={veinY}
        siteDepthM={site.depthMeters}
        veinColor={veinColor}
        half={half}
      />

      <group position={[0, markerHeight, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.22, 0.6, 4]} />
          <meshStandardMaterial color="#e6563f" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
          <meshStandardMaterial color="#1a1d23" />
        </mesh>
        <Html distanceFactor={22} position={[0, 1.1, 0]} occlude>
          <div className="pointer-events-none rounded-md border border-white/15 bg-[#1a1d23]/90 px-2.5 py-1.5 text-[10px] text-white backdrop-blur whitespace-nowrap">
            <div className="font-semibold">{site.name}</div>
            <div className="text-white/60">
              {elevationM}m elevation · {site.primaryMineral} · {site.depthMeters}m deep
            </div>
          </div>
        </Html>
      </group>

      <Cloud position={[-half * 0.4, maxHeight + 6, -half * 0.3]} opacity={0.5} speed={0.15} bounds={[6, 1, 3]} segments={12} />
      <Cloud position={[half * 0.5, maxHeight + 7.5, half * 0.2]} opacity={0.4} speed={0.15} bounds={[5, 1, 3]} segments={10} />

      <ContactShadows position={[0, -0.01, 0]} opacity={0.25} scale={SIZE} blur={2} far={4} />

      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={42}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </>
  )
}

export default function SiteTerrainBlock({ site, xray = false }: { site: DetectionSite; xray?: boolean }) {
  return (
    <Canvas shadows camera={{ position: [20, 15, 20], fov: 38 }} dpr={[1, 1.5]}>
      <TerrainScene site={site} xray={xray} />
    </Canvas>
  )
}
