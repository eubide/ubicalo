# Ubícalo

Web pública para que alumnos de ESO repasen la geografía de España señalando y nombrando lugares sobre un mapa mudo.

## Lenguaje

### Contenido

**Elemento**:
Lugar concreto del mapa que se pregunta: una provincia o una comunidad autónoma.
_Evitar_: accidente, lugar, zona, área

**Tipo**:
Categoría de elementos que se juega por separado: comunidades autónomas, provincias y, más adelante, ríos, montañas, cabos y golfos.
_Evitar_: tipo de prueba, categoría, capa

**Nombre oficial**:
Nombre canónico de un elemento, el que usa el mapa (Girona, Bizkaia).
_Evitar_: nombre real, nombre original

**Alias**:
Otra forma aceptada del nombre de un elemento, normalmente la castellana (Gerona, Vizcaya).
_Evitar_: sinónimo, traducción

**Vecino**:
Elemento del mismo tipo que comparte frontera con otro.
_Evitar_: limítrofe, colindante

**Contexto geográfico**:
Países que rodean España en el mapa; se ven, pero nunca se preguntan.
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
Ayuda sobre el mapa que acompaña a una pregunta tras un Repaso: se iluminan la comunidad autónoma que contiene la provincia o los Vecinos de la comunidad. Resolver con ella cuenta como acierto con pista.
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
- "Tipo de prueba" mezclaba dos conceptos: el **Tipo** (qué se pregunta) y la **Prueba** (tipo más modo).
