<script lang="ts">
  import type { ResumenDeFamilia } from '../dominio/dominio'
  import { etiquetaDeFamilia, type Familia } from '../prueba/prueba'
  import { etiquetaDeSimulacro, type SimulacroEnPortada } from '../simulacro/simulacro'

  interface Props {
    aLaPrimera: number
    total: number
    vuelven: number
    familia: Familia
    resumen: ResumenDeFamilia
    haySiguiente: boolean
    simulacro: SimulacroEnPortada | null
    alSeguir: () => void
    alEmpezarSimulacro: () => void
    alVolver: () => void
  }

  let { aLaPrimera, total, vuelven, familia, resumen, haySiguiente, simulacro, alSeguir, alEmpezarSimulacro, alVolver }: Props = $props()

  const simulacroPrimero = $derived(simulacro !== null && (simulacro.esLoPrincipal || !haySiguiente))

  function cuantos(cantidad: number, uno: string, varios: string): string {
    return `${cantidad} ${cantidad === 1 ? uno : varios}`
  }
</script>

<section class="fin">
  <p class="titulo">
    {aLaPrimera} de {total} a la primera.
    {#if vuelven > 0}{cuantos(vuelven, 'te vuelve', 'te vuelven')} en la siguiente.{/if}
  </p>
  <p>
    De {etiquetaDeFamilia[familia]} te sabes {resumen.sabidos}, tienes {cuantos(resumen.flojos, 'flojo', 'flojos')} y
    {resumen.sinVer === 1 ? 'te queda' : 'te quedan'} {resumen.sinVer} por ver.
  </p>
  <div class="acciones">
    {#if simulacro && simulacroPrimero}
      <button type="button" class="principal" onclick={alEmpezarSimulacro}>
        {etiquetaDeSimulacro(simulacro.primeraVez)}
      </button>
    {/if}
    {#if haySiguiente}
      <button type="button" class:principal={!simulacroPrimero} onclick={alSeguir}>Siguiente tanda</button>
    {/if}
    <button type="button" class:principal={!haySiguiente && !simulacro} onclick={alVolver}>Volver</button>
  </div>
</section>

<style>
  .titulo {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  p {
    margin: 0.5rem 0 0;
  }

  .acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
  }

  button.principal {
    border-color: #2f7a4a;
    color: #2f7a4a;
    font-weight: 600;
  }

  button:hover {
    border-color: #2f7a4a;
  }
</style>
