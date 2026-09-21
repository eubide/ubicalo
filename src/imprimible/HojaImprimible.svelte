<script lang="ts">
  import { etiquetaDeAlcance, etiquetaDeFamilia, type Familia } from '../prueba/prueba'
  import MapaMudo from './MapaMudo.svelte'
  import type { Hoja } from './imprimible'

  interface Props {
    familia: Familia
    hoja: Hoja
  }

  let { familia, hoja }: Props = $props()

  const ELEMENTOS_POR_COLUMNA = 18

  const columnas = $derived(Math.min(3, Math.ceil(hoja.numerados.length / ELEMENTOS_POR_COLUMNA)))
</script>

<section class="hoja">
  <header>
    <h2>{etiquetaDeFamilia[familia]} · {etiquetaDeAlcance[hoja.alcance]}</h2>
    <p class="firma">Nombre y curso</p>
  </header>

  <MapaMudo alcance={hoja.alcance} numerados={hoja.numerados} />

  <ol class="lista" style="--columnas: {columnas}">
    {#each hoja.numerados as { numero, conAltura } (numero)}
      <li>
        <span class="orden">{numero}</span>
        <span class="hueco"></span>
        {#if conAltura}<span class="hueco metros"></span><span class="unidad">m</span>{/if}
      </li>
    {/each}
  </ol>

  <p class="procedencia">Obra derivada de las líneas límite del IGN · CC-BY 4.0 scne.es</p>
</section>

<style>
  .hoja {
    display: flex;
    flex-direction: column;
    gap: 4mm;
    width: 186mm;
    padding: 10mm;
    background: #ffffff;
    color: #000000;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.18);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8mm;
    border-bottom: 1px solid #000000;
    padding-bottom: 1mm;
  }

  h2 {
    font-size: 12pt;
    margin: 0;
  }

  .firma {
    flex: 1;
    margin: 0;
    font-size: 9pt;
    color: #555555;
    border-bottom: 1px dotted #999999;
  }

  .lista {
    columns: var(--columnas);
    column-gap: 6mm;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 10pt;
  }

  .lista li {
    display: flex;
    align-items: baseline;
    gap: 2mm;
    break-inside: avoid;
    padding: 1mm 0;
  }

  .orden {
    min-width: 6mm;
    text-align: right;
    font-weight: 700;
  }

  .hueco {
    flex: 1;
    border-bottom: 1px solid #000000;
    height: 4mm;
  }

  .metros {
    flex: 0 0 14mm;
  }

  .unidad {
    color: #555555;
  }

  .procedencia {
    margin: 0;
    font-size: 7pt;
    color: #666666;
  }

  @media print {
    /* El margen lo pone @page; el ancho lo pone la hoja de papel. */
    .hoja {
      width: auto;
      padding: 0;
      box-shadow: none;
      break-after: page;
    }

    .hoja:last-child {
      break-after: auto;
    }
  }
</style>
