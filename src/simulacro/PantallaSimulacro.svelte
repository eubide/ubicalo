<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { onMount, untrack } from 'svelte'
  import { catalogo, catalogoDelMapa, contextoDe, contornos, etiquetaDeClase, type Elemento } from '../catalogo/catalogo'
  import { formaDe, idDeAltura } from '../catalogo/relieve'
  import Mapa from '../mapa/Mapa.svelte'
  import { formatearTiempo } from '../pantallas/tiempo'
  import { llevaTilde } from '../pantallas/tilde'
  import {
    blancosDe,
    corregir,
    entregar,
    escribir,
    notaDe,
    ponerAlDia,
    sobreDiez,
    tiempoRestante,
    type ElementoCorregido,
    type Simulacro,
  } from './simulacro'

  interface Props {
    inicial: Simulacro
    contexto: FeatureCollection
    hayTanda: boolean
    alGuardar: (simulacro: Simulacro) => void
    alEntregar: (corregidos: ElementoCorregido[]) => void
    alEmpezarTanda: () => void
    alSalir: (entregado: boolean) => void
  }

  let { inicial, contexto, hayTanda, alGuardar, alEntregar, alEmpezarTanda, alSalir }: Props = $props()

  const alEmpezar = untrack(() => inicial)
  const elementos = catalogo(alEmpezar.alcance)
  const formas = catalogoDelMapa(alEmpezar.alcance)
  const primeraVez = alEmpezar.limite === null
  const ESPERA_CONFIRMAR_SALIDA = 3_000
  const QUEDA_POCO = 2 * 60 * 1000

  let simulacro = $state.raw(alEmpezar)
  let ahora = $state(Date.now())
  let elegida = $state<string | null>(null)
  let texto = $state('')
  let metros = $state('')
  let avisandoDeBlancos = $state(false)
  let confirmandoSalida = $state(false)
  let campoDeTexto = $state<HTMLInputElement | null>(null)

  const corregidos = $derived(corregir(simulacro, elementos))
  const nota = $derived(corregidos && notaDe(corregidos))
  const blancos = $derived(blancosDe(simulacro, elementos))
  const restante = $derived(tiempoRestante(simulacro, ahora))
  const alturaDeLaElegida = $derived(elegida !== null && elementos.some((elemento) => elemento.id === idDeAltura(elegida!)))

  function rotuloDe(forma: string, textoDe: (id: string) => string | undefined): string {
    return [textoDe(forma), textoDe(idDeAltura(forma))].filter((parte) => parte !== undefined).join(' · ')
  }

  const nombres = $derived(
    formas
      .map(({ id }) => ({
        id,
        texto: corregidos
          ? rotuloDe(id, (deQuien) => elementos.find((elemento) => elemento.id === deQuien)?.nombreMostrado)
          : rotuloDe(id, (deQuien) => simulacro.respuestas[deQuien]),
      }))
      .filter(({ texto }) => texto !== ''),
  )

  function formasCon(resultado: ElementoCorregido['resultado']): string[] {
    return (corregidos ?? []).filter((corregido) => corregido.resultado === resultado).map(({ elemento }) => formaDe(elemento.id))
  }

  const fallados = $derived(formasCon('fallo'))
  // Un Pico con su Altura en blanco no está acertado; si la falló, el rojo ya gana al verde en las Señales.
  const acertados = $derived(formasCon('acierto').filter((forma) => !formasCon('blanco').includes(forma)))

  $effect(() => {
    if (corregidos) return
    const intervalo = setInterval(() => {
      ahora = Date.now()
      actualizar(ponerAlDia(simulacro, ahora))
    }, 500)
    return () => clearInterval(intervalo)
  })

  // Un Simulacro guardado ya entregado es una entrega que se cortó antes de anotarse.
  onMount(() => {
    const yaCorregido = corregir(alEmpezar, elementos)
    if (yaCorregido) alEntregar(yaCorregido)
  })

  $effect(() => {
    campoDeTexto?.focus()
  })

  $effect(() => {
    if (!confirmandoSalida) return
    const espera = setTimeout(() => (confirmandoSalida = false), ESPERA_CONFIRMAR_SALIDA)
    return () => clearTimeout(espera)
  })

  function actualizar(siguiente: Simulacro) {
    if (siguiente === simulacro) return
    simulacro = siguiente
    alGuardar(siguiente)
    const corregido = corregir(siguiente, elementos)
    if (!corregido) return
    elegida = null
    avisandoDeBlancos = false
    alEntregar(corregido)
  }

  function elegir(id: string) {
    if (corregidos) return
    elegida = id
    texto = simulacro.respuestas[id] ?? ''
    metros = simulacro.respuestas[idDeAltura(id)] ?? ''
    avisandoDeBlancos = false
  }

  // Se guarda según se teclea: tocar otra forma, entregar o quedarse sin tiempo no pierde lo que había en el campo.
  function escribirLoElegido() {
    if (elegida === null) return
    const conNombre = escribir(simulacro, elegida, texto, Date.now())
    actualizar(alturaDeLaElegida ? escribir(conNombre, idDeAltura(elegida), metros, Date.now()) : conNombre)
  }

  function cerrarElCampo(evento: SubmitEvent) {
    evento.preventDefault()
    escribirLoElegido()
    elegida = null
  }

  function pulsarEntregar() {
    if (blancos.length > 0 && !avisandoDeBlancos) {
      elegida = null
      avisandoDeBlancos = true
      return
    }
    actualizar(entregar(simulacro, Date.now()))
  }

  function pulsarSalir() {
    if (!confirmandoSalida) {
      confirmandoSalida = true
      return
    }
    alSalir(false)
  }

  function claseDe(id: string): string {
    const clase = formas.find((forma) => forma.id === id)?.clase
    return (clase && etiquetaDeClase[clase]) ?? 'Escribir aquí'
  }

  function motivoDe(corregido: Extract<ElementoCorregido, { resultado: 'fallo' }>): string {
    const { tipo, confundidoCon } = corregido.fallo
    if (tipo === 'tilde') return llevaTilde(corregido.escrito) ? 'revisa la tilde' : 'te falta la tilde'
    if (tipo === 'errata') return 'casi'
    const otro = elementos.find((elemento) => elemento.id === confundidoCon)
    return otro ? `eso es ${nombreOficial(otro)}` : ''
  }

  function nombreOficial(elemento: Elemento): string {
    return elemento.rotulo ?? elemento.nombreMostrado
  }
