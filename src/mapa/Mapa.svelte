<script lang="ts">
  import type { Feature, FeatureCollection, Geometry, LineString, Polygon } from 'geojson'
  import { geoCentroid, geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'
  import type { ClaseDelMapa, ContextoGeografico } from '../catalogo/catalogo'
  import { nombreDePapel, PAPELES, propiedadesDe, type Papel } from '../catalogo/relieve'
  import { abierta, ETIQUETA_DE_SENAL, senalDe, type EstadoDelMapa, type Senal } from './senales'
  import { tocableMasCercano, trazoMasCercano, type Trazo } from './toque'
  import RecuadroCeutaMelilla, { esCeutaOMelilla } from './RecuadroCeutaMelilla.svelte'

  export interface Rotulo {
    id: string
    texto: string
  }

  interface Props {
    contornos: Feature<Geometry>[]
    contextoDeRelieve?: ContextoGeografico | null
    // La leyenda es la rampa de altitud, no los iconos de clase: solo en Grandes unidades.
    rampa?: boolean
    contexto: FeatureCollection
    acertados: string[]
    tocado?: string | null
    correcto?: string | null
    preguntado: string | null
    diana?: string[]
    dianaSeToca?: boolean
    frontera?: string[]
    parcial?: string[]
    tentativa?: string | null
    destello?: string | null
    pistaDeArea?: string[]
    rotulos?: Rotulo[]
    // Los Elementos ya acertados que se quedan escritos sobre el mapa, como en el examen de papel.
    nombres?: Rotulo[]
    alturas?: Rotulo[]
    fallados?: string[]
    alElegir: (id: string) => void
    nombreDe: (id: string) => string
    // Lo que la barra de confirmación puede decir de una Tentativa sin resolver la pregunta.
    textoDeTentativa?: (id: string) => string
  }

  let {
    contornos,
    contextoDeRelieve = null,
    rampa = false,
    contexto,
    acertados,
    tocado = null,
    correcto = null,
    preguntado,
    diana = [],
    dianaSeToca = false,
    frontera = [],
    parcial = [],
    tentativa = null,
    destello = null,
    pistaDeArea = [],
    rotulos = [],
    nombres = [],
    alturas = [],
    fallados = [],
    alElegir,
    nombreDe,
    textoDeTentativa = nombreDe,
  }: Props = $props()

  const ancho = 960
  const alto = 620
  const margen = 12
  const radioSierra = 7
  const radioPico = 6
  // El Cabo de la Nao y el de San Antonio están a cuatro píxeles: con el círculo de una Sierra se ven
  // como uno solo.
  const radioCabo = 4

  const proyeccion = $derived(
    geoConicConformalSpain().fitExtent(
      [
        [margen, margen],
        [ancho - margen, alto - margen],
      ],
      { type: 'FeatureCollection', features: contextoDeRelieve ? [contextoDeRelieve.contorno] : contornos },
    ),
  )
  const trazado = $derived(geoPath(proyeccion).pointRadius(radioSierra))
  const contornoCorrecto = $derived(contornos.find((contorno) => String(contorno.id) === correcto))
  const anchoRecuadro = 232
  const altoRecuadro = 150
  const radioPulsador = 10
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
  const conPulsador = $derived([...ceutaYMelilla, ...puntos])
  const cauces = $derived(contornos.filter((contorno) => contorno.geometry.type === 'LineString'))
  const manchas = $derived(
    contornos.filter((contorno) => contorno.geometry.type !== 'Point' && contorno.geometry.type !== 'LineString'),
  )

  function claseDe(contorno: Feature<Geometry>): ClaseDelMapa {
    return (contorno.properties as { clase?: ClaseDelMapa })?.clase ?? 'cordillera'
  }

  // El color de cada unidad sale de su papel respecto a la Meseta, en la rampa de altitud de los mapas
  // físicos; la leyenda pasa a ser esa rampa y no los iconos, que aquí son todos manchas.
  // El color entra como variable y no como clase: así los estados momentáneos (un toque erróneo sobre una
  // mancha ya pintada, la Corrección, el Repaso) siguen ganando por orden, como en el resto de los Tipos.
  function colorDelPapel(contorno: Feature<Geometry>): string | null {
    const { papel } = propiedadesDe(contorno)
    return papel ? `--papel: var(--${papel})` : null
  }

  const papelesEnElMapa = $derived(
    rampa ? PAPELES.filter((papel) => contornos.some((contorno) => propiedadesDe(contorno).papel === papel)) : [],
  )

  // Solo las clases presentes, para que la leyenda no anuncie lo que el mapa no muestra.
  const clasesEnElMapa = $derived(
    (['cordillera', 'sierra', 'pico'] as ClaseDelMapa[]).filter(
      (clase) =>
        contornos.some((contorno) => claseDe(contorno) === clase) ||
        (clase === 'cordillera' && (contextoDeRelieve?.tenues.length ?? 0) > 0),
    ),
  )

  const CLASES_DE_RIO: ClaseDelMapa[] = ['rio-principal', 'rio-propio', 'afluente']

  // Una mancha del relieve toma su color del Papel; las de agua y las de costa, el de su Clase.
  const MANCHAS_CON_COLOR_PROPIO: ClaseDelMapa[] = ['vertiente', 'tramo-de-costa']

  function claseDibujada(contorno: Feature<Geometry>): ClaseDelMapa | '' {
    const clase = claseDe(contorno)
    return contorno.geometry.type === 'Point' || MANCHAS_CON_COLOR_PROPIO.includes(clase) ? clase : ''
  }

  function hayClase(clase: ClaseDelMapa): boolean {
    return contornos.some((contorno) => claseDe(contorno) === clase)
  }

  const radioDelDedo = 14

  const puntosTocables = $derived<Trazo[]>(
    conPulsador.flatMap(({ contorno, centro }) => {
      const punto = proyeccion(centro)
      return punto ? [{ id: String(contorno.id), puntos: [{ x: punto[0], y: punto[1] }] }] : []
    }),
  )

  const trazos = $derived<Trazo[]>(
    cauces.map((cauce) => ({
      id: String(cauce.id),
      puntos: (cauce.geometry as LineString).coordinates.flatMap((coordenadas) => {
        const punto = proyeccion(coordenadas as [number, number])
        return punto ? [{ x: punto[0], y: punto[1] }] : []
      }),
    })),
  )

  // Sierra: círculo; pico: triángulo, como en los mapas físicos. Las manchas ya se distinguen solas.
  function marcador(contorno: Feature<Geometry>): string | null {
    if (contorno.geometry.type !== 'Point') return trazado(contorno)
    if (claseDe(contorno) === 'cabo') return trazadoDeCabo(contorno)
    if (claseDe(contorno) !== 'pico') return trazado(contorno)
    const punto = proyeccion(contorno.geometry.coordinates as [number, number])
    if (!punto) return null
    const [x, y] = punto
    return `M${x},${y - radioPico}L${x + radioPico * 0.9},${y + radioPico * 0.6}L${x - radioPico * 0.9},${y + radioPico * 0.6}Z`
  }

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

  let lienzo = $state<SVGSVGElement | null>(null)
  let vista = $state<Vista>({ escala: 1, x: 0, y: 0 })

  // La marca del Cabo no crece con el mapa: si creciera, ampliar no separaría nunca el Cabo de la Nao
  // del de San Antonio, porque su distancia y su radio se multiplicarían por lo mismo.
  const trazadoDeCabo = $derived(geoPath(proyeccion).pointRadius(radioCabo / vista.escala))
  let seleccionado = $state<string | null>(null)
  let bajoElPuntero = $state<string | null>(null)

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

  // Tentativa es todo lo que el alumno tiene apuntado y sin juzgar: el toque pendiente de confirmar, la
  // forma que responde en Todo y el cauce que se llevaría el clic del ratón.
  const estado = $derived<EstadoDelMapa>({
    tocado,
    tentativa: seleccionado ?? tentativa ?? bajoElPuntero,
    diana,
    pistaDeArea,
    fallados,
    acertados,
    parcial,
    frontera,
  })

  function senal(id: string): Senal | null {
    return senalDe(id, estado)
  }

  const radioAspa = 5

  const senalesEnElMapa = $derived.by(() => {
    const presentes = new Set(contornos.map((contorno) => senal(String(contorno.id))))
    return (Object.keys(ETIQUETA_DE_SENAL) as Senal[]).filter((candidata) => presentes.has(candidata))
  })

  function enCoordenadasDelMapa(evento: MouseEvent): Punto {
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

  // El pellizco solo existe con los dedos, y sin zoom el Cabo de la Nao y el de San Antonio, a cuatro
  // píxeles, no se pueden separar con el ratón.
  const PASO_DE_LA_RUEDA = 400

  function alRodar(evento: WheelEvent) {
    evento.preventDefault()
    const punto = enCoordenadasDelMapa(evento)
    const escala = acotar(vista.escala * Math.exp(-evento.deltaY / PASO_DE_LA_RUEDA), 1, escalaMaxima)
    const origenX = (punto.x - vista.x) / vista.escala
    const origenY = (punto.y - vista.y) / vista.escala
    vista = {
      escala,
      x: acotar(punto.x - origenX * escala, ancho * (1 - escala), 0),
      y: acotar(punto.y - origenY * escala, alto * (1 - escala), 0),
    }
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

  function puntoDelEvento(evento: MouseEvent): Punto | null {
    if (!lienzo) return null
    const caja = lienzo.getBoundingClientRect()
    const factor = ancho / caja.width
    return {
      x: ((evento.clientX - caja.left) * factor - vista.x) / vista.escala,
      y: ((evento.clientY - caja.top) * factor - vista.y) / vista.escala,
    }
  }

  // Una línea de dos píxeles no se puede pulsar, y en cada confluencia hay varias bajo el dedo: el
  // toque lo resuelve el mapa entero, quedándose con el cauce que pasa más cerca del punto exacto.
  function cauceBajoElPuntero(evento: MouseEvent): string | null {
    if (trazos.length === 0) return null
    const punto = puntoDelEvento(evento)
    return punto ? trazoMasCercano(punto, trazos, radioDelDedo / vista.escala) : null
  }

  function tocableBajoElPuntero(evento: MouseEvent): string | null {
    const punto = puntoDelEvento(evento)
    return punto ? tocableMasCercano(punto, puntosTocables, trazos, radioDelDedo / vista.escala, radioCabo / vista.escala) : null
  }

  // Con ratón no hay paso de confirmación, así que la puntería tiene que verse antes de pulsar. Y hay
  // que verla también en los puntos: el Cabo de la Nao y el de San Antonio están a cuatro píxeles.
  function apuntar(evento: MouseEvent) {
    if (tipoDePuntero === 'touch' || preguntado === null) return
    if (diana.length > 0 && !dianaSeToca) return
    bajoElPuntero = tocableBajoElPuntero(evento)
  }

  function tocarCauce(evento: MouseEvent) {
    const id = cauceBajoElPuntero(evento)
    if (id !== null) pulsarElemento(id)
  }

  // Los cauces se dibujan sobre las manchas, así que un toque sobre un río que cruza una vertiente
  // le llega a las dos. Gana el río, que es el blanco fino.
  function pulsarMancha(evento: MouseEvent, id: string) {
    if (cauceBajoElPuntero(evento) === null) pulsarElemento(id)
  }

  // Los pulsadores se pisan entre ellos y con los arcos: el Cabo de la Nao y el de San Antonio están
  // a cuatro píxeles y el Estrecho entero cabe dentro del de la Punta de Tarifa. Cuál de los círculos
  // recibe el clic depende del orden de pintado, así que no decide él.
  function pulsarTocable(evento: MouseEvent, id: string) {
    evento.stopPropagation()
    pulsarElemento(tocableBajoElPuntero(evento) ?? id)
  }

  function centroDelRotulo(contorno: Feature<Geometry>): [number, number] {
    const { geometry } = contorno
    if (geometry.type !== 'MultiPolygon') return trazado.centroid(contorno)
    const poligonos = geometry.coordinates.map((coordinates): Polygon => ({ type: 'Polygon', coordinates }))
    const mayor = poligonos.reduce((a, b) => (trazado.area(b) > trazado.area(a) ? b : a))
    return trazado.centroid(mayor)
  }

  // La Diana de un Cabo mide ocho píxeles sobre novecientos sesenta de mapa, y su azul es el de sus
  // vecinos: el color solo no la encuentra. Una mancha sí se ve sola, así que no lleva halo.
  const RADIO_DEL_HALO = 14

  const halos = $derived.by(() =>
    diana.flatMap((id) => {
      const contorno = contornos.find((candidato) => String(candidato.id) === id)
      if (!contorno || (contorno.geometry.type !== 'Point' && contorno.geometry.type !== 'LineString')) return []
      const [x, y] = centroDelRotulo(contorno)
      return [{ id, x, y }]
    }),
  )

  const rotulados = $derived(rotulos.map((rotulo) => rotulo.id))

  // Varios rótulos sobre el mismo elemento (Pertenencia) se apilan hacia abajo.
  const rotulosConPosicion = $derived(
    rotulos.flatMap((rotulo) => {
      const contorno = contornos.find((candidato) => String(candidato.id) === rotulo.id)
      if (!contorno) return []
      const [x, y] = centroDelRotulo(contorno)
      const enRecuadro = ceutaYMelilla.some((elemento) => elemento.contorno === contorno)
      const esPunto = contorno.geometry.type === 'Point'
      const apilados = rotulos.filter((otro) => otro.id === rotulo.id)
      const desplazamiento = apilados.indexOf(rotulo) - (apilados.length - 1) / 2
      return [{ rotulo, x: enRecuadro ? x - radioPulsador : x, y: (esPunto ? y - radioPulsador : y) + desplazamiento * tamañoRotulo * 1.2, enRecuadro }]
    }),
  )

  function pulsarElemento(id: string) {
    if (diana.length > 0 && !dianaSeToca) return
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
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
  <svg
    bind:this={lienzo}
    viewBox="0 0 {ancho} {alto}"
    role="img"
    aria-label="Mapa mudo de España"
    onpointerdown={alPulsar}
    onpointermove={alMover}
    onpointerup={alSoltar}
    onpointercancel={alSoltar}
    onwheel={alRodar}
    onmousemove={apuntar}
    onmouseleave={() => (bajoElPuntero = null)}
    onclick={tocarCauce}
  >
    <g transform="translate({vista.x} {vista.y}) scale({vista.escala})">
      <g class="contexto">
        {#each contexto.features as pais (pais.id)}
          <path d={trazado(pais)} />
        {/each}
      </g>
      {#if contextoDeRelieve}
        <path class="contorno" d={trazado(contextoDeRelieve.contorno)} />
        {#each contextoDeRelieve.tenues as cordillera (cordillera.id)}
          <path class="tenue" d={trazado(cordillera)} />
        {/each}
        {#each contextoDeRelieve.rios as rio (rio.id)}
          <path class="rio" d={trazado(rio)} />
        {/each}
      {/if}
      <!-- El MVP se juega con ratón o dedo; jugar con teclado no está en la spec. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <g class="elementos" class:relieve={contextoDeRelieve !== null}>
        {#each [...manchas, ...puntos.map(({ contorno }) => contorno)] as contorno (contorno.id)}
          {@const id = String(contorno.id)}
          {@const senalDelElemento = senal(id)}
          <path
            d={marcador(contorno)}
            class="{claseDibujada(contorno)} {senalDelElemento ?? ''}"
            class:abierta={abierta(senalDelElemento)}
            class:destello={destello === id}
            style={colorDelPapel(contorno)}
            onclick={(evento) => pulsarMancha(evento, id)}
          />
        {/each}
        <!-- Un cauce se dibuja sobre las manchas: es el blanco fino y una vertiente lo taparía entero. -->
        {#each cauces as cauce (cauce.id)}
          {@const id = String(cauce.id)}
          {@const senalDelElemento = senal(id)}
          {#if senalDelElemento}
            <!-- Una línea no tiene borde: la funda hace de borde y es donde cabe decir si sigue en juego. -->
            <path class="funda {senalDelElemento}" class:abierta={abierta(senalDelElemento)} d={trazado(cauce)} />
          {/if}
          <path class="cauce {senalDelElemento ?? ''}" d={trazado(cauce)} />
        {/each}
        <!-- Las dianas van encima de todo para que una mancha no robe el toque a un punto. -->
        {#each conPulsador as { contorno, centro } (contorno.id)}
          {@const punto = proyeccion(centro)}
          {#if punto}
            <circle
              class="pulsador"
              class:correcto={correcto === String(contorno.id)}
              cx={punto[0]}
              cy={punto[1]}
              r={radioPulsador}
              onclick={(evento) => pulsarTocable(evento, String(contorno.id))}
            />
          {/if}
        {/each}
      </g>
      {#if contornoCorrecto}
        <!-- Encima de todos los elementos para que los vecinos no tapen el contorno grueso. -->
        <path class="correcto" d={trazado(contornoCorrecto)} />
      {/if}
      {#each halos as halo (halo.id)}
        <g class="halo" transform="translate({halo.x} {halo.y}) scale({1 / vista.escala})">
          <circle r={RADIO_DEL_HALO} />
        </g>
      {/each}
      {#each manchas.filter((contorno) => senal(String(contorno.id)) === 'fallo') as contorno (contorno.id)}
        {@const [x, y] = centroDelRotulo(contorno)}
        {@const brazo = radioAspa / vista.escala}
        <path class="aspa" d="M{x - brazo},{y - brazo}L{x + brazo},{y + brazo}M{x + brazo},{y - brazo}L{x - brazo},{y + brazo}" />
      {/each}
      {#each nombres as nombre (nombre.id)}
        {@const contorno = contornos.find((candidato) => String(candidato.id) === nombre.id)}
        {#if contorno}
          {@const [x, y] = centroDelRotulo(contorno)}
          <text class="rotulo" {x} {y} text-anchor="middle" font-size={(tamañoRotulo * 0.85) / vista.escala}>
            {nombre.texto}
          </text>
        {/if}
      {/each}
      {#each alturas as altura (altura.id)}
        {@const contorno = contornos.find((candidato) => String(candidato.id) === altura.id)}
        {#if contorno}
          {@const [x, y] = centroDelRotulo(contorno)}
          <text class="altura" {x} y={y + radioPulsador + tamañoRotulo * 0.6} text-anchor="middle" font-size={(tamañoRotulo * 0.8) / vista.escala}>
            {altura.texto}
          </text>
        {/if}
      {/each}
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
        {estado}
        {correcto}
        {rotulados}
        {tamañoRotulo}
        {nombreDe}
        alElegir={pulsarElemento}
        x={ancho - anchoRecuadro}
        y={alto - altoRecuadro}
        ancho={anchoRecuadro}
        alto={altoRecuadro}
      />
    {/if}
  </svg>
  {#if papelesEnElMapa.length > 0}
    <ul class="leyenda rampa">
      {#each papelesEnElMapa as papel (papel)}
        <li><span class="muestra" style="background: var(--{papel})" aria-hidden="true"></span> {nombreDePapel[papel]}</li>
      {/each}
    </ul>
  {:else if contextoDeRelieve}
    <ul class="leyenda">
      {#if clasesEnElMapa.includes('cordillera')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><path class="mancha" d="M1,9C4,3 8,2 12,5S18,6 19,3V13H1Z" /></svg> Cordillera o macizo</li>
      {/if}
      {#if clasesEnElMapa.includes('sierra')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><circle class="sierra" cx="10" cy="7" r="5" /></svg> Sierra</li>
      {/if}
      {#if clasesEnElMapa.includes('pico')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><path class="pico" d="M10,1L16,12H4Z" /></svg> Pico</li>
      {/if}
      {#if hayClase('vertiente')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><path class="vertiente" d="M1,9C4,3 8,2 12,5S18,6 19,3V13H1Z" /></svg> Vertiente</li>
      {/if}
      {#if CLASES_DE_RIO.some(hayClase)}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><path class="cauce" d="M1,11C6,11 5,4 10,4S15,10 19,3" /></svg> Río</li>
      {/if}
      {#if hayClase('tramo-de-costa')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><path class="tramo-de-costa" d="M1,9C4,3 8,2 12,5S18,6 19,3V13H1Z" /></svg> Tramo de costa</li>
      {/if}
      {#if hayClase('cabo')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><circle class="cabo" cx="10" cy="7" r="4" /></svg> Cabo</li>
      {/if}
      {#if hayClase('golfo') || hayClase('estrecho')}
        <li><svg viewBox="0 0 20 14" aria-hidden="true"><path class="cauce" d="M1,11C6,11 5,4 10,4S15,10 19,3" /></svg> Golfo o estrecho</li>
      {/if}
    </ul>
  {/if}
  {#if senalesEnElMapa.length > 0}
    <ul class="leyenda senales">
      {#each senalesEnElMapa as etiqueta (etiqueta)}
        <li><span class="muestra {etiqueta}" aria-hidden="true"></span> {ETIQUETA_DE_SENAL[etiqueta]}</li>
      {/each}
    </ul>
  {/if}
  {#if seleccionado !== null}
    <div class="seleccion">
      <span>{textoDeTentativa(seleccionado)}</span>
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

  .contorno {
    fill: #fdfdfb;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .tenue {
    fill: #efece4;
    stroke: #d6d2c6;
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

  .elementos.relieve path,
  .leyenda .mancha {
    fill: #d8d2c2;
    stroke: #8b8578;
  }

  .elementos path.sierra,
  .leyenda .sierra {
    fill: #fbf9f3;
    stroke: #6f6552;
    stroke-width: 1.2;
  }

  .elementos path.pico,
  .leyenda .pico {
    fill: #6f6552;
    stroke: #3f3a30;
    stroke-width: 0.8;
  }

  .elementos path.vertiente,
  .leyenda .vertiente {
    fill: #dbe7f0;
    stroke: #6b8ea6;
  }

  .elementos path.tramo-de-costa,
  .leyenda .tramo-de-costa {
    fill: #dcebe7;
    stroke: #6f9e94;
  }

  .elementos path.cabo,
  .leyenda .cabo {
    fill: #3c7fb1;
    stroke: #1f4f70;
    stroke-width: 0.8;
  }

  /* El toque lo resuelve el SVG entero, no cada trazo: aquí solo se dibuja. */
  .elementos path.cauce,
  .leyenda .cauce {
    fill: none;
    stroke: #3c7fb1;
    stroke-width: 1.6;
    stroke-linejoin: round;
    stroke-linecap: round;
    pointer-events: none;
  }

  .elementos .pulsador {
    fill: transparent;
    cursor: pointer;
  }

  .elementos .pulsador.correcto {
    stroke: var(--senal-correcto);
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
  }

  .elementos path.frontera {
    fill: var(--senal-frontera);
    stroke: var(--senal-frontera-borde);
    stroke-width: 1.2;
  }

  .elementos path.diana,
  .elementos path.tentativa {
    fill: var(--senal-diana);
    stroke: var(--senal-diana-borde);
    stroke-width: 2.4;
  }

  /* Rampa hipsométrica: la unidad acertada toma su altura en un mapa físico; sin papel, el verde de siempre. */
  .elementos path.acierto,
  .elementos path.parcial {
    fill: var(--papel, var(--senal-acierto));
    stroke: var(--senal-acierto-borde);
    stroke-width: 1.2;
  }

  .elementos path.fallo {
    fill: var(--senal-fallo);
    stroke: var(--senal-fallo-borde);
    stroke-width: 1.2;
  }

  .elementos path.ayuda {
    fill: var(--senal-ayuda);
    stroke: var(--senal-ayuda-borde);
  }

  .elementos path.tocado {
    fill: var(--senal-tocado);
    stroke: var(--senal-fallo-borde);
  }

  /* El borde dice si el Elemento sigue en juego; el color solo dice qué es. */
  .elementos path.abierta {
    stroke-dasharray: 4 2.5;
  }

  /* El halo no es una Señal más: es el dedo que señala a la que ya la lleva. */
  .halo {
    pointer-events: none;
  }

  .halo circle {
    fill: none;
    stroke: var(--senal-diana-borde);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    animation: latido 1.4s ease-out infinite;
  }

  @keyframes latido {
    from {
      transform: scale(0.55);
      opacity: 0.9;
    }
    to {
      transform: scale(1.55);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .halo circle {
      animation: none;
      transform: scale(1.25);
      opacity: 0.85;
    }
  }

  /* En Grandes unidades el color final es la rampa, un cambio demasiado suave para leerse como acierto. */
  .elementos path.destello {
    animation: destello 600ms ease-out;
  }

  @keyframes destello {
    from {
      fill: var(--senal-acierto-borde);
    }
  }

  /* Una línea no tiene borde: la funda ocupa su lugar y es la que se puntea. */
  .elementos path.funda {
    fill: none;
    stroke-width: 5;
    stroke-linejoin: round;
    stroke-linecap: round;
    opacity: 0.5;
    pointer-events: none;
  }

  .elementos path.funda.abierta {
    stroke-dasharray: 5 3.5;
  }

  .elementos path.funda.frontera {
    stroke: var(--senal-frontera-borde);
    stroke-width: 6;
  }

  .elementos path.funda.diana,
  .elementos path.funda.tentativa {
    stroke: var(--senal-diana-borde);
  }

  .elementos path.funda.acierto,
  .elementos path.funda.parcial {
    stroke: var(--senal-acierto-borde);
  }

  .elementos path.funda.fallo,
  .elementos path.funda.tocado {
    stroke: var(--senal-fallo-borde);
  }

  .elementos path.funda.ayuda {
    stroke: var(--senal-ayuda-borde);
  }

  /* Una Señal le da color al trazo de un cauce y nunca relleno: la regla genérica de arriba tiene la
     misma especificidad que la del cauce y va después, así que cerraría la línea en una cuña.
     El color es el del borde de la Señal: los rellenos pálidos no se leen a 2,4 px de trazo. */
  .elementos path.cauce {
    fill: none;
  }

  .elementos path.cauce.frontera {
    stroke: var(--senal-frontera-borde);
    stroke-width: 2.4;
  }

  .elementos path.cauce.diana,
  .elementos path.cauce.tentativa {
    stroke: var(--senal-diana-borde);
    stroke-width: 2.6;
  }

  .elementos path.cauce.acierto,
  .elementos path.cauce.parcial {
    stroke: var(--senal-acierto-borde);
    stroke-width: 2.4;
  }

  .elementos path.cauce.fallo {
    stroke: var(--senal-fallo-borde);
    stroke-width: 2.4;
  }

  .elementos path.cauce.ayuda {
    stroke: var(--senal-ayuda-borde);
    stroke-width: 2.4;
  }

  .elementos path.cauce.tocado {
    stroke: var(--senal-tocado);
    stroke-width: 2.6;
  }

  /* La marca del Fallo que no es color: uno de cada doce alumnos no distingue el rojo del verde. */
  .aspa {
    fill: none;
    stroke: var(--senal-fallo-borde);
    stroke-width: 2;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  .muestra {
    display: inline-block;
    width: 1.1rem;
    height: 0.8rem;
    border: 1px solid #8b8578;
    border-radius: 0.15rem;
    vertical-align: -0.1em;
  }

  .muestra.frontera {
    background: var(--senal-frontera);
    border-color: var(--senal-frontera-borde);
    border-style: dashed;
  }

  .muestra.diana {
    background: var(--senal-diana);
    border-color: var(--senal-diana-borde);
  }

  .muestra.acierto {
    background: var(--senal-acierto);
    border-color: var(--senal-acierto-borde);
  }

  .muestra.parcial {
    background: var(--senal-acierto);
    border-color: var(--senal-acierto-borde);
    border-style: dashed;
  }

  .muestra.fallo {
    background: var(--senal-fallo);
    border-color: var(--senal-fallo-borde);
  }

  .muestra.ayuda {
    background: var(--senal-ayuda);
    border-color: var(--senal-ayuda-borde);
  }

  path.correcto {
    fill: none;
    stroke: var(--senal-correcto);
    stroke-width: 4;
    stroke-linejoin: round;
    pointer-events: none;
  }

  .marcos {
    fill: none;
    stroke: #9aa0a6;
    stroke-width: 0.8;
  }

  .altura {
    font-weight: 600;
    fill: #4b5563;
    stroke: #fdfdfb;
    stroke-width: 3;
    paint-order: stroke;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
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

  .leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    color: #4b5563;
  }

  .leyenda li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .leyenda svg {
    width: 1.5rem;
    height: 1rem;
  }

  figcaption {
    font-size: 0.7rem;
    color: #6b7280;
    text-align: right;
    padding: 0.25rem 0.5rem;
  }
</style>
