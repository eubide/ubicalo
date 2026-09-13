<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { geoCentroid, geoMercator, geoPath } from 'd3-geo'

  interface Props {
    ciudades: Feature<Geometry>[]
    contexto: FeatureCollection
    acertados: string[]
    resaltado: string | null
    alElegir: (id: string) => void
    x: number
    y: number
    ancho: number
    alto: number
  }

  let { ciudades, contexto, acertados, resaltado, alElegir, x, y, ancho, alto }: Props = $props()

  const radioEnGrados = 0.12

  const anchoCelda = $derived(ancho / Math.max(ciudades.length, 1))

  const celdas = $derived(
    ciudades.map((ciudad, indice) => {
      const x0 = x + indice * anchoCelda
      const [longitud, latitud] = geoCentroid(ciudad)
      const proyeccion = geoMercator().fitExtent(
        [
          [x0, y],
          [x0 + anchoCelda, y + alto],
        ],
        {
          type: 'MultiPoint',
          coordinates: [
            [longitud - radioEnGrados, latitud - radioEnGrados],
            [longitud + radioEnGrados, latitud + radioEnGrados],
          ],
        },
      )
      return { id: String(ciudad.id), x0, ciudad, trazado: geoPath(proyeccion) }
    }),
  )

  const marcos = $derived(
    [`M${x},${y + alto}V${y}H${x + ancho}`, ...celdas.slice(1).map((celda) => `M${celda.x0},${y}V${y + alto}`)].join(
      '',
    ),
  )
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<g class="recuadro">
  {#each celdas as celda (celda.id)}
    <clipPath id="recuadro-{celda.id}">
      <rect x={celda.x0} {y} width={anchoCelda} height={alto} />
    </clipPath>
    <g clip-path="url(#recuadro-{celda.id})">
      {#each contexto.features as pais (pais.id)}
        <path class="contexto" d={celda.trazado(pais)} />
      {/each}
    </g>
    <g
      class="ciudad"
      class:acertado={acertados.includes(celda.id)}
      class:resaltado={resaltado === celda.id}
      onclick={() => alElegir(celda.id)}
    >
      <rect class="zona" x={celda.x0} {y} width={anchoCelda} height={alto} />
      <path d={celda.trazado(celda.ciudad)} />
    </g>
  {/each}
  <path class="marcos" d={marcos} />
</g>

<style>
  .contexto {
    fill: #e3e3df;
    stroke: #f7f7f5;
    stroke-width: 0.8;
  }

  .ciudad {
    cursor: pointer;
  }

  .zona {
    fill: transparent;
  }

  .ciudad path {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .ciudad.acertado path {
    fill: #cfe8d6;
  }

  .ciudad.resaltado path {
    fill: #f4c7a1;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }
</style>
