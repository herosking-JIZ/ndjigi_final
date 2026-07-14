import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Global Leaflet setup — fixes marker icon 404 errors
 * Import this file once at app startup (main.tsx) before any component renders
 * This ensures all leaflet-based components work correctly without local fixes
 */

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
})
