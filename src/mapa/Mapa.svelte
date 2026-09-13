<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { geoCentroid, geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'
  import RecuadroCeutaMelilla, { esCeutaOMelilla } from './RecuadroCeutaMelilla.svelte'

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
  const anchoRecuadro = 232
  const altoRecuadro = 150
  const radioDiana = 10

  const ceutaYMelilla = $derived(
    contornos
      .map((contorno) => ({ contorno, centro: geoCentroid(contorno) }))
      .filter(({ centro }) => esCeutaOMelilla(centro)),
  )
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
      {#each ceutaYMelilla as { contorno, centro } (contorno.id)}
        {@const punto = proyeccion(centro)}
        {#if punto}
          <circle class="diana" cx={punto[0]} cy={punto[1]} r={radioDiana} onclick={() => alElegir(String(contorno.id))} />
        {/if}
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
    <RecuadroCeutaMelilla
      elementos={ceutaYMelilla}
      {contexto}
      {acertados}
      {resaltado}
      {alElegir}
      x={ancho - anchoRecuadro}
      y={alto - altoRecuadro}
      ancho={anchoRecuadro}
      alto={altoRecuadro}
    />
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

  .elementos .diana {
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
