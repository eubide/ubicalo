<script lang="ts">
  import type { Tipo } from '../catalogo/catalogo'
  import type { Marca } from '../competicion/competicion'
  import { formatearTiempo } from '../pantallas/tiempo'

  interface Props {
    alElegir: (tipo: Tipo) => void
    marcaDe: (tipo: Tipo) => Marca | null
  }

  let { alElegir, marcaDe }: Props = $props()

  const tipos: { tipo: Tipo; etiqueta: string }[] = [
    { tipo: 'comunidades', etiqueta: 'Comunidades autónomas' },
    { tipo: 'provincias', etiqueta: 'Provincias' },
  ]
</script>

<section>
  <h1>¿Qué quieres repasar?</h1>
  <div class="tipos">
    {#each tipos as { tipo, etiqueta } (tipo)}
      {@const marca = marcaDe(tipo)}
      <button type="button" onclick={() => alElegir(tipo)}>
        {etiqueta}
        <span class="marca">
          {marca ? `Marca: ${marca.puntuacion} puntos en ${formatearTiempo(marca.tiempo)}` : 'Sin marca'}
        </span>
      </button>
    {/each}
  </div>
</section>

<style>
  h1 {
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  .tipos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  button {
    font: inherit;
    font-size: 1.125rem;
    padding: 0.75rem 1.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
  }

  button:hover {
    border-color: #2f7a4a;
  }

  .marca {
    display: block;
    font-size: 0.875rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }
</style>
