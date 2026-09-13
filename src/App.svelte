<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { catalogo, contornos, type Elemento } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import FinDePartida from './pantallas/FinDePartida.svelte'
  import PuntuacionYTiempo from './pantallas/PuntuacionYTiempo.svelte'
  import { iniciarPartida, responder, responderConTexto, tiempoJugado, type Partida } from './partida/partida'
  import type { Prueba } from './prueba/prueba'
  import SeleccionPrueba from './seleccion/SeleccionPrueba.svelte'

  const contexto = contextoGeografico as FeatureCollection

  let partida = $state<Partida | null>(null)
  let prueba = $state<Prueba | null>(null)
  let elementosDelTipo = $state.raw<Elemento[]>([])
  let totalElementos = $state(0)
  let contornosDelTipo = $state.raw<Feature<Geometry>[]>([])
  let ahora = $state(Date.now())
  let texto = $state('')
  let campoDeTexto = $state<HTMLInputElement | null>(null)

  $effect(() => {
    if (!partida || partida.terminada) return
    const intervalo = setInterval(() => (ahora = Date.now()), 250)
    return () => clearInterval(intervalo)
  })

  $effect(() => {
    campoDeTexto?.focus()
  })

  const escribeNombre = $derived(prueba?.modo === 'ubicacion-nombre')
  const respuesta = $derived(partida?.ultimaRespuesta)
  const desvelaPreguntado = $derived(!escribeNombre && respuesta?.correcto.id === partida?.preguntado?.id)
  const resaltado = $derived(respuesta && !respuesta.acierto && !desvelaPreguntado ? respuesta.correcto.id : null)

  function empezar(elegida: Prueba) {
    const elementos = catalogo(elegida.tipo)
    prueba = elegida
    elementosDelTipo = elementos
    totalElementos = elementos.length
    contornosDelTipo = contornos(elegida.tipo)
    ahora = Date.now()
    texto = ''
    partida = iniciarPartida(elementos, Math.random, Date.now)
  }

  function nombreDe(id: string): string {
    return elementosDelTipo.find((elemento) => elemento.id === id)?.nombreMostrado ?? ''
  }

  function elegir(id: string) {
    if (!partida || partida.terminada) return
    partida = responder(partida, id)
  }

  function enviarTexto(evento: SubmitEvent) {
    evento.preventDefault()
    if (!partida || partida.terminada) return
    partida = responderConTexto(partida, texto)
    texto = ''
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
        {#if escribeNombre}
          <form class="pregunta" onsubmit={enviarTexto}>
            <input
              bind:this={campoDeTexto}
              bind:value={texto}
              aria-label="Nombre del elemento iluminado"
              placeholder="¿Cómo se llama?"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
            <button type="submit">Responder</button>
          </form>
        {:else}
          <p class="pregunta">{partida.preguntado?.nombreMostrado}</p>
        {/if}
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
      iluminado={escribeNombre ? (partida.preguntado?.id ?? null) : null}
      respondePulsando={!escribeNombre}
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
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  .pregunta {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  form.pregunta {
    display: flex;
    gap: 0.5rem;
  }

  form.pregunta input,
  form.pregunta button {
    font: inherit;
    font-size: 1.125rem;
    font-weight: normal;
    padding: 0.375rem 0.75rem;
    border: 1px solid #9aa0a6;
    border-radius: 0.375rem;
    background: #fdfdfb;
    color: inherit;
  }

  form.pregunta input {
    min-width: 0;
    width: 14rem;
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
