<script lang="ts">
  import { enlaceDeReto, type Reto } from '../competicion/competicion'
  import { nombreDePrueba } from '../prueba/prueba'
  import { formatearTiempo } from './tiempo'

  interface Props {
    reto: Reto
  }

  let { reto }: Props = $props()

  const DURACION_AVISO = 2_000

  const texto = $derived(
    `Te reto a ${nombreDePrueba(reto.prueba)}: he hecho ${reto.puntuacion} puntos en ${formatearTiempo(reto.tiempo)}. ¿Me superas?`,
  )
  const enlace = $derived(enlaceDeReto(reto, `${location.origin}${location.pathname}`))
  let aviso = $state<'copiado' | 'sin-copiar' | null>(null)

  $effect(() => {
    if (aviso !== 'copiado') return
    const espera = setTimeout(() => (aviso = null), DURACION_AVISO)
    return () => clearTimeout(espera)
  })

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ text: texto, url: enlace })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${enlace}`)
      aviso = 'copiado'
    } catch {
      aviso = 'sin-copiar'
    }
  }
</script>

<div class="reto">
  <p>{texto}</p>
  <input readonly value={enlace} aria-label="Enlace del reto" onfocus={(evento) => evento.currentTarget.select()} />
  <button type="button" onclick={compartir}>Compartir reto</button>
  {#if aviso === 'copiado'}
    <span class="aviso" role="status">Copiado</span>
  {:else if aviso === 'sin-copiar'}
    <span class="aviso" role="status">No se ha podido copiar; copia el enlace de arriba.</span>
  {/if}
</div>

<style>
  .reto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  p {
    flex-basis: 100%;
    margin: 0;
  }

  input {
    font: inherit;
    flex: 1 1 14rem;
    min-width: 0;
    padding: 0.375rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    color: #6b7280;
  }

  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border: 1px solid #2f7a4a;
    border-radius: 0.5rem;
    background: #2f7a4a;
    color: #fff;
    cursor: pointer;
  }

  .aviso {
    color: #2f7a4a;
  }
</style>
