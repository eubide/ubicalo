# Ubícalo

Web pública para que alumnos de ESO repasen la geografía de España señalando y nombrando lugares sobre un mapa mudo.

## Lenguaje

### Contenido

**Elemento**:
Lugar concreto del mapa que se pregunta: una provincia, una comunidad autónoma, una cordillera, una sierra, un pico, una vertiente o un río.
_Evitar_: accidente, lugar, zona, área

**Tipo**:
Categoría de elementos que se juega por separado, agrupada en familias: político (comunidades autónomas, provincias), relieve (grandes unidades, cordilleras y sierras, picos, jerarquía, alturas, simulacro de relieve), hidrografía (ríos, jerarquía de ríos, simulacro de ríos) y, más adelante, cabos y golfos.
_Evitar_: tipo de prueba, categoría, capa

**Cordillera**:
Unidad montañosa de primer nivel de los apuntes (Pirineos, Sistema Ibérico, Montes de Toledo, Montañas de Canarias); se pulsa como una mancha de área.
_Evitar_: sistema montañoso, montaña

**Meseta**:
Núcleo central de la Península, la mancha mayor del mapa; no es una Cordillera y solo se juega en Grandes unidades.
_Evitar_: submeseta, altiplano, llanura central

**Depresión**:
Tierra baja encajada entre un Reborde de la Meseta y una Cordillera exterior: la del Ebro y la del Guadalquivir.
_Evitar_: valle, cuenca, llanura

**Papel**:
El lugar que ocupa una mancha respecto a la Meseta, tal como lo clasifica la capa del IGN: meseta, interior, reborde, depresión, exterior o volcánico. Decide su color en la rampa de altitud y el orden en que se Desbloquea.
_Evitar_: clase, categoría, unidad de relieve

**Grandes unidades**:
Tipo que construye el mapa físico desde la Meseta: se toca la Meseta, y acertarla abre sus cordilleras interiores y sus rebordes; cada reborde abre su Depresión, cada Depresión su Cordillera exterior, y Canarias cierra la partida. Se juega siempre en Nombre → ubicar.
_Evitar_: unidades del relieve, capas, clasificación

**Rampa de altitud**:
Los seis colores de los Papeles, del verde de las Depresiones al marrón de las Cordilleras exteriores. Una mancha solo toma su color al acertarla: hasta entonces se ve en gris, para que el mapa no dé la respuesta. Al acertarla destella antes en el verde del Acierto, porque pasar de gris a ocre es un cambio demasiado suave para leerse como tal.
_Evitar_: paleta, leyenda, hipsometría

**Sierra**:
Unidad montañosa que pertenece a una Cordillera (Gredos, Picos de Europa, Montseny, las tres partes del Pirineo); en el mapa es un círculo y se juega junto a las cordilleras.
_Evitar_: subunidad, macizo, montaña

**Pico**:
Cumbre concreta que pertenece a una Cordillera; en el mapa es un triángulo (Aneto, Mulhacén, Teide).
_Evitar_: cima, cumbre, montaña

**Clase**:
Lo que es un elemento dentro de su familia: cordillera o macizo, sierra, pico, Meseta o Depresión en el relieve; vertiente, río principal, río propio o afluente en la hidrografía. Se ve en el icono, en la leyenda y en el enunciado de la pregunta.
_Evitar_: tipo, categoría, nivel

**Jerarquía**:
Tipo de apoyo que pregunta en los dos sentidos, barajados: se muestra una Sierra o un Pico y se toca su Cordillera, o se muestra y destaca una Cordillera y se toca su Pico. Se juega siempre en Nombre → ubicar.
_Evitar_: árbol, clasificación, pertenencia

**Altura**:
Tipo de apoyo en el que se muestra un Pico y el alumno escribe sus metros; solo se preguntan Moncayo, Aneto, Teide y Mulhacén. Se juega siempre en Ubicación → nombre.
_Evitar_: altitud, cota

