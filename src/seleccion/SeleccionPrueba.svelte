<script lang="ts">
  import type { Tipo } from '../catalogo/catalogo'

  interface Props {
    alElegir: (tipo: Tipo) => void
  }

  let { alElegir }: Props = $props()

  const tipos: { tipo: Tipo; etiqueta: string }[] = [
    { tipo: 'comunidades', etiqueta: 'Comunidades autónomas' },
    { tipo: 'provincias', etiqueta: 'Provincias' },
  ]
</script>

<section>
  <h1>¿Qué quieres repasar?</h1>
  <div class="tipos">
    {#each tipos as { tipo, etiqueta } (tipo)}
      <button type="button" onclick={() => alElegir(tipo)}>{etiqueta}</button>
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
</style>
