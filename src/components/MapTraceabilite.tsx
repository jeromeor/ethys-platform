'use client'

import { useState, useEffect } from 'react'
// @ts-ignore
import { geoMercator, geoPath } from 'd3-geo'
// @ts-ignore
import { merge, mesh } from 'topojson-client'
// @ts-ignore
import worldData from 'world-atlas/countries-110m.json'

interface Acteur {
  type: string
  nom: string
  ville?: string
  latitude: number | null
  longitude: number | null
}

interface Props {
  acteurs: Acteur[]
}

var FRAME_BBOX = {
  type: 'Feature' as const,
  geometry: {
    type: 'MultiPoint' as const,
    coordinates: [[-14, 22], [42, 22], [42, 56], [-14, 56]],
  },
  properties: {},
}

var COULEURS: Record<string, string> = {
  coton: '#c2956e',
  filature: '#2d5016',
  marque: '#1a1a1a',
}

var LABELS_TYPE: Record<string, string> = {
  coton: 'COTON',
  filature: 'FILATURE',
  marque: 'MARQUE',
}

var W = 880
var H = 504

export default function MapTraceabilite({ acteurs }: Props) {
  var [mapData, setMapData] = useState<any>(null)

  var acteursValides = acteurs.filter(
    function(a): a is Acteur & { latitude: number; longitude: number } {
      return a.latitude != null && a.longitude != null
    }
  )

  useEffect(function() {
    if (acteursValides.length === 0) return

    try {
      var projection = geoMercator()
        .fitExtent([[24, 48], [W - 24, H - 60]], FRAME_BBOX as any)

      var world = worldData as any
      var land = merge(world, world.objects.countries.geometries)
      var borders = mesh(world, world.objects.countries, function(a: any, b: any) { return a !== b })
      var pathGen = geoPath(projection)

      var points = acteursValides.map(function(a) {
        var projected = projection([a.longitude, a.latitude])
        return {
          type: a.type,
          nom: a.nom,
          ville: a.ville || '',
          x: projected ? projected[0] : 0,
          y: projected ? projected[1] : 0,
        }
      })

      setMapData({
        landPath: pathGen(land as any) || '',
        bordersPath: pathGen(borders as any) || '',
        points: points,
      })
    } catch (e) {
      // Erreur silencieuse : la carte ne s'affiche pas
    }
  }, [])

  if (!mapData) return null

  return (
    <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e3d8' }}>
      <svg
        width="100%"
        viewBox={"0 0 " + W + " " + H}
        style={{ display: 'block', background: '#f4efe6' }}
      >
        <path d={mapData.landPath} fill="#e8e0d0" stroke="none" />
        <path
          d={mapData.bordersPath}
          fill="none"
          stroke="#f4efe6"
          strokeWidth={1.1}
          strokeOpacity={0.7}
        />

        {mapData.points.map(function(p: any, i: number) {
          var color = COULEURS[p.type] || '#1a1a1a'
          var label = LABELS_TYPE[p.type] || ''
          var labelRight = p.x < W / 2
          var labelX = labelRight ? p.x + 22 : p.x - 22
          var dotX = labelRight ? p.x + 12 : p.x - 12
          var anchor: 'start' | 'end' = labelRight ? 'start' : 'end'

          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={14} fill={color} fillOpacity={0.14} />
              <circle cx={p.x} cy={p.y} r={8} fill={color} fillOpacity={0.22} />
              <circle cx={p.x} cy={p.y} r={4.5} fill={color} stroke="#f4efe6" strokeWidth={1.5} />
              <circle cx={dotX} cy={p.y} r={1.6} fill={color} />
              <text
                x={labelX}
                y={p.y - 2}
                fontFamily={"Inter, system-ui, sans-serif"}
                fontSize={10}
                fontWeight={700}
                letterSpacing={1.6}
                textAnchor={anchor}
                fill="#2A2520"
              >{label}</text>
              <text
                x={labelX}
                y={p.y + 10}
                fontFamily={"Inter, system-ui, sans-serif"}
                fontSize={11}
                fontWeight={400}
                textAnchor={anchor}
                fill="#7A6E5E"
              >{p.ville ? p.nom + ', ' + p.ville : p.nom}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
