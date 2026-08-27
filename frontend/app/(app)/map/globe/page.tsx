import { TopBar } from '@/components/shell/topbar'
import { CesiumExplorer } from '@/components/map/cesium-explorer'

export default function GlobeMapPage() {
  return (
    <>
      <TopBar
        title="3D Satellite Globe"
        subtitle="Cesium World Terrain · Bing satellite imagery · real elevation worldwide · click a site to explore"
      />
      <div className="flex-1 overflow-hidden">
        <CesiumExplorer />
      </div>
    </>
  )
}