</script>

<header>
  {#if corregidos && nota}
    <section class="fin">
      {#if primeraVez}
        <p class="titulo">Ya te sabes {nota.aciertos}. Te faltan {nota.total - nota.aciertos}.</p>
      {:else}
        <p class="titulo">{sobreDiez(nota)} sobre 10 · {nota.aciertos} de {nota.total}</p>
      {/if}
      <p class="deUbicalo">Sobre los {nota.total} de Ubícalo; tu profesor puede preguntar otros.</p>
      <div class="acciones">
        {#if hayTanda}
          <button type="button" class="principal" onclick={alEmpezarTanda}>Tanda con lo fallado</button>
        {/if}
        <button type="button" class:principal={!hayTanda} onclick={() => alSalir(true)}>Volver</button>
      </div>
    </section>
  {:else}
    <p class="titulo">{primeraVez ? '¿Qué te sabes ya?' : 'Simulacro'}</p>
    {#if avisandoDeBlancos}
      <div class="blancos" role="alert">
        <p>
          {blancos.length === 1 ? 'Te queda 1 en blanco' : `Te quedan ${blancos.length} en blanco`}. En tu examen un fallo no
          resta: escribe algo.
        </p>
        <button type="button" class="principal" onclick={() => (avisandoDeBlancos = false)}>Seguir escribiendo</button>
        <button type="button" onclick={pulsarEntregar}>Entregar de todos modos</button>
      </div>
    {:else if elegida !== null}
      <form onsubmit={cerrarElCampo}>
        <span class="enunciado">{claseDe(elegida)}</span>
        <input
          bind:this={campoDeTexto}
          bind:value={texto}
          oninput={escribirLoElegido}
          aria-label="Nombre de lo que has tocado"
          placeholder="¿Cómo se llama?"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
        {#if alturaDeLaElegida}
          <input
            bind:value={metros}
            oninput={escribirLoElegido}
            aria-label="Altura en metros"
            placeholder="Metros"
            inputmode="numeric"
            autocomplete="off"
          />
        {/if}
        <button type="submit">Hecho</button>
      </form>
    {:else}
      <p class="instruccion">Toca una forma y escribe su nombre. Puedes volver a tocarla para cambiarlo.</p>
    {/if}
    <div class="estado">
      {#if restante !== null}<span class="reloj" class:apurado={restante < QUEDA_POCO}>{formatearTiempo(restante)}</span>{/if}
      <span>{elementos.length - blancos.length} / {elementos.length}</span>
      <button type="button" class="entregar" onclick={pulsarEntregar}>Entregar</button>
      <button type="button" class="salir" class:confirmando={confirmandoSalida} onclick={pulsarSalir}>
        {confirmandoSalida ? '¿Seguro? Se pierde lo escrito' : 'Salir'}
      </button>
    </div>
  {/if}
</header>

<Mapa
  contornos={contornos(alEmpezar.alcance)}
  contextoDeRelieve={contextoDe(alEmpezar.alcance)}
  {contexto}
  frontera={corregidos ? [] : formas.map((forma) => forma.id)}
  tentativa={elegida}
  {acertados}
  {fallados}
  preguntado={corregidos ? null : (elegida ?? 'ninguna')}
  {nombres}
  alElegir={elegir}
  nombreDe={claseDe}
/>

{#if corregidos}
  {@const fallos = corregidos.filter((corregido) => corregido.resultado === 'fallo')}
  {@const enBlanco = corregidos.filter((corregido) => corregido.resultado === 'blanco')}
  {#if fallos.length > 0}
    <section class="listado">
      <h2>Lo que escribiste y no era</h2>
      <ul>
        {#each fallos as corregido (corregido.elemento.id)}
          {@const motivo = motivoDe(corregido)}
          <li>
            <span class="escrito">{corregido.escrito}</span> · {nombreOficial(corregido.elemento)}
            {#if motivo}<span class="motivo">({motivo})</span>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
  {#if enBlanco.length > 0}
    <section class="listado">
      <h2>Lo que dejaste en blanco</h2>
      <ul class="blancosEntregados">
        {#each enBlanco as corregido (corregido.elemento.id)}
          <li>{nombreOficial(corregido.elemento)}</li>
        {/each}
      </ul>
    </section>
  {/if}
{/if}

<style>
  header {
    margin-bottom: 0.5rem;
  }

  .titulo {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
  }

  .instruccion,
  .deUbicalo {
    margin: 0 0 0.5rem;
    color: #4b5563;
  }

  form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .enunciado {
    flex-basis: 100%;
    font-size: 0.875rem;
    color: #6b7280;
  }

  input {
    flex: 1 1 8rem;
    min-width: 0;
    font: inherit;
    font-size: 1rem;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
  }

  .estado,
  .acciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-variant-numeric: tabular-nums;
  }

  .reloj {
    font-weight: 600;
  }

  .reloj.apurado {
    color: #b45309;
  }

  .entregar {
    margin-left: auto;
  }

  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
  }

  button.principal,
  .entregar {
    border-color: #2f7a4a;
    color: #2f7a4a;
    font-weight: 600;
  }

  .salir.confirmando {
    border-color: #b45309;
    color: #b45309;
  }

  .blancos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding: 0.75rem;
    border: 1px solid #b45309;
    border-radius: 0.5rem;
  }

  .blancos p {
    flex-basis: 100%;
    margin: 0;
  }

  .listado h2 {
    font-size: 1rem;
    margin: 1rem 0 0.375rem;
  }

  .listado ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .escrito {
    color: #9b1c1c;
    text-decoration: line-through;
  }

  .motivo {
    color: #6b7280;
  }

  .blancosEntregados {
    columns: 2;
  }
</style>
