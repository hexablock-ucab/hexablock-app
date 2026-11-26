# Diagrams

Mandatory diagrams (assignment §4, requirement C-11). Each one is kept as an **editable source** in this folder and exported as a high-resolution PNG that the README embeds.

| Diagram | Must show | Source | Export |
|---|---|---|---|
| Class diagram | The main classes (entities, use cases, repositories, services, presenters); generic types in UML template notation and how each variant instantiates them; inheritance, implementation, association, aggregation and composition; the Clean layer of each class (color or stereotype); the design patterns. No low-level UI widgets. | `class-diagram.puml` | `class-diagram.png` |
| Clean Architecture layers | The four concentric layers with their main components, dependency arrows pointing to the center, a color legend, and the ports and adapters between layers. | `clean-architecture.drawio` | `clean-architecture.png` |
| Extensibility | The generic engine in the center, the variants as extensions, and the extension points a fifth variant would implement (see [EXTENSIBILITY.md](../EXTENSIBILITY.md)). | `extensibility.puml` | `extensibility.png` |

## Legend (the course convention)

Every class in the class diagram shows its layer with a color and a shape, following the convention used in the course:

| Layer | Color | Mark | Contents |
|---|---|---|---|
| Domain (entities) | Yellow | Triangle | Entities, value objects, builders, rules, the engine |
| Application (use cases) | Purple | Square | Services that implement the use cases |
| Ports | Green | — | Interfaces: input (driving) ports on the left, output (driven) ports on the right |
| Infrastructure (interface adapters, frameworks and drivers) | Blue | Circle | View models, controllers, repository implementations, adapters to external services |

The Clean layers diagram keeps the four rings the assignment requires (§3.4); the class diagram uses this legend, so blue covers both outer rings.

## Stereotypes and UML style

- **Domain classes** carry one of two stereotypes, taken from `docs/domain-model.md`: `«Value Object»` or `«Entity»` (a class with identity). There are no aggregate, domain service, repository, factory or domain event stereotypes: a repository is an `«interface»` (the port) plus its `«Adapter»`, and a factory is named as a pattern in its note.
- **Other classes** keep their architectural role: `«interface»` for ports, and `«Use Case»`, `«Adapter»`, `«DTO»`, `«Mapper»` or `«ViewModel»` where the name does not make it obvious.
- **GoF patterns** are named in a note attached to the participating classes (pattern and role, for example "Strategy: concrete strategy"), so they do not mix with the stereotypes.
- **Notation:** standard UML 2.5 class diagram notation.
- **Members:** each class shows its attributes with visibility (`+` public, `-` private, `#` protected) and type, and its operations with parameters and return type. A read-only value is drawn as a public attribute with `{readOnly}` (UML 2.5, for example `+ value: Integer {readOnly}`), never as a `get` operation. There are no setters. The operations are the game's actions, the questions the rules ask and the Memento operations (`toSnapshot()`, `restore(snapshot)`). Constructors and named or factory constructors are shown, with their parameters. Static members are underlined and abstract ones in italics.
- **Generics:** a generic class shows its type parameters, with their bounds, in the dashed box at its top-right corner (`TCell > Mergeable<TCell>`), and each variant's binding uses a realization or `«bind»` with the concrete type.
- **Relations:** generalization (solid line, hollow triangle), realization of an interface (dashed line, hollow triangle), association (solid line, with navigability, multiplicities and role names), aggregation (hollow diamond), composition (filled diamond), and dependency (dashed arrow) labeled with its kind, such as `«use»` or `«create»`, for a type used only as a parameter, a return type or a local variable.
- **Completeness:** every class of the domain and application layers appears, with the main adapters; only UI widgets are left out (C-11). When one diagram gets too large, it is split by package or variant instead of omitting classes.

## Conventions

- Text sources (PlantUML) are preferred where the diagram allows it: changes are reviewable in a pull request. draw.io is used where the layout matters, such as the concentric layers.
- Export at 2x scale, so the images stay readable in the README.
- A pull request that changes a class, a layer boundary or an extension point updates the affected diagram in the same pull request.
- The tool choice (PlantUML, draw.io or another) is the team's; record it here when decided.
