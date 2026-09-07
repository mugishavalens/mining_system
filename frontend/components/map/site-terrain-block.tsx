'use client'

/**
 * 3D Terrain Block - Clean, Working Implementation
 * Displays mining site subsurface with smooth elevation and solid walls
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import type { OrbitControlsImpl } from 'three-stdlib'
import type { DetectionSite } from '@/lib/mdmis-data'
import { MINERAL_HEX } from '@/lib/site-terrain'
import { useDemTerrain } from '@/lib/use-dem-terrain'
import { useSatelliteTexture } from '@/lib/use-satellite-texture'
import { seedFromString } from '@/lib/noise'

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const TERRAIN_SIZE = 32  
const CUT_DEPTH = 16
const DEFAULT_CAM_POS: [number, number, number] = [28, 22, 28]
const DEFAULT_CAM_TARGET: [number, number, number] = [0, 3, 0]
const DEM_GRID_SIZE = 32  // Simple procedural grid

// ──TERRAIN GENERATION ──────────────────────────────────────────────────────

interface TerrainSceneProps {
  site: DetectionSite
  xray: boolean
  resetSignal: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

function TerrainScene({ site, xray, resetSignal, controlsRef }: TerrainSceneProps) {
  const seed = seedFromString(site.id)
  const half = TERRAIN_SIZE / 2

  // Load DEM (will fail, but we'll use procedural)
  const demTerrain = useDemTerrain(site, DEM_GRID_SIZE)
  const satelliteData = useSatelliteTexture(site, 2)
  const tex = satelliteData.status === 'ready' ? satelliteData.texture : null

  // Build terrain mesh
  const terrainData = useMemo(() => {
    console.log(`[Terrain] Building terrain block for ${site.id}`)
    
    // Generate procedural elevation grid
    const gridSize = 32
    const grid: number[][] = []
    
    for (let j = 0; j < gridSize; j++) {
      const row: number[] = []
      for (let i = 0; i < gridSize; i++) {
        const x = i / gridSize
        const y = j / gridSize
        // Generate terrain with variation
        const v1 = Math.sin(x * 4 + seed) * Math.cos(y * 4 + seed) * 2
        const v2 = Math.sin(x * 8) * Math.cos(y * 7) * 1
        const height = 4 + v1 + v2  // Base height 4, with -3 to +3 variation
        row.push(Math.max(0, height))
      }
      grid.push(row)
    }

    // Create surface geometry - explicitly positioned mesh
    const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 32, 32)
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const posArray = positions.array as Float32Array

    // Apply elevation to vertex Y positions
    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i]      // ranges from -half to +half
      const z = posArray[i + 2]  // ranges from -half to +half

      // Map to grid coordinates
      const gx = Math.floor(((x / half + 1) / 2) * (gridSize - 1))
      const gy = Math.floor(((z / half + 1) / 2) * (gridSize - 1))
      const gx2 = Math.min(gx + 1, gridSize - 1)
      const gy2 = Math.min(gy + 1, gridSize - 1)

      // Interpolate between grid points
      const fx = ((x / half + 1) / 2) * (gridSize - 1) - gx
      const fy = ((z / half + 1) / 2) * (gridSize - 1) - gy

      const v00 = grid[gy][gx]
      const v10 = grid[gy][gx2]
      const v01 = grid[gy2][gx]
      const v11 = grid[gy2][gx2]

      const h0 = v00 + (v10 - v00) * fx
      const h1 = v01 + (v11 - v01) * fx
      const h = h0 + (h1 - h0) * fy

      posArray[i + 1] = h  // Set Y (height)
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()

    // Surface is now in XZ plane at correct Y positions
    const maxH = Math.max(...Array.from(posArray).filter((_, i) => i % 3 === 1))

    return {
      surfaceGeometry: geometry,
      maxHeight: maxH,
      grid,
    }
  }, [site.id])

  const { surfaceGeometry, maxHeight, grid } = terrainData

  // Mineral deposit positioning
  const veinColor = MINERAL_HEX[site.primaryMineral] || '#ff6b6b'
  const depositDepth = Math.min(Math.max(site.depthMeters / 80, 0.2), 0.85)
  const depositY = -CUT_DEPTH * depositDepth
  const depositSize = Math.sqrt(site.estimatedTonnage) / 120

  // Camera and controls
  const { camera } = useThree()
  const [autoRotate, setAutoRotate] = useState(true)

  useFrame(({ clock }) => {
    // LOD and animation can go here
  })

  useEffect(() => {
    camera.position.set(...DEFAULT_CAM_POS)
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(...DEFAULT_CAM_TARGET)
      controls.update()
    }
    setAutoRotate(true)
  }, [site.id, resetSignal, camera, controlsRef])

  return (
    <>
      {/* BACKGROUND & FOG */}
      <color attach="background" args={['#0a0e27']} />
      <fog attach="fog" args={['#0a0e27', 50, 120]} />

      {/* LIGHTING */}
      <directionalLight
        position={[35, 50, 30]}
        intensity={1.6}
        color="#ffecd2"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.00005}
      />
      <directionalLight position={[-30, 25, -25]} intensity={0.7} color="#a8d8ff" />
      <ambientLight intensity={0.5} color="#ffffff" />
      <hemisphereLight args={['#87ceeb', '#1a3a1a', 0.6]} />

      {/* TERRAIN GROUP */}
      <group>
        {/* SURFACE MESH */}
        <mesh geometry={surfaceGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={tex}
            color={tex ? '#ffffff' : '#6b7d4d'}
            roughness={tex ? 0.65 : 0.75}
            metalness={0.05}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* WALLS - 4 rectangular faces */}
        {/* North wall (z = -half) */}
        <mesh
          position={[0, -CUT_DEPTH / 2, -half]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[TERRAIN_SIZE, CUT_DEPTH]} />
          <meshStandardMaterial color="#8b7355" roughness={0.8} metalness={0} side={THREE.FrontSide} />
        </mesh>

        {/* South wall (z = +half) */}
        <mesh
          position={[0, -CUT_DEPTH / 2, half]}
          rotation={[0, Math.PI, 0]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[TERRAIN_SIZE, CUT_DEPTH]} />
          <meshStandardMaterial color="#8b7355" roughness={0.8} metalness={0} side={THREE.FrontSide} />
        </mesh>

        {/* East wall (x = +half) */}
        <mesh
          position={[half, -CUT_DEPTH / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[TERRAIN_SIZE, CUT_DEPTH]} />
          <meshStandardMaterial color="#8b7355" roughness={0.8} metalness={0} side={THREE.FrontSide} />
        </mesh>

        {/* West wall (x = -half) */}
        <mesh
          position={[-half, -CUT_DEPTH / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[TERRAIN_SIZE, CUT_DEPTH]} />
          <meshStandardMaterial color="#8b7355" roughness={0.8} metalness={0} side={THREE.FrontSide} />
        </mesh>

        {/* BOTTOM PLATE */}
        <mesh position={[0, -CUT_DEPTH, 0]} receiveShadow>
          <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* MINERAL DEPOSIT (X-Ray visible) */}
        {xray && (
          <>
            {/* Floating pin */}
            <mesh position={[0, depositY + 8, 0]}>
              <coneGeometry args={[0.3, 2, 8]} />
              <meshStandardMaterial
                color={veinColor}
                emissive={veinColor}
                emissiveIntensity={0.8}
              />
            </mesh>

            {/* Connecting line */}
            <mesh position={[0, (depositY + depositY + 8) / 2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
              <meshStandardMaterial
                color={veinColor}
                emissive={veinColor}
                emissiveIntensity={0.6}
                transparent
                opacity={0.6}
              />
            </mesh>

            {/* Deposit sphere */}
            <mesh position={[0, depositY, 0]}>
              <sphereGeometry args={[depositSize, 32, 32]} />
              <meshStandardMaterial
                color={veinColor}
                emissive={veinColor}
                emissiveIntensity={0.7}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Halo */}
            <mesh position={[0, depositY, 0]}>
              <sphereGeometry args={[depositSize * 1.5, 16, 16]} />
              <meshBasicMaterial color={veinColor} transparent opacity={0.15} depthWrite={false} />
            </mesh>
          </>
        )}

        {/* SHADOW */}
        <ContactShadows position={[0, -CUT_DEPTH - 0.1, 0]} opacity={0.3} scale={TERRAIN_SIZE * 1.5} blur={3} far={10} />
      </group>

      {/* INFO LABEL */}
      <Html position={[0, maxHeight + 2, 0]} center distanceFactor={1}>
        <div className="pointer-events-none rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-center backdrop-blur">
          <div className="text-sm font-bold text-white">{site.name}</div>
          <div className="text-xs text-white/60">
            {site.primaryMineral} • {site.depthMeters}m deep
          </div>
        </div>
      </Html>

      {/* CAMERA CONTROLS */}
      <OrbitControls
        ref={controlsRef}
        target={DEFAULT_CAM_TARGET}
        enablePan={true}
        minDistance={15}
        maxDistance={60}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI * 0.9}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        onStart={() => setAutoRotate(false)}
      />

      {/* STATUS OVERLAY */}
      {demTerrain.status === 'loading' && (
        <Html center>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-blue-500 bg-black/80 px-6 py-4 backdrop-blur">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-blue-300">Loading terrain...</p>
          </div>
        </Html>
      )}
    </>
  )
}

