<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { catalogo, contornos, type Elemento } from './catalogo/catalogo'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import FinDePartida from './pantallas/FinDePartida.svelte'
  import PuntuacionYTiempo from './pantallas/PuntuacionYTiempo.svelte'
  import {
    almacenEnMemoria,
    crearCompeticion,
    enlaceSinReto,
    retoDe,
    retoDeEnlace,
    superaReto,
    type Almacen,
    type ResultadoDeRegistro,
    type Reto,
  } from './competicion/competicion'
  import {
    abandonar,
    cerrarCorreccion,
    cerrarRepaso,
    correccionTrasFallo,
    DURACION_REPASO_UBICACION_NOMBRE,
    elegirOpcion,
    iniciarPartida,
    marcarEnRepaso,
    responder,
    responderConTexto,
    resumirPartida,
    tiempoJugado,
    type Partida,
  } from './partida/partida'
  import type { Prueba } from './prueba/prueba'
  import SeleccionPrueba from './seleccion/SeleccionPrueba.svelte'

  const contexto = contextoGeografico as FeatureCollection

  function almacenDelNavegador(): Almacen {
    try {
      return window.localStorage ?? almacenEnMemoria()
    } catch {
      return almacenEnMemoria()
    }
  }

  const competicion = crearCompeticion(almacenDelNavegador())

  let retoRecibido = $state<Reto | null>(retoDeEnlace(location.href))
  let aBatir = $state<Reto | null>(null)
  let retoSuperado = $state<boolean | null>(null)
  let resultado = $state<ResultadoDeRegistro | null>(null)
  let reto = $state<Reto | null>(null)
  const ESPERA_CONFIRMAR_ABANDONO = 3_000
  let confirmandoAbandono = $state(false)
  let partida = $state<Partida | null>(null)
  let prueba = $state<Prueba | null>(null)
  let elementosDelTipo = $state.raw<Elemento[]>([])
  let totalElementos = $state(0)
  let contornosDelTipo = $state.raw<Feature<Geometry>[]>([])
  let ahora = $state(Date.now())
  let texto = $state('')
  let campoDeTexto = $state<HTMLInputElement | null>(null)
  let pistaAbierta = $state<HTMLElement | null>(null)

  $effect(() => {
    if (!partida || partida.terminada) return
    const intervalo = setInterval(() => (ahora = Date.now()), 250)
    return () => clearInterval(intervalo)
  })

  $effect(() => {
    campoDeTexto?.focus()
  })

  $effect(() => {
    pistaAbierta?.focus()
  })

  const escribeNombre = $derived(prueba?.modo === 'ubicacion-nombre')
  const respuesta = $derived(partida?.ultimaRespuesta)
  const pista = $derived(partida?.pista ?? null)
  const correccion = $derived(partida?.correccion ?? null)
  const repaso = $derived(partida?.repaso ?? null)
  const rotulados = $derived(
    repaso?.elementos.map((elemento) => elemento.id).filter((id) => !repaso.marcados.includes(id)) ?? [],
  )

  $effect(() => {
    if (!correccion) return
    confirmandoAbandono = false
    const espera = setTimeout(() => {
      if (partida) partida = cerrarCorreccion(partida)
    }, correccion.duracion)
    return () => clearTimeout(espera)
  })

  $effect(() => {
    if (!repaso) return
    confirmandoAbandono = false
    if (!escribeNombre) return
    const espera = setTimeout(() => {
      if (partida) partida = cerrarRepaso(partida)
    }, DURACION_REPASO_UBICACION_NOMBRE)
    return () => clearTimeout(espera)
  })

  function empezar(elegida: Prueba) {
    const elementos = catalogo(elegida.tipo)
    prueba = elegida
    resultado = null
    reto = null
    retoSuperado = null
    aBatir =
      retoRecibido?.prueba.tipo === elegida.tipo && retoRecibido.prueba.modo === elegida.modo ? retoRecibido : null
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
    if (partida.repaso) {
      partida = marcarEnRepaso(partida, id)
      return
    }
    partida = responder(partida, id)
    if (partida.terminada) registrar(partida)
  }

  $effect(() => {
    if (!confirmandoAbandono) return
    const espera = setTimeout(() => (confirmandoAbandono = false), ESPERA_CONFIRMAR_ABANDONO)
    return () => clearTimeout(espera)
  })

  function pulsarAbandonar() {
    if (!partida || partida.terminada || partida.correccion || partida.repaso) return
    if (!confirmandoAbandono) {
      confirmandoAbandono = true
      return
    }
    confirmandoAbandono = false
    partida = abandonar(partida)
    registrar(partida)
  }

  function elegirOtraPrueba() {
    partida = null
    prueba = null
    resultado = null
    retoSuperado = null
  }

  function registrar(acabada: Partida) {
    const jugada = prueba && resumirPartida(acabada, prueba)
    if (!jugada) return
    resultado = competicion.registrar(jugada)
    reto = retoDe(jugada)
    if (aBatir) {
      retoSuperado = superaReto(jugada, aBatir)
      aBatir = null
      retoRecibido = null
      history.replaceState(history.state, '', enlaceSinReto(location.href))
    }
  }

  function enviarTexto(evento: SubmitEvent) {
    evento.preventDefault()
    if (!partida || partida.terminada) return
    partida = responderConTexto(partida, texto)
    if (partida.terminada) registrar(partida)
    texto = ''
    campoDeTexto?.focus()
  }

  function elegirOpcionDePista(id: string) {
    if (!partida || partida.terminada) return
    partida = elegirOpcion(partida, id)
  }
