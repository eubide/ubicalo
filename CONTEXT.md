# Ubícalo

Web pública para que alumnos de ESO repasen la geografía de España señalando y nombrando lugares sobre un mapa mudo.

## Lenguaje

### Contenido

**Elemento**:
Lugar concreto del mapa que se pregunta: una provincia, una comunidad autónoma, una cordillera, una sierra, un pico, una vertiente, un río, un cabo, un golfo o el estrecho.
_Evitar_: accidente, lugar, zona, área

**Familia**:
Cada uno de los cuatro bloques en los que el alumno estudia y en los que se reparte la portada: Político, Relieve, Hidrografía y Costas.
_Evitar_: grupo, categoría, bloque

**Alcance**:
Qué Elementos entran en una Prueba dentro de su Familia, con el número de preguntas que trae: Comunidades (19) y Provincias (52); Picos (15), Cordilleras y sierras (29), Pertenencia (40), Todo (44) y Grandes unidades (14); Ríos (41), Pertenencia (24) y Todo (44); Cabos (13), Golfos (7) y Todo (20).
_Evitar_: tipo, categoría, capa

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
Alcance que construye el mapa físico desde la Meseta: se toca la Meseta, y acertarla abre sus cordilleras interiores y sus rebordes; cada reborde abre su Depresión, cada Depresión su Cordillera exterior, y Canarias cierra la partida. Se juega siempre en Localizar.
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
Lo que es un elemento dentro de su familia: cordillera o macizo, sierra, pico, Meseta o Depresión en el relieve; vertiente, río principal, río propio o afluente en la hidrografía; cabo, golfo o estrecho en las costas. Se ve en el icono, en la leyenda y en el enunciado de la pregunta.
_Evitar_: tipo, categoría, nivel

**Pertenencia**:
Alcance que pregunta en los dos sentidos, barajados: se muestra una Sierra o un Pico y se toca su Cordillera, o se muestra y destaca una Cordillera y se toca su Pico; en Hidrografía, de qué Río principal es cada Afluente. No existe en Costas, que no tiene jerarquía. Se juega siempre en Localizar.
_Evitar_: jerarquía, árbol, clasificación

**Altura**:
Los metros de un Pico. Solo se preguntan los de Moncayo, Aneto, Teide y Mulhacén, y no se eligen: van dentro de Picos y de Todo, y se responden escribiendo la cifra aunque la Prueba sea de Localizar.
_Evitar_: altitud, cota

**Todo**:
Alcance que recorre de una vez la Familia entera sobre un único mapa mudo: Cordillera → Sierra → Pico → Altura en Relieve, Vertiente → Río → Afluente en Hidrografía. Empieza con el nivel de arriba visible sin nombre; acertar un Elemento Desbloquea el siguiente nivel de esa rama. El alumno elige el orden y puede tener varias ramas abiertas a la vez. El de Costas es la excepción y no tiene niveles: sus Cabos y sus Golfos se ven todos desde el principio, porque la Familia no tiene jerarquía.
_Evitar_: examen, prueba final

**Desbloqueado**:
Estado de un Elemento de Todo o de Grandes unidades que ya se puede tocar y responder, porque los Elementos de los que depende están entre los Acertados. Antes de eso, ni se ve ni se pregunta. En Todo el alumno elige cuál responder; en Grandes unidades lo elige el motor.
_Evitar_: revelado, visible, disponible

**Vertiente**:
Mar al que van a parar los ríos de una zona: Cantábrica, Atlántica y Mediterránea; en el mapa se pulsa como una mancha de área. Reparte la tierra por cuencas y solo existe en Hidrografía: la costa no se reparte, sus Elementos se distinguen por Clase.
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

**Cabo**:
Tierra que se mete en el mar; en el mapa es un punto. Las tres puntas de la hoja oficial, Estaca de Bares, Tarifa y Europa, conservan su nombre pero se juegan como cabos.
_Evitar_: punta, saliente, promontorio

**Golfo**:
Mar que se mete en la tierra; en el mapa es la mancha de agua que hay delante del arco de costa que lo baña, entre los dos puntos que lo cierran. Es lo contrario de un Cabo y se dibuja al revés: el Cabo es tierra y es un punto, el Golfo es mar y es una mancha.
_Evitar_: bahía, ensenada, entrante

