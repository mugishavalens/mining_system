'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { DetectionSite } from '@/lib/mdmis-data'
import { SITES } from '@/lib/mdmis-data'
import { MINERAL_HEX } from '@/lib/site-terrain'

// ── Risk colours (plain hex — no CSS vars inside Cesium canvas) ───────────────
const RISK_HEX: Record<DetectionSite['riskLevel'], string> = {
  low:      '#3fcf8e',
  moderate: '#e6b84d',
  high:     '#f97316',
  critical: '#ef4444',
}

const STATUS_LABEL: Record<DetectionSite['status'], string> = {
  active:    'Active',
  surveying: 'Surveying',
  flagged:   'Flagged ⚠',
  depleted:  'Depleted',
}

interface Props {
  selectedId:           string | null
  onSelect:             (site: DetectionSite) => void
  onInspect:            (site: DetectionSite) => void
  onVisibleSitesChange: (ids: string[]) => void
}

export default function CesiumGlobe({
  selectedId,
  onSelect,
  onInspect,
  onVisibleSitesChange,
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const viewerRef     = useRef<any>(null)
  const entitiesRef   = useRef<Map<string, any>>(new Map())

  // ── Initialise once — wait for global Cesium ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    let destroyed = false

    // Poll for Cesium global (loaded via <script> tag in layout)
    const checkCesium = setInterval(() => {
      const Cesium = (globalThis as any).Cesium
      if (!Cesium) return

      clearInterval(checkCesium)
      if (destroyed) return

      // Point at the static assets in public/cesium
      ;(window as any).CESIUM_BASE_URL = '/cesium/'
      Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_TOKEN!

      ;(async () => {
        try {
          // ── Create viewer ──────────────────────────────────────────────────
          const viewer = new Cesium.Viewer(containerRef.current!, {
            terrainProvider: await Cesium.createWorldTerrainAsync({
              requestWaterMask:        true,
              requestVertexNormals:    true,
            }),
            baseLayer: Cesium.ImageryLayer.fromProviderAsync(
              Cesium.IonImageryProvider.fromAssetId(2),
              {}
            ),
            animation:         false,
            baseLayerPicker:   false,
            fullscreenButton:  false,
            geocoder:          false,
            homeButton:        false,
            infoBox:           false,
            sceneModePicker:   false,
            selectionIndicator: false,
            timeline:          false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            requestRenderMode: false,
            useBrowserRecommendedResolution: true,
            shadows:           false,
          })

          viewerRef.current = viewer
          const scene = viewer.scene
          const globe = scene.globe

          // ── Visual quality ────────────────────────────────────────────────
          scene.fog.enabled            = true
          scene.fog.density            = 0.00012
          scene.fog.minimumBrightness  = 0.15
          scene.skyAtmosphere.show     = true
          scene.skyAtmosphere.hueShift       = 0.0
          scene.skyAtmosphere.saturationShift = 0.1
          scene.skyAtmosphere.brightnessShift = 0.05

          scene.light = new Cesium.SunLight()
          globe.enableLighting     = true
          globe.dynamicAtmosphereLightingFromSun = true
          scene.verticalExaggeration = 2.0

          // ── Initial camera ────────────────────────────────────────────────
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(29.8, -1.9, 1_200_000),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch:   Cesium.Math.toRadians(-45),
              roll:    0,
            },
          })

          // ── Plot all mine sites ────────────────────────────────────────────
          SITES.forEach((site) => {
            const canvas = document.createElement('canvas')
            canvas.width  = 36
            canvas.height = 36
            const ctx = canvas.getContext('2d')!

            // Outer ring (mineral colour)
            ctx.beginPath()
            ctx.arc(18, 18, 16, 0, Math.PI * 2)
            ctx.strokeStyle = MINERAL_HEX[site.primaryMineral] ?? '#9b6dff'
            ctx.lineWidth   = 2.5
            ctx.stroke()

            // Core dot (risk colour)
            ctx.beginPath()
            ctx.arc(18, 18, 9, 0, Math.PI * 2)
            ctx.fillStyle = RISK_HEX[site.riskLevel]
            ctx.fill()

            // White border on core
            ctx.beginPath()
            ctx.arc(18, 18, 9, 0, Math.PI * 2)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth   = 2
            ctx.stroke()

            const entity = viewer.entities.add({
              id:       site.id,
              position: Cesium.Cartesian3.fromDegrees(site.lng, site.lat, 0),
              billboard: {
                image:             canvas,
                width:             36,
                height:            36,
                verticalOrigin:    Cesium.VerticalOrigin.CENTER,
                horizontalOrigin:  Cesium.HorizontalOrigin.CENTER,
                heightReference:   Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                scaleByDistance: new Cesium.NearFarScalar(1_000, 1.6, 8_000_000, 0.4),
              },
              label: {
                text:            site.name,
                font:            '600 13px "Inter", sans-serif',
                fillColor:       Cesium.Color.WHITE,
                outlineColor:    Cesium.Color.fromCssColorString('#000000cc'),
                outlineWidth:    3,
                style:           Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin:  Cesium.VerticalOrigin.BOTTOM,
                pixelOffset:     new Cesium.Cartesian2(0, -22),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                translucencyByDistance: new Cesium.NearFarScalar(200_000, 1.0, 4_000_000, 0.0),
                scaleByDistance: new Cesium.NearFarScalar(10_000, 1.1, 1_000_000, 0.7),
              },
            })

            entitiesRef.current.set(site.id, entity)
          })

          // ── Click handling ────────────────────────────────────────────────
          const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)

          handler.setInputAction((click: any) => {
            const picked = scene.pick(click.position)
            if (!picked?.id?.id) return
            const site = SITES.find((s) => s.id === picked.id.id)
            if (!site) return
            onSelect(site)
            flyToSite(viewer, Cesium, site)
            showInfoOverlay(site)
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

          handler.setInputAction((click: any) => {
            const picked = scene.pick(click.position)
            if (!picked?.id?.id) return
            const site = SITES.find((s) => s.id === picked.id.id)
            if (site) onInspect(site)
          }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

          // ── Visibility tracking ───────────────────────────────────────────
          scene.camera.changed.addEventListener(() => {
            reportVisible(viewer, Cesium, onVisibleSitesChange)
          })
          setTimeout(() => reportVisible(viewer, Cesium, onVisibleSitesChange), 1000)

          // ── Cursor pointer on hover ───────────────────────────────────────
          scene.canvas.addEventListener('mousemove', (e) => {
            const pickedObj = scene.pick(new Cesium.Cartesian2(e.offsetX, e.offsetY))
            scene.canvas.style.cursor = pickedObj?.id?.id ? 'pointer' : 'default'
          })
        } catch (err) {
          console.error('Cesium init error:', err)
        }
      })()
    }, 50)

    return () => {
      destroyed = true
      clearInterval(checkCesium)
      removeInfoOverlay()
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
      }
      viewerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fly to site when selectedId changes ────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current
    const Cesium = (globalThis as any).Cesium
    if (!viewer || !Cesium || !selectedId) return
    const site = SITES.find((s) => s.id === selectedId)
    if (!site) return
    removeInfoOverlay()
    flyToSite(viewer, Cesium, site)
    showInfoOverlay(site)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Highlight selected entity ──────────────────────────────────────────────
  useEffect(() => {
    const Cesium = (globalThis as any).Cesium
    if (!Cesium) return
    entitiesRef.current.forEach((entity, id) => {
      const isSelected = id === selectedId
      if (entity.billboard) entity.billboard.scale = isSelected ? 1.45 : 1.0
      if (entity.label) {
        entity.label.fillColor = isSelected
          ? Cesium.Color.fromCssColorString('#3fcf8e')
          : Cesium.Color.WHITE
      }
    })
  }, [selectedId])

  return (
    <div className="relative h-full w-full bg-[#05080f]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <style>{`
        .cesium-widget-credits {
          bottom: 4px !important;
          right: 8px !important;
          font-size: 9px !important;
          opacity: 0.45 !important;
        }
        .cesium-widget-credits a { color: rgba(255,255,255,0.5) !important; }
        .cesium-viewer-toolbar { display: none !important; }
        .cesium-viewer-animationContainer { display: none !important; }
        .cesium-viewer-timelineContainer { display: none !important; }
        .cesium-viewer-bottom { bottom: 0 !important; }
      `}</style>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="rounded-full border border-white/10 bg-[#0a0d18]/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40 backdrop-blur whitespace-nowrap">
          Left-drag · orbit &nbsp;|&nbsp; Right-drag / scroll · zoom &nbsp;|&nbsp; Middle-drag · pan &nbsp;|&nbsp; Click site · details
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flyToSite(viewer: any, Cesium: any, site: DetectionSite) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(site.lng, site.lat, 8_000),
    orientation: {
      heading: Cesium.Math.toRadians(-20),
      pitch:   Cesium.Math.toRadians(-35),
      roll:    0,
    },
    duration: 2.2,
    easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
  })
}

function reportVisible(viewer: any, Cesium: any, onVisibleSitesChange: (ids: string[]) => void) {
  if (!viewer || viewer.isDestroyed()) return
  const camera = viewer.camera
  const rect   = camera.computeViewRectangle(viewer.scene.globe.ellipsoid)
  if (!rect) { onVisibleSitesChange(SITES.map((s) => s.id)); return }

  const west  = Cesium.Math.toDegrees(rect.west)
  const east  = Cesium.Math.toDegrees(rect.east)
  const south = Cesium.Math.toDegrees(rect.south)
  const north = Cesium.Math.toDegrees(rect.north)

  const visible = SITES
    .filter((s) => s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east)
    .map((s) => s.id)
  onVisibleSitesChange(visible.length > 0 ? visible : SITES.map((s) => s.id))
}

let _currentOverlay: HTMLElement | null = null

function removeInfoOverlay() {
  if (_currentOverlay) {
    _currentOverlay.remove()
    _currentOverlay = null
  }
}

function showInfoOverlay(site: DetectionSite) {
  removeInfoOverlay()

  const RISK_HEX_MAP: Record<DetectionSite['riskLevel'], string> = {
    low: '#3fcf8e', moderate: '#e6b84d', high: '#f97316', critical: '#ef4444',
  }
  const MINERAL_HEX_MAP: Record<string, string> = {
    Cassiterite: '#4bc5d6', Coltan: '#9b6dff', Wolframite: '#e6b84d',
    Gold: '#f0c040', Beryl: '#3fcf8e', Lithium: '#e6563f',
  }
  const riskColor    = RISK_HEX_MAP[site.riskLevel]
  const mineralColor = MINERAL_HEX_MAP[site.primaryMineral] ?? '#9b6dff'

  const el = document.createElement('div')
  el.id = 'cesium-site-overlay'
  el.innerHTML = `
    <div style="
      position:absolute; bottom:72px; left:50%; transform:translateX(-50%);
      background:#141720; border:1px solid rgba(255,255,255,0.14);
      border-radius:12px; padding:14px 16px 12px; min-width:260px; max-width:320px;
      font-family:system-ui,sans-serif; box-shadow:0 16px 48px rgba(0,0,0,0.8);
      z-index:9999; pointer-events:auto;
    ">
      <button id="cesium-overlay-close" style="
        position:absolute; top:8px; right:10px; background:none; border:none;
        color:rgba(255,255,255,0.5); font-size:18px; cursor:pointer; line-height:1;
        padding:0;
      ">×</button>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${riskColor};flex-shrink:0;display:inline-block;"></span>
        <span style="font-weight:700;font-size:14px;color:#fff;">${site.name}</span>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.42);margin-bottom:11px;padding-left:18px;">
        ${site.district} · ${site.id}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;margin-bottom:12px;">
        ${row('Mineral', `<span style="color:${mineralColor}">${site.primaryMineral}</span>`)}
        ${row('Grade', `${site.gradePct}%`)}
        ${row('Depth', `${site.depthMeters}m`)}
        ${row('AI Conf.', `${site.confidence}%`)}
        ${row('Safety', `${site.safetyScore}/100`)}
        ${row('Status', STATUS_LABEL[site.status])}
      </div>
      <button id="cesium-overlay-inspect" style="
        width:100%; background:linear-gradient(135deg,#2d6a4f,#1a4731);
        border:1px solid rgba(63,207,142,0.4); border-radius:8px;
        color:#3fcf8e; font-size:12px; font-weight:600; padding:9px 12px;
        cursor:pointer; font-family:inherit; letter-spacing:0.02em;
      ">🔬 Inspect Terrain Block</button>
    </div>
  `
  document.body.appendChild(el)
  _currentOverlay = el

  document.getElementById('cesium-overlay-close')?.addEventListener('click', removeInfoOverlay)
  document.getElementById('cesium-overlay-inspect')?.addEventListener('click', () => {
    removeInfoOverlay()
    window.dispatchEvent(new CustomEvent('cesium:inspect', { detail: { siteId: site.id } }))
  })
}

function row(label: string, value: string) {
  return `
    <div style="display:flex;flex-direction:column;gap:1px;">
      <span style="font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,0.38);">${label}</span>
      <span style="font-size:12px;font-weight:600;color:#fff;">${value}</span>
    </div>`
}
