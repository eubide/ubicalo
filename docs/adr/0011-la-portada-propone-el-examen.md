# La portada propone el examen

La portada deja de pedirle al alumno que decida qué estudiar. Pregunta una vez «¿De qué te examinas?», se queda con esa Familia y desde ahí ofrece dos cosas: un Simulacro, que es la Familia entera sobre el mapa mudo, sin ayudas y en 20 minutos, y Tandas de unos 5 minutos de Nombrar con lo que el alumno falla y lo que aún no ha visto. Las Pruebas de hoy siguen ahí, plegadas bajo Práctica libre, con sus Marcas y sus Retos. Lo que el alumno va sabiendo lo recuerda el **Dominio**, y lo que escribe en el Simulacro y en las Tandas se juzga con **Juicio estricto**, como lo juzga su profesor.

Los alumnos casi no usan Ubícalo, y la aplicación no se parece en nada al examen que preparan. Así lo describe el profesor:

| Dato | Valor | Dónde pesa |
|---|---|---|
| Duración | 20 minutos | cuenta atrás del Simulacro |
| Político | Comunidades y Provincias | una sola Familia con dos mapas |
| Tilde que falta | cuenta como falta | Juicio estricto |
| Un fallo | no resta | aviso de blancos; nota lineal |
| Lista oficial | no hay | la nota es «sobre los de Ubícalo» |

Se estudia en dos o tres días, de forma intensiva, y se entrega un mapa mudo de una sola Familia rellenado a mano. Frente a eso, la portada de hoy ofrece 4 Familias, 13 Alcances y 19 botones del mismo peso a quien menos sabe qué le conviene; lo más cercano al examen es **Todo**, que desbloquea en cascada, corrige al instante y ofrece Pista; una Partida no tiene tamaño fijo, y Provincias son 52 preguntas más las Vueltas; y `normalizar` quita las tildes y `admiteErrata` perdona una letra, así que «cadiz» y «Guadalquibir» son aciertos que el profesor tacha.

Que la portada sea la causa de que no se use es una hipótesis, no un dato: no hay analítica (ADR-0001). Por eso este tramo es el mínimo que pone delante del alumno algo que se parece a su examen, y lo demás espera a verlo usado.

Este ADR sustituye al ADR-0008 en tres opciones que aquel descartó: agrupar por actividad, plegar las Pruebas y repartir la portada en dos pantallas. Las tres vuelven. La actividad, Simulacro o Tanda, se propone dentro de la Familia elegida, así que el reparto por el que el alumno estudia se conserva; las Pruebas se pliegan enteras bajo Práctica libre; y elegir la Familia es un paso previo que se da una vez y la aplicación recuerda. El ADR-0008 también retiró la palabra Simulacro al llamar **Todo** al Alcance que recorre la Familia entera; vuelve con otro significado, y Todo sigue llamándose Todo. El resto del ADR-0008 sigue en pie: las Familias, los Alcances, Localizar y Nombrar, y sus colores.

El Dominio tiene tres estados por Elemento y no Cajas. Sin ver: no hay entrada. **Flojo**: la última respuesta fue un Fallo o un acierto con Pista, o el Elemento solo se ha presentado. **Sabido**: la última respuesta fue un acierto sin ayuda con Juicio estricto. En tres días, cinco Cajas con sus intervalos se reducen a insistir en lo fallado, que es lo que ya hacen tres estados. Y no hay un cuarto estado «Dominado»: certificaría memoria de hace veinte minutos, y lo que el alumno se sabe de verdad lo dice el Simulacro, no una Tanda.

## Opciones consideradas

- **Cajas tipo Leitner**: en tres días de estudio, cinco Cajas se reducen a insistir en lo fallado, y eso ya lo hacen tres estados.
- **Un estado «Dominado»**: certificaba memoria de veinte minutos.
- **El Simulacro al final**: es lo único que se parece al examen, así que va delante. La primera vez se llama «¿Qué te sabes ya?», no lleva cuenta atrás y cuenta en positivo.
- **Localizar como rampa hacia Nombrar** dentro de las Tandas: preguntar lo que nunca se ha visto es un Fallo seguro. Lo sustituye la presentación rotulada antes de la primera pregunta, y la Tanda queda solo en Nombrar, que es lo que pide el examen.
- **Juicio estricto también en Práctica libre**: sus Marcas no se tocan. Igualar los dos criterios es otro cambio.

## Consecuencias

