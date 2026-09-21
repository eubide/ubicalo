<script lang="ts">
  import { etiquetaDeFamilia, type Familia } from '../prueba/prueba'
  import HojaImprimible from './HojaImprimible.svelte'
  import { hojasDe } from './imprimible'

  interface Props {
    familia: Familia
    alVolver: () => void
  }

  let { familia, alVolver }: Props = $props()

  const EN_EL_CUERPO = 'imprimible-a-la-vista'

  const hojas = $derived(hojasDe(familia))

  // La aplicación se imprime desde su propia pantalla, así que apagar lo de fuera de la hoja solo puede
  // hacerse mientras esta está montada.
  $effect(() => {
    document.body.classList.add(EN_EL_CUERPO)
    return () => document.body.classList.remove(EN_EL_CUERPO)
  })
</script>

<div class="pantalla">
  <div class="acciones">
    <p class="titulo">Mapa mudo de {etiquetaDeFamilia[familia]}</p>
    <button type="button" class="principal" onclick={() => window.print()}>Imprimir</button>
    <button type="button" onclick={alVolver}>Volver</button>
  </div>
  <p class="aviso">
    {hojas.length === 1 ? 'Una hoja' : `${hojas.length} hojas`}, una por mapa. Cada forma lleva un número y cada
    número su línea en la lista, para escribir el nombre a mano.
  </p>

  <div class="imprimible">
    {#each hojas as hoja (hoja.alcance)}
      <HojaImprimible {familia} {hoja} />
    {/each}
  </div>
</div>

<style>
  .pantalla {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .acciones {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .titulo {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .aviso {
    margin: 0;
    max-width: 60ch;
    text-align: center;
    color: #52606d;
  }

  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border: 1px solid #52606d;
    border-radius: 0.5rem;
    background: #ffffff;
    cursor: pointer;
  }

  .principal {
    background: #1f2933;
    border-color: #1f2933;
    color: #ffffff;
  }

  .imprimible {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  /* @page es global y no se puede condicionar a una clase: la hoja de papel es A4 vertical para toda la
     aplicación. */
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  @media print {
    /* En el papel queda solo el mapa y su lista: se apaga todo lo que no lleva hasta ellos, dejando en
       pie los contenedores que los envuelven. */
    :global(body.imprimible-a-la-vista *:not(.imprimible, .imprimible *, :has(.imprimible))) {
      display: none;
    }

    /* La hoja manda sobre el ancho, así que los contenedores dejan de centrar y de acolchar. */
    :global(html:has(body.imprimible-a-la-vista)),
    :global(body.imprimible-a-la-vista),
    :global(body.imprimible-a-la-vista :has(.imprimible)) {
      display: block;
      margin: 0;
      padding: 0;
      max-width: none;
      background: #ffffff;
    }

    .imprimible {
      display: block;
      gap: 0;
    }
  }
</style>
