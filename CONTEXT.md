# Ubícalo

Web pública para que alumnos de ESO repasen la geografía de España señalando y nombrando lugares sobre un mapa mudo.

## Lenguaje

### Contenido

**Elemento**:
Lugar concreto del mapa que se pregunta: una provincia, una comunidad autónoma, una cordillera, una sierra o un pico.
_Evitar_: accidente, lugar, zona, área

**Tipo**:
Categoría de elementos que se juega por separado: comunidades autónomas, provincias, cordilleras y sierras, picos, jerarquía, alturas y, más adelante, ríos, cabos y golfos.
_Evitar_: tipo de prueba, categoría, capa

**Cordillera**:
Unidad montañosa de primer nivel de los apuntes (Pirineos, Sistema Ibérico, Montes de Toledo, Montañas de Canarias); se pulsa como una mancha de área.
_Evitar_: sistema montañoso, montaña, unidad de relieve

**Sierra**:
Unidad montañosa que pertenece a una Cordillera (Gredos, Picos de Europa, Montseny, las tres partes del Pirineo); en el mapa es un círculo y se juega junto a las cordilleras.
_Evitar_: subunidad, macizo, montaña

**Pico**:
Cumbre concreta que pertenece a una Cordillera; en el mapa es un triángulo (Aneto, Mulhacén, Teide).
_Evitar_: cima, cumbre, montaña

**Clase**:
Lo que es un elemento de relieve: cordillera o macizo, sierra o pico. Se ve en el icono, en la leyenda y en el enunciado de la pregunta.
_Evitar_: tipo, categoría, nivel

**Jerarquía**:
Tipo de apoyo que pregunta en los dos sentidos, barajados: se muestra una Sierra o un Pico y se toca su Cordillera, o se muestra y destaca una Cordillera y se toca su Pico. Se juega siempre en Nombre → ubicar.
_Evitar_: árbol, clasificación, pertenencia

**Altura**:
Tipo de apoyo en el que se muestra un Pico y el alumno escribe sus metros; solo se preguntan Moncayo, Aneto, Teide y Mulhacén. Se juega siempre en Ubicación → nombre.
_Evitar_: altitud, cota

**Nombre oficial**:
Nombre canónico de un elemento: en provincias y comunidades el que usa el mapa (Girona, Bizkaia); en cordilleras y picos el que usan los libros de texto (Cordillera Cantábrica, Torre Cerredo).
_Evitar_: nombre real, nombre original

**Alias**:
Otra forma aceptada del nombre de un elemento, normalmente la castellana (Gerona, Vizcaya).
_Evitar_: sinónimo, traducción

**Vecino**:
Elemento del mismo tipo que comparte frontera con otro; en el relieve, uno de los tres más cercanos, y en Jerarquía, un vecino de la Cordillera a la que pertenece.
_Evitar_: limítrofe, colindante, cercano

**Contexto geográfico**:
Lo que se ve en el mapa y nunca se pregunta: los países que rodean España y, en el relieve, los ríos principales y las cordilleras en tono tenue.
_Evitar_: fondo, países vecinos

### Juego

**Alumno**:
Persona que juega.
_Evitar_: usuario, jugador, estudiante

**Modo**:
Forma de preguntar los elementos de un tipo: Nombre → ubicar o Ubicación → nombre.
_Evitar_: tipo de juego, variante

**Nombre → ubicar**:
Modo en el que se muestra el nombre de un elemento y el alumno lo señala en el mapa.
_Evitar_: localizar, colocar

**Ubicación → nombre**:
Modo en el que se ilumina un elemento y el alumno escribe su nombre.
_Evitar_: ¿qué es esto?, identificar

**Prueba**:
Combinación de un tipo y un modo, por ejemplo provincias en Nombre → ubicar.
_Evitar_: test, examen, juego

