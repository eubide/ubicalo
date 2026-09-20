# Se responde con lo que distingue al Elemento

Escribir el nombre de un Elemento no obliga a escribirlo entero. Dos mecanismos lo permiten. La normalización general quita artículos, conectores, guiones y apóstrofos en los dos lados de la comparación, así que «Sierra de Gata», «Sierra Gata» y «sierragata» son la misma respuesta, y con ella caen de golpe La Meseta, Las Palmas, Castilla y León, Castilla-La Mancha, A Coruña y la treintena de Sierras y Montes que empiezan por su genérico. La tabla de formas cortas cubre aparte lo que no es mecánico, seis casos en los que sobra un sustantivo entero: las tres Vertientes, las dos Depresiones y el Turó de l'Home.

El sustantivo genérico no es lo que se pregunta. Vertiente, Depresión, Sierra y Montes son la Clase del Elemento, y la Clase ya se ve en el icono del mapa y en el enunciado antes de escribir nada. Exigirla en la respuesta no mide geografía, mide mecanografía, y la penaliza justo en los nombres más largos. El alumno que ve la mancha señalada y escribe «Mediterránea» sabe la respuesta.

El recorte tiene un límite y es cuándo lo que queda deja de nombrar algo. «Picos de Europa» y «Montes Vascos» no se acortan: «Europa» y «Vascos» no son topónimos fuera de ese mapa, y aceptarlos enseñaría un nombre que en el examen no vale. «Guadiana Menor» tampoco, porque su forma corta chocaría con el río Guadiana.

## Opciones consideradas

- **Un alias por Elemento, sin regla general**: es lo que ya hace `FORMAS_CORTAS` para los nombres políticos. Da control caso a caso y cuesta más de cuarenta entradas que hay que recordar escribir cada vez que entra un topónimo nuevo. Los artículos y los conectores son mecánicos y no merecen una tabla.
- **Aceptar cualquier subcadena, o una distancia de edición**: perdona faltas de ortografía que el examen no perdona, y en una lista con Sierra de Gata y Sierra de Gredos empieza a dar por buena la palabra equivocada.
- **Exigir el nombre oficial completo**, como hasta ahora: convierte veintiocho caracteres de «Depresión del Guadalquivir» en parte de la dificultad, y esa no es la dificultad que se quiere medir.
- **Quitar el genérico del nombre mostrado** en vez de aceptarlo como alias: contradice el ADR 0002, donde el nombre oficial es el canónico y las otras formas son alias. El mapa sigue diciendo «Vertiente Mediterránea»; lo que cambia es lo que basta escribir.

## Consecuencias

- La regla general vive en `loQueDistingue`, en `src/partida/partida.ts`, y se aplica al nombre esperado y a lo escrito. Quita `el`, `la`, `los`, `las`, `de`, `del`, `y`, `e`, `al`, `l`, los guiones y los apóstrofos.
- `FORMAS_CORTAS` gana seis entradas: Vertiente Mediterránea, Cantábrica y Atlántica pierden el genérico; Depresión del Guadalquivir y Depresión del Ebro quedan en el río que las nombra; Turó de l'Home queda en Turó, que necesita entrada propia porque la regla general lo dejaría en «turohome».
- Esa tabla deja de ser «formas castellanas de topónimos oficiales del IGN» y pasa a ser «lo que basta escribir». Vive en `src/catalogo/catalogo.ts` junto a los nombres políticos y merece nombre nuevo cuando se toque.
- La regla general no crea ninguna colisión. Comprobados los cinco catálogos completos con todos sus alias, la única respuesta ambigua es «Moncayo», que vale para la Sierra del Moncayo y para el Pico, y que ya era ambigua antes de este ADR.
- Solo afecta a las Pruebas en las que la respuesta se escribe. En Localizar el alumno toca el mapa y no hay texto que comparar.
- Depresión del Ebro pasa a aceptar «Ebro», que es también el nombre de un río. No colisiona porque relieve e hidrografía son familias distintas y ninguna Prueba las mezcla; dejaría de ser cierto si algún día se juntaran.
