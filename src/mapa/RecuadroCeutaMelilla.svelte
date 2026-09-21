<script module lang="ts">
  import type { Feature, Geometry } from 'geojson'

  export interface ElementoConCentro {
    contorno: Feature<Geometry>
    centro: [number, number]
  }

</script>

<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { geoMercator, geoPath } from 'd3-geo'
  import { abierta, senalDe, type EstadoDelMapa } from './senales'

  interface Props {
    elementos: ElementoConCentro[]
    contexto: FeatureCollection
    estado: EstadoDelMapa
    correcto: string | null
    rotulados: string[]
    tamañoRotulo: number
    nombreDe: (id: string) => string
    alElegir: (id: string) => void
    x: number
    y: number
    ancho: number
    alto: number
  }

  let {
    elementos,
    contexto,
    estado,
    correcto,
    rotulados,
    tamañoRotulo,
    nombreDe,
    alElegir,
    x,
    y,
    ancho,
    alto,
  }: Props = $props()

  const prefijo = $props.id()
  const radioEnGrados = 0.12
  const letrasPorLinea = 10

  function lineasDe(nombre: string): string[] {
    return nombre.split(' ').reduce<string[]>((lineas, palabra) => {
      const ultima = lineas.at(-1)
      if (ultima !== undefined && ultima.length + 1 + palabra.length <= letrasPorLinea) {
        return [...lineas.slice(0, -1), `${ultima} ${palabra}`]
      }
      return [...lineas, palabra]
    }, [])
  }

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
    {@const senal = senalDe(celda.id, estado)}
    <g
      class="elemento {senal ?? ''}"
      class:abierta={abierta(senal)}
      class:correcto={correcto === celda.id}
      onclick={() => alElegir(celda.id)}
    >
      <rect class="pulsador" x={celda.x0} {y} width={anchoCelda} height={alto} />
      <path d={celda.trazado(celda.contorno)} />
    </g>
    {#if rotulados.includes(celda.id)}
      {@const lineas = lineasDe(nombreDe(celda.id))}
      {@const esLaUltima = celda === celdas.at(-1)}
      {@const xRotulo = esLaUltima ? celda.x0 + anchoCelda - tamañoRotulo / 2 : celda.x0 + anchoCelda / 2}
      <text
        class="rotulo"
        y={y + alto - tamañoRotulo * lineas.length}
        font-size={tamañoRotulo}
        text-anchor={esLaUltima ? 'end' : 'middle'}
      >
        {#each lineas as linea, i (i)}
          <tspan x={xRotulo} dy={i === 0 ? 0 : '1.1em'}>{linea}</tspan>
        {/each}
      </text>
    {/if}
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

  .pulsador {
    fill: transparent;
  }

  .elemento path {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .elemento.frontera path {
    fill: var(--senal-frontera);
    stroke: var(--senal-frontera-borde);
    stroke-width: 1.2;
  }

  .elemento.diana path,
  .elemento.tentativa path {
    fill: var(--senal-diana);
    stroke: var(--senal-diana-borde);
    stroke-width: 2.4;
  }

  .elemento.acierto path,
  .elemento.parcial path {
    fill: var(--senal-acierto);
    stroke: var(--senal-acierto-borde);
    stroke-width: 1.2;
  }

  .elemento.fallo path {
    fill: var(--senal-fallo);
    stroke: var(--senal-fallo-borde);
    stroke-width: 1.2;
  }

  .elemento.ayuda path {
    fill: var(--senal-ayuda);
    stroke: var(--senal-ayuda-borde);
  }

  .elemento.tocado path {
    fill: var(--senal-tocado);
    stroke: var(--senal-fallo-borde);
  }

  .elemento.abierta path {
    stroke-dasharray: 4 2.5;
  }

  .elemento.correcto path {
    stroke: var(--senal-correcto);
    stroke-width: 4;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }

  .rotulo {
    font-weight: 600;
    fill: #1f2937;
    stroke: #fdfdfb;
    stroke-width: 3;
    paint-order: stroke;
    stroke-linejoin: round;
    pointer-events: none;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }
</style>