// ── CANVAS WRAPPER ─────────────────────────────────────────────────────────

export default function SiteTerrainBlockV2({
  site,
  xray = false,
  resetSignal = 0,
  onContextLost,
}: {
  site: DetectionSite
  xray?: boolean
  resetSignal?: number
  onContextLost?: () => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0e27', 1)
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFShadowMap
        }}
      >
        <PerspectiveCamera position={DEFAULT_CAM_POS} fov={45} near={0.1} far={500} makeDefault />
        <TerrainScene site={site} xray={xray} resetSignal={resetSignal} controlsRef={controlsRef} />
      </Canvas>

      {/* UI OVERLAY */}
      <div className="pointer-events-none absolute top-4 left-4 text-xs text-white/60">
        <div>Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  )
}

// ──TERRAIN GENERATION ──────────────────────────────────────────────────────

interface TerrainSceneProps {
  site: DetectionSite
  xray: boolean
  resetSignal: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

function TerrainScene({ site, xray, resetSignal, controlsRef }: TerrainSceneProps) {
  const seed = seedFromString(site.id)
  const half = TERRAIN_SIZE / 2

  // Load real DEM - THIS IS THE KEY
  const demTerrain = useDemTerrain(site, DEM_GRID_SIZE)

  // Load satellite texture
  const satelliteData = useSatelliteTexture(site, 2)
  const tex = satelliteData.status === 'ready' ? satelliteData.texture : null

  // Build terrain from DEM with proper fallback
  const terrainData = useMemo(() => {
    let grid = demTerrain.normalizedElevations
    let gridSize = grid?.length || 0
    let hasDemData = demTerrain.status === 'ready' && grid && gridSize > 0
    
    console.log(`[Terrain] Building terrain. Has DEM: ${hasDemData}`)
    
    // Simple bilinear sampling
    const bilinearSample = (x: number, y: number): number => {
      if (!grid || gridSize === 0) return 0
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      const xf = x - xi
      const yf = y - yi
      const clamp = (v: number) => Math.max(0, Math.min(gridSize - 1, v))
      
      const x0 = clamp(xi), x1 = clamp(xi + 1)
      const y0 = clamp(yi), y1 = clamp(yi + 1)
      
      const v00 = grid[y0]?.[x0] ?? 0, v10 = grid[y0]?.[x1] ?? 0
      const v01 = grid[y1]?.[x0] ?? 0, v11 = grid[y1]?.[x1] ?? 0
      
      const top = v00 * (1 - xf) + v10 * xf
      const bottom = v01 * (1 - xf) + v11 * xf
      return top * (1 - yf) + bottom * yf
    }
    
    // If no DEM, generate procedural terrain
    if (!hasDemData) {
      console.log(`[Terrain] No DEM data, generating procedural surface`)
      gridSize = 32
      grid = []
      for (let j = 0; j < gridSize; j++) {
        const row = []
        for (let i = 0; i < gridSize; i++) {
          // Perlin-like noise using sine waves
          const x = i / gridSize
          const y = j / gridSize
          const val = (Math.sin(x * 3) * Math.cos(y * 3) + 
                      Math.sin(x * 5) * Math.cos(y * 7) * 0.5) * 0.5 + 0.5
          row.push(val * 8) // Scale to 0-8 amplitude
        }
        grid.push(row)
      }
    }
    
    // Create surface plane with 32x32 segments
    const surfaceGeometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 32, 32)
    const positions = surfaceGeometry.attributes.position as THREE.BufferAttribute
    const posArray = positions.array as Float32Array
    
    // Apply elevation from grid
    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i]
      const z = posArray[i + 2]
      const gx = ((x / half + 1) / 2) * (gridSize - 1)
      const gy = ((z / half + 1) / 2) * (gridSize - 1)
      const h = bilinearSample(gx, gy)
      posArray[i + 1] = h
    }
    positions.needsUpdate = true
    surfaceGeometry.computeVertexNormals()
    surfaceGeometry.rotateX(-Math.PI / 2)
    
