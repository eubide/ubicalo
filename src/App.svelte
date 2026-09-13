<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { catalogo, contornos, type Elemento, type Tipo } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import FinDePartida from './pantallas/FinDePartida.svelte'
  import PuntuacionYTiempo from './pantallas/PuntuacionYTiempo.svelte'
  import { iniciarPartida, responder, tiempoJugado, type Partida } from './partida/partida'
  import SeleccionPrueba from './seleccion/SeleccionPrueba.svelte'

  const contexto = contextoGeografico as FeatureCollection

  let partida = $state<Partida | null>(null)
  let elementosDelTipo = $state.raw<Elemento[]>([])
  let totalElementos = $state(0)
  let contornosDelTipo = $state.raw<Feature<Geometry>[]>([])
  let ahora = $state(Date.now())

  $effect(() => {
    if (!partida || partida.terminada) return
    const intervalo = setInterval(() => (ahora = Date.now()), 250)
    return () => clearInterval(intervalo)
  })

  const respuesta = $derived(partida?.ultimaRespuesta)
  const desvelaPreguntado = $derived(respuesta?.correcto.id === partida?.preguntado?.id)
  const resaltado = $derived(respuesta && !respuesta.acierto && !desvelaPreguntado ? respuesta.correcto.id : null)

  function empezar(tipo: Tipo) {
    const elementos = catalogo(tipo)
    elementosDelTipo = elementos
    totalElementos = elementos.length
    contornosDelTipo = contornos(tipo)
    ahora = Date.now()
    partida = iniciarPartida(elementos, Math.random, Date.now)
  }

  function nombreDe(id: string): string {
    return elementosDelTipo.find((elemento) => elemento.id === id)?.nombreMostrado ?? ''
  }

  function elegir(id: string) {
    if (!partida || partida.terminada) return
    partida = responder(partida, id)
  }
</script>

<main>
  {#if !partida}
    <SeleccionPrueba alElegir={empezar} />
  {:else}
    <header>
      {#if partida.terminada}
        <FinDePartida
          puntuacion={partida.puntuacion}
          tiempo={tiempoJugado(partida, ahora)}
          fallos={partida.fallos}
          fallados={partida.fallados}
        />
      {:else}
        <p class="pregunta">{partida.preguntado?.nombreMostrado}</p>
        <PuntuacionYTiempo puntuacion={partida.puntuacion} tiempo={tiempoJugado(partida, ahora)} />
        <p class="pendientes">{partida.pendientes} / {totalElementos}</p>
      {/if}
    </header>

    {#if respuesta && !partida.terminada}
      <p class="respuesta" class:fallo={!respuesta.acierto}>
        {#if respuesta.acierto}
          Correcto: {respuesta.correcto.nombreMostrado}
        {:else if desvelaPreguntado}
          Incorrecto
        {:else}
          Incorrecto. Era {respuesta.correcto.nombreMostrado}
        {/if}
      </p>
    {/if}

    <Mapa
      contornos={contornosDelTipo}
      {contexto}
      acertados={partida.acertados}
      {resaltado}
      preguntado={partida.preguntado?.id ?? null}
      fallados={partida.terminada ? partida.fallados.map((elemento) => elemento.id) : []}
      alElegir={elegir}
      {nombreDe}
    />
  {/if}
</main>

<style>
  main {
    max-width: 60rem;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  .pregunta {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .pendientes {
    margin: 0;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }

  .respuesta {
    margin: 0.5rem 0;
    color: #2f7a4a;
    min-height: 1.5rem;
  }

  .respuesta.fallo {
    color: #b45309;
  }
</style>
