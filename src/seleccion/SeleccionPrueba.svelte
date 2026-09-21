<script lang="ts">
  import { geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'
  import { siluetaDeEspana, type Alcance } from '../catalogo/catalogo'
  import type { Marca, Reto } from '../competicion/competicion'
  import type { ResumenDeFamilia } from '../dominio/dominio'
  import type { RecuentoDeTanda } from '../dominio/tanda'
  import { etiquetaDeSimulacro, type SimulacroEnPortada } from '../simulacro/simulacro'
  import { formatearTiempo } from '../pantallas/tiempo'
  import {
    alcancesDe,
    direccionesDe,
    etiquetaDeAlcance,
    etiquetaDeDireccion,
    etiquetaDeFamilia,
    FAMILIAS,
    nombreDePrueba,
    preguntasDe,
    pruebaDe,
    type Familia,
    type Prueba,
  } from '../prueba/prueba'

  interface Props {
    alElegir: (prueba: Prueba) => void
    marcaDe: (prueba: Prueba) => Marca | null
    reto: Reto | null
    retoCaducado: boolean
    ultima: Prueba | null
    yaHaJugado: boolean
    familiaElegida: Familia | null
    resumenDe: (familia: Familia) => ResumenDeFamilia
    tanda: RecuentoDeTanda | null
    alEmpezarTanda: () => void
    simulacroDe: (familia: Familia) => SimulacroEnPortada
    alEmpezarSimulacro: () => void
    alImprimir: () => void
    soloMira: boolean
    alElegirFamilia: (familia: Familia) => void
    alMirar: (soloMira: boolean) => void
  }

  let {
    alElegir,
    marcaDe,
    reto,
    retoCaducado,
    ultima,
    yaHaJugado,
    familiaElegida,
    resumenDe,
    tanda,
    alEmpezarTanda,
    simulacroDe,
    alEmpezarSimulacro,
    alImprimir,
    soloMira,
    alElegirFamilia,
    alMirar,
  }: Props = $props()

  let cambiando = $state(false)
  let practicaAbierta = $state(false)
  const vista = $derived(soloMira ? 'mira' : familiaElegida && !cambiando ? 'elegida' : 'pregunta')

  const loQueEntra: Record<Familia, string> = {
    politico: 'comunidades y provincias',
    relieve: 'montañas',
    hidrografia: 'ríos',
    costas: 'cabos, golfos y rías',
  }

  function deQueEstaHecha({ flojos, sabidos, nuevos }: RecuentoDeTanda): string {
    const partes = [
      flojos > 0 ? `${flojos} ${flojos === 1 ? 'flojo' : 'flojos'}` : '',
      sabidos > 0 ? `${sabidos} ${sabidos === 1 ? 'sabido' : 'sabidos'}` : '',
      nuevos > 0 ? `${nuevos} ${nuevos === 1 ? 'nuevo' : 'nuevos'}` : '',
    ].filter((parte) => parte !== '')
    return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}` : partes.join('')
  }

  function elegirFamilia(familia: Familia) {
    cambiando = false
    alElegirFamilia(familia)
  }

  function volverALaPregunta() {
    cambiando = true
    alMirar(false)
  }

  // La segunda tarde empieza donde acabó la primera: el botón de lo último jugado recibe el foco, que
  // además lo trae a la vista.
  function siEsLaUltima(boton: HTMLButtonElement, esLaUltima: boolean) {
    if (esLaUltima) boton.focus()
  }

  const ANCHO_SILUETA = 52
  const ALTO_SILUETA = 34
  const silueta = geoPath(
    geoConicConformalSpain().fitExtent(
      [
        [1, 1],
        [ANCHO_SILUETA - 1, ALTO_SILUETA - 1],
      ],
      siluetaDeEspana(),
    ),
  )(siluetaDeEspana())

  function resumenDeMarca(marca: Marca | null): string {
    return marca ? `${marca.puntuacion} en ${formatearTiempo(marca.tiempo)}` : ''
  }
</script>

<section class="portada">
  <header>
    <svg viewBox="0 0 {ANCHO_SILUETA} {ALTO_SILUETA}" aria-hidden="true">
      <path d={silueta} />
    </svg>
    <h1>Ubícalo</h1>
  </header>

  {#if vista === 'pregunta'}
    <p class="explicacion">Repasa la geografía de España sobre un mapa mudo.</p>
  {:else if vista === 'mira' && !yaHaJugado}
    <p class="explicacion">
      Repasa la geografía de España sobre un mapa mudo. Elige una familia y una dirección: localizar lo que
      se te nombra, o nombrar lo que se ilumina.
    </p>
  {/if}

  {#if retoCaducado}
    <p class="reto caducado">Este reto es de una versión anterior de Ubícalo y ya no se puede jugar.</p>
  {:else if reto}
    <div class="reto">
      <p>
        Te han retado a {nombreDePrueba(reto.prueba)}. Marca a batir:
        <strong>{reto.puntuacion} puntos en {formatearTiempo(reto.tiempo)}</strong>
      </p>
      <button type="button" onclick={() => alElegir(reto.prueba)}>Jugar el reto</button>
    </div>
  {/if}

  {#if vista === 'mira'}
    <p class="volver"><button type="button" class="enlace" onclick={volverALaPregunta}>¿De qué te examinas?</button></p>
    {#each FAMILIAS as { familia, alcances } (familia)}
      {@render tarjeta(familia, alcances)}
    {/each}
  {:else if vista === 'elegida' && familiaElegida}
    {@const resumen = resumenDe(familiaElegida)}
    {@const simulacro = simulacroDe(familiaElegida)}
    <section class="elegida {familiaElegida}">
      <p class="examen">
        <span class="deQue">Te examinas de</span>
        <strong>{etiquetaDeFamilia[familiaElegida]}</strong>
        <button type="button" class="enlace" onclick={() => (cambiando = true)}>Cambiar</button>
      </p>
      <p class="cifra">Te sabes {resumen.sabidos} de {resumen.total}</p>
      <div class="barra" aria-hidden="true">
        <span class="sabido" style:flex-grow={resumen.sabidos}></span>
        <span class="flojo" style:flex-grow={resumen.flojos}></span>
        <span class="sinVer" style:flex-grow={resumen.sinVer}></span>
      </div>
      <ul class="leyenda">
        <li class="sabido">{resumen.sabidos} te sabes</li>
        <li class="flojo">{resumen.flojos} flojos</li>
        <li class="sinVer">{resumen.sinVer} por ver</li>
      </ul>
      {#if simulacro.ultimaNota}<p class="ultimaNota">Último simulacro: {simulacro.ultimaNota}</p>{/if}
    </section>
    {#snippet botonDeTanda()}
      {#if tanda}
        <button type="button" class="accion {familiaElegida}" class:secundaria={simulacro.esLoPrincipal} onclick={alEmpezarTanda}>
          <strong>{resumen.sinVer === resumen.total ? 'Empezar' : 'Siguiente tanda'}</strong>
          <span>{tanda.minutos === 1 ? 'un minuto' : `unos ${tanda.minutos} min`} · {deQueEstaHecha(tanda)}</span>
        </button>
      {/if}
    {/snippet}
    {#snippet botonDeSimulacro()}
      <button
        type="button"
        class="accion {familiaElegida}"
        class:secundaria={!simulacro.esLoPrincipal && tanda !== null}
        onclick={alEmpezarSimulacro}
      >
        <strong>{etiquetaDeSimulacro(simulacro.primeraVez)}</strong>
        <span>{simulacro.primeraVez ? 'el examen entero, sin reloj' : 'el examen entero, como el de verdad'}</span>
      </button>
    {/snippet}
    <div class="acciones">
      {#if simulacro.esLoPrincipal}
        {@render botonDeSimulacro()}
        {@render botonDeTanda()}
      {:else}
        {@render botonDeTanda()}
        {@render botonDeSimulacro()}
      {/if}
    </div>
    <p class="juicio">En la tanda y en el simulacro la tilde y la errata cuentan como fallo, igual que en tu examen.</p>
    <p class="imprimir">
      <button type="button" class="enlace" onclick={alImprimir}>Imprimir el mapa mudo</button>
      <span>para rellenarlo a mano, como en el examen</span>
    </p>
    <details class="practica" bind:open={practicaAbierta}>
      <summary>Práctica libre</summary>
      {#if practicaAbierta}
        <p class="juicio">Aquí no: se te perdonan la tilde y la errata.</p>
        {@render tarjeta(familiaElegida, alcancesDe(familiaElegida))}
      {/if}
    </details>
    <p class="pie">Tu progreso se guarda solo en este navegador</p>
  {:else}
    <h2 class="pregunta">¿De qué te examinas?</h2>
    <div class="familias">
      {#each FAMILIAS as { familia } (familia)}
        <button type="button" class="examinarse {familia}" onclick={() => elegirFamilia(familia)}>
          <strong>{etiquetaDeFamilia[familia]}</strong>
          <span>{loQueEntra[familia]}</span>
        </button>
      {/each}
    </div>
    <p class="mirar"><button type="button" class="enlace" onclick={() => alMirar(true)}>Solo quiero mirar</button></p>
  {/if}
</section>

{#snippet tarjeta(familia: Familia, alcances: Alcance[])}
  <section class="familia {familia}">
    <h2>{etiquetaDeFamilia[familia]}</h2>
    <ul>
      {#each alcances as alcance (alcance)}
        {@const direcciones = direccionesDe(alcance)}
        <li>
          <p class="alcance">
            <span class="preguntas">{preguntasDe(alcance)}<span class="soloParaLectores"> preguntas</span></span>
            <span class="nombre">{etiquetaDeAlcance[alcance]}</span>
            {#if alcance === ultima?.alcance}<span class="ultima">Última</span>{/if}
          </p>
          <div class="direcciones" class:sola={direcciones.length === 1}>
            {#each direcciones as direccion (direccion)}
              {@const prueba = pruebaDe(alcance, direccion)}
              {@const marca = resumenDeMarca(marcaDe(prueba))}
              <button
                type="button"
                use:siEsLaUltima={alcance === ultima?.alcance && direccion === ultima.direccion}
                onclick={() => alElegir(prueba)}
              >
                {etiquetaDeDireccion[direccion]}
                {#if marca}<span class="marca">{marca}</span>{/if}
              </button>
            {/each}
          </div>
        </li>
      {/each}
    </ul>
  </section>
{/snippet}

<style>
  .portada {
    max-width: 30rem;
    margin: 0 auto;
  }

  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  header svg {
    width: 3.25rem;
    height: 2.125rem;
    flex: none;
  }

  header path {
    fill: #e3e3df;
    stroke: #9aa0a6;
    stroke-width: 0.4;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .explicacion {
    margin: 0 0 1rem;
    color: #4b5563;
    line-height: 1.4;
  }

  .familia,
  .elegida {
    --familia: #6b7280;
    margin-bottom: 1rem;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-left: 4px solid var(--familia);
    border-radius: 0.5rem;
    background: #fff;
  }

  .politico {
    --familia: var(--familia-politico);
  }

  .relieve {
    --familia: var(--familia-relieve);
  }

  .hidrografia {
    --familia: var(--familia-hidrografia);
  }

  .costas {
    --familia: var(--familia-costas);
  }

  .pregunta {
    font-size: 1.25rem;
    color: inherit;
    margin: 1.25rem 0 0.75rem;
  }

  .familias {
    display: grid;
    gap: 0.625rem;
  }

  .acciones {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-bottom: 1rem;
  }

  .accion.secundaria {
    background: #fff;
    color: var(--familia);
  }

  .ultimaNota {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: #4b5563;
    font-variant-numeric: tabular-nums;
  }

  .examinarse,
  .accion {
    padding: 0.75rem 1rem;
    border-color: var(--familia);
    background: var(--familia);
    color: #fff;
  }

  .examinarse strong,
  .examinarse span,
  .accion strong,
  .accion span {
    display: block;
  }

  .examinarse strong,
  .accion strong {
    font-size: 1.1875rem;
  }

  .enlace {
    padding: 0;
    border: 0;
    background: none;
    color: #4b5563;
    font-size: 0.875rem;
    text-decoration: underline;
  }

  .mirar,
  .volver {
    margin: 1rem 0;
    text-align: center;
  }

  .volver {
    text-align: left;
  }

  .examen {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    margin: 0 0 0.75rem;
  }

  .deQue {
    color: #4b5563;
  }

  .examen strong {
    font-size: 1.1875rem;
    color: var(--familia);
  }

  .examen .enlace {
    margin-left: auto;
  }

  .cifra {
    margin: 0 0 0.375rem;
    font-variant-numeric: tabular-nums;
  }

  .barra {
    display: flex;
    height: 0.75rem;
    overflow: hidden;
    border-radius: 0.375rem;
    background: #e5e7eb;
  }

  .barra .sabido {
    background: var(--familia);
  }

  .barra .flojo {
    background: var(--flojo);
  }

  .leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 0.375rem 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8125rem;
    color: #4b5563;
  }

  .leyenda li {
    display: flex;
    align-items: center;
    gap: 0.3125rem;
  }

  .leyenda li::before {
    content: '';
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 0.1875rem;
    background: var(--marca);
  }

  .leyenda .sabido {
    --marca: var(--familia);
  }

  .leyenda .flojo {
    --marca: var(--flojo);
  }

  .leyenda .sinVer {
    --marca: #e5e7eb;
  }

  .juicio {
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: #4b5563;
  }

  .imprimir {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.375rem;
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
    color: #4b5563;
  }

  .practica summary {
    padding: 0.5rem 0;
    font-weight: 600;
    cursor: pointer;
  }

  .pie {
    margin: 1.5rem 0 0;
    font-size: 0.8125rem;
    color: #6b7280;
    text-align: center;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--familia);
    margin: 0 0 0.5rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .familia li + li {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f0f0ee;
  }

  .alcance {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0 0 0.375rem;
  }

  .nombre {
    font-size: 1.0625rem;
  }

  .preguntas {
    min-width: 2ch;
    text-align: right;
    font-size: 0.8125rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }

  .soloParaLectores {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .ultima {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--familia);
    border: 1px solid currentColor;
    border-radius: 0.25rem;
    padding: 0 0.25rem;
  }

  .direcciones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .direcciones.sola {
    grid-template-columns: 1fr;
  }

  button {
    font: inherit;
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
    text-align: left;
  }

  button:hover {
    border-color: var(--familia, #2f7a4a);
  }

  .marca {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }

  .reto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid #2f7a4a;
    border-radius: 0.5rem;
  }

  .reto p {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .reto.caducado {
    display: block;
    border-color: #d1d5db;
    color: #6b7280;
  }
</style>
