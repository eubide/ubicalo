<script lang="ts">
  import { geoPath } from 'd3-geo'
  import { geoConicConformalSpain } from 'd3-composite-projections'
  import { siluetaDeEspana } from '../catalogo/catalogo'
  import type { Marca, Reto } from '../competicion/competicion'
  import { formatearTiempo } from '../pantallas/tiempo'
  import {
    direccionesDe,
    etiquetaDeAlcance,
    etiquetaDeDireccion,
    etiquetaDeFamilia,
    FAMILIAS,
    nombreDePrueba,
    preguntasDe,
    pruebaDe,
    type Prueba,
  } from '../prueba/prueba'

  interface Props {
    alElegir: (prueba: Prueba) => void
    marcaDe: (prueba: Prueba) => Marca | null
    reto: Reto | null
    retoCaducado: boolean
    ultima: Prueba | null
    yaHaJugado: boolean
  }

  let { alElegir, marcaDe, reto, retoCaducado, ultima, yaHaJugado }: Props = $props()

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

  {#if !yaHaJugado}
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

  {#each FAMILIAS as { familia, alcances } (familia)}
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
  {/each}
</section>

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

  .familia {
    --familia: #6b7280;
    margin-bottom: 1rem;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-left: 4px solid var(--familia);
    border-radius: 0.5rem;
    background: #fff;
  }

  .familia.politico {
    --familia: var(--familia-politico);
  }

  .familia.relieve {
    --familia: var(--familia-relieve);
  }

  .familia.hidrografia {
    --familia: var(--familia-hidrografia);
  }

  .familia.costas {
    --familia: var(--familia-costas);
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

  li + li {
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
