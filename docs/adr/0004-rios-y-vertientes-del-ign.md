# Ríos y vertientes de la hidrografía del IGN

Los ríos salen de la Hidrografía del IGN (Información Geográfica de Referencia, CC BY 4.0), por el WFS INSPIRE de IDEE, pidiendo cada río por su nombre exacto; las vertientes, de la capa «Vertientes hidrográficas» del Atlas Didáctico del IGN (CC BY 4.0), el mismo servicio del que ya salen las cordilleras. Todo cabe bajo la atribución al IGN que el mapa ya muestra. El nombre canónico de cada río es la forma de los apuntes del alumno, y no la del dataset.

Esto deja sin efecto la parte del ADR-0003 que fija Natural Earth como fuente de los ríos. Allí valía porque los ríos eran solo Contexto geográfico: bastaba con que el mapa físico de fondo tuviera trazos plausibles de Miño a Segura. Ahora los ríos se preguntan, y el listado de los apuntes son 41 con sus afluentes. Natural Earth solo trae 26, y de esos, 6 no se recuperan filtrando por el nombre español: el Llobregat viene etiquetado `Cardoner`, el Aragón viene como `Alagón` (indistinguible del Alagón extremeño salvo por `name_en`), el Záncara como `Zncara`, el Miño partido en `Mio` y `Minho`, el Tajo necesita `Tajo` más `Tejo` para llegar al Atlántico, y el `Jalón` de Natural Earth es un muñón de cabecera cuyo curso real vive bajo la feature `Jiloca`. Faltan por completo Ter, Gállego, Guadalope, Jabalón, Cigüela, Almonte, Jarama, Nalón, Nervión, Bidasoa, Tambre, Huerva, Odiel y Tinto.

## Opciones consideradas

- **Seguir con Natural Earth y dibujar a mano los catorce que faltan**: reaprovecharía el script actual, pero trazar ríos a ojo es lo mismo que el ADR-0003 descartó para el relieve, y dejaría los seis nombres sucios pidiendo una tabla de correcciones a mano.
- **Recortar el examen a los veintiséis de Natural Earth**: barato, pero deja que el dataset mande sobre los apuntes; quitar el Jarama o el Nalón porque la fuente es pobre es cambiar el contenido del examen.
- **Otro fichero de Natural Earth con más detalle**: no existe. `ne_10m_rivers_europe` ya es el suplemento fino, y el único otro fichero son las mismas geometrías con el `scalerank` recalculado para estilado.
- **OpenStreetMap**: ODbL, share-alike; descartado por la misma razón que el INE en el ADR-0002.
- **La descarga completa de Hidrografía del Centro de Descargas del CNIG**: misma licencia y mismos datos, pero cientos de megas de red hidrográfica nacional para quedarse con 41 ríos. El WFS filtra por nombre en servidor y devuelve solo el río pedido, así que no hace falta.
- **Agrupar a mano las quince cuencas del IGN en tres vertientes**: innecesario. La capa de vertientes ya las trae como tres polígonos, y la de cuencas no tiene ningún campo que las enlace a su vertiente.

## Consecuencias

- La Hidrografía del IGN viene troceada en cientos de tramos por río, hasta 993 en el Tajo. El script toma el camino más largo del grafo de tramos, que es el cauce, y descarta los brazos y acequias que comparten nombre.
- **Los embalses parten el cauce**: el tramo inundado deja de ser un curso de agua en la capa, y el Tajo llega en 103 componentes inconexas. El script las cose en línea recta hasta doce kilómetros y descarta lo que quede más lejos. Ese número no es arbitrario: por debajo, el Tajo sale en 138 km en vez de los 816 reales; por encima, empieza a enganchar fragmentos ajenos. Las longitudes resultantes cuadran con las reales (Guadalquivir 647 frente a 657, Segura 324 frente a 325, Ebro 954 frente a 930), y esa es la comprobación que hay que repetir al regenerar.
- Cada río se orienta hacia su desembocadura: los afluentes hacia donde tocan al río que los recoge, y los demás hacia el extremo con mar abierto alrededor, sondeando contra las vertientes y los países vecinos. No basta el extremo más cercano al receptor: el Záncara nace a tres kilómetros del nacimiento del Cigüela, así que entre dos extremos que lo tocan gana el que cae más abajo.
- **Los nombres del IGN hay que darlos a mano**: el servicio no distingue un río de sus homónimos. Buscar «Ter» devuelve el Tera y doscientos arroyos; el Cigüela allí se escribe Gigüela; el Miño es «Río Miño» pero el Ter es «El Ter» y «Riu Ter». La tabla de nombres del script es la parte que hay que revisar si el IGN reetiqueta algo.
- El servicio declara un `numberMatched` que a ratos vale cero para nombres que sí devuelven tramos, y se queda mudo bajo carga. El script pagina por lo que de verdad llega y reintenta antes de rendirse.
- El script falla en voz alta si la capa cambia, si un río del listado no aparece, si un cauce queda partido o si un afluente no llega a tocar a su receptor, en lugar de escribir un fichero incompleto. El resultado se commitea en `src/datos/`, como el resto: el servicio no garantiza estabilidad.
- El Cinca desemboca en el Segre, no en el Ebro, aunque los apuntes lo listen bajo el Ebro. El dato lo dice y la pregunta sigue siendo el Ebro, como con el Jiloca y el Záncara.
- Con dos Simulacros en el selector, el del relieve pasa a llamarse **Simulacro de relieve** y su id se renombra a juego. Las Marcas se guardan bajo la clave `tipo/modo` y los Retos llevan el `tipo` en el enlace, así que las Marcas guardadas de ese Tipo quedan huérfanas y los Retos de ese Tipo ya compartidos dejan de abrirse. Decisión tomada a sabiendas: no se migra nada ni se avisa al alumno, porque el historial de un repaso no vale la complejidad de una migración. Ningún otro Tipo cambia de id.
- El Contexto geográfico del relieve pasa a usar este dato, así que desaparecen del mapa físico de fondo el `Mio` y los tramos portugueses `Minho` y `Tejo`.
- La vertiente Atlántica del IGN incluye Canarias. No estorba: ningún río del listado es canario.
- La cuenca de cada río la fija el script a mano desde la hidrografía real, no el dataset: el listado de los apuntes está ordenado geográficamente y no sirve para deducirla.

## Fuentes

- Ríos: `https://servicios.idee.es/wfs-inspire/hidrografia`, tipo `hy-p:Watercourse`
- Vertientes: `https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1314/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`
- Licencia declarada en `https://educativo.ign.es/atlas-didactico/agua-bach/las_vertientes_y_cuencas_hidrogrficas.html`
