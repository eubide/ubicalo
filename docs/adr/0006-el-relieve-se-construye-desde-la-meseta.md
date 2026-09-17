# El relieve se construye desde la Meseta y se colorea por altitud

El Tipo Grandes unidades arranca con el mapa mudo y una sola respuesta posible, la Meseta. Acertarla abre sus cordilleras interiores y sus rebordes; cada reborde abre su depresión y cada depresión su cordillera exterior; Canarias cierra la partida. El orden no es didáctico por fuera: es la definición que la propia capa del IGN da de cada clase, donde todo el relieve peninsular se describe por su posición respecto a la Meseta. Así la mecánica del juego y el contenido son la misma cosa, y el alumno nunca tiene delante más de cuatro manchas que decidir.

Cada mancha toma su color solo al acertarla, y ese color es su altura en la rampa de los mapas físicos: verde las depresiones, ocre la Meseta, marrón creciente los rebordes, las interiores y las exteriores. Al terminar, el alumno tiene un mapa físico de España que ha pintado él, y el color responde a por qué la Meseta se llama así. Hasta entonces las manchas desbloqueadas se ven en gris.

## Opciones consideradas

- **Relieve sombreado de fondo**: dibuja las cordilleras antes de preguntarlas, así que el mapa mudo deja de serlo. Además, el juego distingue nueve estados por relleno plano (acertado, fallado, iluminado, pista de área, seleccionado, tocado, por responder, parcial, destacado) y ninguno sobrevive sobre una textura. Descartado como fondo; como revelado al final de la partida, para contrastar lo construido, no delataría nada y queda abierto.
- **Añadir Meseta y depresiones a Cordilleras y sierras**: una tarde de trabajo, pero deja catorce nombres sueltos que memorizar y pierde justo lo que hace falta aprender, que es la estructura.
- **Clasificar en vez de localizar**, con seis botones fijos de papel bajo el mapa: entrena mejor el modelo mental y no exige escribir, pero necesita un modo de respuesta que el motor no tiene. Complementa a este Tipo y no lo sustituye; queda pendiente.
- **Submesetas Norte y Sur separadas**: la capa no las trae y el corte por el Sistema Central sería criterio propio sobre la mancha mayor del mapa. Una mancha, una respuesta.

## Consecuencias

- El Preguntado tiene que estar siempre Desbloqueado. En el Simulacro lo garantiza el alumno, que elige tocando; aquí lo garantiza el motor, que adelanta en la cola el primero que ya se puede responder y lo trae de la siguiente Vuelta si en esta no queda ninguno. Sin eso, fallar la Meseta bloquearía la partida entera.
- Las dependencias entre depresión, reborde y cordillera exterior son seis entradas escritas a mano: la capa dice que las depresiones están «entre los rebordes y las cordilleras exteriores», pero no cuál con cuál.
- Canarias no se define respecto a la Meseta y no depende de nada por geografía; se cuelga de las cuatro cordilleras exteriores para que la partida abra siempre con la Meseta y cierre con el relieve volcánico.
- La rampa vive en `src/app.css` como variables y la usan el mapa y la barra de contexto; la leyenda del mapa pasa a ser esa rampa en este Tipo, porque aquí todas las formas son manchas y los iconos de clase no distinguen nada.