**Simulacro**:
Tipo que recorre de una vez la jerarquía completa de una familia sobre un único mapa mudo: Cordillera → Sierra → Pico → Altura en el Simulacro de relieve, Vertiente → Río → Afluente en el de ríos. Empieza con el nivel de arriba visible sin nombre; acertar un Elemento Desbloquea el siguiente nivel de esa rama. El alumno elige el orden y puede tener varias ramas abiertas a la vez.
_Evitar_: examen, prueba final, test

**Desbloqueado**:
Estado de un Elemento del Simulacro o de Grandes unidades que ya se puede tocar y responder, porque los Elementos de los que depende están entre los Acertados. Antes de eso, ni se ve ni se pregunta. En el Simulacro el alumno elige cuál responder; en Grandes unidades lo elige el motor.
_Evitar_: revelado, visible, disponible

**Vertiente**:
Mar al que van a parar los ríos de una zona: Cantábrica, Atlántica y Mediterránea; en el mapa se pulsa como una mancha de área.
_Evitar_: cuenca, demarcación, ladera

**Río principal**:
Río que recoge Afluentes y desemboca en el mar: Ebro, Duero, Tajo, Guadiana, Guadalquivir y Miño; en el mapa es una línea.
_Evitar_: río grande, colector, río madre

**Afluente**:
Río que desemboca en otro río en vez de en el mar; se pregunta siempre por el Río principal de su cuenca, aunque desagüe en otro Afluente.
_Evitar_: tributario, subafluente, brazo

**Río propio**:
Río que llega al mar por sí solo sin ser Río principal, porque no se le pregunta ningún Afluente: Ter, Llobregat, Turia, Júcar, Segura, Nalón, Nervión, Bidasoa, Tambre, Odiel y Tinto.
_Evitar_: río menor, río costero, río suelto

**Nombre oficial**:
Nombre canónico de un elemento: en provincias y comunidades el que usa el mapa (Girona, Bizkaia); en cordilleras y picos el que usan los libros de texto (Cordillera Cantábrica, Torre Cerredo).
_Evitar_: nombre real, nombre original

**Alias**:
Otra forma aceptada del nombre de un elemento, normalmente la castellana (Gerona, Vizcaya).
_Evitar_: sinónimo, traducción

**Vecino**:
Elemento del mismo tipo con el que otro se confunde, y de donde salen los Distractores: en lo político, el que comparte frontera; en el relieve, uno de los tres más cercanos; en los ríos, un hermano de cuenca, es decir, otro Afluente del mismo Río principal o, para el nivel de arriba, otro río de la misma Vertiente. En las Jerarquías, los Vecinos son los del Elemento que hay que tocar.
_Evitar_: limítrofe, colindante, cercano

**Contexto geográfico**:
Lo que se ve en el mapa de un Tipo y en ese Tipo nunca se pregunta; depende del Tipo, no es una lista fija. Los países que rodean España son contexto siempre. En el relieve lo son los ríos y, cuando no se tocan, las cordilleras en tono tenue. En los ríos no hay relieve de fondo: con 41 líneas sobre el mapa, las manchas de cordillera taparían lo que hay que tocar.
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

**Señales**:
El código con el que el mapa dice en qué estado está cada Elemento, el mismo en todos los Tipos. El color dice qué es: azul lo que está en juego, verde lo Acertado, rojo el Fallo, amarillo la ayuda. El borde dice si sigue en juego: punteado abierto, continuo cerrado. Un Elemento lleva como mucho una Señal, la de mayor prioridad, y lo que pasa ahora gana al historial. En una línea el borde es la funda que la envuelve.
_Evitar_: leyenda, paleta, estilos, colores

**Diana**:
El Elemento que se pregunta ahora, marcado sobre el mapa. En Ubicación → nombre es el que el alumno tiene que nombrar; en Jerarquía, la Cordillera que se muestra para preguntar por su Pico. Solo se toca cuando el Modo es Nombre → ubicar.
_Evitar_: objetivo, foco, iluminado, destacado

