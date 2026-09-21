<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { geoMercator, geoPath } from 'd3-geo'
  import type { Numerado } from './imprimible'

  interface Props {
    numerados: Numerado[]
    paises: FeatureCollection
    x: number
    y: number
    ancho: number
    alto: number
  }

  let { numerados, paises, x, y, ancho, alto }: Props = $props()

  const prefijo = $props.id()
  const radioEnGrados = 0.12

  const anchoCelda = $derived(ancho / Math.max(numerados.length, 1))

  const celdas = $derived(
    numerados.map((numerado, indice) => {
      const [longitud, latitud] = numerado.coordenadas
      const x0 = x + indice * anchoCelda
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
      return { numerado, clip: `${prefijo}-${numerado.elemento.id}`, x0, trazado: geoPath(proyeccion) }
    }),
  )

  const marcos = $derived(
    [`M${x},${y + alto}V${y}H${x + ancho}`, ...celdas.slice(1).map((celda) => `M${celda.x0},${y}V${y + alto}`)].join(''),
  )
</script>

<g class="recuadro">
  {#each celdas as celda (celda.numerado.elemento.id)}
    <clipPath id={celda.clip}>
      <rect x={celda.x0} {y} width={anchoCelda} height={alto} />
    </clipPath>
    <g clip-path="url(#{celda.clip})">
      {#each paises.features as pais (pais.id)}
        <path class="paises" d={celda.trazado(pais)} />
      {/each}
    </g>
    <path class="mancha" d={celda.trazado(celda.numerado.contorno)} />
    <text class="numero" x={celda.x0 + anchoCelda / 2} y={y + alto * 0.78} text-anchor="middle">
      {celda.numerado.numero}
    </text>
  {/each}
  <path class="marcos" d={marcos} />
</g>

<style>
  .paises {
    fill: #eeeeee;
    stroke: #dddddd;
    stroke-width: 0.6;
  }

  .mancha {
    fill: #ffffff;
    stroke: #000000;
    stroke-width: 1;
  }

  .numero {
    font-family: system-ui, sans-serif;
    font-size: 17px;
    font-weight: 700;
    fill: #000000;
    stroke: #ffffff;
    stroke-width: 3;
    paint-order: stroke;
  }

  .marcos {
    fill: none;
    stroke: #000000;
    stroke-width: 0.8;
  }
</style>
