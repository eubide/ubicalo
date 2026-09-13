<script module lang="ts">
  import type { Feature, Geometry } from 'geojson'

  export interface ElementoConCentro {
    contorno: Feature<Geometry>
    centro: [number, number]
  }

  const latitudMaxima = 36
  const longitudMinima = -10

  // Se reconocen por su posición porque su id cambia según el tipo.
  export function esCeutaOMelilla([longitud, latitud]: [number, number]): boolean {
    return latitud < latitudMaxima && longitud > longitudMinima
  }
</script>

<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { geoMercator, geoPath } from 'd3-geo'

  interface Props {
    elementos: ElementoConCentro[]
    contexto: FeatureCollection
    acertados: string[]
    tocado: string | null
    correcto: string | null
    iluminado: string | null
    fallados: string[]
    seleccionado: string | null
    alElegir: (id: string) => void
    x: number
    y: number
    ancho: number
    alto: number
  }

  let {
    elementos,
    contexto,
    acertados,
    tocado,
    correcto,
    iluminado,
    fallados,
    seleccionado,
    alElegir,
    x,
    y,
    ancho,
    alto,
  }: Props = $props()

  const prefijo = $props.id()
  const radioEnGrados = 0.12

  const anchoCelda = $derived(ancho / Math.max(elementos.length, 1))

  const celdas = $derived(
    elementos.map(({ contorno, centro: [longitud, latitud] }, indice) => {
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
      const id = String(contorno.id)
      return { id, clip: `${prefijo}-${id}`, x0, contorno, trazado: geoPath(proyeccion) }
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
    <clipPath id={celda.clip}>
      <rect x={celda.x0} {y} width={anchoCelda} height={alto} />
    </clipPath>
    <g clip-path="url(#{celda.clip})">
      {#each contexto.features as pais (pais.id)}
        <path class="contexto" d={celda.trazado(pais)} />
      {/each}
    </g>
    <g
      class="elemento"
      class:acertado={acertados.includes(celda.id)}
      class:fallado={fallados.includes(celda.id)}
      class:seleccionado={seleccionado === celda.id}
      class:iluminado={iluminado === celda.id}
      class:tocado={tocado === celda.id}
      class:correcto={correcto === celda.id}
      onclick={() => alElegir(celda.id)}
    >
      <rect class="diana" x={celda.x0} {y} width={anchoCelda} height={alto} />
      <path d={celda.trazado(celda.contorno)} />
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

  .elemento {
    cursor: pointer;
  }

  .diana {
    fill: transparent;
  }

  .elemento path {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .elemento.acertado path {
    fill: #cfe8d6;
  }

  .elemento.fallado path {
    fill: #f4c7a1;
  }

  .elemento.seleccionado path {
    fill: #c9dcf2;
  }

  .elemento.iluminado path {
    fill: #f6d365;
    stroke: #8a6d1f;
    stroke-width: 1.6;
  }

  .elemento.tocado path {
    fill: #dc2626;
  }

  .elemento.correcto path {
    stroke: #14532d;
    stroke-width: 4;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }
</style>
