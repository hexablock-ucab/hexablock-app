# Diagrams

Mandatory diagrams (assignment §4, requirement C-11). Each one is kept as an **editable source** in this folder and exported as a high-resolution PNG that the README embeds.

| Diagram | Must show | Source | Export |
|---|---|---|---|
| Class diagram | The main classes (entities, use cases, repositories, services, presenters); generic types in UML template notation and how each variant instantiates them; inheritance, implementation, association, aggregation and composition; the Clean layer of each class (color or stereotype); the design patterns. No low-level UI widgets. | `class-diagram.puml` | `class-diagram.png` |
| Clean Architecture layers | The four concentric layers with their main components, dependency arrows pointing to the center, a color legend, and the ports and adapters between layers. | `clean-architecture.drawio` | `clean-architecture.png` |
| Extensibility | The generic engine in the center, the variants as extensions, and the extension points a fifth variant would implement (see [EXTENSIBILITY.md](../EXTENSIBILITY.md)). | `extensibility.puml` | `extensibility.png` |

## Conventions

- Text sources (PlantUML) are preferred where the diagram allows it: changes are reviewable in a pull request. draw.io is used where the layout matters, such as the concentric layers.
- Export at 2x scale, so the images stay readable in the README.
- A pull request that changes a class, a layer boundary or an extension point updates the affected diagram in the same pull request.
- The tool choice (PlantUML, draw.io or another) is the team's; record it here when decided.
