<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { catalogo, catalogoDelMapa, contextoDe, contornos, type Elemento } from './catalogo/catalogo'
  import {
    esIdDeAltura,
    etiquetaDeClase,
    idDeAltura,
    nombreDePapel,
    PAPELES,
    textoDeAltura,
    type ContextoDeRelieve,
  } from './catalogo/relieve'
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
    elegirPregunta,
    iniciarPartida,
    marcarEnRepaso,
    responder,
    responderConTexto,
    respuestaDe,
    resumirPartida,
    tiempoJugado,
    type Partida,
  } from './partida/partida'
  import { indicacionDeRespuesta, pruebaDe, type Prueba } from './prueba/prueba'
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
  let elementosDelMapa = $state.raw<Elemento[]>([])
  let totalElementos = $state(0)
  let contornosDelTipo = $state.raw<Feature<Geometry>[]>([])
  let contextoDelTipo = $state.raw<ContextoDeRelieve | null>(null)
  let ahora = $state(Date.now())
  let texto = $state('')
  let simulacroActivo = $state<string | null>(null)
  let mostrarCorrecto = $state(false)
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
  const esSimulacro = $derived(prueba?.tipo === 'simulacro')
  const esUnidades = $derived(prueba?.tipo === 'unidades')
  // Tipos en los que el mapa arranca mudo y solo se dibuja lo ya Acertado o Desbloqueado.
  const conCascada = $derived(esSimulacro || esUnidades)
  // Solo lo ya visible (Acertado o Desbloqueado); el resto del mapa mudo sigue sin dibujarse.
  const contornosVisibles = $derived(
    conCascada && partida
      ? contornosDelTipo.filter(
          (contorno) => partida!.acertados.includes(String(contorno.id)) || partida!.desbloqueados.includes(String(contorno.id)),
        )
      : contornosDelTipo,
  )
  // Todo lo que depende de un elemento, directa o indirectamente, siguiendo desbloqueaCon al revés.
  function descendientesDe(id: string): Elemento[] {
    const directos = elementosDelTipo.filter((elemento) => (elemento.desbloqueaCon ?? []).includes(id))
    return directos.flatMap((hijo) => [hijo, ...descendientesDe(hijo.id)])
  }

  // En el Simulacro, una rama solo se pinta de verde cuando ella y todo lo que cuelga de ella están
  // Acertados. Todo lo demás visible y sin terminar (nunca tocado o respondido a medias) se ve igual,
  // en amarillo, para que "queda algo por hacer aquí" tenga siempre el mismo aspecto.
  const acertadosVisibles = $derived.by(() => {
    if (!esSimulacro || !partida) return partida?.acertados ?? []
    const acertadosSet = new Set(partida.acertados)
    return partida.acertados.filter((id) => descendientesDe(id).every((hijo) => acertadosSet.has(hijo.id)))
  })
  // Este elemento ya está Acertado, pero algo de lo que cuelga de él todavía no.
  const parcialesVisibles = $derived(
    esSimulacro && partida ? partida.acertados.filter((id) => !acertadosVisibles.includes(id) && !esIdDeAltura(id)) : [],
  )
  // Visible pero aún no Acertado: no se ha respondido nada de esto todavía.
  const porResponderVisibles = $derived(
    esSimulacro && partida
      ? contornosVisibles.map((contorno) => String(contorno.id)).filter((id) => !partida!.acertados.includes(id))
      : [],
  )
  const respuesta = $derived(partida?.ultimaRespuesta)
  const pista = $derived(partida?.pista ?? null)
  const correccion = $derived(partida?.correccion ?? null)
  const repaso = $derived(partida?.repaso ?? null)
  const rotulos = $derived(
    repaso?.elementos
      .filter((elemento) => !repaso.marcados.includes(elemento.id))
      .map((elemento) => ({ id: respuestaDe(elemento), texto: elemento.rotulo ?? elemento.nombreMostrado })) ?? [],
  )

  // En el Simulacro la cifra no se muestra hasta acertarla; antes, si el pico ya está nombrado,
  // se avisa de que le falta la altura, para que "por qué sigue en naranja" tenga respuesta a la vista.
  const alturas = $derived(
    elementosDelMapa.flatMap((elemento) => {
      if (elemento.altura === undefined) return []
      if (esSimulacro && !(partida?.acertados.includes(idDeAltura(elemento.id)) ?? false)) {
        const picoAcertado = partida?.acertados.includes(elemento.id) ?? false
        return picoAcertado ? [{ id: elemento.id, texto: 'Falta la altura' }] : []
      }
      return [{ id: elemento.id, texto: textoDeAltura(elemento.altura) }]
    }),
  )

  const enunciado = $derived.by(() => {
    const preguntado = partida?.preguntado
    if (!preguntado || correccion) return null
    return preguntado.pregunta ?? (preguntado.clase && etiquetaDeClase[preguntado.clase]) ?? null
  })

  // Qué se está preguntando ahora y cuánto queda de cada papel: el alumno nunca tiene que recordar en
  // qué punto de la cascada está.
  const avanceDePapeles = $derived.by(() => {
    if (!esUnidades || !partida) return []
    const acertados = new Set(partida.acertados)
    return PAPELES.map((papel) => {
      const delPapel = elementosDelTipo.filter((elemento) => elemento.papel === papel)
      return {
        papel,
        nombre: nombreDePapel[papel],
        hechos: delPapel.filter((elemento) => acertados.has(elemento.id)).length,
        total: delPapel.length,
        activo: papel === partida!.preguntado?.papel,
      }
    }).filter(({ total }) => total > 0)
  })

  const preguntaDeAltura = $derived((simulacroActivo && esIdDeAltura(simulacroActivo)) ?? false)
  // La forma que se está respondiendo ahora mismo, para remarcarla; una Altura remarca su propio pico.
  const activoEnSimulacro = $derived(
    simulacroActivo ? (esIdDeAltura(simulacroActivo) ? simulacroActivo.slice(idDeAltura('').length) : simulacroActivo) : null,
  )

  const DURACION_RESPUESTA_CORRECTA = 3_000

  $effect(() => {
    if (!respuesta?.acierto) {
      mostrarCorrecto = false
      return
    }
    mostrarCorrecto = true
    const espera = setTimeout(() => (mostrarCorrecto = false), DURACION_RESPUESTA_CORRECTA)
    return () => clearTimeout(espera)
  })

  function nombreDeLaRespuesta(elemento: Elemento): string {
    return elemento.respuesta === undefined ? '' : nombreDe(elemento.respuesta)
  }

  const iluminados = $derived.by(() => {
    if (!escribeNombre) return []
    if (repaso) return rotulos.map((rotulo) => rotulo.id)
    // El alumno elige qué tocar; solo se ilumina la respuesta correcta mientras se ve la Corrección.
    if (esSimulacro) return correccion ? [correccion.correcto.id] : []
    const id = (correccion?.correcto ?? partida?.preguntado)?.id
    return id === undefined ? [] : [id]
  })

  function cerrarAlCabo(duracion: number, cerrar: (partida: Partida) => Partida) {
    const espera = setTimeout(() => {
      if (partida) partida = cerrar(partida)
    }, duracion)
    return () => clearTimeout(espera)
  }

  $effect(() => {
    if (!correccion) return
    confirmandoAbandono = false
    return cerrarAlCabo(correccion.duracion, (partidaEnCorreccion) => {
      simulacroActivo = null
      return cerrarCorreccion(partidaEnCorreccion)
    })
  })

  $effect(() => {
    if (!repaso || !escribeNombre) return
    return cerrarAlCabo(DURACION_REPASO_UBICACION_NOMBRE, cerrarRepaso)
  })

  function empezar(pedida: Prueba) {
    const elegida = pruebaDe(pedida.tipo, pedida.modo)
    const elementos = catalogo(elegida.tipo)
    prueba = elegida
    resultado = null
    reto = null
    retoSuperado = null
    aBatir =
      retoRecibido?.prueba.tipo === elegida.tipo && retoRecibido.prueba.modo === elegida.modo ? retoRecibido : null
    elementosDelTipo = elementos
    elementosDelMapa = catalogoDelMapa(elegida.tipo)
    totalElementos = elementos.length
    contornosDelTipo = contornos(elegida.tipo)
    contextoDelTipo = contextoDe(elegida.tipo)
    ahora = Date.now()
    texto = ''
    simulacroActivo = null
    partida = iniciarPartida(elegida, elementos, Math.random, Date.now, elementosDelMapa)
  }

  function nombreDe(id: string): string {
    return elementosDelMapa.find((elemento) => elemento.id === id)?.nombreMostrado ?? ''
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

  // Tocar un elemento en el Simulacro lo elige como pregunta; responderlo es cosa del formulario de texto.
  // Un pico ya acertado con su Altura pendiente redirige al toque hacia esa pregunta.
  function elegirEnSimulacro(id: string) {
    if (!partida) return
    const objetivoAltura = idDeAltura(id)
    const objetivo = partida.desbloqueados.includes(objetivoAltura) ? objetivoAltura : id
    const elegida = elegirPregunta(partida, objetivo)
    if (elegida === partida) return
    partida = elegida
    simulacroActivo = objetivo
  }

  $effect(() => {
    if (!confirmandoAbandono) return
    const espera = setTimeout(() => (confirmandoAbandono = false), ESPERA_CONFIRMAR_ABANDONO)
    return () => clearTimeout(espera)
  })

  function pulsarAbandonar() {
    if (!partida || partida.terminada || partida.correccion) return
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
    if (!partida.pista && !partida.correccion) simulacroActivo = null
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
        {#if avanceDePapeles.length > 0}
          <ul class="papeles" aria-label="Avance por papel respecto a la Meseta">
            {#each avanceDePapeles as { papel, nombre, hechos, total, activo } (papel)}
              <li class:activo class:completo={hechos === total} aria-current={activo ? 'true' : undefined}>
                <span class="muestra" style="background: var(--{papel})" aria-hidden="true"></span>
                {nombre}
                <span class="cuenta">{hechos}/{total}</span>
              </li>
            {/each}
          </ul>
        {/if}
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
        {:else if escribeNombre && !correccion && (!esSimulacro || simulacroActivo)}
          <form class="pregunta" onsubmit={enviarTexto}>
            {#if enunciado}
              <span class="enunciado">{enunciado}</span>
            {/if}
            <input
              bind:this={campoDeTexto}
              bind:value={texto}
              aria-label={enunciado ?? 'Nombre del elemento iluminado'}
              placeholder={preguntaDeAltura ? 'Metros' : ((prueba && indicacionDeRespuesta[prueba.tipo]) ?? '¿Cómo se llama?')}
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
            <button type="submit">Responder</button>
          </form>
        {:else if esSimulacro && !correccion}
          <p class="pregunta">Toca una forma para responderla</p>
        {:else}
          <p class="pregunta">
            {#if !correccion}
              {#if enunciado}<span class="enunciado">{enunciado}</span>{/if}
              {partida.preguntado?.nombreMostrado}
            {/if}
          </p>
        {/if}
        <PuntuacionYTiempo puntuacion={partida.puntuacion} tiempo={tiempoJugado(partida, ahora)} {aBatir} />
        <p class="pendientes">{partida.pendientes} / {totalElementos}</p>
        <button type="button" class="abandonar" class:confirmando={confirmandoAbandono} onclick={pulsarAbandonar}>
          {confirmandoAbandono ? '¿Seguro? Abandonar' : 'Abandonar'}
        </button>
      {/if}
    </header>

    <p class="respuesta">
      {#if mostrarCorrecto && respuesta?.acierto && !partida.terminada && !pista}
        Correcto: {respuesta.correcto.nombreMostrado}
      {/if}
    </p>

    <Mapa
      contornos={contornosVisibles}
      contextoDeRelieve={contextoDelTipo}
      rampa={esUnidades}
      porResponder={porResponderVisibles}
      parcial={parcialesVisibles}
      activo={esSimulacro ? activoEnSimulacro : null}
      {contexto}
      acertados={acertadosVisibles}
      tocado={correccion && !escribeNombre && correccionTrasFallo(correccion) ? correccion.elegido.id : null}
      correcto={correccion ? respuestaDe(correccion.correcto) : null}
      preguntado={correccion ? null : (partida.preguntado?.id ?? null)}
      {iluminados}
      destacados={!correccion && partida.preguntado?.destacar ? [partida.preguntado.id] : []}
      pistaDeArea={partida.pistaDeArea ?? []}
      {rotulos}
      {alturas}
      fallados={partida.terminada ? partida.fallados.map((elemento) => elemento.id) : []}
      alElegir={esSimulacro ? elegirEnSimulacro : elegir}
      {nombreDe}
    />

    {#if correccion}
      <div class="correccion" class:conPista={!correccionTrasFallo(correccion)} role="status">
        <p>
          {#if !correccionTrasFallo(correccion)}
            Con pista: {correccion.correcto.nombreMostrado}
          {:else if !escribeNombre && correccion.correcto.respuesta}
            Tocaste {correccion.elegido.nombreMostrado} · {correccion.correcto.nombreMostrado} → {nombreDeLaRespuesta(correccion.correcto)}
          {:else if !escribeNombre}
            Tocaste {correccion.elegido.nombreMostrado} · {correccion.correcto.nombreMostrado} está aquí
          {:else}
            Elegiste {correccion.elegido.nombreMostrado} · Era {correccion.correcto.nombreMostrado}
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

  .papeles {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .papeles li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
  }

  .papeles li.activo {
    border-color: #1d4ed8;
    color: #1f2933;
    font-weight: 600;
  }

  .papeles li.completo {
    opacity: 0.5;
  }

  .papeles .muestra {
    width: 1rem;
    height: 0.7rem;
    border: 1px solid #8b8578;
    border-radius: 0.15rem;
  }

  .papeles .cuenta {
    font-variant-numeric: tabular-nums;
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
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .pregunta .enunciado {
    display: block;
    font-size: 0.875rem;
    font-weight: 400;
    color: #6b7280;
  }

  form.pregunta .enunciado {
    flex-basis: 100%;
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