**Estrecho**:
El de Gibraltar, único de su Clase: el paso entre el Atlántico y el Mediterráneo. En el mapa es el agua entre las dos orillas, la de Cádiz desde Punta Camarinal y la africana de enfrente. La Punta de Tarifa no lo abre: es su parte más angosta. Se juega con los Golfos sin ser uno.
_Evitar_: paso, canal

**Nombre oficial**:
Nombre canónico de un elemento: en provincias y comunidades el que usa el mapa (Girona, Bizkaia); en cordilleras y picos el que usan los libros de texto (Cordillera Cantábrica, Torre Cerredo).
_Evitar_: nombre real, nombre original

**Alias**:
Otra forma aceptada del nombre de un elemento, normalmente la castellana (Gerona, Vizcaya).
_Evitar_: sinónimo, traducción

**Vecino**:
Elemento del mismo Alcance con el que otro se confunde, y de donde salen los Distractores: en lo político, el que comparte frontera; en el relieve, uno de los tres más cercanos; en los ríos, un hermano de cuenca, es decir, otro Afluente del mismo Río principal o, para el nivel de arriba, otro río de la misma Vertiente; en las costas, uno de los más cercanos siguiendo la costa. En Pertenencia, los Vecinos son los del Elemento que hay que tocar.
_Evitar_: limítrofe, colindante, cercano

**Contexto geográfico**:
Lo que se ve en el mapa de un Alcance y en ese Alcance nunca se pregunta; depende del Alcance, no es una lista fija. Los países que rodean España son contexto siempre. En el relieve lo son los ríos y, cuando no se tocan, las cordilleras en tono tenue. En los ríos no hay relieve de fondo: con 41 líneas sobre el mapa, las manchas de cordillera taparían lo que hay que tocar. En las costas tampoco hay relieve ni reparto de la tierra en zonas, que se probó y tapaba las manchas de agua, y sí los ríos en tenue: las desembocaduras del Ebro y del Guadiana son límites de Golfo.
_Evitar_: fondo, países vecinos

### Juego

**Alumno**:
Persona que juega.
_Evitar_: usuario, jugador, estudiante

**Dirección**:
En qué sentido se pregunta un Alcance: Localizar o Nombrar. Los Alcances de apoyo llevan la suya fija y no la ofrecen.
_Evitar_: modo, tipo de juego, variante

**Localizar**:
Dirección en la que se muestra el nombre de un Elemento y el alumno lo señala en el mapa.
_Evitar_: nombre → ubicar, señalar, colocar

**Nombrar**:
Dirección en la que se ilumina un Elemento y el alumno escribe su nombre.
_Evitar_: ubicación → nombre, identificar

**Señales**:
El código con el que el mapa dice en qué estado está cada Elemento, el mismo en todos los Alcances. El color dice qué es: azul lo que está en juego, verde lo Acertado, rojo el Fallo, amarillo la ayuda. El borde dice si sigue en juego: punteado abierto, continuo cerrado. Un Elemento lleva como mucho una Señal, la de mayor prioridad, y lo que pasa ahora gana al historial. En una línea el borde es la funda que la envuelve. El halo de la Diana no es una Señal: no dice en qué estado está el Elemento, señala al que ya lleva la suya.
_Evitar_: leyenda, paleta, estilos, colores

**Diana**:
El Elemento que se pregunta ahora, marcado sobre el mapa. En Nombrar es el que el alumno tiene que nombrar; en Pertenencia, la Cordillera que se muestra para preguntar por su Pico. Solo se toca cuando la Dirección es Localizar. Cuando es un punto o una línea late un halo encima, porque un Cabo mide ocho píxeles sobre novecientos sesenta de mapa y su color es el de sus vecinos; una mancha se ve sola y no lo lleva. El halo se queda quieto si el alumno ha pedido menos animación al sistema.
_Evitar_: objetivo, foco, iluminado, destacado

**Frontera**:
Los Elementos Desbloqueados que el alumno todavía no ha acertado: lo que puede tocar en este turno. Crece con cada Acierto y solo se muestra donde el alumno elige: en Todo y, hasta que entrega, en el Simulacro, donde es el mapa entero.
_Evitar_: candidatos, disponibles, siguiente nivel, por responder

