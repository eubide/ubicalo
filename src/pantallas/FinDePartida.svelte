<script lang="ts">
  import type { Elemento } from '../catalogo/catalogo'
  import { formatearTiempo } from './tiempo'

  interface Props {
    puntuacion: number
    tiempo: number
    fallos: number
    pistas: number
    fallados: Elemento[]
  }

  let { puntuacion, tiempo, fallos, pistas, fallados }: Props = $props()
</script>

<section class="fin">
  <p class="titulo">¡Partida terminada!</p>
  <dl>
    <dt>Puntuación</dt>
    <dd>{puntuacion}</dd>
    <dt>Tiempo</dt>
    <dd>{formatearTiempo(tiempo)}</dd>
    <dt>Fallos</dt>
    <dd>{fallos}</dd>
    <dt>Pistas</dt>
    <dd>{pistas}</dd>
  </dl>
  {#if fallados.length > 0}
    <p>Para repasar:</p>
    <ul>
      {#each fallados as elemento (elemento.id)}
        <li>{elemento.nombreMostrado}</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .titulo {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
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
