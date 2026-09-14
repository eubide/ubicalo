<script lang="ts">
  import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
  import { geoCentroid, geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'
  import type { Fondo } from '../catalogo/catalogo'
  import RecuadroCeutaMelilla, { esCeutaOMelilla } from './RecuadroCeutaMelilla.svelte'

  export interface Rotulo {
    id: string
    texto: string
  }

  interface Props {
    contornos: Feature<Geometry>[]
    fondo?: Fondo | null
    contexto: FeatureCollection
    acertados: string[]
    tocado?: string | null
    correcto?: string | null
    preguntado: string | null
    iluminados?: string[]
    destacados?: string[]
    pistaDeArea?: string[]
    rotulos?: Rotulo[]
    fallados?: string[]
    alElegir: (id: string) => void
    nombreDe: (id: string) => string
  }

  let {
    contornos,
    fondo = null,
    contexto,
    acertados,
    tocado = null,
    correcto = null,
    preguntado,
    iluminados = [],
    destacados = [],
    pistaDeArea = [],
    rotulos = [],
    fallados = [],
    alElegir,
    nombreDe,
  }: Props = $props()

  const ancho = 960
  const alto = 620
  const margen = 12
  const radioPunto = 5

  const proyeccion = $derived(
    geoConicConformalSpain().fitExtent(
      [
        [margen, margen],
        [ancho - margen, alto - margen],
      ],
      { type: 'FeatureCollection', features: fondo ? [fondo.contorno] : contornos },
    ),
  )
  const trazado = $derived(geoPath(proyeccion).pointRadius(radioPunto))
  const contornoCorrecto = $derived(contornos.find((contorno) => String(contorno.id) === correcto))
  const anchoRecuadro = 232
  const altoRecuadro = 150
  const radioDiana = 10
  const tamañoRotuloEnPixeles = 13
  let anchoEnPantalla = $state(ancho)
  const tamañoRotulo = $derived((tamañoRotuloEnPixeles * ancho) / Math.max(anchoEnPantalla, 1))

  const ceutaYMelilla = $derived(
    contornos
      .map((contorno) => ({ contorno, centro: geoCentroid(contorno) }))
      .filter(({ centro }) => esCeutaOMelilla(centro)),
  )
  const puntos = $derived(
    contornos
      .filter((contorno) => contorno.geometry.type === 'Point')
      .map((contorno) => ({ contorno, centro: geoCentroid(contorno) })),
  )
  const conDiana = $derived([...ceutaYMelilla, ...puntos])

  interface Punto {
    x: number
    y: number
  }

  interface Vista extends Punto {
    escala: number
  }

  const escalaMaxima = 8
  const pausaDobleToque = 300
  const holguraDobleToque = 30

  let vista = $state<Vista>({ escala: 1, x: 0, y: 0 })
  let seleccionado = $state<string | null>(null)

  const dedos = new Map<number, Punto>()
  let gesto: { distancia: number; centro: Punto; vista: Vista } | null = null
  let huboGesto = false
  let tipoDePuntero = 'mouse'
  let ultimoToque: { instante: number; x: number; y: number; seleccionPrevia: string | null } | null = null
  let dobleToque = false

  $effect(() => {
    void preguntado
    seleccionado = null
  })

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
    if (dedos.size === 0) {
      huboGesto = false
      dobleToque = false
    }
    dedos.set(evento.pointerId, enCoordenadasDelMapa(evento))
    if (dedos.size === 2) huboGesto = true
    retomarGesto()
  }

  function retomarGesto() {
    gesto = dedos.size === 2 ? { ...medirGesto(), vista } : null
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
    if (!dedos.delete(evento.pointerId)) return
    retomarGesto()
    if (evento.type === 'pointerup' && dedos.size === 0 && !huboGesto) registrarToque(evento)
  }

  function registrarToque(evento: PointerEvent) {
    const previo = ultimoToque
    const esDoble =
      previo !== null &&
      evento.timeStamp - previo.instante < pausaDobleToque &&
      Math.hypot(evento.clientX - previo.x, evento.clientY - previo.y) < holguraDobleToque
    if (esDoble) {
      vista = { escala: 1, x: 0, y: 0 }
      seleccionado = previo.seleccionPrevia
      dobleToque = true
      ultimoToque = null
    } else {
      ultimoToque = { instante: evento.timeStamp, x: evento.clientX, y: evento.clientY, seleccionPrevia: seleccionado }
    }
  }

  function centroDelRotulo(contorno: Feature<Geometry>): [number, number] {
    const { geometry } = contorno
    if (geometry.type !== 'MultiPolygon') return trazado.centroid(contorno)
    const poligonos = geometry.coordinates.map((coordinates): Polygon => ({ type: 'Polygon', coordinates }))
    const mayor = poligonos.reduce((a, b) => (trazado.area(b) > trazado.area(a) ? b : a))
    return trazado.centroid(mayor)
  }

  const rotulados = $derived(rotulos.map((rotulo) => rotulo.id))

  // Varios rótulos sobre el mismo elemento (Jerarquía) se apilan hacia abajo.
  const rotulosConPosicion = $derived(
    rotulos.flatMap((rotulo) => {
      const contorno = contornos.find((candidato) => String(candidato.id) === rotulo.id)
      if (!contorno) return []
      const [x, y] = centroDelRotulo(contorno)
      const enRecuadro = ceutaYMelilla.some((elemento) => elemento.contorno === contorno)
      const esPunto = contorno.geometry.type === 'Point'
      const apilados = rotulos.filter((otro) => otro.id === rotulo.id)
      const desplazamiento = apilados.indexOf(rotulo) - (apilados.length - 1) / 2
      return [{ rotulo, x: enRecuadro ? x - radioDiana : x, y: (esPunto ? y - radioDiana : y) + desplazamiento * tamañoRotulo * 1.2, enRecuadro }]
    }),
  )

  function pulsarElemento(id: string) {
    if (iluminados.length > 0) return
    if (rotulados.length > 0) {
      if (rotulados.includes(id) && !huboGesto && !dobleToque) alElegir(id)
      return
    }
    if (tipoDePuntero !== 'touch') {
      seleccionado = null
      alElegir(id)
    } else if (!huboGesto && !dobleToque && preguntado !== null) {
      seleccionado = id
    }
  }

  function confirmar() {
    if (seleccionado === null) return
    alElegir(seleccionado)
    seleccionado = null
  }
