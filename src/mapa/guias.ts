// Mar adentro es lejos de aquí: sirve para toda la costa peninsular, que rodea este punto.
export const CENTRO_DE_LA_PENINSULA: [number, number] = [-3.7, 40.2]

export interface Ancla {
  id: string
  x: number
  y: number
}

export function gruposApinados(anclas: Ancla[], apinado: number): Ancla[][] {
  const grupos: Ancla[][] = []
  const vistas = new Set<string>()
  for (const semilla of anclas) {
    if (vistas.has(semilla.id)) continue
    const grupo = [semilla]
    vistas.add(semilla.id)
    for (let i = 0; i < grupo.length; i += 1) {
      for (const otra of anclas) {
        if (vistas.has(otra.id) || Math.hypot(otra.x - grupo[i].x, otra.y - grupo[i].y) >= apinado) continue
        vistas.add(otra.id)
        grupo.push(otra)
      }
    }
    if (grupo.length > 1) grupos.push(grupo)
  }
  return grupos
}

export interface Fila {
  fondo: number
  paso: number
  // Un nombre ocupa más a lo ancho que a lo alto: si la fila corre en horizontal, el paso lo pone él.
  anchoDe?: (id: string) => number
  alto?: number
}

// La fila se aleja del centro y sigue el orden de las formas sobre la costa, para que las guías no se
// crucen.
export function enFilaMarAdentro(grupo: Ancla[], [cx, cy]: [number, number], fila: Fila): Ancla[] {
  const { fondo, paso, anchoDe = () => 0, alto = 0 } = fila
  const mx = grupo.reduce((suma, { x }) => suma + x, 0) / grupo.length
  const my = grupo.reduce((suma, { y }) => suma + y, 0) / grupo.length
  const largo = Math.hypot(mx - cx, my - cy) || 1
  const [dx, dy] = [(mx - cx) / largo, (my - cy) / largo]
  const [px, py] = [-dy, dx]
  const ordenados = [...grupo].sort((una, otra) => una.x * px + una.y * py - (otra.x * px + otra.y * py))
  const posiciones = [0]
  for (let i = 1; i < ordenados.length; i += 1) {
    const entre =
      Math.abs(px) * ((anchoDe(ordenados[i - 1].id) + anchoDe(ordenados[i].id)) / 2) + Math.abs(py) * alto
    posiciones.push(posiciones[i - 1] + Math.max(paso, entre))
  }
  const mitad = posiciones.at(-1)! / 2
  return ordenados.map(({ id }, i) => ({
    id,
    x: mx + dx * fondo + px * (posiciones[i] - mitad),
    y: my + dy * fondo + py * (posiciones[i] - mitad),
  }))
}
