# Flujo de trabajo con las skills de Matt Pocock

Guía para construir Ubícalo con el plugin `mattpocock-skills` (versión 1.2.3). En Claude Code los comandos llevan el prefijo del plugin: `/mattpocock-skills:<nombre>`.

## La cadena principal

```txt
grill → to-spec → to-tickets → implement → code-review
```

| Paso | Comando | Qué produce | Estado en Ubícalo |
| --- | --- | --- | --- |
| 0 | `git init` y `/mattpocock-skills:setup-matt-pocock-skills` | `CLAUDE.md` y `docs/agents/*.md` | [x] Hecho (2026-09-13) |
| 1 | `/mattpocock-skills:grill-with-docs` | Decisiones, `CONTEXT.md` y ADRs en `docs/adr/` | [x] Hecho (2026-09-13) |
| 2 | `/mattpocock-skills:to-spec` | Un issue de GitHub con la spec | [x] Hecho: #1 (2026-09-13) |
| 3 | `/mattpocock-skills:to-tickets` | Un issue de GitHub por ticket, con sus dependencias | [x] Hecho: #2–#10 (2026-09-13) |
| 4 | `/mattpocock-skills:implement` | Código con TDD, revisión y commit, un ticket por sesión | [x] Hecho: #2–#10, PRs #11–#18 y #21 (2026-09-13) |
| 5 | `/mattpocock-skills:code-review <punto fijo>` | Informe de estándares y de fidelidad a la spec | Lo lanza `implement` al terminar |

## Paso 0: preparar el repositorio (hecho)

- **Repositorio**: `eubide/ubicalo`, privado, enlazado como `origin`.
- **Issue tracker**: GitHub Issues con el CLI `gh` (`docs/agents/issue-tracker.md`).
- **Triage labels**: los cinco nombres por defecto, ya creados en GitHub (`docs/agents/triage-labels.md`).
- **Domain docs**: single-context, `CONTEXT.md` y `docs/adr/` en la raíz (`docs/agents/domain.md`).
- **Instrucciones del agente**: bloque `## Agent skills` en `CLAUDE.md`.

Solo hace falta volver a lanzar el setup para cambiar de tracker o empezar de cero; lo demás se edita a mano en `docs/agents/`.

## Paso 1: decidir (hecho)

`grill-with-docs` es `grilling` más `domain-modeling`: entrevista por rondas y escribe el glosario y las decisiones difíciles mientras tanto.

Qué quedó escrito:

- `CONTEXT.md`: solo glosario. Nada de detalles de implementación.
- `docs/adr/`: una decisión solo entra si cumple las tres condiciones: difícil de revertir, sorprendente sin contexto y fruto de una disyuntiva real.
- `DEFINITION.md`: la idea original. Desde la spec deja de ser la fuente de verdad.

## Paso 2: spec

`to-spec` no pregunta: resume lo ya decidido. Antes de escribir te propone las **seams** (fronteras públicas donde se prueban los tests) y espera tu confirmación. Esa es la parte que más merece tu atención.

- Lánzalo **en la misma sesión que el grilling**, sin `/clear` ni `/compact`: necesita la conversación original.
- Publica la spec como issue de GitHub con la etiqueta `ready-for-agent`.
- Plantilla: problema, solución, historias de usuario, decisiones de implementación, decisiones de pruebas, fuera de alcance y notas.
- Revisa sobre todo **Fuera de alcance**. Todo lo que diga la spec y no hayas decidido tú es un defecto.
- La spec es una foto del momento. Lo que aprendas implementando va a `CONTEXT.md` o a un ADR, no a la spec.

## Paso 3: tickets

`to-tickets` corta la spec en **tracer bullets**: rebanadas verticales que se pueden demostrar solas y caben en una sesión nueva.

1. Lánzalo en la misma ventana que `to-spec`, pasándole el issue de la spec (`#<número>`).
2. Te enseña la lista con título, **Blocked by** y qué entrega cada ticket.
3. Ajusta la granularidad y las dependencias hasta aprobarla.
4. Publica un issue por ticket, bloqueantes primero, con las dependencias nativas de GitHub, la etiqueta `ready-for-agent` y criterios de aceptación.

## Paso 4: implementar, un ticket cada vez

1. Elige un ticket de la **frontera**: los que tienen todos sus bloqueantes cerrados.
2. Abre una sesión nueva y ejecuta `/mattpocock-skills:implement #<número>`.
3. `implement` usa `tdd` solo en las seams acordadas, pasa typecheck y tests, ejecuta `code-review` y **hace commit en la rama actual**. Lanzarlo equivale a autorizar ese commit.
4. El push a GitHub no lo hace ningún skill: lo pides aparte.
5. Cierra el issue del ticket y pasa al siguiente.

### Cómo se hizo en Ubícalo

- **Oleadas por frontera:** #3, #4, #5 y #6 en paralelo; luego #7 y #9; luego #8 y #10.
- **Un agente por ticket**, cada uno en su propio worktree (`git worktree add <ruta> -b ticket-N-… main`), con TDD solo en las seams Partida, Competición y Catálogo.
- **Revisión en dos ejes** por ticket, con dos subagentes en paralelo: estándares (glosario, reglas y olores) y spec (criterios del issue y casos límite).
- **Arreglos** de los defectos y desviaciones encontrados; las dudas de producto se preguntaron antes de decidir.
- **Integración:** `git merge main` en la rama del ticket, `task verificar`, PR con `Closes #N` y merge a `main`.