</script>

<figure class="mapa" bind:clientWidth={anchoEnPantalla}>
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
      {#if fondo}
        <path class="fondo" d={trazado(fondo.contorno)} />
        {#each fondo.relieve as unidad (unidad.id)}
          <path class="fondo relieve" class:destacado={destacados.includes(String(unidad.id))} d={trazado(unidad)} />
        {/each}
        {#each fondo.rios as rio (rio.id)}
          <path class="rio" d={trazado(rio)} />
        {/each}
      {/if}
      <!-- El MVP se juega con ratón o dedo; jugar con teclado no está en la spec. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="elementos" class:relieve={fondo !== null}>
        {#each conDiana as { contorno, centro } (contorno.id)}
          {@const punto = proyeccion(centro)}
          {#if punto}
            <circle
              class="diana"
              class:correcto={correcto === String(contorno.id)}
              cx={punto[0]}
              cy={punto[1]}
              r={radioDiana}
              onclick={() => pulsarElemento(String(contorno.id))}
            />
          {/if}
        {/each}
        {#each contornos as contorno (contorno.id)}
          {@const id = String(contorno.id)}
          <path
            d={trazado(contorno)}
            class:acertado={acertados.includes(id)}
            class:fallado={fallados.includes(id)}
            class:pistaDeArea={pistaDeArea.includes(id)}
            class:seleccionado={seleccionado === id}
            class:iluminado={iluminados.includes(id)}
            class:tocado={tocado === id}
            onclick={() => pulsarElemento(id)}
          />
        {/each}
      </g>
      {#if contornoCorrecto}
        <!-- Encima de todos los elementos para que los vecinos no tapen el contorno grueso. -->
        <path class="correcto" d={trazado(contornoCorrecto)} />
      {/if}
      {#each rotulosConPosicion as { rotulo, x, y, enRecuadro } (rotulo.id + rotulo.texto)}
        <text
          class="rotulo"
          {x}
          {y}
          text-anchor={enRecuadro ? 'end' : 'middle'}
          font-size={tamañoRotulo / vista.escala}
        >
          {rotulo.texto}
        </text>
      {/each}
      <path class="marcos" d={proyeccion.getCompositionBorders()} />
    </g>
    {#if ceutaYMelilla.length > 0}
      <RecuadroCeutaMelilla
        elementos={ceutaYMelilla}
        {contexto}
        {acertados}
        {tocado}
        {correcto}
        {iluminados}
        {pistaDeArea}
        {rotulados}
        {tamañoRotulo}
        {nombreDe}
        {fallados}
        {seleccionado}
        alElegir={pulsarElemento}
        x={ancho - anchoRecuadro}
        y={alto - altoRecuadro}
        ancho={anchoRecuadro}
        alto={altoRecuadro}
      />
    {/if}
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

  .fondo {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .fondo.relieve {
    fill: #efece4;
    stroke: #d6d2c6;
  }

  .fondo.relieve.destacado {
    fill: #f6d365;
    stroke: #8a6d1f;
  }

  .rio {
    fill: none;
    stroke: #7fb3d5;
    stroke-width: 0.9;
    stroke-linejoin: round;
    stroke-linecap: round;
    pointer-events: none;
  }

  .elementos path {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
    cursor: pointer;
  }

  .elementos.relieve path {
    fill: #d8d2c2;
    stroke: #8b8578;
  }

  .elementos .diana {
    fill: transparent;
    cursor: pointer;
  }

  .elementos .diana.correcto {
    stroke: #14532d;
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
  }

  .elementos path.acertado {
    fill: #cfe8d6;
  }

  .elementos path.fallado {
    fill: #f4c7a1;
  }

  .elementos path.pistaDeArea {
    fill: #fbe7a1;
    stroke: #8a6d1f;
  }

  .elementos path.seleccionado {
    fill: #c9dcf2;
  }

  .elementos path.iluminado {
    fill: #f6d365;
    stroke: #8a6d1f;
    stroke-width: 1.6;
  }

  .elementos path.tocado {
    fill: #dc2626;
  }

  path.correcto {
    fill: none;
    stroke: #14532d;
    stroke-width: 4;
    stroke-linejoin: round;
    pointer-events: none;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .rotulo {
    font-weight: 600;
    dominant-baseline: middle;
    fill: #1f2937;
    stroke: #fdfdfb;
    stroke-width: 3;
    paint-order: stroke;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
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
