import * as THREE from 'three'
import { fbm2D, hash2 } from './noise'
import type { BiomePreset } from './site-terrain'

export interface TerrainBlockOptions {
  seed: number
  size: number
  segments: number
  amplitude: number
  frequency: number
  biomeColors: BiomePreset['colors']
  cutDepth: number
  /** bottom (bedrock) -> top (subsoil), exactly 5 hex colors */
  strataBands: string[]
}

export interface TerrainBlockResult {
  surfaceGeometry: THREE.BufferGeometry
  wallGeometry: THREE.BufferGeometry
  bottomGeometry: THREE.BufferGeometry
  maxHeight: number
  heightAt: (nx: number, nz: number) => number
}

const tmpColor = new THREE.Color()

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

function hexToVec(hex: string): [number, number, number] {
  tmpColor.set(hex)
  return [tmpColor.r, tmpColor.g, tmpColor.b]
}

function lerp3(a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function lerpColor(hexA: string, hexB: string, t: number): [number, number, number] {
  return lerp3(hexToVec(hexA), hexToVec(hexB), clamp01(t))
}

interface Peak {
  px: number
  pz: number
  radius: number
  weight: number
}

const peakCache = new Map<number, Peak[]>()

/** A handful of seeded, roughly-conical mountains — gives each block a
 *  recognizable skyline (like the reference diorama) instead of chaotic noise. */
function getPeaks(seed: number): Peak[] {
  const cached = peakCache.get(seed)
  if (cached) return cached
  const count = 3 + Math.floor(hash2(seed, 1) * 3) // 3-5 peaks
  const peaks: Peak[] = []
  for (let i = 0; i < count; i++) {
    const s = seed + i * 131
    peaks.push({
      px: (hash2(s, 2) * 2 - 1) * 0.55,
      pz: (hash2(s, 3) * 2 - 1) * 0.5,
      radius: 0.2 + hash2(s, 4) * 0.22,
      weight: 0.5 + hash2(s, 5) * 0.55,
    })
  }
  peakCache.set(seed, peaks)
  return peaks
}

function heightField(nx: number, nz: number, seed: number, amplitude: number, frequency: number) {
  const peaks = getPeaks(seed)
  let peakSum = 0
  for (const p of peaks) {
    const dx = nx - p.px
    const dz = nz - p.pz
    const d2 = dx * dx + dz * dz
    const r2 = p.radius * p.radius
    peakSum += p.weight * Math.exp(-d2 / (2 * r2))
  }

  const rolling = fbm2D(nx * frequency * 0.5 + 100, nz * frequency * 0.5 + 100, seed, 3)
  const texture = fbm2D(nx * frequency * 2.4 + 400, nz * frequency * 2.4 + 400, seed + 50, 2)
  const combined = clamp01(rolling * 0.3 + peakSum * 0.8 + texture * 0.06)

  const edge = 1 - Math.max(Math.abs(nx), Math.abs(nz))
  const fade = Math.pow(clamp01(edge), 0.55)
  const floor = 0.07
  return amplitude * (floor + combined * (1 - floor) * fade)
}

/**
 * Builds a "terrain block" — a noise-displaced surface with a few seeded
 * mountain peaks, whose perimeter is skirted straight down to a flat base,
 * with wall vertices striped in geological strata bands (by world Y).
 * Mirrors the sliced-earth diorama look: raised terrain on top, exposed
 * rock cross-section on the sides.
 */
export function buildTerrainBlock(opts: TerrainBlockOptions): TerrainBlockResult {
  const { seed, size, segments, amplitude, frequency, biomeColors, cutDepth, strataBands } = opts
  const half = size / 2
  const seg = segments

  // --- top surface ---
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const heights: number[][] = []

  for (let j = 0; j <= seg; j++) {
    const row: number[] = []
    const nz = (j / seg) * 2 - 1
    for (let i = 0; i <= seg; i++) {
      const nx = (i / seg) * 2 - 1
      const h = heightField(nx, nz, seed, amplitude, frequency)
      row.push(h)
      positions.push(nx * half, h, nz * half)

      const t = clamp01(h / amplitude)
      let col: [number, number, number]
      if (t < 0.35) col = lerpColor(biomeColors.low, biomeColors.mid, t / 0.35)
      else if (t < 0.7) col = lerpColor(biomeColors.mid, biomeColors.high, (t - 0.35) / 0.35)
      else col = lerpColor(biomeColors.high, biomeColors.peak, (t - 0.7) / 0.3)

      const patch = fbm2D(nx * 6 + 50, nz * 6 + 50, seed + 900, 2)
      const mix = 0.12 * (patch - 0.5)
      colors.push(clamp01(col[0] + mix), clamp01(col[1] + mix), clamp01(col[2] + mix))
    }
    heights.push(row)
  }

  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i
      const b = a + 1
      const c = a + (seg + 1)
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const surfaceGeometry = new THREE.BufferGeometry()
  surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  surfaceGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  surfaceGeometry.setIndex(indices)
  surfaceGeometry.computeVertexNormals()

  // --- perimeter walls (strata cutaway) ---
  const bottomY = -cutDepth
  const vertSegs = 10
  const bandSteps = 16
  const wallPositions: number[] = []
  const wallColors: number[] = []
  const wallIndices: number[] = []

  function strataColorAt(y: number, topY: number, worldX: number, worldZ: number) {
    const wave = (fbm2D(worldX * 0.35 + seed, worldZ * 0.35 + seed + 40, seed + 200, 2) - 0.5) * 0.9
    const t = clamp01((y - bottomY + wave) / (topY - bottomY || 1))
    const bandT = 1 - t
    const scaled = bandT * (strataBands.length - 1)
    const idx = Math.floor(scaled)
    const frac = scaled - idx
    const c0 = hexToVec(strataBands[Math.min(idx, strataBands.length - 1)])
    const c1 = hexToVec(strataBands[Math.min(idx + 1, strataBands.length - 1)])
    const base = lerp3(c0, c1, frac)

    const stripeIdx = Math.floor(bandT * bandSteps)
    const jitter = (hash2(stripeIdx, seed + 55) - 0.5) * 0.09
    return [clamp01(base[0] + jitter), clamp01(base[1] + jitter), clamp01(base[2] + jitter)] as const
  }

  function addWallStrip(edgePts: { x: number; z: number; topY: number }[], axis: 'x' | 'z') {
    const base = wallPositions.length / 3
    edgePts.forEach((p, ei) => {
      for (let k = 0; k <= vertSegs; k++) {
        const t = k / vertSegs
        const y = p.topY + (bottomY - p.topY) * t
        const jitter = (fbm2D(ei * 0.9 + seed, k * 1.1 + seed, seed + 700, 2) - 0.5) * 0.32
        const x = axis === 'x' ? p.x + jitter : p.x
        const z = axis === 'z' ? p.z + jitter : p.z
        wallPositions.push(x, y, z)
        wallColors.push(...strataColorAt(y, p.topY, p.x, p.z))
      }
    })
    const rows = edgePts.length
    for (let i = 0; i < rows - 1; i++) {
      for (let k = 0; k < vertSegs; k++) {
        const a = base + i * (vertSegs + 1) + k
        const b = a + (vertSegs + 1)
        const c = a + 1
        const d = b + 1
        wallIndices.push(a, b, c, c, b, d)
      }
    }
  }

  const northEdge: { x: number; z: number; topY: number }[] = []
  const southEdge: { x: number; z: number; topY: number }[] = []
  const westEdge: { x: number; z: number; topY: number }[] = []
  const eastEdge: { x: number; z: number; topY: number }[] = []
  for (let i = 0; i <= seg; i++) {
    const nx = (i / seg) * 2 - 1
    northEdge.push({ x: nx * half, z: -half, topY: heights[0][i] })
    southEdge.push({ x: nx * half, z: half, topY: heights[seg][i] })
  }
  for (let j = 0; j <= seg; j++) {
    const nz = (j / seg) * 2 - 1
    westEdge.push({ x: -half, z: nz * half, topY: heights[j][0] })
    eastEdge.push({ x: half, z: nz * half, topY: heights[j][seg] })
  }
  addWallStrip(northEdge, 'z')
  addWallStrip(southEdge, 'z')
  addWallStrip(westEdge, 'x')
  addWallStrip(eastEdge, 'x')

  const wallGeometry = new THREE.BufferGeometry()
  wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3))
  wallGeometry.setAttribute('color', new THREE.Float32BufferAttribute(wallColors, 3))
  wallGeometry.setIndex(wallIndices)
  wallGeometry.computeVertexNormals()

  // --- bottom (bedrock) ---
  const bottomGeometry = new THREE.PlaneGeometry(size, size)
  bottomGeometry.rotateX(Math.PI / 2)
  bottomGeometry.translate(0, bottomY, 0)
  const bedrock = hexToVec(strataBands[0])
  const bcount = bottomGeometry.attributes.position.count
  const bcolors: number[] = []
  for (let i = 0; i < bcount; i++) bcolors.push(...bedrock)
  bottomGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bcolors, 3))

  const heightAt = (nx: number, nz: number) => heightField(nx, nz, seed, amplitude, frequency)

  return { surfaceGeometry, wallGeometry, bottomGeometry, maxHeight: amplitude, heightAt }
}

/** An organic, slightly lumpy ore-body blob — the "true" 3D deposit shape
 *  revealed inside the block when the ground is made translucent. */
export function buildOreBlob(radius: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 3)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = v.clone().normalize()
    const noise = fbm2D(n.x * 2.2 + seed, n.y * 2.2 + n.z * 1.7 + seed, seed + 300, 3)
    v.multiplyScalar(0.72 + noise * 0.55)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}
