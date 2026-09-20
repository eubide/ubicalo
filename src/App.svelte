<script lang="ts">
  import type { Feature, FeatureCollection, Geometry } from 'geojson'
  import { catalogo, catalogoDelMapa, contextoDe, contornos, etiquetaDeClase, type ContextoGeografico, type Elemento } from './catalogo/catalogo'
  import { esIdDeAltura, formaDe, idDeAltura, nombreDePapel, PAPELES, picoDeAltura, textoDeAltura } from './catalogo/relieve'
  import { esDeHidrografia } from './catalogo/hidrografia'
  import contextoGeografico from './datos/contexto-geografico.json'
  import Mapa from './mapa/Mapa.svelte'
  import FinDePartida from './pantallas/FinDePartida.svelte'
  import FinDeTanda from './pantallas/FinDeTanda.svelte'
  import PuntuacionYTiempo from './pantallas/PuntuacionYTiempo.svelte'
  import { llevaTilde } from './pantallas/tilde'
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
  import { alcancesDeExamen, crearDominio, diaLocal, familiaDeEnlace } from './dominio/dominio'
  import { anotacionesDe, cierreDe, componerTanda, recuentoDe, type Tanda } from './dominio/tanda'
  import {
    abandonar,
    cerrarCorreccion,
    cerrarRepaso,
    correccionTrasFallo,
    DURACION_REPASO_UBICACION_NOMBRE,
    elegirOpcion,
    elegirPregunta,
    iniciarPartida,
    iniciarTanda,
    marcarEnRepaso,
    responder,
    responderConTexto,
    respuestaDe,
    resumirPartida,
    tiempoJugado,
    type Partida,
    type TipoDeFallo,
  } from './partida/partida'
  import { enCascada, pruebaDe, seEligeLaPregunta, type Familia, type Prueba } from './prueba/prueba'
  import SeleccionPrueba from './seleccion/SeleccionPrueba.svelte'
  import PantallaSimulacro from './simulacro/PantallaSimulacro.svelte'
  import {
    anotacionesDelSimulacro,
    DURACION_DEL_SIMULACRO,
    esLoPrincipal,
    iniciarSimulacro,
    notaDe,
    sobreDiez,
    type ElementoCorregido,
    type Simulacro,
    type SimulacroEnPortada,
  } from './simulacro/simulacro'
  import { crearSimulacros } from './simulacro/simulacros-guardados'

  const contexto = contextoGeografico as FeatureCollection

  function almacenDelNavegador(): Almacen {
    try {
      return window.localStorage ?? almacenEnMemoria()
    } catch {
      return almacenEnMemoria()
    }
  }

  const almacen = almacenDelNavegador()
  const competicion = crearCompeticion(almacen)
  function hoy(): string {
    return diaLocal(new Date())
  }

  const dominio = crearDominio(almacen, hoy)
  const propuesta = familiaDeEnlace(location.href)
  if (propuesta) dominio.proponerFamilia(propuesta)
  let familiaElegida = $state(dominio.familia())
  let soloMira = $state(false)
  let tandaPropuesta = $state.raw(proponerTanda())
  let tandaEnJuego = $state.raw<Tanda | null>(null)
  const simulacros = crearSimulacros(almacen)
  let simulacroEnCurso = $state.raw<Simulacro | null>(simulacros.enCurso())
  let tandasSeguidas = $state(0)

  function empezarSimulacro() {
    if (!familiaElegida) return
    const primeraVez = simulacros.notas(familiaElegida) === null
    const limite = primeraVez ? null : DURACION_DEL_SIMULACRO
    const simulacro = iniciarSimulacro(familiaElegida, alcancesDeExamen(familiaElegida), Date.now(), limite)
    simulacros.guardar(simulacro)
    partida = null
    tandaEnJuego = null
    simulacroEnCurso = simulacro
  }

  function entregarSimulacro(corregidos: ElementoCorregido[]) {
    if (!simulacroEnCurso) return
    const { familia, limite } = simulacroEnCurso
    for (const { alcance, id, resultado } of anotacionesDelSimulacro(corregidos)) dominio.anotar(alcance, id, resultado)
    simulacros.cerrar(familia, notaDe(corregidos), limite !== null)
    tandasSeguidas = 0
    tandaPropuesta = proponerTanda()
  }

  function salirDelSimulacro(entregado: boolean) {
    if (!entregado) simulacros.descartar()
    simulacroEnCurso = null
    tandaPropuesta = proponerTanda()
  }

  function tandaTrasElSimulacro() {
    simulacroEnCurso = null
    empezarTanda()
  }

  function simulacroDe(familia: Familia): SimulacroEnPortada {
    const notas = simulacros.notas(familia)
    return {
      primeraVez: notas === null,
      ultimaNota: notas?.ultimaConReloj ? sobreDiez(notas.ultima) : null,
      esLoPrincipal: esLoPrincipal(tandasSeguidas, dominio.resumen(familia)),
    }
  }

  function proponerTanda(): Tanda | null {
    const familia = dominio.familia()
    if (!familia) return null
    const examen = alcancesDeExamen(familia).map((alcance) => ({ alcance, elementos: catalogo(alcance) }))
    return componerTanda(examen, (alcance) => dominio.entradas(alcance), hoy(), Math.random)
  }
  // Lo ya jugado responde a la vez si es la primera visita y por dónde se quedó la anterior.
  let jugadas = $state.raw(competicion.historial())

  const recibido = retoDeEnlace(location.href)
  let retoRecibido = $state<Reto | null>(recibido === 'caducado' ? null : recibido)
  const retoCaducado = recibido === 'caducado'
  let aBatir = $state<Reto | null>(null)
  let retoSuperado = $state<boolean | null>(null)
  let resultado = $state<ResultadoDeRegistro | null>(null)
  let reto = $state<Reto | null>(null)
  const ESPERA_CONFIRMAR_ABANDONO = 3_000
  let confirmandoAbandono = $state(false)
  let partida = $state<Partida | null>(null)
  let prueba = $state<Prueba | null>(null)
  let elementosDelAlcance = $state.raw<Elemento[]>([])
  let elementosDelMapa = $state.raw<Elemento[]>([])
  let totalElementos = $state(0)
  let contornosDelAlcance = $state.raw<Feature<Geometry>[]>([])
  let contextoDelAlcance = $state.raw<ContextoGeografico | null>(null)
  let ahora = $state(Date.now())
  let texto = $state('')
  let preguntaElegida = $state<string | null>(null)
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

  // La cifra de una Altura se escribe venga la Prueba en la dirección que venga.
  const escribeNombre = $derived(prueba?.direccion === 'nombrar' || (partida?.preguntado?.seEscribe ?? false))
  const enTanda = $derived(tandaEnJuego !== null)
  // Una Tanda pregunta lo que trae, en su orden y sobre el mapa entero, aunque su catálogo sea el de un Todo.
  const esTodo = $derived(prueba !== null && !enTanda && seEligeLaPregunta(prueba.alcance))
  const esUnidades = $derived(prueba?.alcance === 'unidades')
  // Alcances en los que el mapa arranca mudo y solo se dibuja lo ya Acertado o Desbloqueado.
  const conCascada = $derived(prueba !== null && !enTanda && enCascada(prueba.alcance))
  // Solo lo ya visible (Acertado o Desbloqueado); el resto del mapa mudo sigue sin dibujarse.
  const contornosVisibles = $derived(
    conCascada && partida
      ? contornosDelAlcance.filter(
          (contorno) => partida!.acertados.includes(String(contorno.id)) || partida!.desbloqueados.includes(String(contorno.id)),
        )
      : contornosDelAlcance,
  )
  // Todo lo que depende de un elemento, directa o indirectamente, siguiendo desbloqueaCon al revés.
  function descendientesDe(id: string): Elemento[] {
    const directos = elementosDelAlcance.filter((elemento) => (elemento.desbloqueaCon ?? []).includes(id))
    return directos.flatMap((hijo) => [hijo, ...descendientesDe(hijo.id)])
  }

  // En Todo, una rama solo se pinta de verde cuando ella y todo lo que cuelga de ella están
  // Acertados. Todo lo demás visible y sin terminar (nunca tocado o respondido a medias) se ve igual,
  // en amarillo, para que "queda algo por hacer aquí" tenga siempre el mismo aspecto.
  const acertadosVisibles = $derived.by(() => {
    if (!esTodo || !partida) return partida?.acertados ?? []
    const acertadosSet = new Set(partida.acertados)
    return partida.acertados.filter((id) => descendientesDe(id).every((hijo) => acertadosSet.has(hijo.id)))
  })
  // Este elemento ya está Acertado, pero algo de lo que cuelga de él todavía no.
  const parcialesVisibles = $derived(
    esTodo && partida ? partida.acertados.filter((id) => !acertadosVisibles.includes(id) && !esIdDeAltura(id)) : [],
  )
  // La Frontera: visible, Desbloqueado y todavía sin acertar. Es lo que el alumno puede tocar ahora.
  const fronteraVisible = $derived(
    esTodo && partida
      ? contornosVisibles.map((contorno) => String(contorno.id)).filter((id) => !partida!.acertados.includes(id))
      : [],
  )
  // El examen de ríos se entrega como un mapa rotulado, así que la partida lo va escribiendo: lo que ya
  // tiene nombre encima es lo que no hay que volver a tocar.
  const esHidrografia = $derived(prueba !== null && esDeHidrografia(prueba.alcance))
  const nombres = $derived(
    esHidrografia && partida
      ? partida.acertados.map((id) => ({ id, texto: nombreDe(id) })).filter(({ texto }) => texto !== '')
      : [],
  )
  const respuesta = $derived(partida?.ultimaRespuesta)
  const pista = $derived(partida?.pista ?? null)
  const correccion = $derived(partida?.correccion ?? null)
  const repaso = $derived(partida?.repaso ?? null)
  const rotulos = $derived(
    repaso?.elementos
      .filter((elemento) => !repaso.marcados.includes(elemento.id))
      .map((elemento) => ({ id: formaDe(respuestaDe(elemento)), texto: elemento.rotulo ?? elemento.nombreMostrado })) ?? [],
  )
  const enPresentacion = $derived(repaso?.presentacion ?? false)

  // Los picos cuya cifra pregunta esta Prueba: Picos y Todo.
  const alturasPreguntadas = $derived(
    new Set(
      (enTanda && prueba ? catalogo(prueba.alcance) : elementosDelAlcance)
        .filter((elemento) => elemento.seEscribe)
        .map((elemento) => picoDeAltura(elemento.id)),
    ),
  )
  // Mientras la cifra se pregunte, no se muestra hasta acertarla; antes, si el pico ya está nombrado, se
  // avisa de que le falta la altura, para que "por qué sigue en naranja" tenga respuesta a la vista.
  const alturas = $derived(
    elementosDelMapa.flatMap((elemento) => {
      if (elemento.altura === undefined) return []
      if (alturasPreguntadas.has(elemento.id) && !(partida?.acertados.includes(idDeAltura(elemento.id)) ?? false)) {
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
      const delPapel = elementosDelAlcance.filter((elemento) => elemento.papel === papel)
      return {
        papel,
        nombre: nombreDePapel[papel],
        hechos: delPapel.filter((elemento) => acertados.has(elemento.id)).length,
        total: delPapel.length,
        activo: papel === partida!.preguntado?.papel,
      }
    }).filter(({ total }) => total > 0)
  })

  const preguntaDeAltura = $derived(partida?.preguntado?.seEscribe ?? false)
  // La forma que se está respondiendo ahora mismo, para remarcarla; una Altura remarca su propio pico.
  const formaDeLaPreguntaElegida = $derived(
    preguntaElegida ? (esIdDeAltura(preguntaElegida) ? picoDeAltura(preguntaElegida) : preguntaElegida) : null,
  )

  const DURACION_RESPUESTA_CORRECTA = 3_000
  const DURACION_DESTELLO = 600
  let destello = $state<string | null>(null)

  $effect(() => {
    if (!respuesta?.acierto) return
    destello = respuestaDe(respuesta.correcto)
    const espera = setTimeout(() => (destello = null), DURACION_DESTELLO)
    return () => clearTimeout(espera)
  })

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

  // La Diana: el Elemento que se pregunta ahora. En Ubicación → nombre es el que se señala para que el
  // alumno lo nombre; en Pertenencia, la Cordillera que se muestra para preguntar por su Pico.
  const diana = $derived.by(() => {
    if (!correccion && partida?.preguntado?.destacar) return [partida.preguntado.id]
    if (!escribeNombre) return []
    if (repaso) return rotulos.map((rotulo) => rotulo.id)
    // El alumno elige qué tocar; solo se señala la respuesta correcta mientras se ve la Corrección.
    if (esTodo) return correccion ? [correccion.correcto.id] : []
    const id = (correccion?.correcto ?? partida?.preguntado)?.id
    if (id === undefined) return []
    return [enTanda ? formaDe(id) : id]
  })

  // El rojo del Fallo dura mientras el Elemento siga Pendiente; al terminar se ven todos los que costaron
  // un fallo, acertados después o no.
  const falladosVisibles = $derived.by(() => {
    if (!partida) return []
    const ids = partida.fallados.map((elemento) => elemento.id)
    return partida.terminada ? ids : ids.filter((id) => !partida!.acertados.includes(id))
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
      preguntaElegida = null
      return cerrarCorreccion(partidaEnCorreccion)
    })
  })

  $effect(() => {
    if (!repaso || !escribeNombre || enPresentacion) return
    return cerrarAlCabo(DURACION_REPASO_UBICACION_NOMBRE, cerrarRepaso)
  })

  function prepararElMapa(elegida: Prueba, elementos: Elemento[]) {
    prueba = elegida
    resultado = null
    reto = null
    retoSuperado = null
    elementosDelAlcance = elementos
    elementosDelMapa = catalogoDelMapa(elegida.alcance)
    totalElementos = elementos.length
    contornosDelAlcance = contornos(elegida.alcance)
    contextoDelAlcance = contextoDe(elegida.alcance)
    ahora = Date.now()
    texto = ''
    preguntaElegida = null
  }

  function empezar(elegida: Prueba) {
    const elementos = catalogo(elegida.alcance)
    prepararElMapa(elegida, elementos)
    aBatir = esElRetoRecibido(elegida) ? retoRecibido : null
    tandaEnJuego = null
    partida = iniciarPartida(elegida, elementos, Math.random, Date.now, elementosDelMapa)
  }

  function empezarTanda() {
    // Se compone al tocar: la portada puede llevar abierta desde ayer.
    const tanda = proponerTanda()
    tandaPropuesta = tanda
    if (!tanda) return
    const elegida = pruebaDe(tanda.alcance, 'nombrar')
    const nuevos = tanda.elementos.filter((elemento) => tanda.nuevos.includes(elemento.id))
    prepararElMapa(elegida, tanda.elementos)
    aBatir = null
    tandaEnJuego = tanda
    partida = iniciarTanda(elegida, tanda.elementos, nuevos, Math.random, Date.now, elementosDelMapa)
  }

  function pasar(siguiente: Partida) {
    if (partida && tandaEnJuego) {
      for (const { id, resultado } of anotacionesDe(partida, siguiente)) dominio.anotar(tandaEnJuego.alcance, id, resultado)
      if (siguiente.terminada) tandaPropuesta = proponerTanda()
      if (siguiente.terminada && !siguiente.abandonada) tandasSeguidas += 1
    }
    partida = siguiente
  }

  function elegirFamilia(familia: Familia) {
    dominio.elegirFamilia(familia)
    familiaElegida = familia
    tandaPropuesta = proponerTanda()
  }

  function esElRetoRecibido(elegida: Prueba): boolean {
    if (!retoRecibido) return false
    return retoRecibido.prueba.alcance === elegida.alcance && retoRecibido.prueba.direccion === elegida.direccion
  }

  function nombreDe(id: string): string {
    return elementosDelMapa.find((elemento) => elemento.id === id)?.nombreMostrado ?? ''
  }

  // Cuando el nombre es la respuesta, la barra de confirmación dice la Clase: informa sin resolver.
  function textoDeTentativa(id: string): string {
    if (!escribeNombre) return nombreDe(id)
    const clase = elementosDelMapa.find((elemento) => elemento.id === id)?.clase
    return (clase && etiquetaDeClase[clase]) ?? 'Responder esto'
  }

  function elegir(id: string) {
    if (!partida || partida.terminada) return
    if (partida.repaso) {
      // El Rótulo de una Altura va sobre su Pico, así que tocar el Pico descarta los dos.
      pasar(marcarEnRepaso(marcarEnRepaso(partida, id), idDeAltura(id)))
      return
    }
    pasar(responder(partida, id))
    if (partida.terminada) registrar(partida)
  }

  // Tocar un elemento en Todo lo elige como pregunta; responderlo es cosa del formulario de texto.
  // Un pico ya acertado con su Altura pendiente redirige al toque hacia esa pregunta.
  function elegirPreguntaEnElMapa(id: string) {
    if (!partida) return
    const objetivoAltura = idDeAltura(id)
    const objetivo = partida.desbloqueados.includes(objetivoAltura) ? objetivoAltura : id
    const elegida = elegirPregunta(partida, objetivo)
    if (elegida === partida) return
    partida = elegida
    preguntaElegida = objetivo
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
    pasar(abandonar(partida))
    if (tandaEnJuego) elegirOtraPrueba()
    else registrar(partida)
  }

  function elegirOtraPrueba() {
    jugadas = competicion.historial()
    partida = null
    prueba = null
    tandaEnJuego = null
    resultado = null
    retoSuperado = null
  }

  function registrar(acabada: Partida) {
    if (tandaEnJuego) return
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
    pasar(responderConTexto(partida, texto))
    if (partida.terminada) registrar(partida)
    if (!partida.pista && !partida.correccion) preguntaElegida = null
    texto = ''
    campoDeTexto?.focus()
  }

  function elegirOpcionDePista(id: string) {
    if (!partida || partida.terminada) return
    pasar(elegirOpcion(partida, id))
  }

  function correccionDeTexto(escrito: string, tipo: TipoDeFallo, nombre: string): string {
    if (tipo === 'errata') return `Escribiste ${escrito} · Casi: ${nombre}`
    return `Escribiste ${escrito} · ${llevaTilde(escrito) ? 'Revisa la tilde' : 'Te falta la tilde'}: ${nombre}`
  }