    // Create solid box for walls and bottom
    const boxGeom = new THREE.BoxGeometry(TERRAIN_SIZE, CUT_DEPTH, TERRAIN_SIZE)
    boxGeom.translate(0, -CUT_DEPTH / 2, 0)
    
    const maxH = Math.max(...Array.from(posArray).filter((_, i) => i % 3 === 1))
    
    return {
      surfaceGeometry,
      wallGeometry: boxGeom,
      bottomGeometry: null,
      maxHeight: maxH,
      heightAt: bilinearSample,
    }
  }, [demTerrain.status, demTerrain.normalizedElevations])

  const { surfaceGeometry, wallGeometry, bottomGeometry, maxHeight, heightAt } = terrainData

  // Mineral deposit positioning
  const veinColor = MINERAL_HEX[site.primaryMineral] || '#ff6b6b'
  const depositDepth = Math.min(Math.max(site.depthMeters / 80, 0.2), 0.85)
  const depositY = -CUT_DEPTH * depositDepth
  const depositSize = Math.sqrt(site.estimatedTonnage) / 120

  // Camera tracking for LOD
  const { camera } = useThree()
  const [autoRotate, setAutoRotate] = useState(true)

  useFrame(({ clock }) => {
    const dist = camera.position.length()
    // Could implement LOD here if needed
  })

  useEffect(() => {
    camera.position.set(...DEFAULT_CAM_POS)
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(...DEFAULT_CAM_TARGET)
      controls.update()
    }
    setAutoRotate(true)
  }, [site.id, resetSignal, camera, controlsRef])

  return (
    <>
      {/* BACKGROUND & FOG */}
      <color attach="background" args={['#0a0e27']} />
      <fog attach="fog" args={['#0a0e27', 50, 120]} />

      {/* LIGHTING - Key for 3D Effect */}
      {/* Main sun casting strong shadows */}
      <directionalLight
        position={[35, 50, 30]}
        intensity={1.6}
        color="#ffecd2"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.00005}
      />

      {/* Fill light for detail */}
      <directionalLight position={[-30, 25, -25]} intensity={0.7} color="#a8d8ff" />

      {/* Ambient for overall illumination */}
      <ambientLight intensity={0.5} color="#ffffff" />

      {/* Sky/ground hemisphere */}
      <hemisphereLight args={['#87ceeb', '#1a3a1a', 0.6]} />

      {/* TERRAIN MESH GROUP */}
      <group>
        {/* SURFACE - With satellite texture */}
        <mesh geometry={surfaceGeometry} castShadow receiveShadow position={[0, 0, 0]}>
          <meshStandardMaterial
            map={tex}
            color={tex ? '#ffffff' : '#7a8659'}
            roughness={tex ? 0.65 : 0.75}
            metalness={0.05}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* WALLS + BEDROCK - Solid box */}
        {wallGeometry && (
          <mesh geometry={wallGeometry} castShadow receiveShadow position={[0, 0, 0]}>
            <meshStandardMaterial
              color="#8b7355"
              roughness={0.8}
              metalness={0}
              side={THREE.FrontSide}
            />
          </mesh>
        )}

        {/* MINERAL DEPOSIT VISUALIZATION (X-Ray visible) */}
        {xray && (
          <>
            {/* Floating cone pin above deposit */}
            <mesh position={[0, depositY + 8, 0]}>
              <coneGeometry args={[0.3, 2, 8]} />
              <meshStandardMaterial
                color={veinColor}
                emissive={veinColor}
                emissiveIntensity={0.8}
                metalness={0.7}
                roughness={0.2}
              />
            </mesh>
            
            {/* Vertical line connecting pin to deposit */}
            <mesh position={[0, (depositY + depositY + 8) / 2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
              <meshStandardMaterial
                color={veinColor}
                emissive={veinColor}
                emissiveIntensity={0.6}
                wireframe={false}
                transparent
                opacity={0.6}
              />
            </mesh>
            
            {/* Glowing deposit sphere */}
            <mesh position={[0, depositY, 0]}>
              <sphereGeometry args={[depositSize, 32, 32]} />
              <meshStandardMaterial
                color={veinColor}
                emissive={veinColor}
                emissiveIntensity={0.7}
                metalness={0.6}
                roughness={0.2}
                transparent
                opacity={0.85}
              />
            </mesh>
            
            {/* Glow halo around deposit */}
            <mesh position={[0, depositY, 0]}>
              <sphereGeometry args={[depositSize * 1.5, 16, 16]} />
              <meshBasicMaterial
                color={veinColor}
                transparent
                opacity={0.15}
                depthWrite={false}
              />
            </mesh>
          </>
        )}

        {/* GROUND SHADOW */}
        <ContactShadows position={[0, -CUT_DEPTH - 0.1, 0]} opacity={0.3} scale={TERRAIN_SIZE * 1.5} blur={3} far={10} />
      </group>

      {/* INFO LABEL */}
      <Html position={[0, maxHeight + 2, 0]} center distanceFactor={1}>
        <div className="pointer-events-none rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-center backdrop-blur">
          <div className="text-sm font-bold text-white">{site.name}</div>
          <div className="text-xs text-white/60">{site.primaryMineral} • {site.depthMeters}m deep</div>
        </div>
      </Html>

      {/* CAMERA CONTROLS */}
      <OrbitControls
        ref={controlsRef}
        target={DEFAULT_CAM_TARGET}
        enablePan={true}
        minDistance={15}
        maxDistance={60}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI * 0.9}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        onStart={() => setAutoRotate(false)}
      />

      {/* STATUS OVERLAY */}
      {demTerrain.status === 'loading' && (
        <Html center>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-blue-500 bg-black/80 px-6 py-4 backdrop-blur">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-blue-300">Loading terrain...</p>
          </div>
        </Html>
      )}

      {demTerrain.status === 'error' && (
        <Html center>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-500 bg-black/80 px-6 py-4 backdrop-blur">
            <p className="text-sm text-amber-300">Using fallback terrain</p>
            <p className="text-xs text-amber-400/70">{demTerrain.error}</p>
          </div>
        </Html>
      )}
    </>
  )
}

// ── CANVAS WRAPPER ─────────────────────────────────────────────────────────

export default function SiteTerrainBlockV2({
  site,
  xray = false,
  resetSignal = 0,
  onContextLost,
}: {
  site: DetectionSite
  xray?: boolean
  resetSignal?: number
  onContextLost?: () => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0e27', 1)
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFShadowMap
          if (!onContextLost) return
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            onContextLost()
          })
        }}
      >
        <PerspectiveCamera position={DEFAULT_CAM_POS} fov={45} near={0.1} far={500} makeDefault />
        <TerrainScene site={site} xray={xray} resetSignal={resetSignal} controlsRef={controlsRef} />
      </Canvas>

      {/* UI OVERLAY */}
      <div className="pointer-events-none absolute top-4 left-4 text-xs text-white/60">
        <div>Drag to rotate • Scroll to zoom</div>
        <div className="mt-1 text-blue-400">Using high-detail 256x256 polygon mesh</div>
      </div>
    </div>
  )
}
