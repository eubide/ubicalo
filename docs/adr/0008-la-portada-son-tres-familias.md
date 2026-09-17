# La portada son tres familias, no once Tipos

La pantalla de inicio deja de listar once Tipos en una rejilla plana y pasa a tres tarjetas, una por familia: Político, Relieve e Hidrografía. Dentro de cada tarjeta hay una lista de Alcances con el número de preguntas de cada uno, y en los que admiten las dos, la dirección se elige ahí mismo. Jerarquía, Altura y Simulacro dejan de ser Tipos: la primera pasa a ser el Alcance Pertenencia de su familia, la segunda va siempre pegada a Picos y no se elige, y el tercero es el Alcance Todo.

Once entradas iguales decían que hay once contenidos, y no los hay. Los identificadores de los catálogos dicen que hay tres conjuntos vistos de distintas maneras. En Relieve, Cordilleras y sierras (29), Picos (11) y Altura (4) suman exactamente el Simulacro (44), y Jerarquía es ese mismo conjunto menos las alturas; el único que aporta Elementos propios es Grandes unidades, con la Meseta y las dos Depresiones. En Hidrografía, Jerarquía de ríos son exactamente los afluentes de Ríos, y el Simulacro es Ríos más las tres Vertientes. Solo Político tiene dos conjuntos disjuntos, Comunidades (19) y Provincias (52).

El Modo se elegía arriba, en un radio que parecía global y que seis de los once Tipos ignoraban por llevar Modo fijo: cambiarlo no hacía nada en más de la mitad de la pantalla, y el parche era una etiqueta pequeña dentro del botón. Al bajar la dirección al Alcance, cada entrada de una tarjeta es una Prueba entera y no queda ningún ajuste que mienta. Las etiquetas pasan de «Nombre → ubicar» y «Ubicación → nombre» a dos verbos, Localizar y Nombrar: dos sustantivos y una flecha obligan a descifrar antes de elegir, y esta pantalla se diseña a ancho de móvil.

Cada Alcance lleva delante su número de preguntas, que va de 4 a 52 y que hasta ahora no se veía en ninguna parte. Es la primera pregunta del alumno que tiene diez minutos antes de cenar, y la Marca no la responde: la Marca dice lo bien que fue la última vez, no cuánto dura. Van las dos en la misma línea, el número siempre y la Marca detrás cuando existe.

## Opciones consideradas

- **Arreglar solo el aspecto y dejar las once entradas**: tipografía, aire y color sobre la rejilla de hoy. Corrige que la portada parezca un formulario, pero deja intacto lo que hace que once opciones cuesten de leer, que es que no son comparables entre sí.
- **Reagrupar en Practicar, Afinar y Examen** en vez de en las tres familias: separa mejor lo que pesa distinto, pero tira el vocabulario de `CONTEXT.md` y, sobre todo, el reparto por el que el alumno estudia. Las familias son los bloques de sus apuntes.
- **Recortar la portada a las cinco Pruebas base** y plegar el resto tras un «Más»: esconder Altura, que son cuatro preguntas, es esconder lo más barato que hay en la app. Lo que sobraba no era la cantidad de entradas sino que todas se vieran iguales.
- **Dos pantallas, familia y luego Pruebas**: convierte tres tarjetas en tres destinos y añade un paso de navegación para once cosas que caben en una columna.
- **Fundir Cordilleras y sierras con Picos** en un único Alcance de 40, que es exactamente el conjunto de Jerarquía: mezcla veintinueve manchas de área con once triángulos en una sola Prueba, y el alumno que falla ya no sabe si le falla el relieve o le fallan los picos. Ahí la separación da información.
- **Casillas combinables dentro de la tarjeta**, «preguntar también la pertenencia» y «preguntar también la altura»: con dos casillas y cuatro Alcances salen doce Pruebas por familia, cada una con su Marca. Vuelve por otro camino al problema que este ADR resuelve.
- **Un interruptor de dirección por familia**, o quitar la dirección de la portada y decidirla dentro de la Partida: el primero repite el ajuste que miente, en pequeño; el segundo esconde media app, y el alumno que no sabe que existe nunca practicará la dirección que peor lleva.
- **Elegir el Alcance solo al terminar la Partida**, encadenando una Prueba con la siguiente: es buena para reencadenar y se conserva por eso, pero como única puerta obliga a jugar cuarenta y cuatro preguntas de Relieve entero para llegar a los once Picos.
- **Una miniatura del mapa por Tipo**: la forma más clara de decir qué se juega, y once dibujos que mantener; trece en cuanto entren cabos y golfos.
- **Traducir las Marcas viejas con una tabla de equivalencias**, o conservar los identificadores de hoy por dentro y cambiar solo la presentación: las dos evitan la pérdida, y las dos arrastran para siempre un modelo que este ADR declara equivocado.

## Consecuencias

- `Tipo` y `Modo` dejan de ser el par que identifica una Prueba. La sustituyen familia, Alcance y dirección, y `src/prueba/prueba.ts` deja de necesitar `modoFijoDeTipo`: un Alcance que no admite las dos direcciones simplemente no las ofrece.
- Los Alcances quedan así: Político, Comunidades (19) y Provincias (52); Relieve, Picos (15), Cordilleras y sierras (29), Pertenencia (40), Todo (44, en cascada) y Grandes unidades (14); Hidrografía, Ríos (41), Pertenencia (24) y Todo (44, en cascada). Pertenencia, Todo y Grandes unidades tienen dirección fija.
- Altura desaparece como Prueba suelta. Picos pasa de once preguntas a quince: las once ubicaciones y las cuatro cifras. Quien quiera repasar solo las alturas ya no tiene por dónde, y a cambio nadie se encuentra una Prueba de cuatro preguntas entre otras de cuarenta.
- El registro de Marcas guardado en `localStorage` bajo `ubicalo:competicion` se tira. Las claves son `tipo+modo` y ya no describen nada; migrarlas costaría una tabla permanente para salvar los resultados de una tarde.
- Un Reto compartido antes del cambio lleva en la URL un `tipo` que ya no existe. Se reconoce y se responde con una línea que dice que caducó, en vez de entrar a la portada como si el enlace estuviera roto.
- La pantalla de fin gana el siguiente Alcance de la familia como acción principal, y repetir y volver como secundarias. Es donde se encadena una Prueba con la siguiente.
- Se recuerda el último Alcance jugado, para que la segunda tarde empiece donde acabó la primera.
- Cada familia toma un color propio en la portada, y las tarjetas lo comparten. Adelanta el código de color que el alumno va a usar dentro y saca la pantalla del gris; el mapa de España aparece arriba, pequeño y junto al nombre, como marca y no como fondo.
- La portada se diseña a 375 px de ancho. Si tres tarjetas con sus Alcances funcionan en una columna de móvil, en escritorio funcionan; al revés no.
- En la primera visita la portada explica qué es la app y cómo funciona; esa línea desaparece en cuanto hay una Partida jugada. Hasta ahora el nombre Ubícalo solo vivía en el `<title>` de la pestaña.
- `CONTEXT.md` pierde las entradas de Jerarquía, Altura y Simulacro como Tipos y gana Familia, Alcance y Pertenencia. La dirección se rotula Localizar y Nombrar; Señalar se descarta por compartir raíz con Señales, que en el glosario es el código de color y borde del mapa.
- Los catálogos de Comunidades y Provincias usan los identificadores `01` a `19` para Elementos distintos: la comunidad `02` es Aragón y la provincia `02` es Albacete. Hoy no rompe nada porque una Partida vive en un solo conjunto, pero es una colisión real y este ADR no la resuelve.
