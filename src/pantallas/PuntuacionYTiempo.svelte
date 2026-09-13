<script lang="ts">
  import { formatearTiempo } from './tiempo'

  interface Props {
    puntuacion: number
    tiempo: number
    aBatir?: { puntuacion: number; tiempo: number } | null
  }

  let { puntuacion, tiempo, aBatir = null }: Props = $props()
</script>

<p class="marcador">
  <span>{puntuacion} puntos</span>
  <span>{formatearTiempo(tiempo)}</span>
  {#if aBatir}
    <span class="a-batir">A batir: {aBatir.puntuacion} · {formatearTiempo(aBatir.tiempo)}</span>
  {/if}
</p>

<style>
  .marcador {
    display: flex;
    gap: 1rem;
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .a-batir {
    color: #6b7280;
  }
</style>
