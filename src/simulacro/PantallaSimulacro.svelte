<script lang="ts">
  import type { FeatureCollection } from 'geojson'
  import { onMount, untrack } from 'svelte'
  import { catalogo, catalogoDelMapa, contextoDe, contornos, etiquetaDeClase, type Alcance, type Elemento } from '../catalogo/catalogo'
  import { formaDe, idDeAltura } from '../catalogo/relieve'
  import Mapa from '../mapa/Mapa.svelte'
  import { formatearTiempo } from '../pantallas/tiempo'
  import { llevaTilde } from '../pantallas/tilde'
  import { etiquetaDeAlcance } from '../prueba/prueba'
  import {
    blancosDe,
    corregir,
    entregar,
    escribir,
    notaDe,
    ponerAlDia,
    sobreDiez,
    tiempoRestante,
    verMapa,
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
  const examen = alEmpezar.alcances.map((alcance) => ({ alcance, elementos: catalogo(alcance) }))
  const total = examen.reduce((suma, { elementos }) => suma + elementos.length, 0)
  const primeraVez = alEmpezar.limite === null
  // Comunidades y Provincias no tienen Clase que enseñar sobre el campo de texto.
  const LO_QUE_SE_ESCRIBE: Partial<Record<Alcance, string>> = { comunidades: 'Comunidad autónoma', provincias: 'Provincia' }
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

  const enVista = $derived(simulacro.enVista)
  const elementos = $derived(examen.find(({ alcance }) => alcance === enVista)!.elementos)
  const formas = $derived(catalogoDelMapa(enVista))
  const escritas = $derived(simulacro.respuestas[enVista] ?? {})
  const todosLosCorregidos = $derived(corregir(simulacro, examen))
  const corregidos = $derived(todosLosCorregidos?.filter(({ alcance }) => alcance === enVista) ?? null)
  const nota = $derived(todosLosCorregidos && notaDe(todosLosCorregidos))
  const blancosPorMapa = $derived(blancosDe(simulacro, examen))
  const enBlanco = $derived(blancosPorMapa.reduce((suma, { blancos }) => suma + blancos.length, 0))
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
          : rotuloDe(id, (deQuien) => escritas[deQuien]),
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
    const yaCorregido = corregir(alEmpezar, examen)
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
    const yaEntregado = simulacro.entregadoEn !== null
    simulacro = siguiente
    // Entregado ya no se guarda: cambiar de mapa para ver el corregido no lo devuelve a «en curso».
    if (yaEntregado) return
    alGuardar(siguiente)
    const corregido = corregir(siguiente, examen)
    if (!corregido) return
    elegida = null
    avisandoDeBlancos = false
    alEntregar(corregido)
  }

  function elegir(id: string) {
    if (corregidos) return
    elegida = id
    texto = escritas[id] ?? ''
    metros = escritas[idDeAltura(id)] ?? ''
    avisandoDeBlancos = false
  }

  // Se guarda según se teclea: tocar otra forma, entregar o quedarse sin tiempo no pierde lo que había en el campo.
  function escribirLoElegido() {
    if (elegida === null) return
    const conNombre = escribir(simulacro, enVista, elegida, texto, Date.now())
    actualizar(alturaDeLaElegida ? escribir(conNombre, enVista, idDeAltura(elegida), metros, Date.now()) : conNombre)
  }

  function cambiarDeMapa(alcance: Alcance) {
    elegida = null
    actualizar(verMapa(simulacro, alcance))
  }

  function escritosEn(alcance: Alcance): string {
    const deEseMapa = examen.find((catalogoDeExamen) => catalogoDeExamen.alcance === alcance)!.elementos.length
    const enBlanco = blancosPorMapa.find((porMapa) => porMapa.alcance === alcance)!.blancos.length
    return `${deEseMapa - enBlanco} / ${deEseMapa}`
  }

  function avisoDeBlancos(): string {
    const cuantos = enBlanco === 1 ? 'Te queda 1 en blanco' : `Te quedan ${enBlanco} en blanco`
    if (examen.length === 1) return `${cuantos}.`
    const porMapa = blancosPorMapa.map(({ alcance, blancos }) => `${blancos.length} en ${etiquetaDeAlcance[alcance]}`)
    return `${cuantos}: ${porMapa.join(' y ')}.`
  }

  function cerrarElCampo(evento: SubmitEvent) {
    evento.preventDefault()
    escribirLoElegido()
    elegida = null
  }

  function pulsarEntregar() {
    if (enBlanco > 0 && !avisandoDeBlancos) {
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
    const forma = formas.find((candidata) => candidata.id === id)
    if (forma?.ciudadAutonoma) return 'Ciudad autónoma'
    return (forma?.clase && etiquetaDeClase[forma.clase]) ?? LO_QUE_SE_ESCRIBE[enVista] ?? 'Escribir aquí'
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
        <p>{avisoDeBlancos()} En tu examen un fallo no resta: escribe algo.</p>
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
      <span>{total - enBlanco} / {total}</span>
      <button type="button" class="entregar" onclick={pulsarEntregar}>Entregar</button>
      <button type="button" class="salir" class:confirmando={confirmandoSalida} onclick={pulsarSalir}>
        {confirmandoSalida ? '¿Seguro? Se pierde lo escrito' : 'Salir'}
      </button>
    </div>
  {/if}
  {#if examen.length > 1}
    <div class="mapas" role="group" aria-label="Mapa que se ve">
      {#each examen as { alcance } (alcance)}
        <button type="button" aria-pressed={alcance === enVista} onclick={() => cambiarDeMapa(alcance)}>
          {etiquetaDeAlcance[alcance]}
          {#if !corregidos}<span class="escritos">{escritosEn(alcance)}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
</header>

<!-- Se monta de nuevo al cambiar de mapa: una forma tocada y sin confirmar no puede pasar de Aragón a Albacete,
     que comparten id. -->
{#key enVista}
  <Mapa
    contornos={contornos(enVista)}
    contextoDeRelieve={contextoDe(enVista)}
    {contexto}
    frontera={corregidos ? [] : formas.map((forma) => forma.id)}
    tentativa={elegida}
    {acertados}
    {fallados}
    preguntado={corregidos ? null : (elegida ?? 'ninguna')}
    {nombres}
    foco={elegida}
    alElegir={elegir}
    nombreDe={claseDe}
  />
{/key}

{#if corregidos}
  {@const fallos = corregidos.filter((corregido) => corregido.resultado === 'fallo')}
  {@const sinEscribir = corregidos.filter((corregido) => corregido.resultado === 'blanco')}
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
  {#if sinEscribir.length > 0}
    <section class="listado">
      <h2>Lo que dejaste en blanco</h2>
      <ul class="blancosEntregados">
        {#each sinEscribir as corregido (corregido.elemento.id)}
          <li>{nombreOficial(corregido.elemento)}</li>
        {/each}
      </ul>
    </section>
  {/if}
  <p class="deUbicalo">Sobre los {corregidos.length} de Ubícalo; tu profesor puede preguntar otros.</p>
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

  .instruccion {
    margin: 0 0 0.5rem;
    color: #4b5563;
  }

  .deUbicalo {
    margin: 1.5rem 0 0;
    font-size: 0.8125rem;
    color: #6b7280;
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

  .mapas {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .mapas button {
    flex: 1;
  }

  .mapas button[aria-pressed='true'] {
    border-color: #1d4ed8;
    color: #1d4ed8;
    font-weight: 600;
  }

  .escritos {
    display: block;
    font-size: 0.8125rem;
    font-weight: 400;
    color: #6b7280;
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
