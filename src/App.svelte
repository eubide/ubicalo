<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { catalogo, contornos, type Tipo } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import { iniciarPartida, responder, type Partida } from './partida/partida'
  import SeleccionPrueba from './seleccion/SeleccionPrueba.svelte'

  const contexto = contextoGeografico as FeatureCollection

  let partida = $state<Partida | null>(null)
  let totalElementos = $state(0)
  let contornosDelTipo = $state.raw<Feature<Geometry>[]>([])

  const respuesta = $derived(partida?.ultimaRespuesta)
  const desvelaPreguntado = $derived(respuesta?.correcto.id === partida?.preguntado?.id)
  const resaltado = $derived(respuesta && !respuesta.acierto && !desvelaPreguntado ? respuesta.correcto.id : null)

  function empezar(tipo: Tipo) {
    const elementos = catalogo(tipo)
    totalElementos = elementos.length
    contornosDelTipo = contornos(tipo)
    partida = iniciarPartida(elementos, Math.random)
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
        <p class="pregunta">¡Partida terminada!</p>
      {:else}
        <p class="pregunta">{partida.preguntado?.nombreMostrado}</p>
        <p class="pendientes">{partida.pendientes} / {totalElementos}</p>
      {/if}
    </header>

    {#if respuesta}
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

    <Mapa contornos={contornosDelTipo} {contexto} acertados={partida.acertados} {resaltado} alElegir={elegir} />
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