- El Juicio estricto es una opción del juicio de texto, no un cambio del que hay. La tilde que falta, sobra o va en otra letra, y la errata que Práctica libre perdona, son Fallo. Siguen valiendo los Alias, las formas cortas del ADR-0009, las mayúsculas indistintas y las palabras que no distinguen. Práctica libre sigue tolerando y sus Marcas no se tocan.
- **Un Fallo lleva su tipo**: tilde, errata u otro. Es un Fallo a todos los efectos, pero no es lo mismo no saber dónde está el Júcar que escribirlo sin tilde, y la Corrección podrá decir «Te falta la tilde: Cádiz» o «Casi: Guadalquivir».
- **La eñe es una letra, no una tilde.** «Coruna» no es un Fallo de tilde sino una errata, y «Mino», con menos de seis letras, un Fallo sin más.
- El Dominio vive en `localStorage` bajo `ubicalo:dominio`, como `{ version, familia, elementos }`, y guarda por Elemento `estado`, `visto` (el día local de la última vez), `fallos`, `tipoDeFallo` y `confundidoCon`. La Familia elegida va en el mismo registro.
- **La clave de cada entrada lleva el Alcance además del id.** Es la colisión que el ADR-0008 dejó escrita sin resolver: la comunidad `02` es Aragón y la provincia `02` es Albacete, y en el Dominio conviven.
- **Lo guardado que no se reconoce se tira en silencio**: una versión desconocida, un JSON roto, una entrada incompleta o un id que ya no está en el catálogo. Un cambio de esquema o de catálogo no corrompe el Dominio de nadie, y a cambio tampoco se migra.
- `confundidoCon` es el id del Elemento cuyo nombre escribió el alumno en su último Fallo. No se usa todavía: se guarda para no perder el dato que pedirán los pares que se confunden.
- Solo escriben en el Dominio las Tandas y el Simulacro. Práctica libre no.
- La aplicación nunca cambia la Familia elegida por su cuenta: lo que cae en el examen lo sabe el alumno.
- Político es una sola Familia con dos mapas, Comunidades y Provincias, sobre una sola cuenta atrás en el Simulacro; una Tanda de Político es de uno solo, para que el mapa no cambie a mitad.
- La nota del Simulacro es lineal, aciertos entre total, porque un fallo no resta; y se dice siempre sobre qué se calcula, porque no hay lista oficial: «Sobre los 44 de Ubícalo; tu profesor puede preguntar otros».
- **Una Tanda solo se rellena con Sabidos de hoy cuando trae nuevos.** La regla de partida era rellenar siempre hasta 12, y los alumnos sintéticos la tumbaron: volver a preguntar lo Sabido hace cinco minutos solo le da a quien acierta el 70 % otra ocasión de fallarlo, así que Político tardaba una mediana de 132 Tandas en verse entero, porque las Provincias esperan a las Comunidades, y quien acierta el 50 % seguía con Flojos tras 150 Tandas en las cuatro Familias. Sin nuevos que traer, la Tanda son los Flojos y lo Sabido otro día, y puede ser corta: el botón promete el tiempo, no el número.
- Con esa regla, Tandas encadenadas el mismo día, como mediana y máximo de cinco alumnos sintéticos por caso. El alumno sintético no aprende: acierta siempre con la misma probabilidad, así que es el peor caso y no un alumno real.

  | Familia | Acierta | Verla entera | Quedarse sin Flojos |
  |---|---|---|---|
  | Político (71) | 50 % | 16 · 21 | 22 · 29 |
  | Político (71) | 70 % | 16 · 19 | 17 · 20 |
  | Político (71) | 90 % | 14 · 17 | 15 · 18 |
  | Relieve (44) e Hidrografía (44) | 50 % | 9 · 9 | 13 · 22 |
  | Relieve (44) e Hidrografía (44) | 70 % | 8 · 8 | 9 · 10 |
  | Relieve (44) e Hidrografía (44) | 90 % | 8 · 8 | 8 · 9 |
  | Costas (25) | 50 % | 5 · 5 | 11 · 12 |
  | Costas (25) | 70 % | 5 · 5 | 7 · 7 |
  | Costas (25) | 90 % | 5 · 5 | 6 · 6 |

  Político al 70 % queda en 16, por debajo de las 25 que obligaban a revisar el reparto. El test falla si alguna Familia pasa de 25 Tandas para verse entera o de 30 para quedarse sin Flojos.
- **Los nuevos entran con el nivel de arriba entero y después por ramas completas**: las tres Vertientes, y luego cada Río principal seguido de sus Afluentes; los cinco Tramos, y luego los accidentes de cada uno; las once Cordilleras, y luego las Sierras, el Pico y la Altura de cada una. En Político, las Provincias no empiezan hasta que las Comunidades no tienen nada que repasar ni que ver, y entran por comunidad.
- Quedan fuera hasta ver a alumnos usar esto: el Reto de Simulacro, reinsertar los pares que se confunden, el mapa mudo imprimible, quitar Elementos de la Familia con «Esto no me entra», Localizar dentro de las Tandas, la fecha de examen y medir el uso.
- `CONTEXT.md` gana **Dominio**, **Flojo**, **Sabido** y **Juicio estricto**, y «simulacro» sale de las palabras a evitar de **Todo**; Familia elegida, Tanda, Simulacro y Práctica libre entran con lo que las construye.
