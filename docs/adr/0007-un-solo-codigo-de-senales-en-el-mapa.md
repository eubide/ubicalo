# Un solo código de Señales en el mapa

El mapa dice en qué estado está cada Elemento con dos canales y no con uno. El color dice qué es: azul lo que está en juego, verde lo Acertado, rojo el Fallo, amarillo la ayuda. El borde dice si sigue en juego: punteado abierto, continuo cerrado. Los dos son iguales en todos los Tipos, y un Elemento lleva como mucho una Señal, la de mayor prioridad, porque lo que pasa ahora gana al historial.

El azul es el color de lo que está en juego porque el rojo ya significa error, dentro del juego y fuera de él. La propuesta de partida era marcar en rojo lo que se pregunta, y habría dejado el Fallo sin color propio en un mapa donde el toque erróneo ya se pintaba de rojo. El segundo canal no es decoración: uno de cada doce chicos de una clase de ESO no distingue el rojo del verde, y sin el borde no podría separar lo acertado de lo pendiente.

## Opciones consideradas

- **Rojo para la pregunta, verde para el acierto**: la propuesta original. Deja el Fallo sin color libre y obliga a reinterpretar el rojo, que el alumno ya lee como error en cualquier corrección.
- **Distinguir los estados solo por color**: falla para los alumnos que no separan rojo de verde, que son justo los que más necesitan que el mapa hable claro.
- **Verde plano para todo Acierto**: sacrifica la rampa de altitud en Grandes unidades, que es lo mejor que tiene ese Tipo. Se resuelve al revés: la mancha destella en verde y se queda con su color de Papel.
- **Rotular sobre el mapa todo lo Acertado** como marca que no es color: con cuarenta y siete provincias satura el mapa y choca con los rótulos del Repaso, que significan otra cosa.
- **Una paleta por familia de formas**, manchas por relleno y cauces por trazo, como estaba: dos vocabularios para el mismo bucle y tres sitios que tocar por cada estado nuevo.
- **Rayar el propio cauce** para decir que sigue en juego: un río a rayas ya significa cauce intermitente en un mapa. La funda que lo envuelve hace de borde sin robarle ese significado.
- **Leyenda fija de Señales** bajo el mapa: gasta alto de pantalla en un móvil para anunciar estados que ese Tipo no tiene.

## Consecuencias

- La prioridad entre Señales vive en `senalDe`, en `src/mapa/senales.ts`, y no en el orden de las reglas de CSS. Es una función pura con test, porque es la decisión que se rompe sin avisar.
- El mapa y el recuadro de Ceuta y Melilla comparten un mismo estado y la misma tabla; el recuadro deja de repetir el vocabulario con sus propios colores.
- Diez clases de estado pasan a ocho Señales: `destacado` e `iluminado` se funden en la Diana, `seleccionado` y `activo` en la Tentativa. Eran el mismo concepto pintado distinto.
- Al soltar el amarillo de la pregunta, el amarillo queda como color único de la ayuda.
- El Fallo se ve mientras el Elemento siga Pendiente, no solo al terminar la partida: el alumno puede mirar el mapa y saber qué le queda por recuperar.
- La Diana no siempre se toca. En Ubicación → nombre el mapa no acepta respuesta y en Jerarquía sí, así que el gesto viaja como dato aparte de la Señal.
- Este ADR modifica la última consecuencia del 0006: en Grandes unidades la leyenda sigue siendo la rampa, y la de Señales se añade debajo con los estados presentes en pantalla.
- Las variables `--senal-*` viven en `src/app.css`, al lado de la rampa, y las consumen el mapa y el recuadro.
- Sobre una línea, la Señal necesita grosor además de color: a ancho de móvil un trazo de 1,6 es medio píxel y el color no llega. Lo que está en la Frontera se pinta más gordo, que es señal de estado y no de clase, así que no delata nada en Jerarquía.
- La Tentativa pasa a dar puntería. Con el dedo ya existía como paso previo a confirmar; con ratón no había ninguno, y en una confluencia el clic se lleva el cauce más cercano sin avisar de cuál. Ahora el ratón resalta el que se llevaría antes de pulsar.
- La barra de confirmación dice el nombre de la Tentativa en Nombre → ubicar y su Clase en Ubicación → nombre. Decía siempre el nombre, que ahí es la respuesta: en el Simulacro bastaba con tocar una línea para leer cómo se llama antes de escribirlo.
- En los Tipos de hidrografía cada Acierto deja su Rótulo sobre el mapa. Con cuarenta y una líneas iguales, ver lo que ya está resuelto es la mitad de saber qué queda; y el mapa terminado es el producto del examen real.
