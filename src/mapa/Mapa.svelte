<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'

  interface Props {
    contornos: Feature<Geometry>[]
    contexto: FeatureCollection
    acertados: string[]
    resaltado: string | null
    alElegir: (id: string) => void
    nombreDe: (id: string) => string
  }

  let { contornos, contexto, acertados, resaltado, alElegir, nombreDe }: Props = $props()

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

  interface Punto {
    x: number
    y: number
  }

  interface Vista extends Punto {
    escala: number
  }

  const escalaMaxima = 8

  let vista = $state<Vista>({ escala: 1, x: 0, y: 0 })
  let seleccionado = $state<string | null>(null)

  const dedos = new Map<number, Punto>()
  let gesto: { distancia: number; centro: Punto; vista: Vista } | null = null
  let huboGesto = false
  let tipoDePuntero = 'mouse'

  function enCoordenadasDelMapa(evento: PointerEvent): Punto {
    const caja = (evento.currentTarget as SVGSVGElement).getBoundingClientRect()
    const factor = ancho / caja.width
    return { x: (evento.clientX - caja.left) * factor, y: (evento.clientY - caja.top) * factor }
  }

  function medirGesto(): { distancia: number; centro: Punto } {
    const [a, b] = [...dedos.values()]
    return {
      distancia: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      centro: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
  }

  function acotar(valor: number, minimo: number, maximo: number): number {
    return Math.min(maximo, Math.max(minimo, valor))
  }

  function alPulsar(evento: PointerEvent) {
    tipoDePuntero = evento.pointerType
    if (evento.pointerType !== 'touch') return
    if (dedos.size === 0) huboGesto = false
    dedos.set(evento.pointerId, enCoordenadasDelMapa(evento))
    if (dedos.size === 2) {
      huboGesto = true
      gesto = { ...medirGesto(), vista }
    }
  }

  function alMover(evento: PointerEvent) {
    if (!dedos.has(evento.pointerId)) return
    dedos.set(evento.pointerId, enCoordenadasDelMapa(evento))
    if (!gesto || dedos.size !== 2) return
    const { distancia, centro } = medirGesto()
    const escala = acotar((gesto.vista.escala * distancia) / gesto.distancia, 1, escalaMaxima)
    const origenX = (gesto.centro.x - gesto.vista.x) / gesto.vista.escala
    const origenY = (gesto.centro.y - gesto.vista.y) / gesto.vista.escala
    vista = {
      escala,
      x: acotar(centro.x - origenX * escala, ancho * (1 - escala), 0),
      y: acotar(centro.y - origenY * escala, alto * (1 - escala), 0),
    }
  }

  function alSoltar(evento: PointerEvent) {
    dedos.delete(evento.pointerId)
    if (dedos.size < 2) gesto = null
  }

  function tocar(id: string) {
    if (tipoDePuntero !== 'touch') {
      alElegir(id)
    } else if (!huboGesto) {
      seleccionado = id
    }
  }

  function confirmar() {
    if (seleccionado === null) return
    alElegir(seleccionado)
    seleccionado = null
  }
</script>

<figure class="mapa">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <svg
    viewBox="0 0 {ancho} {alto}"
    role="img"
    aria-label="Mapa mudo de España"
    onpointerdown={alPulsar}
    onpointermove={alMover}
    onpointerup={alSoltar}
    onpointercancel={alSoltar}
  >
    <g transform="translate({vista.x} {vista.y}) scale({vista.escala})">
      <g class="contexto">
        {#each contexto.features as pais (pais.id)}
          <path d={trazado(pais)} />
        {/each}
      </g>
      <!-- El MVP se juega con ratón o dedo; jugar con teclado no está en la spec. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="elementos">
        {#each contornos as contorno (contorno.id)}
          {@const id = String(contorno.id)}
          <path
            d={trazado(contorno)}
            class:acertado={acertados.includes(id)}
            class:resaltado={resaltado === id}
            class:seleccionado={seleccionado === id}
            onclick={() => tocar(id)}
          />
        {/each}
      </g>
      <path class="marcos" d={proyeccion.getCompositionBorders()} />
    </g>
  </svg>
  {#if seleccionado !== null}
    <div class="seleccion">
      <span>{nombreDe(seleccionado)}</span>
      <button type="button" onclick={confirmar}>Confirmar</button>
    </div>
  {/if}
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
    touch-action: none;
  }

  path {
    vector-effect: non-scaling-stroke;
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

  .elementos path.acertado {
    fill: #cfe8d6;
  }

  .elementos path.resaltado {
    fill: #f4c7a1;
  }

  .elementos path.seleccionado {
    fill: #c9dcf2;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .seleccion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem;
  }

  .seleccion span {
    font-weight: 600;
  }

  .seleccion button {
    font: inherit;
    padding: 0.5rem 1.25rem;
    border: 1px solid #9aa0a6;
    border-radius: 0.375rem;
    background: #fdfdfb;
    color: inherit;
  }

  figcaption {
    font-size: 0.7rem;
    color: #6b7280;
    text-align: right;
    padding: 0.25rem 0.5rem;
  }
</style>
