<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { catalogo, contornos } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import { iniciarPartida, responder } from './partida/partida'

  const elementos = catalogo()
  const contornosDelTipo = contornos()
  const contexto = contextoGeografico as FeatureCollection

  let partida = $state(iniciarPartida(elementos, Math.random))

  const respuesta = $derived(partida.ultimaRespuesta)
  const desvelaPreguntado = $derived(respuesta?.correcto.id === partida.preguntado?.id)
  const resaltado = $derived(respuesta && !respuesta.acierto && !desvelaPreguntado ? respuesta.correcto.id : null)

  function nombrar(id: string): string {
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
      <p class="pregunta">¡Partida terminada!</p>
    {:else}
      <p class="pregunta">{partida.preguntado?.nombre}</p>
      <p class="pendientes">{partida.pendientes} / {elementos.length}</p>
    {/if}
  </header>

  {#if respuesta}
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

  <Mapa contornos={contornosDelTipo} {contexto} acertados={partida.acertados} {resaltado} alElegir={elegir} nombreDe={nombrar} />
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