Comandos del proyecto: `task` lista las tareas (`dev`, `dev:https`, `test`, `check`, `build`, `verificar`…). En el iPhone, usa `task dev:https`.

## Cambios tras probar con usuarios

Cuando una prueba real saca fallos, se vuelve a entrar en la cadena por el principio, pero sin spec nueva si cabe en pocas sesiones:

1. **`/mattpocock-skills:grill-with-docs`** con lo observado (modo, dispositivo, qué creyó el usuario). Los términos nuevos van a `CONTEXT.md`.
2. **`/mattpocock-skills:prototype`** solo si el "cómo se ve" no se decide hablando.
3. **`/mattpocock-skills:to-tickets`** directamente desde la conversación.
4. **`/mattpocock-skills:implement`** por frontera, como en el paso 4.

En Ubícalo (2026-09-13): la prueba con un alumno llevó a Corrección, Racha de fallos, Repaso y Pista de área (glosario en PR #24), tickets #25–#29 y PRs #30–#34.

## Entre fases: seguir, limpiar o traspasar

En cada frontera entre fases, recorre las preguntas en orden y quédate con el primer sí:

1. ¿La fase siguiente necesita esta conversación tal cual, o queda contexto de sobra? → **Seguir** en la misma sesión.
2. ¿Todo lo de esta sesión sobra? → **`/clear`**.
3. ¿Cambias de herramienta, de directorio o se lo pasas a otra persona? → **`/mattpocock-skills:handoff`**.
4. ¿La tarea puede hacerse sin ti delante? → **Subagente**.
5. Si no → **`/compact`** con una instrucción ("vamos a implementar el ticket #3").

Nunca compactes a mitad de una fase.

## Fuera de la cadena

| Situación en Ubícalo | Comando |
| --- | --- |
| ¿Cómo debe verse el mapa mudo minimalista? Hablar no lo resuelve | `/mattpocock-skills:prototype` |
| Falta un dato externo (una licencia, qué ríos entran en ESO) | `/mattpocock-skills:research` |
| Un bug difícil o algo lento en móvil | `/mattpocock-skills:diagnosing-bugs` |
| Cabos y golfos (aplazados) | `/mattpocock-skills:grill-with-docs`; `/mattpocock-skills:wayfinder` si no cabe en una sesión |
| Un mensaje del agente no se entiende | `/mattpocock-skills:wait-what` |
| No sabes qué skill toca | `/mattpocock-skills:ask-matt` |
| Cada pocos días, para vigilar el diseño del código | `/mattpocock-skills:improve-codebase-architecture` |

## Próximo paso

- [x] `git init`
- [x] `/mattpocock-skills:setup-matt-pocock-skills`
- [x] `/mattpocock-skills:to-spec` → #1
- [x] Resolver los cuatro puntos "Sin decidir" de #1
- [x] `/mattpocock-skills:to-tickets #1` → #2–#10
- [x] `/mattpocock-skills:implement` de #2 a #10 → PRs #11–#18 y #21
- [x] Prueba con usuario → `grill-with-docs` → `to-tickets` #25–#29 → `implement` → PRs #30–#34, spec #1 cerrada
- [ ] Probar en un móvil real: gestos táctiles, recuadro de Ceuta y Melilla, y compartir un reto (requiere HTTPS)
- [x] Siguiente bloque: relieve (cordilleras, sierras, picos) con `grill-with-docs` → spec #36 → tickets #37–#45 → `implement` → `code-review` (dos ejes, hallazgos corregidos) → PR #46, spec cerrada
- [x] Bloque Simulacro: spec #47 → tickets #48–#52 → PR #53, spec cerrada
- [x] Bloque Grandes unidades: la Meseta y las depresiones, spec #63 → PR #64. Sin tickets: cupo en una sesión desde la conversación, como los cambios tras probar con usuarios
- [ ] Probar el relieve en un móvil real: pulsadores de sierras y picos, rótulos apilados en el Repaso de Pertenencia, y las manchas de Montes Vascos y Montes de Toledo, que a ancho de móvil quedan por debajo de los 44 px de pulsador
- [x] Bloque Ríos: spec #54 → tickets #55–#61 → PR #62, spec cerrada. La rama salió antes que Grandes unidades, así que se integró con `git merge main` y los nueve conflictos resueltos a mano
- [x] Bloque Señales: un solo código de color y borde para los tres juegos de estado que dejó el merge de Ríos. Salió de `/mattpocock-skills:grill-me` sobre el bucle de pregunta, sin spec ni tickets → ADR-0007
- [ ] Probar las Señales en un móvil real: el punteado del borde a ancho de móvil, la funda de los cauces sobre una vertiente, la leyenda de Señales cuando conviven cinco estados, y los Rótulos de ríos acertados cuando se amontonan en una cuenca
- [x] Bloque Portada: tres Familias en lugar de once Tipos, con Alcance y Dirección en su sitio → ADR-0008. Sin spec ni tickets: el ADR ya traía la lista de consecuencias
- [ ] Probar la portada en un móvil real: las tres tarjetas a 375 px, los dos botones de dirección en una fila, y la silueta de España junto al nombre
- [ ] Siguiente bloque: despliegue (dominio y Terraform), o cabos y golfos con `/mattpocock-skills:grill-with-docs`
