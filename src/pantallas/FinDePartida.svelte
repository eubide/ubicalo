<script lang="ts">
  import type { Elemento } from '../catalogo/catalogo'
  import type { ResultadoDeRegistro } from '../competicion/competicion'
  import { formatearTiempo } from './tiempo'

  interface Props {
    puntuacion: number
    tiempo: number
    fallos: number
    fallados: Elemento[]
    abandonada: boolean
    resultado: ResultadoDeRegistro | null
    alElegirOtraPrueba: () => void
  }

  let { puntuacion, tiempo, fallos, fallados, abandonada, resultado, alElegirOtraPrueba }: Props = $props()
</script>

<section class="fin">
  <p class="titulo">{abandonada ? 'Partida abandonada' : '¡Partida terminada!'}</p>
  {#if abandonada}
    <p class="marca">Una partida abandonada no cuenta para la marca.</p>
  {:else if resultado?.nuevaMarca}
    <p class="marca nueva">¡Nueva marca!</p>
  {:else if resultado?.puntosParaLaMarca === 0}
    <p class="marca">Empatas a puntos con tu marca, pero con más tiempo.</p>
  {:else if resultado?.puntosParaLaMarca}
    <p class="marca">
      Te has quedado a {resultado.puntosParaLaMarca}
      {resultado.puntosParaLaMarca === 1 ? 'punto' : 'puntos'} de tu marca.
    </p>
  {/if}
  <dl>
    <dt>Puntuación</dt>
    <dd>{puntuacion}</dd>
    <dt>Tiempo</dt>
    <dd>{formatearTiempo(tiempo)}</dd>
    <dt>Fallos</dt>
    <dd>{fallos}</dd>
  </dl>
  {#if fallados.length > 0}
    <p>Para repasar:</p>
    <ul>
      {#each fallados as elemento (elemento.id)}
        <li>{elemento.nombreMostrado}</li>
      {/each}
    </ul>
  {/if}
  <button type="button" onclick={alElegirOtraPrueba}>Elegir otra prueba</button>
</section>

<style>
  .titulo {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .marca {
    margin: 0.25rem 0 0;
    color: #6b7280;
  }

  .marca.nueva {
    color: #2f7a4a;
    font-weight: 600;
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    margin: 0.5rem 0;
    font-variant-numeric: tabular-nums;
  }

  dt {
    color: #6b7280;
  }

  button {
    font: inherit;
    margin-top: 0.75rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
  }

  button:hover {
    border-color: #2f7a4a;
  }

  dd {
    margin: 0;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin: 0;
    padding-left: 1.25rem;
    color: #b45309;
  }
</style>
