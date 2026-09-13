<script lang="ts">
  import { untrack } from 'svelte'
  import type { Tipo } from '../catalogo/catalogo'
  import type { Marca, Reto } from '../competicion/competicion'
  import { formatearTiempo } from '../pantallas/tiempo'
  import { etiquetaDeModo, etiquetaDeTipo, nombreDePrueba, type Modo, type Prueba } from '../prueba/prueba'

  interface Props {
    alElegir: (prueba: Prueba) => void
    marcaDe: (prueba: Prueba) => Marca | null
    reto: Reto | null
  }

  let { alElegir, marcaDe, reto }: Props = $props()

  const modos: { modo: Modo; etiqueta: string }[] = [
    { modo: 'nombre-ubicar', etiqueta: etiquetaDeModo['nombre-ubicar'] },
    { modo: 'ubicacion-nombre', etiqueta: etiquetaDeModo['ubicacion-nombre'] },
  ]

  const tipos: { tipo: Tipo; etiqueta: string }[] = [
    { tipo: 'comunidades', etiqueta: etiquetaDeTipo.comunidades },
    { tipo: 'provincias', etiqueta: etiquetaDeTipo.provincias },
  ]

  let modoElegido = $state<Modo>(untrack(() => reto?.prueba.modo ?? 'nombre-ubicar'))
</script>

<section>
  {#if reto}
    <div class="reto">
      <p>
        Te han retado a {nombreDePrueba(reto.prueba)}. Marca a batir:
        <strong>{reto.puntuacion} puntos en {formatearTiempo(reto.tiempo)}</strong>
      </p>
      <button type="button" onclick={() => alElegir(reto.prueba)}>Jugar el reto</button>
    </div>
  {/if}
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
      {@const marca = marcaDe({ tipo, modo: modoElegido })}
      <button type="button" onclick={() => alElegir({ tipo, modo: modoElegido })}>
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

  .reto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid #2f7a4a;
    border-radius: 0.5rem;
  }

  .reto p {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .marca {
    display: block;
    font-size: 0.875rem;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }
</style>
