<script lang="ts">
  import type { Feature, FeatureCollection, Geometry, Point } from 'geojson'
  import { geoPath } from 'd3-geo'
  import { contextoDe, contornos, type Alcance, type ClaseDelMapa } from '../catalogo/catalogo'
  import contextoGeografico from '../datos/contexto-geografico.json'
  import RecuadroMudo from './RecuadroMudo.svelte'
  import { ALTO, ANCHO, proyeccionDe, trazadoDe, type Numerado } from './imprimible'

  interface Props {
    alcance: Alcance
    numerados: Numerado[]
  }

  let { alcance, numerados }: Props = $props()

  const paises = contextoGeografico as FeatureCollection
  const radioPico = 6
  const radioCabo = 4
  const anchoRecuadro = 232
  const altoRecuadro = 150

  const proyeccion = $derived(proyeccionDe(alcance))
  const trazado = $derived(trazadoDe(alcance))
  const trazadoDeCabo = $derived(geoPath(proyeccion).pointRadius(radioCabo))
  const formas = $derived(contornos(alcance))
  const contexto = $derived(contextoDe(alcance))
  const manchas = $derived(
    formas.filter(({ geometry }) => geometry.type !== 'Point' && geometry.type !== 'LineString'),
  )
  const cauces = $derived(formas.filter(({ geometry }) => geometry.type === 'LineString'))
  const puntos = $derived(formas.filter(({ geometry }) => geometry.type === 'Point'))
  const enElRecuadro = $derived(numerados.filter(({ enRecuadro }) => enRecuadro))
  const sobreElMapa = $derived(numerados.filter(({ enRecuadro }) => !enRecuadro))

  function claseDe(contorno: Feature<Geometry>): ClaseDelMapa | '' {
    return (contorno.properties as { clase?: ClaseDelMapa })?.clase ?? ''
  }

  // Cada Clase se reconoce por su forma, que es lo único que queda cuando el tóner no tiene colores.
  function marcador(contorno: Feature<Geometry>): string | null {
    const clase = claseDe(contorno)
    if (clase === 'cabo') return trazadoDeCabo(contorno)
    if (clase !== 'pico') return trazado(contorno)
    const punto = proyeccion((contorno.geometry as Point).coordinates as [number, number])
    if (!punto) return null
    const [x, y] = punto
    return `M${x},${y - radioPico}L${x + radioPico * 0.9},${y + radioPico * 0.6}L${x - radioPico * 0.9},${y + radioPico * 0.6}Z`
  }
</script>

<svg viewBox="0 0 {ANCHO} {ALTO}" role="img" aria-label="Mapa mudo para rellenar a mano">
  <g class="paises">
    {#each paises.features as pais (pais.id)}
      <path d={trazado(pais)} />
    {/each}
  </g>
  {#if contexto}
    <path class="contorno" d={trazado(contexto.contorno)} />
    {#each contexto.tenues as cordillera (cordillera.id)}
      <path class="tenue" d={trazado(cordillera)} />
    {/each}
    {#each contexto.rios as rio (rio.id)}
      <path class="rio" d={trazado(rio)} />
    {/each}
  {/if}
  {#each manchas as contorno (contorno.id)}
    <path class="mancha {claseDe(contorno)}" d={trazado(contorno)} />
  {/each}
  {#each cauces as cauce (cauce.id)}
    <path class="cauce" d={trazado(cauce)} />
  {/each}
  {#each puntos as punto (punto.id)}
    <path class="punto {claseDe(punto)}" d={marcador(punto)} />
  {/each}
  <path class="marcos" d={proyeccion.getCompositionBorders()} />
  {#if enElRecuadro.length > 0}
    <RecuadroMudo
      numerados={enElRecuadro}
      {paises}
      x={ANCHO - anchoRecuadro}
      y={ALTO - altoRecuadro}
      ancho={anchoRecuadro}
      alto={altoRecuadro}
    />
  {/if}
  {#each sobreElMapa as { numero, x, y } (numero)}
    <text class="numero" {x} {y} text-anchor="middle" dominant-baseline="central">{numero}</text>
  {/each}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    background: #ffffff;
  }

  path {
    vector-effect: non-scaling-stroke;
  }

  .paises path {
    fill: #eeeeee;
    stroke: #dddddd;
    stroke-width: 0.6;
  }

  .contorno {
    fill: #ffffff;
    stroke: #767676;
    stroke-width: 0.8;
  }

  .tenue {
    fill: #f2f2f2;
    stroke: #d4d4d4;
  }

  .rio {
    fill: none;
    stroke: #c0c0c0;
    stroke-width: 0.8;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .mancha {
    fill: #ffffff;
    stroke: #000000;
    stroke-width: 0.9;
  }

  /* El agua y las manchas del relieve se tiñen de gris para separarse del fondo blanco de la tierra. */
  .mancha.cordillera,
  .mancha.vertiente,
  .mancha.golfo,
  .mancha.bahia,
  .mancha.estrecho,
  .mancha.ria {
    fill: #e6e6e6;
  }

  /* Una Vertiente cubre media Península: con el trazo negro de los cauces, su borde se leería como otro
     río. Va punteado y en gris, que es lo que separa una zona de una línea sin color que las distinga. */
  .mancha.vertiente {
    fill: #f2f2f2;
    stroke: #8a8a8a;
    stroke-dasharray: 6 4;
  }

  .cauce {
    fill: none;
    stroke: #000000;
    stroke-width: 1.2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .punto {
    fill: #000000;
    stroke: #000000;
    stroke-width: 0.8;
  }

  .punto.sierra {
    fill: #ffffff;
    stroke-width: 1.4;
  }

  .marcos {
    fill: none;
    stroke: #767676;
    stroke-width: 0.8;
  }

  .numero {
    font-family: system-ui, sans-serif;
    font-size: 17px;
    font-weight: 700;
    fill: #000000;
    stroke: #ffffff;
    stroke-width: 3;
    paint-order: stroke;
  }
</style>
