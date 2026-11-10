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
| Domain (entities) | Yellow | Triangle | Entities, value objects, domain services, builders, rules |
| Application (use cases) | Purple | Square | Services that implement the use cases |
| Ports | Green | — | Interfaces: input (driving) ports on the left, output (driven) ports on the right |
| Infrastructure (interface adapters, frameworks and drivers) | Blue | Circle | View models, controllers, repository implementations, adapters to external services |

The Clean layers diagram keeps the four rings the assignment requires (§3.4); the class diagram uses this legend, so blue covers both outer rings.

## DDD stereotypes and UML style

- **DDD building blocks** carry their stereotype: `«Value Object»`, `«Entity»`, `«Aggregate Root»`, `«Domain Service»`, `«Repository»`, `«Factory»`, `«Domain Event»`. A class may carry two (`«Entity» «Aggregate Root»`). The role comes from `docs/domain-model.md`.
- **Other classes** keep their architectural role: `«interface»` for ports, and `«Use Case»`, `«Adapter»`, `«DTO»`, `«Mapper»` or `«ViewModel»` where the name does not make it obvious. They never carry a DDD stereotype.
- **GoF patterns** are named in a note attached to the participating classes (pattern and role, for example "Strategy: concrete strategy"), so they do not mix with the DDD stereotypes.
- **Members:** attributes keep their real visibility: `-` for internal state, and `+ name: Type {readOnly}` for state other classes may read (the final or `readonly` fields of value objects and entities). That read-only public attribute replaces a getter, so getters, setters, `add` methods and constructors are not drawn, except the constructor signature that injects dependencies. Every change of state appears as a command method.
- **Relations:** a dependency through a parameter, a return type or a local variable is a solid arrow labeled `«use»`; a dependency held in an attribute is an association, aggregation or composition.
- **Minimal:** draw the classes that explain the design; list secondary ones in a note.

## Conventions

- Text sources (PlantUML) are preferred where the diagram allows it: changes are reviewable in a pull request. draw.io is used where the layout matters, such as the concentric layers.
- Export at 2x scale, so the images stay readable in the README.
- A pull request that changes a class, a layer boundary or an extension point updates the affected diagram in the same pull request.
- The tool choice (PlantUML, draw.io or another) is the team's; record it here when decided.
