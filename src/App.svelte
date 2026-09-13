<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { catalogo, contornos } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import FinDePartida from './pantallas/FinDePartida.svelte'
  import PuntuacionYTiempo from './pantallas/PuntuacionYTiempo.svelte'
  import { iniciarPartida, responder, tiempoJugado } from './partida/partida'

  const elementos = catalogo()
  const contornosDelTipo = contornos()
  const contexto = contextoGeografico as FeatureCollection

  let partida = $state(iniciarPartida(elementos, Math.random, Date.now))
  let ahora = $state(Date.now())

  $effect(() => {
    if (partida.terminada) return
    const intervalo = setInterval(() => (ahora = Date.now()), 250)
    return () => clearInterval(intervalo)
  })

  const respuesta = $derived(partida.ultimaRespuesta)
  const desvelaPreguntado = $derived(respuesta?.correcto.id === partida.preguntado?.id)
  const resaltado = $derived(respuesta && !respuesta.acierto && !desvelaPreguntado ? respuesta.correcto.id : null)

  function nombreDe(id: string): string {
    return elementos.find((elemento) => elemento.id === id)?.nombre ?? ''
  }

  function elegir(id: string) {
    if (partida.terminada) return
    partida = responder(partida, id)
  }
</script>

<main>
  <header>
    {#if partida.terminada}
      <FinDePartida
        puntuacion={partida.puntuacion}
        tiempo={tiempoJugado(partida, ahora)}
        fallos={partida.fallos}
        fallados={partida.fallados}
      />
    {:else}
      <p class="pregunta">{partida.preguntado?.nombre}</p>
      <PuntuacionYTiempo puntuacion={partida.puntuacion} tiempo={tiempoJugado(partida, ahora)} />
      <p class="pendientes">{partida.pendientes} / {elementos.length}</p>
    {/if}
  </header>

  {#if respuesta && !partida.terminada}
    <p class="respuesta" class:fallo={!respuesta.acierto}>
      {#if respuesta.acierto}
        Correcto: {respuesta.correcto.nombre}
      {:else if desvelaPreguntado}
        Incorrecto
      {:else}
        Incorrecto. Era {respuesta.correcto.nombre}
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