**Partida**:
Una sesión de juego de una prueba, desde el primer elemento hasta que no queda ningún pendiente o hasta el abandono.
_Evitar_: ronda, intento

**Vuelta**:
Pasada por los elementos pendientes de una partida; la primera vuelta recorre todos los elementos del tipo.
_Evitar_: ronda, repetición

**Pendiente**:
Elemento de la partida que el alumno todavía no ha acertado sin ayuda.
_Evitar_: restante, por hacer

**Acierto a la primera**:
Elemento acertado sin ayuda en la primera vuelta.
_Evitar_: acierto directo

**Acierto en vuelta posterior**:
Elemento acertado sin ayuda después de haberlo fallado o resuelto con pista.
_Evitar_: acierto tardío, recuperación

**Fallo**:
Respuesta incorrecta; el elemento sigue pendiente.
_Evitar_: error

**Pista**:
Las cuatro opciones que se ofrecen en Ubicación → nombre, a petición del alumno o tras un fallo. Resolver con pista no cuenta como acierto.
_Evitar_: ayuda, opciones

**Pista de área**:
Ayuda sobre el mapa que acompaña a una pregunta tras un Repaso: se iluminan la comunidad autónoma que contiene la provincia o los Vecinos del elemento en los demás tipos; en Jerarquía, los Vecinos de lo que hay que tocar. Resolver con ella cuenta como acierto con pista.
_Evitar_: ayuda, zona

**Corrección**:
Panel temporal que sigue a un Fallo o a un acierto con pista y muestra lo que respondió el alumno junto al elemento correcto; se cierra solo y no se puede saltar.
_Evitar_: feedback, modal, aviso

**Racha de fallos**:
Número de preguntas falladas seguidas; un acierto sin ayuda la reinicia y un acierto con pista no la cambia.
_Evitar_: serie, racha mala

**Repaso**:
Pausa activa que abre una Racha de fallos de tres: muestra rotulados los elementos fallados de la racha para localizarlos antes de seguir.
_Evitar_: resumen, revisión

**Distractor**:
Opción incorrecta dentro de una pista.
_Evitar_: opción falsa, señuelo

**Abandono**:
Final de una partida con elementos pendientes, por decisión del alumno.
_Evitar_: rendirse, salir

### Competición

**Puntuación**:
Puntos obtenidos en una partida.
_Evitar_: score, nota

**Marca**:
Mejor partida terminada del alumno en una prueba: la de mayor puntuación y, a igualdad, la de menos tiempo.
_Evitar_: récord, high score, mejor resultado

**Reto**:
Invitación compartible a jugar una prueba con una marca a batir.
_Evitar_: desafío, challenge

## Relaciones

- Un **Tipo** agrupa muchos **Elementos**; cada **Elemento** tiene un **Nombre oficial** y cero o más **Alias**
- Una **Prueba** es un **Tipo** jugado en un **Modo**; cada **Prueba** tiene como mucho una **Marca**
- Una **Partida** juega una **Prueba** en una o más **Vueltas**, y termina cuando no quedan **Pendientes** o por **Abandono**
- Una **Partida** terminada por **Abandono** nunca fija **Marca** ni genera **Reto**
- Una **Pista** contiene el **Elemento** correcto y tres **Distractores**, preferentemente **Vecinos**

## Ambigüedades resueltas

- "Regiones" en la idea original significa comunidades autónomas, no regiones naturales.
- "Montañas" en la idea original son los tipos de relieve: **Cordilleras**, **Sierras** y **Picos** sobre el mapa, más **Jerarquía** y **Altura** como apoyo. La Meseta y las depresiones no son montañas y quedan para otro tipo.
- El listado de relieve son los apuntes del alumno desde "Macizo / sierra", con un pico por cordillera para darle simetría; el examen es rellenar un mapa mudo físico con ríos.
- "Tipo de prueba" mezclaba dos conceptos: el **Tipo** (qué se pregunta) y la **Prueba** (tipo más modo).
