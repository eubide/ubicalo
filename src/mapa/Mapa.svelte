<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { geoCentroid, geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'
  import RecuadroCeutaMelilla from './RecuadroCeutaMelilla.svelte'

  interface Props {
    contornos: Feature<Geometry>[]
    contexto: FeatureCollection
    acertados: string[]
    resaltado: string | null
    alElegir: (id: string) => void
  }

  let { contornos, contexto, acertados, resaltado, alElegir }: Props = $props()

  const ancho = 960
  const alto = 620
  const margen = 12

  const proyeccion = $derived(
    geoConicConformalSpain().fitExtent(
      [
        [margen, margen],
        [ancho - margen, alto - margen],
      ],
      { type: 'FeatureCollection', features: contornos },
    ),
  )
  const trazado = $derived(geoPath(proyeccion))

  // Se reconocen por su posición porque su id cambia según el tipo.
  const ciudadesAfricanas = $derived(
    contornos.filter((contorno) => {
      const [longitud, latitud] = geoCentroid(contorno)
      return latitud < 36 && longitud > -10
    }),
  )
  const recuadro = { x: ancho - 232, y: alto - 150, ancho: 232, alto: 150 }
</script>

<figure class="mapa">
  <svg viewBox="0 0 {ancho} {alto}" role="img" aria-label="Mapa mudo de España">
    <g class="contexto">
      {#each contexto.features as pais (pais.id)}
        <path d={trazado(pais)} />
      {/each}
    </g>
    <!-- El MVP se juega con ratón o dedo; jugar con teclado no está en la spec. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <g class="elementos">
      {#each ciudadesAfricanas as ciudad (ciudad.id)}
        {@const [cx, cy] = proyeccion(geoCentroid(ciudad)) ?? [0, 0]}
        <circle class="zona" {cx} {cy} r="10" onclick={() => alElegir(String(ciudad.id))} />
      {/each}
      {#each contornos as contorno (contorno.id)}
        {@const id = String(contorno.id)}
        <path
          d={trazado(contorno)}
          class:acertado={acertados.includes(id)}
          class:resaltado={resaltado === id}
          onclick={() => alElegir(id)}
        />
      {/each}
    </g>
    <path class="marcos" d={proyeccion.getCompositionBorders()} />
    <RecuadroCeutaMelilla ciudades={ciudadesAfricanas} {contexto} {acertados} {resaltado} {alElegir} {...recuadro} />
  </svg>
  <figcaption>
    Obra derivada de las líneas límite del IGN · CC-BY 4.0 scne.es
  </figcaption>
</figure>

<style>
  .mapa {
    margin: 0;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .contexto path {
    fill: #e3e3df;
    stroke: #f7f7f5;
    stroke-width: 0.8;
  }

  .elementos path {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
    cursor: pointer;
  }

  .elementos .zona {
    fill: transparent;
    cursor: pointer;
  }

  .elementos path.acertado {
    fill: #cfe8d6;
  }

  .elementos path.resaltado {
    fill: #f4c7a1;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  figcaption {
    font-size: 0.7rem;
    color: #6b7280;
    text-align: right;
    padding: 0.25rem 0.5rem;
  }
</style>