**Tentativa**:
El Elemento que el alumno tiene apuntado y todavía sin juzgar: el toque pendiente de confirmar con el dedo, la forma que se está respondiendo en Todo, o el cauce que se llevaría el clic del ratón. Sobre una línea es lo único que da puntería, porque el toque se resuelve por cercanía y en una confluencia hay varias bajo el dedo.
_Evitar_: selección, elegido, activo

**Prueba**:
Una Familia, un Alcance y una Dirección, por ejemplo Político · Provincias · Localizar. Es lo que se pulsa en la portada.
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
El nombre de un Elemento escrito sobre el mapa. En los Alcances de Hidrografía lo deja puesto cada Acierto, porque el examen de ríos se entrega como un mapa rotulado y lo que no tiene Rótulo es lo que falta. En el Repaso aparecen sobre lo fallado y se tocan para descartarlos.
_Evitar_: etiqueta, label, leyenda

**Pista**:
Las cuatro opciones que se ofrecen al escribir la respuesta, a petición del alumno o tras un fallo. Resolver con pista no cuenta como acierto.
_Evitar_: ayuda, opciones

**Pista de área**:
Ayuda sobre el mapa que acompaña a una pregunta tras un Repaso: se iluminan la comunidad autónoma que contiene la provincia o los Vecinos del elemento en los demás Alcances; en Pertenencia, los Vecinos de lo que hay que tocar. Resolver con ella cuenta como acierto con pista.
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

### Examen

**Familia elegida**:
La Familia de la que el alumno dice que se examina. La portada la pregunta una vez, la recuerda entre visitas y gira sobre ella; solo el alumno la cambia, y cambiarla no borra lo que el Dominio recuerda de la anterior. Un enlace del profesor puede traerla ya elegida para quien todavía no tiene ninguna.
_Evitar_: familia activa, familia actual, asignatura

**Práctica libre**:
Las Pruebas, con sus Marcas y sus Retos, plegadas en la portada bajo la Familia elegida. Tolera la tilde y la errata, y en este tramo no escribe en el Dominio. Quien no quiere elegir Familia la abre con «Solo quiero mirar», y entonces ve las Pruebas de las cuatro.
_Evitar_: modo libre, entrenamiento, catálogo

**Juicio estricto**:
Forma de juzgar el texto escrito como lo juzga el profesor: la tilde que falta y la errata son Fallo, y el Fallo lleva su tipo, que es tilde, errata u otro. Siguen valiendo los Alias, las formas cortas, las mayúsculas indistintas y las palabras que no distinguen. Solo lo usan la Tanda y el Simulacro; las Partidas de las Pruebas siguen tolerando la tilde y la errata. En una Tanda, un Fallo de tilde o de errata no abre la Pista: va directo a la Corrección, que lo nombra.
_Evitar_: modo examen, corrección dura, ortografía

**Dominio**:
Lo que la aplicación recuerda de cada Elemento de un día para otro: si está sin ver, Flojo o Sabido, el día en que se vio por última vez, cuántas veces se ha fallado y cómo fue su último Fallo. Guarda también la Familia de la que se examina el alumno, y vive solo en su navegador.
_Evitar_: progreso, nivel, memoria, cajas

**Flojo**:
Estado de un Elemento cuya última respuesta fue un Fallo o un acierto con Pista, o que solo se ha presentado rotulado y todavía no se ha preguntado.
_Evitar_: débil, pendiente, fallado

**Sabido**:
Estado de un Elemento cuya última respuesta fue un acierto sin ayuda con Juicio estricto. No es definitivo: un Fallo lo devuelve a Flojo, y lo que el alumno se sabe de verdad lo dice el Simulacro.
_Evitar_: dominado, aprendido, acertado

**Tanda**:
Unos cinco minutos de Nombrar sobre la Familia elegida, con hasta 12 Elementos de un solo mapa: primero los Flojos, después los Sabidos que no se han visto hoy y entre 3 y 6 nuevos mientras quede algo sin ver. Los nuevos llegan con el nivel de arriba entero y luego por ramas completas, y dentro de la Tanda se barajan. Solo se rellena con Sabidos de hoy cuando trae nuevos, así que al final puede ser corta. Se encadenan mientras quede algo Flojo o sin ver. Es una Partida con Juicio estricto que no da Vueltas: un Fallo vuelve una sola vez, tres preguntas después, y acertarlo ahí no lo saca de Flojo; nunca pasa de 18 preguntas, así que puede terminar con Flojos. No tiene Puntuación, reloj, Marca ni Reto, y cada respuesta se anota en el Dominio al darse.
_Evitar_: ronda, sesión, lote, repaso

