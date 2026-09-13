# Mapa con datos del IGN y nombres oficiales

Provincias y comunidades salen de `es-atlas` (líneas límite del IGN, CC-BY 4.0), que permite uso comercial con atribución visible a pie de mapa. Como esa fuente usa nombres oficiales (Girona, Bizkaia), el nombre oficial es el canónico y la forma castellana entra como alias; el contexto geográfico viene de Natural Earth (dominio público).

## Opciones consideradas

- **Eurostat GISCO**: licencia solo no comercial, incompatible con una posible monetización.
- **INE**: CC BY-SA 4.0; el share-alike obliga a publicar los derivados con la misma licencia.
- **Natural Earth para todo**: nombres en castellano, pero contorno menos preciso y sin recuadro de Canarias.

## Consecuencias

- Los seis elementos con doble nombre oficial en `es-atlas` (Alacant/Alicante, Castelló/Castellón, València/Valencia, Araba/Álava, Cataluña/Catalunya, País Vasco/Euskadi) son la excepción: se muestran en castellano y la otra forma es alias.
- La tabla de alias se mantiene a mano; mezclar nombres de `es-atlas` y Natural Earth en un mismo tipo daría nombres incoherentes.
- La atribución al IGN es obligatoria en cualquier pantalla que muestre el mapa.
