# Ríos y vertientes de la hidrografía del IGN

Los ríos salen de la Hidrografía del IGN (Información Geográfica de Referencia, CC BY 4.0), descargada del Centro de Descargas del CNIG; las vertientes, de la capa «Vertientes hidrográficas» del Atlas Didáctico del IGN (CC BY 4.0), el mismo servicio del que ya salen las cordilleras. Todo cabe bajo la atribución al IGN que el mapa ya muestra. El nombre canónico de cada río es la forma de los apuntes del alumno, y no la del dataset.

Esto deja sin efecto la parte del ADR-0003 que fija Natural Earth como fuente de los ríos. Allí valía porque los ríos eran solo Contexto geográfico: bastaba con que el mapa físico de fondo tuviera trazos plausibles de Miño a Segura. Ahora los ríos se preguntan, y el listado de los apuntes son 41 con sus afluentes. Natural Earth solo trae 26, y de esos, 6 no se recuperan filtrando por el nombre español: el Llobregat viene etiquetado `Cardoner`, el Aragón viene como `Alagón` (indistinguible del Alagón extremeño salvo por `name_en`), el Záncara como `Zncara`, el Miño partido en `Mio` y `Minho`, el Tajo necesita `Tajo` más `Tejo` para llegar al Atlántico, y el `Jalón` de Natural Earth es un muñón de cabecera cuyo curso real vive bajo la feature `Jiloca`. Faltan por completo Ter, Gállego, Guadalope, Jabalón, Cigüela, Almonte, Jarama, Nalón, Nervión, Bidasoa, Tambre, Huerva, Odiel y Tinto.

## Opciones consideradas

- **Seguir con Natural Earth y dibujar a mano los catorce que faltan**: reaprovecharía el script actual, pero trazar ríos a ojo es lo mismo que el ADR-0003 descartó para el relieve, y dejaría los seis nombres sucios pidiendo una tabla de correcciones a mano.
- **Recortar el examen a los veintiséis de Natural Earth**: barato, pero deja que el dataset mande sobre los apuntes; quitar el Jarama o el Nalón porque la fuente es pobre es cambiar el contenido del examen.
- **Otro fichero de Natural Earth con más detalle**: no existe. `ne_10m_rivers_europe` ya es el suplemento fino, y el único otro fichero son las mismas geometrías con el `scalerank` recalculado para estilado.
- **OpenStreetMap**: ODbL, share-alike; descartado por la misma razón que el INE en el ADR-0002.
- **El WFS INSPIRE de Hidrografía del IGN en vez de la descarga completa**: misma licencia y mismos datos, pero paginado; una caja de 0,15° satura el `count`, así que un río saldrían cientos de peticiones. La descarga del CNIG da lo mismo de una vez.
- **Agrupar a mano las quince cuencas del IGN en tres vertientes**: innecesario. La capa de vertientes ya las trae como tres polígonos, y la de cuencas no tiene ningún campo que las enlace a su vertiente.

## Consecuencias

- La Hidrografía del IGN viene troceada en cientos de tramos por río. El script une los tramos de cada río en una sola línea, la ordena de cabecera a desembocadura y la simplifica con el mismo Douglas-Peucker que el relieve. Esa unión es la parte frágil del dato y lo que hay que verificar al regenerarlo.
- El script falla en voz alta si la capa cambia o si un río del listado no aparece, en lugar de escribir un fichero incompleto. El resultado se commitea en `src/datos/`, como el resto: ni el Centro de Descargas ni el servicio REST garantizan estabilidad.
- El Contexto geográfico del relieve pasa a usar este dato, así que desaparecen del mapa físico de fondo el `Mio` y los tramos portugueses `Minho` y `Tejo`.
- La vertiente Atlántica del IGN incluye Canarias. No estorba: ningún río del listado es canario.
- La cuenca de cada río la fija el script a mano desde la hidrografía real, no el dataset: el listado de los apuntes está ordenado geográficamente y no sirve para deducirla.

## Fuentes

- Ríos: `https://centrodedescargas.cnig.es/CentroDescargas/informacion-geografica-referencia`, sección Hidrografía
- Vertientes: `https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1314/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`
- Licencia declarada en `https://educativo.ign.es/atlas-didactico/agua-bach/las_vertientes_y_cuencas_hidrogrficas.html`
