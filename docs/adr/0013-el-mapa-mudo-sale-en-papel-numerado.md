# El mapa mudo sale en papel numerado

La Familia elegida se puede imprimir como **Hoja**: un A4 vertical con su mapa mudo, cada Elemento marcado con un **Número**, y debajo una lista del 1 al N con una línea en blanco para escribir cada nombre a mano. Una Hoja por cada Alcance que examina el Simulacro de esa Familia.

El examen del alumno es rellenar a mano un mapa mudo de papel. Hasta ahora lo más parecido que ofrecía Ubícalo era el Simulacro, que copia la condición —la Familia entera, veinte minutos, sin ayudas— pero no el soporte: se toca y se teclea. La Hoja es lo único del proyecto que no se parece al examen sino que lo es.

El ADR-0011 la dejó fuera de su tramo «hasta ver a alumnos usar esto», junto a otras seis cosas. Esa condición resultó no ser comprobable: no hay analítica (ADR-0001) ni canal abierto con los alumnos ni con el profesor, así que la señal que desbloqueaba la lista no iba a llegar. La Hoja sale de ahí porque es barata, es fiel, y no depende de medir nada.

## Opciones consideradas

- **Escribir el nombre encima de su forma en el mapa**, como en el examen de verdad: no cabe. Un Cabo mide ocho píxeles sobre novecientos sesenta y las Provincias pequeñas del norte no dan para una palabra manuscrita. El Número separa dónde está de cómo se llama, y el examen del profesor hace lo mismo cuando la forma es pequeña.
- **Numerar por el orden del catálogo**: los ids de Provincias van casi en orden alfabético, así que la hoja se convertía en un acróstico y dejaba de ser muda. El Número sale de dónde cae la forma en el papel, leyendo por bandas de arriba abajo y de izquierda a derecha.
- **Generar un PDF con una librería**: mete una dependencia en el paquete que se sirve para hacer lo que el navegador ya hace. La Hoja es una pantalla más con `@page` y `@media print`, y el navegador la convierte en PDF o la manda a la impresora.
- **Imprimir también el solucionario**: la Hoja es lo que el profesor reparte, y una hoja que trae las respuestas detrás no se puede repartir. Quien quiera corregirse tiene el Simulacro.
- **Llevar la leyenda de Clases al papel**: ocupa sitio y la forma ya distingue, que es lo que hace en pantalla. Se deja fuera hasta que alguien la eche en falta.

## Consecuencias

- **Una Hoja por Alcance del Simulacro**, que es lo que ya decide `alcancesDeExamen`: Político son dos, Comunidades (19) y Provincias (52); Relieve, Hidrografía y Costas una cada una, con 40, 44 y 20 Números.
- **Una Altura no lleva Número propio: va como segundo hueco de la línea de su Pico.** No tiene forma en el mapa, así que no se puede señalar. Es la única asimetría entre el Simulacro y la Hoja: Relieve cubre sus 44 respuestas con 40 Números.
- **Los Números que se pisan se apartan** antes de imprimirse, con una separación mínima de 20 píxeles sobre los 960 del mapa: el Cabo de la Nao y el de San Antonio están a cuatro.
- **La Hoja no comparte componente con el mapa de pantalla.** `Mapa.svelte` arrastra las Señales, la Diana, el toque y la Rampa de altitud, y en papel no existe ninguna de las cuatro. Comparten la proyección y poco más.
- **Blanco y negro, para tóner**: sin Rampa de altitud y sin los colores de las Señales. Cada Clase se distingue por su forma, como en pantalla: el Cabo es un punto, el Golfo una mancha con trama, el Pico un triángulo, la Sierra un círculo, el Río una línea. La **Vertiente** es la excepción y lleva el borde punteado: cubre media Península y con el trazo negro de los cauces su borde se leía como otro río.
- **`@page` es global y no se puede condicionar a una clase**, así que toda la aplicación pasa a imprimirse en A4 vertical. Hoy no afecta a nada más, porque no había nada imprimible.
- **Al recuadro de Ceuta y Melilla de la Hoja solo va lo que lleva `ciudadAutonoma`.** Es el dato del catálogo, no una posición: el Estrecho de Gibraltar cae a la misma altura que las dos ciudades, y reconocerlas por latitud y longitud se lo llevaría al recuadro.
- **La Hoja no escribe en el Dominio ni guarda nada.** No es una Partida ni un Simulacro: es papel.
- `CONTEXT.md` gana **Hoja** y **Número**.
