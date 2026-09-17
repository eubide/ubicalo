# Relieve con la capa didáctica del IGN y cortes editoriales

Las cordilleras salen de la capa «Unidades del relieve» del Atlas Didáctico del IGN (CC BY 4.0, escala 1:6.500.000, pensada para ESO y Bachillerato); las sierras y los picos, de los listados «Sierras» y «Cumbres» de la Información Geográfica Destacada del IGN (CC-BY 4.0), como puntos en el centro del extent de su visor; los ríos del mapa físico de fondo, de Natural Earth (dominio público), como el contexto geográfico. Todo cabe bajo la atribución al IGN que ya muestra el mapa. El nombre canónico de cada elemento es la forma de los apuntes del alumno, porque es la que se examina, y no el nombre del dataset.

La capa del IGN clasifica el relieve en seis clases (Meseta, cordilleras interiores, rebordes montañosos, cordilleras exteriores, depresiones y relieve volcánico) y funde pares que los apuntes separan: Macizo Galaico-Leonés con Cordillera Cantábrica y Pirineos con Montes Vascos y con la mitad norte de la Costero-Catalana. Esos cortes, y los dos meridianos que parten el Pirineo en Navarro, Aragonés y Catalán (criterio editorial, no tercios iguales; cada parte se guarda como el centro de su geometría, para que la mancha de Pirineos siga siendo tocable), se hacen a mano en el script de datos y son criterio propio, no del IGN. El relieve volcánico de las islas se agrupa como Montañas de Canarias para que el Teide tenga cordillera.

## Opciones consideradas

- **Natural Earth para el relieve (dominio público)**: solo trae Pirineos, Cantábrica, Sierra Morena y un «Sierra Nevada» que en realidad es todo el Penibético. Faltan ocho unidades. Sí vale para los ríos: entre el fichero general y el suplemento europeo están los principales, de Miño a Segura.
- **OpenStreetMap**: ODbL, share-alike; descartado por la misma razón que el INE en el ADR-0002.
- **Dibujar polígonos propios**: sin atribución nueva, pero horas de trazado y un límite de cada sistema decidido sin criterio geográfico.
- **Polígonos para las sierras**: no hay fuente libre; los puntos del listado del IGN bastan para un mapa mudo. Montserrat no está en ese listado y sale de Wikidata (CC0).
- **Wikidata (CC0) para los picos**: coordenadas exactas, pero etiquetas sucias y duplicados; se usa solo para contrastar las coordenadas del IGN, que tienen un error de hasta 500 m.

## Consecuencias

- El servicio REST del IGN no garantiza estabilidad: el script descarga, trocea y simplifica, y el resultado se commitea en `src/datos/` como ya ocurre con el contexto geográfico.
- Los cortes editoriales (rectas fijadas en el script) son la parte más discutible del dato; a escala de mapa mudo no cambian la respuesta correcta.
- Cordilleras, sierras y picos no comparten arcos ni frontera, así que sus Vecinos son los tres elementos más cercanos por centroide, no los limítrofes.
- Cada sierra y cada pico lleva su cordillera y su clase en el dato; Jerarquía y Alturas se derivan de ahí sin geometría propia, y el icono del mapa sale de la clase.
- La capa trae seis registros, uno por clase, y el papel que cada uno declara respecto a la Meseta viaja hasta el dato: es lo que ordena el Tipo Grandes unidades (ADR-0006). Las dos depresiones salen separadas con el mismo punto interior que ya reconoce las demás partes, sin corte nuevo.
- La Meseta llega como un único polígono: la división en Submeseta Norte y Sur que anuncia su descripción no está en la geometría y exigiría un corte propio por el Sistema Central, que no se hace.

## Fuentes

- Capa: `https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1114/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`
- Licencia declarada en `https://educativo.ign.es/atlas-didactico/relieve-bach/las_grandes_unidades_del_relieve_peninsular.html`
- Sierras y cumbres: `https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_SIERRAS.xlsx` y `…/IGN_INFOGEO_CUMBRES.xlsx`
- Ríos: `ne_10m_rivers_lake_centerlines` y `ne_10m_rivers_europe` de `github.com/nvkelso/natural-earth-vector`
