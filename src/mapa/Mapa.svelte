<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'

  interface Props {
    geometrias: Feature<Geometry>[]
    contexto: FeatureCollection
    acertados: string[]
    resaltado: string | null
    alElegir: (id: string) => void
  }

  let { geometrias, contexto, acertados, resaltado, alElegir }: Props = $props()

  const ancho = 960
  const alto = 620
  const margen = 12

  const proyeccion = $derived(
    geoConicConformalSpain().fitExtent(
      [
        [margen, margen],
        [ancho - margen, alto - margen],
      ],
      { type: 'FeatureCollection', features: geometrias },
    ),
  )
  const trazado = $derived(geoPath(proyeccion))
</script>

<figure class="mapa">
  <svg viewBox="0 0 {ancho} {alto}" role="img" aria-label="Mapa mudo de España">
    <g class="contexto">
      {#each contexto.features as pais (pais.id)}
        <path d={trazado(pais)} />
      {/each}
    </g>
    <g class="elementos">
      {#each geometrias as rasgo (rasgo.id)}
        <path
          d={trazado(rasgo)}
          class:acertado={acertados.includes(String(rasgo.id))}
          class:resaltado={resaltado === String(rasgo.id)}
          role="button"
          tabindex="-1"
          onclick={() => alElegir(String(rasgo.id))}
          onkeydown={() => {}}
        />
      {/each}
    </g>
    <path class="marcos" d={proyeccion.getCompositionBorders()} />
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
    outline: none;
  }

  .elementos path:hover {
    fill: #eef2f6;
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
