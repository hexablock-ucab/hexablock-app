# Diagrams

Mandatory diagrams (assignment §4, requirement C-11). Each one is kept as an **editable source** in this folder and exported as a high-resolution PNG that the README embeds.

| Diagram | Must show | Source | Export |
|---|---|---|---|
| Class diagram | The main classes (entities, use cases, repositories, services, presenters); generic types in UML template notation and how each variant instantiates them; inheritance, implementation, association, aggregation and composition; the Clean layer of each class (color or stereotype); the design patterns. No low-level UI widgets. | `class-model.json` (the model as data) → `class-diagram.puml` (overview) and `class-diagram-<view>.puml` (one per package or variant) | one `.png` per `.puml` |
| Clean Architecture layers | The four concentric layers with their main components, dependency arrows pointing to the center, a color legend, and the ports and adapters between layers. | `clean-architecture.drawio` | `clean-architecture.png` |
| Extensibility | The generic engine in the center, the variants as extensions, and the extension points a fifth variant would implement (see [EXTENSIBILITY.md](../EXTENSIBILITY.md)). | `extensibility.puml` | `extensibility.png` |

## Legend (the course convention)

Every class in the class diagram shows its layer with a color and a shape, following the convention used in the course:

| Layer | Color | Mark | Contents |
|---|---|---|---|
| Domain (entities) | Yellow | Triangle ▲ | Entities, value objects, rules, builders, the engine and its interfaces |
| Application (use cases) | Purple | Square ■ | Services that implement the use cases, the variant contract and the session data |
| Ports | Green | ◄ input, ► output | Interfaces: input (driving) ports on the left, output (driven) ports on the right |
| Infrastructure (interface adapters, frameworks and drivers) | Blue | Circle ● | View models, controllers, repository implementations, adapters to external services |

The Clean layers diagram keeps the four rings the assignment requires (§3.4); the class diagram uses this legend, so blue covers both outer rings.

## Stereotypes and UML style

- **Stereotypes:** `«Value Object»` and `«Entity»` for the domain classes that are one (`docs/domain-model.md` §1 says why), `«interface»` for every interface, and `«Use Case»`, `«Adapter»`, `«DTO»`, `«Mapper»` or `«ViewModel»` for the architectural roles. No other stereotype is used.
- **GoF patterns** are named in a note attached to each participating class (pattern and role, for example "Strategy: concrete strategy").
- **Notation:** standard UML 2.5 class diagram notation.
- **Members:** each class shows its attributes with visibility (`+` public, `-` private, `#` protected) and type, and its operations with parameters and return type. A value that other classes read is a public attribute marked `{readOnly}`; a derived one carries `/`. There are no getters and no setters. Named constructors (`Score.zero()`, `Mulberry32.fromSeed(seed)`) are static operations; the unnamed constructor of a value object, which takes its attributes and checks its invariant, is left out. Static members are underlined and abstract ones in italics. An optional value has multiplicity `[0..1]`.
- **Generics:** a generic class shows its type parameters, with their bounds, in the dashed box at its top-right corner. PlantUML cannot draw UML's `TCell > IMergeable<TCell>` inside that box, so it reads `TCell extends IMergeable<TCell>`. Each variant binds the engine with a `«bind»` dependency that lists the arguments (`<TCell -> ColorId, …>`), and its rules and factory realize the generic interfaces with the same arguments.
- **Relations:** generalization (solid line, hollow triangle), realization of an interface (dashed line, hollow triangle), association (solid line, with navigability, multiplicities and role names), aggregation (hollow diamond), composition (filled diamond), and dependency (dashed arrow) labeled `«use»`, `«create»` or `«send»` (events), for a type used only as a parameter, a return type, a local variable or a published event.
- **Completeness:** every class of the four layers appears, except UI widgets other than the game screen (C-11). The model is split into views: the overview (`class-diagram.puml`: one box per folder and the `«bind»` of each variant), four views of the engine, two of the use cases, one of the generic adapters, one of the frameworks and one per variant across all layers. Each class appears with its members in exactly one view; another view that needs it shows it without members, inside its own package.

## The class model as data

`class-model.json` holds one entry per class: `name`, `kind` (`class`, `interface`, `abstract`, `enum`, `sealed`), `stereotypes`, `layer`, `port` (`input`, `output` or null), `package`, `folder`, `scope` (`generic` or the variant id), `typeParameters` (name, bound, reason of the bound), `attributes` (name, type, visibility, `readOnly`, `static`, `derived`), `operations` (name, parameters, return type, visibility, `static`, `abstract`, kind), `literals` of an enum, `relations` (type, target, multiplicity, role, label, bindings), `patterns` (pattern and role), `traces` (requirement IDs, game rules, ADRs; † marks one not yet on `main`), `invariant` of a value object and `summary`.

The `.puml` views and the generated sections of `docs/domain-model.md` come from this file, so the diagram, the document and the data are meant to agree. Change the JSON first, then regenerate; until the generator script is in the repository (last bullet), a reviewer checks that the three match.

## Conventions

- Text sources (PlantUML) are preferred where the diagram allows it: changes are reviewable in a pull request. draw.io is used where the layout matters, such as the concentric layers.
- Export at 2x scale, so the images stay readable in the README.
- A pull request that changes a class, a layer boundary or an extension point updates the affected diagram in the same pull request.
- **Tool:** PlantUML for the class diagram, run locally with Java and the built-in Smetana layout (no Graphviz): `java -DPLANTUML_LIMIT_SIZE=30000 -jar plantuml.jar -tpng docs/diagrams/class-diagram*.puml`. `skinparam dpi 192` in every file gives the 2x export. draw.io stays the choice for the concentric layers.
- The script that generates the `.puml` files from `class-model.json` is not in the repository yet; until it is, a change to the model updates the JSON and the affected `.puml` files in the same pull request.