**Simulacro**:
Lo único de la aplicación que se parece al examen: la Familia elegida entera sobre el mapa mudo, con todos sus Elementos visibles y sin nombre desde el principio. El alumno elige el orden, toca, escribe, y el Rótulo queda como lo escribió; puede cambiarlo hasta entregar. No hay Pista, Corrección ni Repaso, y nada se juzga hasta la entrega, que llega cuando el alumno quiere o cuando se acaban los 20 minutos. Se corrige con Juicio estricto y da una nota lineal sobre 10, porque un fallo no resta; un Elemento en blanco no es un Fallo. La primera vez se llama «¿Qué te sabes ya?» y no lleva cuenta atrás. Alimenta el Dominio y sobrevive a un corte. El de Político son dos mapas, Comunidades y Provincias, sobre una sola cuenta atrás: un conmutador cambia de uno a otro sin perder lo escrito, porque tocar Zaragoza no dice si se quiere escribir Zaragoza o Aragón; la Nota es una sola, sobre los 71.
_Evitar_: examen, prueba final, test

**Nota**:
El resultado de un Simulacro: aciertos entre total, sobre 10 y con un decimal, siempre junto a «sobre los de Ubícalo», porque no hay lista oficial. La de la primera vez, sin reloj, se guarda pero no se enseña como nota: se cuenta en positivo. No es la Puntuación de una Partida.
_Evitar_: puntuación, calificación, score

**Presentación**:
Lo primero de una Tanda que trae nuevos: se enseñan rotulados sobre el mapa, con el mecanismo del Repaso, y no se pregunta nada hasta que el alumno los descarta. Presentar un Elemento lo deja en Flojo.
_Evitar_: tutorial, introducción, lección

**Hoja**:
El mapa mudo de un Alcance en papel A4, con cada Elemento marcado por su Número y una lista del 1 al N con una línea en blanco para escribir a mano. Es lo único de la aplicación que no se parece al examen sino que lo es. La Familia elegida se imprime en una Hoja por cada Alcance que examina su Simulacro, y ninguna guarda nada: no es una Partida.
_Evitar_: ficha, PDF, impresión, lámina

**Número**:
Lo que lleva una forma en la Hoja en lugar de su Rótulo, porque sobre un Cabo de ocho píxeles no cabe un nombre a mano. Sale de dónde cae la forma en el papel, leyendo de arriba abajo y de izquierda a derecha, y no del orden del catálogo, que en Provincias es casi alfabético y delataría la respuesta. Una Altura no tiene Número: va como segundo hueco de la línea de su Pico.
_Evitar_: índice, orden, etiqueta

## Relaciones

- Una **Familia** agrupa varios **Alcances**, y un **Alcance** agrupa muchos **Elementos**; cada **Elemento** tiene un **Nombre oficial** y cero o más **Alias**
- Una **Prueba** es un **Alcance** jugado en una **Dirección**; cada **Prueba** tiene como mucho una **Marca**
- Cada mancha de **Grandes unidades** tiene un **Papel**, y ese **Papel** le da su color en la **Rampa de altitud**
- Cada **Elemento** del mapa lleva como mucho una **Señal**; la **Diana**, la **Frontera** y la **Tentativa** son tres de ellas
- Una **Partida** juega una **Prueba** en una o más **Vueltas**, y termina cuando no quedan **Pendientes** o por **Abandono**
- Una **Partida** terminada por **Abandono** nunca fija **Marca** ni genera **Reto**
- Una **Pista** contiene el **Elemento** correcto y tres **Distractores**, preferentemente **Vecinos**
- Cada **Vertiente** recoge varios **Ríos principales** y **Ríos propios**; cada **Río principal** recoge varios **Afluentes**
- Un **Afluente** desemboca en un **Río principal** o en otro **Afluente**, pero siempre se pregunta por el **Río principal** de su cuenca
- La Familia **Costas** son veinticinco **Elementos** sueltos de dos **Clases**, dieciocho **Cabos** y siete **Golfos**, sin nada que los agrupe
- Un **Golfo** es la mancha de mar que hay delante de la costa, entre los dos puntos que lo cierran, y cada uno de esos dos puntos es un **Cabo** o un límite declarado a mano
- El alumno tiene como mucho una **Familia elegida**, y el **Dominio** la guarda junto a lo que recuerda de cada **Elemento**
- Cada **Elemento** está en el **Dominio** sin ver, **Flojo** o **Sabido**
- Un **Fallo** juzgado con **Juicio estricto** lleva su tipo: tilde, errata u otro
- Una **Tanda** sale del **Dominio**: repasa lo **Flojo** y lo **Sabido** otro día, y trae **Elementos** nuevos
- Un **Simulacro** mide la **Familia elegida** entera y deja en el **Dominio** lo acertado como **Sabido** y lo demás como **Flojo**; la **Tanda** siguiente trabaja lo que destapa
- Una **Familia elegida** se imprime en una **Hoja** por cada **Alcance** que examina su **Simulacro**, y cada **Elemento** de esa **Hoja** lleva un **Número** en lugar de su **Rótulo**