**Frontera**:
Los Elementos Desbloqueados que el alumno todavía no ha acertado: lo que puede tocar en este turno. Crece con cada Acierto y solo se muestra donde el alumno elige, es decir en el Simulacro.
_Evitar_: candidatos, disponibles, siguiente nivel, por responder

**Tentativa**:
El Elemento que el alumno tiene apuntado y todavía sin juzgar: el toque pendiente de confirmar con el dedo, la forma que se está respondiendo en el Simulacro, o el cauce que se llevaría el clic del ratón. Sobre una línea es lo único que da puntería, porque el toque se resuelve por cercanía y en una confluencia hay varias bajo el dedo.
_Evitar_: selección, elegido, activo

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
Respuesta incorrecta; el elemento sigue pendiente y se ve en rojo sobre el mapa mientras lo siga.
_Evitar_: error

**Rótulo**:
El nombre de un Elemento escrito sobre el mapa. En los Tipos de hidrografía lo deja puesto cada Acierto, porque el examen de ríos se entrega como un mapa rotulado y lo que no tiene Rótulo es lo que falta. En el Repaso aparecen sobre lo fallado y se tocan para descartarlos.
_Evitar_: etiqueta, label, leyenda

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
- Cada mancha de **Grandes unidades** tiene un **Papel**, y ese **Papel** le da su color en la **Rampa de altitud**
- Cada **Elemento** del mapa lleva como mucho una **Señal**; la **Diana**, la **Frontera** y la **Tentativa** son tres de ellas
- Una **Partida** juega una **Prueba** en una o más **Vueltas**, y termina cuando no quedan **Pendientes** o por **Abandono**
- Una **Partida** terminada por **Abandono** nunca fija **Marca** ni genera **Reto**
- Una **Pista** contiene el **Elemento** correcto y tres **Distractores**, preferentemente **Vecinos**
- Cada **Vertiente** recoge varios **Ríos principales** y **Ríos propios**; cada **Río principal** recoge varios **Afluentes**
- Un **Afluente** desemboca en un **Río principal** o en otro **Afluente**, pero siempre se pregunta por el **Río principal** de su cuenca

## Ambigüedades resueltas

- "Regiones" en la idea original significa comunidades autónomas, no regiones naturales.
- "Montañas" en la idea original son los tipos de relieve: **Cordilleras**, **Sierras** y **Picos** sobre el mapa, más **Jerarquía** y **Altura** como apoyo. La **Meseta** y las **Depresiones** no son montañas: se juegan aparte, en **Grandes unidades**.
- El listado de relieve son los apuntes del alumno desde "Macizo / sierra", con un pico por cordillera para darle simetría; el examen real es rellenar un mapa mudo físico con ríos.
- El Tipo que simula ese examen se llama **Simulacro**, no "Examen": ese nombre ya estaba reservado como sinónimo a evitar de **Prueba**, para no llamar "examen" a un repaso suelto de comunidades o de picos.
- "Tipo de prueba" mezclaba dos conceptos: el **Tipo** (qué se pregunta) y la **Prueba** (tipo más modo).
- El listado de ríos de los apuntes está ordenado geográficamente, no por pertenencia: coloca el Huerva y el Jiloca lejos del Ebro, y el Turia, el Júcar y el Segura entre los **Afluentes** del Ebro sin serlo. La cuenca de cada río sale de la hidrografía real, no del orden de la lista: el Cinca desemboca en el Segre, el Jiloca en el Jalón y el Záncara en el Cigüela, y los tres se preguntan por su **Río principal**.
- El río que el alumno se saltó al copiar la lista se rellena con el Tiétar por su posición; queda marcado en el dato como añadido nuestro hasta que el profesor confirme cuál era.
- "Vertiente" es el nivel de arriba de los ríos, no un Tipo suelto: con tres **Elementos** no da para una **Partida**, así que solo se juega dentro del **Simulacro** de ríos.
