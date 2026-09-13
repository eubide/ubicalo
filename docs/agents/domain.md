# Docs de dominio

Cómo deben usar los skills de ingeniería la documentación de dominio de este repositorio al explorar el código.

## Antes de explorar, lee esto

- **`CONTEXT.md`** en la raíz: el glosario del proyecto.
- **`docs/adr/`**: los ADRs que toquen la zona en la que vas a trabajar.

Si alguno no existe, **sigue sin decir nada**. No señales su ausencia ni propongas crearlos de antemano. El skill `/domain-modeling` (vía `/grill-with-docs` e `/improve-codebase-architecture`) los crea cuando se resuelve un término o una decisión.

## Estructura

Repositorio single-context:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-sin-servidor-ni-datos-personales.md
│   └── 0002-mapa-ign-y-nombres-oficiales.md
└── src/
```

## Usa el vocabulario del glosario

Cuando tu salida nombre un concepto del dominio (título de un issue, propuesta de refactor, hipótesis, nombre de un test), usa el término tal como lo define `CONTEXT.md`. No uses los sinónimos que el glosario marca en _Evitar_.

Si el concepto que necesitas no está en el glosario, es una señal: o estás inventando lenguaje que el proyecto no usa (reconsidéralo) o hay un hueco real (anótalo para `/domain-modeling`).

## Señala conflictos con ADRs

Si tu salida contradice un ADR existente, dilo explícitamente en vez de ignorarlo:

> _Contradice ADR-0001 (sin servidor ni datos personales), pero merece reabrirse porque…_
