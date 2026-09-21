# El canon de Costas es la hoja oficial

El listado de Costas deja de ser la búsqueda que el alumno dio por buena y pasa a ser la **hoja oficial**: el mapa mudo que reparte el profesor, rotulado a mano. El ADR-0010 aceptó los 20 Elementos porque no había canon que seguir; ahora lo hay, y manda sobre todo lo anterior. Lo que la hoja rotula entra y lo que no rotula sale, aunque estuviera en los cinco listados de ESO con los que se contrastó el de 20.

Con eso la Familia gana seis Cabos y dos Golfos y pierde un Cabo y dos Golfos:

- **Entran** Touriñán, Tortosa y Begur, que están en el Nomenclátor; Cabo da Roca, Cabo de San Vicente y Punta de Europa, que no lo están porque caen fuera de España; y los Golfos de Mazarrón y de León.
- **Salen** el Golfo de Vizcaya, el Golfo de Cádiz y el Cabo de San Antonio. La hoja no rotula el primero; en Cádiz rotula la bahía, que es otro accidente; y lo que parecía una abreviatura junto a la Nao es el dibujo de una isla.

La hoja trae además seis rías, dos bahías y el Mar Menor. No caben en la mancha de 40 km del ADR-0012, que se comería la ría entera y se saldría a mar abierto, así que su agua es la que **la recta de su boca cierra contra la costa**. Los dos extremos de la boca salen del Nomenclátor, salvo en el Mar Menor, que se cierra en las Encañizadas con dos vértices de la propia silueta. Donde la silueta no da agua, porque la ría no está dibujada, como Villaviciosa, o porque cerrada se queda en migas, como Bilbao y Santander, el Elemento es un disco de mar de 8 km en su desembocadura.

## Opciones consideradas

- **Mantener los 20 y añadir lo que falte**: el examen es la hoja, y un Elemento que ella no pide es ruido que el alumno estudia para nada. El Golfo de Vizcaya era uno de los ocho topónimos presentes en todos los listados contrastados; aun así sale, porque el contraste solo servía mientras no hubiera una fuente mejor.
- **Dejar fuera lo que no es España**: la hoja rotula dos cabos portugueses, uno en Gibraltar y un golfo francés, y el mapa ya dibuja en gris a los vecinos. Quitarlos sería volver a decidir el canon por nuestra cuenta.
- **Estirar el encuadre a toda la costa del Golfo de León**, de Creus a Tolón, sin más: el mapa de Costas queda al 97 % de la escala de las demás Familias. Se acepta, porque recortar el golfo a lo que ya cabía lo convertía en una franja pegada al borde.

## Consecuencias

- **Los tres Cabos de fuera llevan el punto a mano** en el script, como los límites de arco de `LIMITES`. El Nomenclátor del IGN solo cubre España.
- **El Golfo de León sale de la costa francesa de world-atlas** y no de la silueta, entre Cerbère y el cabo Sicié. El Cabo de Creus que lo abre queda en España, fuera de ese arco, y se declara a mano como Cabo que baña.
- **El Golfo de Mazarrón va del Cabo de Gata al de Palos**, que es lo que sombrea la hoja, y **el de Valencia pasa a empezar en el Cabo de la Nao**. El delta del Ebro deja de ser un límite declarado: ahora es el Cabo de Tortosa.
- **El mapa de Costas encuadra la silueta más sus propios Elementos**, a través de `encuadre` en el contexto geográfico. La Hoja usa la misma proyección y cambia con él.
- **Gibraltar se dibuja como tierra vecina**, en gris junto a Portugal, Francia, Andorra y Marruecos. Sin eso la Punta de Europa quedaba sobre un hueco blanco.
- **La pareja de Cabos más apretada pasa a ser Estaca de Bares y el Cabo Ortegal**, a siete píxeles. La Nao y San Antonio, a cuatro, eran la referencia de la marca del Cabo y de la separación de Números en la Hoja; los dos umbrales siguen valiendo.
- **Lo guardado del Golfo de Vizcaya, del de Cádiz y del Cabo de San Antonio se descarta al leerse**, como cualquier id que ya no está en el catálogo.
- **Ría y Bahía son dos Clases nuevas.** La Ría tiene su propio Alcance, Rías; las Bahías se juegan en Golfos. El Mar Menor es laguna, pero la hoja lo pone junto a los golfos y se juega como Golfo.
- **Los Vecinos de un agua son las tres aguas más cercanas, sea cual sea su Clase**: con dos Bahías, filtrar por Clase no daba tres Distractores.
- **Las Rías, las Bahías y el Mar Menor van delante en el reparto del mar**, así que el Golfo de Mazarrón cede lo que su banda metía en el Mar Menor.
- En la Hoja, Rías y Bahías llevan la misma trama que los Golfos: en papel cuenta el Número, no la Clase.
- La Familia pasa a tener 34 Elementos: 18 Cabos, 10 Golfos contando las dos Bahías y el Estrecho, y 6 Rías.
