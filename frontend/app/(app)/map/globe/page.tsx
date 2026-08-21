import { TopBar } from '@/components/shell/topbar'
import { MapboxExplorer } from '@/components/map/mapbox-explorer'

export default function GlobeMapPage() {
  return (
    <>
      <TopBar
        title="Real-World Satellite Globe"
        subtitle="Live 3D terrain with real satellite imagery · click a site to explore · Inspect for full terrain block & X-ray"
      />
      <div className="flex-1 overflow-hidden">
        <MapboxExplorer />
      </div>
    </>
  )
}
