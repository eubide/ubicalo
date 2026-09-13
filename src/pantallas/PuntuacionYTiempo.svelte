<script lang="ts">
  import { formatearTiempo } from './tiempo'

  interface Props {
    puntuacion: number
    tiempo: number
  }

  let { puntuacion, tiempo }: Props = $props()
</script>

<p class="marcador">
  <span>{puntuacion} puntos</span>
  <span>{formatearTiempo(tiempo)}</span>
</p>

<style>
  .marcador {
    display: flex;
    gap: 1rem;
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
</style>
