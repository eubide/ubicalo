# Tocar una línea en el mapa mudo

Un río se dibuja como una línea fina y se toca por cercanía: el mapa entero recoge el toque, mide la distancia del punto a cada trazo y responde el más cercano dentro del radio de un dedo. Ningún trazo escucha su propio clic. Esa decisión es una función pura, `trazoMasCercano`, con sus tests sobre coordenadas reales del dato.

Hasta aquí todo lo tocable era una mancha de área o un icono, y bastaba con que el navegador resolviera el clic sobre la forma. Una línea de dos píxeles no se puede pulsar, y en cada confluencia hay varios ríos bajo el mismo dedo: el Záncara y el Cigüela corren pegados, y cada afluente termina encima de su río principal. Sin un desempate explícito, la respuesta la decidiría el orden de pintado.

## Opciones consideradas

- **Un trazo transparente ancho sobre cada río, con su propio clic**: menos código y el navegador hace el trabajo, pero en los solapes gana el último pintado, no el más cercano, y no hay forma de probarlo sin abrir un navegador.
- **Un icono en el punto medio de cada río, como los picos**: resuelve el solape y reaprovecha lo que ya existe, pero deja de ser «señalar el río» para ser «señalar su chincheta», que es justo lo que el examen no pide.
- **Aumentar el grosor visible del trazo hasta que se pueda pulsar**: haría ilegible un mapa con 41 líneas, y engordar solo los ríos principales delataría la respuesta en Jerarquía.

## Consecuencias

- El radio del dedo se divide por la escala del zoom, así que acercarse afina la puntería en lugar de agrandar el área sensible.
- Los empates exactos se rompen por id, no por orden de la lista, para que la respuesta no dependa de cómo se ordenen los contornos.
- **Un río le gana el toque a la mancha que tiene debajo.** En el Simulacro de ríos las vertientes son manchas y los ríos se dibujan encima, así que un toque cerca de un cauce responde el cauce. Una vertiente sigue siendo una superficie grande y se toca lejos de las líneas, pero en una cuenca densa cuesta más. Está sin verificar con un dedo real; si molesta, lo que se ajusta es el radio, no la prioridad.
- El componente del mapa gana la conversión de coordenadas de pantalla a coordenadas del mapa, que antes solo hacía falta para los gestos de zoom. La decisión de qué se ha tocado vive fuera, en la función pura; el componente solo mide y dibuja.
- Cualquier Tipo futuro que se juegue sobre líneas —los cabos, si alguna vez se dibujan como tramos de costa— hereda este mecanismo sin tocarlo.