</script>

<main>
  {#if !partida}
    <SeleccionPrueba alElegir={empezar} marcaDe={(elegida) => competicion.marca(elegida)} reto={retoRecibido} />
  {:else}
    <header>
      {#if partida.terminada}
        <FinDePartida
          puntuacion={partida.puntuacion}
          aciertosALaPrimera={partida.aciertosALaPrimera}
          totalElementos={partida.elementos.length}
          tiempo={tiempoJugado(partida, ahora)}
          fallos={partida.fallos}
          pistasUsadas={partida.pistasUsadas}
          fallados={partida.fallados}
          abandonada={partida.abandonada}
          {resultado}
          {reto}
          {retoSuperado}
          alElegirOtraPrueba={elegirOtraPrueba}
        />
      {:else}
        {#if pista}
          <div
            class="pista"
            bind:this={pistaAbierta}
            role="group"
            tabindex="-1"
            aria-label="Pista: elige el nombre del elemento iluminado"
          >
            <p class:fallo={pista.escrito !== null}>
              {pista.escrito !== null ? `Escribiste: ${pista.escrito}. ¿Cuál es?` : '¿Cuál es?'}
            </p>
            {#each pista.opciones as opcion (opcion.id)}
              <button type="button" onclick={() => elegirOpcionDePista(opcion.id)}>{opcion.nombreMostrado}</button>
            {/each}
          </div>
        {:else if repaso}
          <p class="pregunta">{escribeNombre ? 'Repaso: fíjate en dónde están' : 'Repaso: toca cada nombre'}</p>
        {:else if escribeNombre && !correccion}
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
          <p class="pregunta">
            {#if !correccion}{partida.preguntado?.nombreMostrado}{/if}
          </p>
        {/if}
        <PuntuacionYTiempo puntuacion={partida.puntuacion} tiempo={tiempoJugado(partida, ahora)} {aBatir} />
        <p class="pendientes">{partida.pendientes} / {totalElementos}</p>
        <button type="button" class="abandonar" class:confirmando={confirmandoAbandono} onclick={pulsarAbandonar}>
          {confirmandoAbandono ? '¿Seguro? Abandonar' : 'Abandonar'}
        </button>
      {/if}
    </header>

    {#if respuesta?.acierto && !partida.terminada && !pista}
      <p class="respuesta">Correcto: {respuesta.correcto.nombreMostrado}</p>
    {/if}

    <Mapa
      contornos={contornosDelTipo}
      {contexto}
      acertados={partida.acertados}
      tocado={correccion && !escribeNombre ? correccion.elegido.id : null}
      correcto={correccion?.correcto.id ?? null}
      preguntado={correccion ? null : (partida.preguntado?.id ?? null)}
      iluminados={escribeNombre
        ? repaso
          ? rotulados
          : [(correccion?.correcto ?? partida.preguntado)?.id].filter((id) => id !== undefined)
        : []}
      {rotulados}
      fallados={partida.terminada ? partida.fallados.map((elemento) => elemento.id) : []}
      alElegir={elegir}
      {nombreDe}
    />

    {#if correccion}
      <div class="correccion" class:conPista={!correccionTrasFallo(correccion)} role="status">
        <p>
          {#if !escribeNombre}
            Tocaste {correccion.elegido.nombreMostrado} · {correccion.correcto.nombreMostrado} está aquí
          {:else if correccionTrasFallo(correccion)}
            Elegiste {correccion.elegido.nombreMostrado} · Era {correccion.correcto.nombreMostrado}
          {:else}
            Con pista: {correccion.correcto.nombreMostrado}
          {/if}
        </p>
        <div class="barra" style:animation-duration="{correccion.duracion}ms"></div>
      </div>
    {:else if repaso && escribeNombre}
      <div class="repaso" role="status">
        <div class="barra" style:animation-duration="{DURACION_REPASO_UBICACION_NOMBRE}ms"></div>
      </div>
    {/if}
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

  p.pregunta {
    min-height: 1lh;
  }

  form.pregunta {
    display: flex;
    gap: 0.5rem;
  }

  form.pregunta input,
  form.pregunta button,
  .pista button {
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

  .pista {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
  }

  .pista p {
    margin: 0;
    font-size: 1.125rem;
  }

  .pista p.fallo {
    color: #b45309;
  }

  .pendientes {
    margin: 0;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }

  .abandonar {
    font: inherit;
    padding: 0.25rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    color: #6b7280;
    cursor: pointer;
  }

  .abandonar.confirmando {
    border-color: #b45309;
    color: #b45309;
  }

  .respuesta {
    margin: 0.5rem 0;
    color: #2f7a4a;
    min-height: 1.5rem;
  }

  .correccion,
  .repaso {
    position: sticky;
    bottom: 0;
    padding: 0.5rem;
    border-top: 1px solid #d1d5db;
    background: #f7f7f5;
  }

  .correccion p {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    color: #b45309;
  }

  .correccion.conPista p {
    color: #2f7a4a;
  }

  .correccion.conPista .barra,
  .repaso .barra {
    background: #2f7a4a;
  }

  .barra {
    height: 0.375rem;
    border-radius: 0.1875rem;
    background: #b45309;
    transform-origin: left;
    animation-name: vaciar;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  @keyframes vaciar {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
</style>
