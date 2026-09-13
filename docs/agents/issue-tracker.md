# Issue tracker: GitHub

Los issues y las specs de este repositorio son issues de GitHub. Todas las operaciones usan el CLI `gh`. Títulos y cuerpos en español.

## Convenciones

- **Crear un issue**: `gh issue create --title "..." --body "..."`. Usa un heredoc para cuerpos de varias líneas.
- **Leer un issue**: `gh issue view <número> --comments`, filtrando comentarios con `jq` y trayendo también las etiquetas.
- **Listar issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` con los filtros `--label` y `--state` que toquen.
- **Comentar**: `gh issue comment <número> --body "..."`
- **Poner / quitar etiquetas**: `gh issue edit <número> --add-label "..."` / `--remove-label "..."`
- **Cerrar**: `gh issue close <número> --comment "..."`

El repositorio se deduce de `git remote -v`; `gh` lo hace solo dentro del clon.

## Pull requests como superficie de triage

**PRs as a request surface: no.** _(Pon `yes` si este repositorio trata las PRs externas como peticiones; `/triage` lee este flag.)_

Con `yes`, las PRs pasan por las mismas etiquetas y estados que los issues, con los equivalentes `gh pr`:

- **Leer una PR**: `gh pr view <número> --comments` y `gh pr diff <número>` para el diff.
- **Listar PRs externas para triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` y quedarse solo con `authorAssociation` igual a `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR` o `NONE` (descartar `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comentar / etiquetar / cerrar**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub comparte numeración entre issues y PRs, así que un `#42` suelto puede ser cualquiera de los dos: resuélvelo con `gh pr view 42` y, si falla, `gh issue view 42`.

## Cuando un skill dice "publica en el issue tracker"

Crea un issue de GitHub.

## Cuando un skill dice "trae el ticket correspondiente"

Ejecuta `gh issue view <número> --comments`.

## Operaciones de wayfinding

Las usa `/wayfinder`. El **mapa** es un único issue y sus **hijos** son los tickets.

- **Mapa**: un issue con la etiqueta `wayfinder:map` que contiene Notas / Decisiones hasta ahora / Niebla. `gh issue create --label wayfinder:map`.
- **Ticket hijo**: un issue enlazado al mapa como sub-issue de GitHub (`gh api` sobre el endpoint de sub-issues). Si los sub-issues no están activos, añade el hijo a una lista de tareas en el cuerpo del mapa y pon `Part of #<mapa>` al principio del cuerpo del hijo. Etiquetas: `wayfinder:<tipo>` (`research`/`prototype`/`grilling`/`task`). Al reclamarlo se asigna a quien lo trabaja.
- **Bloqueo**: las **dependencias nativas de issues** de GitHub, visibles en la interfaz. Se añade una arista con `gh api --method POST repos/<owner>/<repo>/issues/<hijo>/dependencies/blocked_by -F issue_id=<id-db-del-bloqueante>`, donde `<id-db-del-bloqueante>` es el **id numérico de base de datos** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _no_ el `#número` ni el `node_id`). GitHub informa en `issue_dependencies_summary.blocked_by` (solo bloqueantes abiertos). Si no hay dependencias disponibles, usa una línea `Blocked by: #<n>, #<n>` al principio del cuerpo del hijo. Un ticket está desbloqueado cuando todos sus bloqueantes están cerrados.
- **Consulta de frontera**: lista los hijos abiertos del mapa (`gh issue list --state open`, limitado a los sub-issues o la lista de tareas del mapa), descarta los que tengan un bloqueante abierto o un asignado; gana el primero en el orden del mapa.
- **Reclamar**: `gh issue edit <n> --add-assignee @me`, la primera escritura de la sesión.
- **Resolver**: `gh issue comment <n> --body "<respuesta>"`, luego `gh issue close <n>`, y añade un puntero de contexto (resumen + enlace) a Decisiones hasta ahora en el mapa.