## Ambigüedades resueltas

- "Regiones" en la idea original significa comunidades autónomas, no regiones naturales.
- "Montañas" en la idea original es la Familia Relieve: **Cordilleras**, **Sierras** y **Picos** sobre el mapa, más **Pertenencia** y **Altura** como apoyo. La **Meseta** y las **Depresiones** no son montañas: se juegan aparte, en **Grandes unidades**.
- El listado de relieve son los apuntes del alumno desde "Macizo / sierra", con un pico por cordillera para darle simetría; el examen real es rellenar un mapa mudo físico con ríos.
- El Alcance que recorre la Familia entera se llama **Todo**, no "Examen" ni "Simulacro": lo que lo distingue de los demás es cuánto abarca, que es de lo que habla un Alcance.
- "Tipo de prueba" mezclaba tres conceptos: la **Familia** (qué bloque), el **Alcance** (cuánto de ese bloque) y la **Dirección** (en qué sentido).
- La **Dirección** se rotula **Localizar** y **Nombrar**, no "Señalar": comparte raíz con **Señales**, que es el código de color y borde del mapa.
- El listado de ríos de los apuntes está ordenado geográficamente, no por pertenencia: coloca el Huerva y el Jiloca lejos del Ebro, y el Turia, el Júcar y el Segura entre los **Afluentes** del Ebro sin serlo. La cuenca de cada río sale de la hidrografía real, no del orden de la lista: el Cinca desemboca en el Segre, el Jiloca en el Jalón y el Záncara en el Cigüela, y los tres se preguntan por su **Río principal**.
- El río que el alumno se saltó al copiar la lista se rellena con el Tiétar por su posición; queda marcado en el dato como añadido nuestro hasta que el profesor confirme cuál era.
- "Vertiente" es el nivel de arriba de los ríos, no un Alcance suelto: con tres **Elementos** no da para una **Partida**, así que solo se juega dentro de **Todo**.
- El listado de cabos y golfos llama "vertientes" a sus tres grupos, pero reparten la costa de otra manera que las tres **Vertientes** de Hidrografía. La palabra se queda en Hidrografía, y la costa no se reparte en nada.
- **Costas es la única Familia sin jerarquía.** Sus veinticinco **Elementos** se distinguen por **Clase**: dieciocho **Cabos** y siete **Golfos**. Hubo cinco tramos de costa que hacían de nivel de arriba, y se quitaron porque no tienen canon, porque preguntarlos era examinar de un reparto que nos inventamos, y porque sobre el mapa tapaban las manchas de agua en vez de orientar.
- Las **Puntas** de Estaca de Bares, Tarifa y Europa no son una Clase: conservan su **Nombre oficial** y se juegan como **Cabos**, porque el examen no las distingue y el Nomenclátor del IGN tampoco.
- El canon de Costas es la hoja oficial del profesor, no un listado: entra lo que rotula y sale lo que no, aunque caiga fuera de España. «Bahía Cádiz» es la bahía y no el Golfo de Cádiz, y lo que hay junto a la Nao es una isla dibujada, no el Cabo de San Antonio.
- El **Estrecho** de Gibraltar sí es una Clase, aunque tenga un solo **Elemento**: el Nomenclátor lo agrupa con los golfos, y llamarlo golfo sería enseñar algo falso.
