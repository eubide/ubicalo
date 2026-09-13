<script lang="ts">
  import type { Tipo } from '../catalogo/catalogo'
  import type { Modo, Prueba } from '../prueba/prueba'

  interface Props {
    alElegir: (prueba: Prueba) => void
  }

  let { alElegir }: Props = $props()

  const modos: { modo: Modo; etiqueta: string }[] = [
    { modo: 'nombre-ubicar', etiqueta: 'Nombre → ubicar' },
    { modo: 'ubicacion-nombre', etiqueta: 'Ubicación → nombre' },
  ]

  const tipos: { tipo: Tipo; etiqueta: string }[] = [
    { tipo: 'comunidades', etiqueta: 'Comunidades autónomas' },
    { tipo: 'provincias', etiqueta: 'Provincias' },
  ]

  let modoElegido = $state<Modo>('nombre-ubicar')
</script>

<section>
  <h1>¿Qué quieres repasar?</h1>
  <fieldset class="modos">
    <legend>Modo</legend>
    {#each modos as { modo, etiqueta } (modo)}
      <label>
        <input type="radio" name="modo" value={modo} bind:group={modoElegido} />
        {etiqueta}
      </label>
    {/each}
  </fieldset>
  <div class="tipos">
    {#each tipos as { tipo, etiqueta } (tipo)}
      <button type="button" onclick={() => alElegir({ tipo, modo: modoElegido })}>{etiqueta}</button>
    {/each}
  </div>
</section>

<style>
  h1 {
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  .modos {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    border: none;
    padding: 0;
    margin: 0 0 1rem;
  }

  legend {
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  label {
    font-size: 1.125rem;
    cursor: pointer;
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