</script>

<main>
  {#if simulacroEnCurso}
    <PantallaSimulacro
      inicial={simulacroEnCurso}
      {contexto}
      hayTanda={tandaPropuesta !== null}
      alGuardar={(simulacro) => simulacros.guardar(simulacro)}
      alEntregar={entregarSimulacro}
      alEmpezarTanda={tandaTrasElSimulacro}
      alSalir={salirDelSimulacro}
    />
  {:else if !partida}
    <SeleccionPrueba
      alElegir={empezar}
      marcaDe={(elegida) => competicion.marca(elegida)}
      reto={retoRecibido}
      {retoCaducado}
      ultima={jugadas[0]?.prueba ?? null}
      yaHaJugado={jugadas.length > 0}
      {familiaElegida}
      resumenDe={(familia) => dominio.resumen(familia)}
      tanda={tandaPropuesta && recuentoDe(tandaPropuesta, dominio.entradas(tandaPropuesta.alcance))}
      alEmpezarTanda={empezarTanda}
      simulacroDe={simulacroDe}
      alEmpezarSimulacro={empezarSimulacro}
      {soloMira}
      alElegirFamilia={elegirFamilia}
      alMirar={(mira) => (soloMira = mira)}
    />
  {:else}
    <header>
      {#if partida.terminada && tandaEnJuego && familiaElegida}
        <FinDeTanda
          {...cierreDe(tandaEnJuego, dominio.entradas(tandaEnJuego.alcance))}
          total={tandaEnJuego.elementos.length}
          familia={familiaElegida}
          resumen={dominio.resumen(familiaElegida)}
          haySiguiente={tandaPropuesta !== null}
          simulacro={simulacroDe(familiaElegida)}
          alSeguir={empezarTanda}
          alEmpezarSimulacro={empezarSimulacro}
          alVolver={elegirOtraPrueba}
        />
      {:else if partida.terminada}
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
          prueba={partida.prueba}
          alJugar={empezar}
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
            {#if pista.escrito !== null && partida.preguntado?.desambiguacion}
              <p class="desambiguacion">{partida.preguntado.desambiguacion}</p>
            {/if}
            {#each pista.opciones as opcion (opcion.id)}
              <button type="button" onclick={() => elegirOpcionDePista(opcion.id)}>{opcion.nombreMostrado}</button>
            {/each}
          </div>
        {:else if repaso}
          <p class="pregunta">
            {#if enPresentacion}
              Esto es nuevo: toca cada nombre cuando lo tengas
              <button type="button" class="yaEsta" onclick={() => partida && pasar(cerrarRepaso(partida))}>Ya está</button>
            {:else}
              {escribeNombre ? 'Repaso: fíjate en dónde están' : 'Repaso: toca cada nombre'}
            {/if}
          </p>
        {:else if escribeNombre && !correccion && (!esTodo || preguntaElegida)}
          <form class="pregunta" onsubmit={enviarTexto}>
            {#if enunciado}
              <span class="enunciado">{enunciado}</span>
            {/if}
            <input
              bind:this={campoDeTexto}
              bind:value={texto}
              aria-label={enunciado ?? 'Nombre del elemento iluminado'}
              placeholder={preguntaDeAltura ? 'Metros' : '¿Cómo se llama?'}
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
            <button type="submit">Responder</button>
          </form>
        {:else if esTodo && !correccion}
          <p class="pregunta">Toca una forma para responderla</p>
        {:else}
          <p class="pregunta">
            {#if !correccion}
              {#if enunciado}<span class="enunciado">{enunciado}</span>{/if}
              {partida.preguntado?.nombreMostrado}
            {/if}
          </p>
        {/if}
        {#if !enTanda}
          <PuntuacionYTiempo puntuacion={partida.puntuacion} tiempo={tiempoJugado(partida, ahora)} {aBatir} />
        {/if}
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
      contextoDeRelieve={contextoDelAlcance}
      rampa={esUnidades}
      frontera={fronteraVisible}
      parcial={parcialesVisibles}
      tentativa={esTodo ? formaDeLaPreguntaElegida : null}
      {destello}
      {contexto}
      acertados={acertadosVisibles}
      tocado={correccion && !escribeNombre && correccionTrasFallo(correccion) ? correccion.elegido.id : null}
      correcto={correccion ? respuestaDe(correccion.correcto) : null}
      preguntado={correccion ? null : (partida.preguntado?.id ?? null)}
      {diana}
      dianaSeToca={!escribeNombre || enPresentacion}
      pistaDeArea={partida.pistaDeArea ?? []}
      {rotulos}
      {nombres}
      {alturas}
      fallados={falladosVisibles}
      alElegir={esTodo ? elegirPreguntaEnElMapa : elegir}
      {nombreDe}
      {textoDeTentativa}
    />

    {#if correccion}
      <div class="correccion" class:conPista={!correccionTrasFallo(correccion)} role="status">
        <p>
          {#if correccion.fallo && correccion.escrito !== undefined}
            {correccionDeTexto(correccion.escrito, correccion.fallo.tipo, correccion.correcto.nombreMostrado)}
          {:else if !correccionTrasFallo(correccion)}
            Con pista: {correccion.correcto.nombreMostrado}
          {:else if !escribeNombre && correccion.correcto.respuesta}
            Tocaste {correccion.elegido.nombreMostrado} · {correccion.correcto.nombreMostrado} → {nombreDeLaRespuesta(correccion.correcto)}
          {:else if !escribeNombre}
            Tocaste {correccion.elegido.nombreMostrado} · {correccion.correcto.nombreMostrado} está aquí
          {:else}
            Elegiste {correccion.elegido.nombreMostrado} · Era {correccion.correcto.nombreMostrado}
          {/if}
        </p>
        {#if correccionTrasFallo(correccion) && correccion.correcto.desambiguacion}
          <p class="desambiguacion">{correccion.correcto.desambiguacion}</p>
        {/if}
        <div class="barra" style:animation-duration="{correccion.duracion}ms"></div>
      </div>
    {:else if repaso && escribeNombre && !enPresentacion}
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

  .desambiguacion {
    font-size: 0.9375rem;
    color: #6b7280;
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

  .yaEsta {
    display: block;
    margin-top: 0.5rem;
    font: inherit;
    font-size: 1rem;
    font-weight: 400;
    padding: 0.375rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
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

  .correccion .desambiguacion {
    font-size: 0.9375rem;
    color: #6b7280;
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
