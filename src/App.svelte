<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { catalogo, geometrias } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import { iniciarPartida, responder } from './partida/partida'

  const elementos = catalogo('comunidades')
  const rasgos = geometrias('comunidades')
  const contexto = contextoGeografico as FeatureCollection

  let partida = $state(iniciarPartida(elementos, Math.random))

  const resaltado = $derived(
    partida.ultimaRespuesta && !partida.ultimaRespuesta.acierto ? partida.ultimaRespuesta.correcto.id : null,
  )

  function elegir(id: string) {
    if (partida.terminada) return
    partida = responder(partida, id)
  }

  function jugarOtraVez() {
    partida = iniciarPartida(elementos, Math.random)
  }
</script>

<main>
  <header>
    {#if partida.terminada}
      <p class="pregunta">¡Partida terminada!</p>
      <button onclick={jugarOtraVez}>Jugar otra vez</button>
    {:else}
      <p class="pregunta">{partida.preguntado?.nombre}</p>
      <p class="pendientes">{partida.pendientes} / {elementos.length}</p>
    {/if}
  </header>

  {#if partida.ultimaRespuesta}
    <p class="respuesta" class:fallo={!partida.ultimaRespuesta.acierto}>
      {#if partida.ultimaRespuesta.acierto}
        Correcto: {partida.ultimaRespuesta.correcto.nombre}
      {:else}
        Incorrecto. Era {partida.ultimaRespuesta.correcto.nombre}
      {/if}
    </p>
  {/if}

  <Mapa geometrias={rasgos} {contexto} acertados={partida.acertados} {resaltado} alElegir={elegir} />
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
