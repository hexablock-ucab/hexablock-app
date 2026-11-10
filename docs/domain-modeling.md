# Domain modeling guide (DDD tactical patterns)

How this project models its domain. It applies to the domain and use-case layers of both repositories (`hexablock-app` and `hexablock-api`) and to every class diagram (C-05, C-11, C-32).
The domain model itself, with the glossary, lives in `docs/domain-model.md`; this guide states the rules that model follows.

**Sources.** Eric Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software* (Addison-Wesley, 2003), Part II; Eric Evans, *Domain-Driven Design Reference: Definitions and Pattern Summaries* (2015, CC BY 4.0, [domainlanguage.com](https://www.domainlanguage.com/ddd/reference/)); Dino Esposito, *Clean Architecture with .NET* (2024), chapters 2, 6 and 7. The rules below are this project's application of those sources, not quotations.

## 1. Ubiquitous language

- Every domain concept has one name, recorded in the glossary of `docs/domain-model.md` with its Spanish equivalent. Code, diagrams, tests, commits and documents use that name and no synonym.
- A change in the language is a change in the model: when a term changes, the code, the diagrams and the glossary change in the same pull request.
- Names come from the games and their rules (`Board`, `Piece`, `ColorStack`, `LineClear`), never from technology (`DataManager`, `JsonHelper`).

## 2. Building blocks

Each building block below has a stereotype that the class diagram must show (section 4).

### Value object — `«Value Object»`

A value object describes a characteristic of something and has no identity of its own: its value is its identity.

- **Equality by value.** Two value objects with the same attributes are equal: in Dart, `==` and `hashCode` compare the attributes; in TypeScript, an `equals` method does.
- **Immutable.** All fields are final. An operation that "changes" a value returns a new instance.
- **Self-validating.** It cannot exist in an invalid state: creation rejects invalid input with a domain error.
- **Behavior of its own.** It holds the operations that belong to the concept (a coordinate computes its neighbors; a tile value knows how it merges).
- **Groups values that only make sense together**, such as the two axial components of a coordinate.
- **No setters**, and no getter that only wraps a private field: expose final (Dart) or `readonly` (TypeScript) fields instead.
- It replaces primitives in the domain and the use cases (C-32). Only booleans, and an integer the team justifies as needing no value object of its own, stay primitive.

### Entity — `«Entity»`

An entity is defined by an identity that stays the same through its life cycle, not by its attributes.

- **Unique, stable identity**, modeled as a value object (`GameSessionId`, `PlayerId`). Identities come from an injected generator, never from the domain itself.
- **Equality by identity.** Two entities with the same identity are the same entity, even if their attributes differ.
- **Mutable, with a life cycle.** Its state changes over time: created, played, finished.
- **Behavior, not just data.** State changes only through methods that express an intention of the game or the business (`placePiece`, `finish`), never through setters.
- It enforces its own invariants and uses value objects for its attributes.

### Aggregate — `«Aggregate Root»` on the root

An aggregate is a cluster of entities and value objects with one consistency boundary and one entity as its root.

- Outside objects hold a reference to the root only. Other aggregates refer to it by its identity, not by an object reference.
- The root enforces every invariant of the aggregate; nothing outside changes an inner object directly.
- One operation changes one aggregate and leaves it consistent. Consistency between aggregates is eventual.
- Aggregates stay small: include an object only when an invariant needs it inside the boundary.

### Domain service — `«Domain Service»`

A domain service holds a domain operation that does not belong naturally to any entity or value object.

- It is stateless, named with the ubiquitous language, and lives in the domain layer.
- It is not an application service: a use-case service (`GameSessionService`) orchestrates the domain and the ports and lives in the application layer; it carries no domain rules.
- Use one only when the operation truly involves several objects and none of them is its natural owner. Logic that fits an entity or a value object stays there, to avoid an anemic model.

### Repository — `«Repository»`

A repository gives access to aggregates as if they were an in-memory collection, and hides the storage technology.

- One repository per aggregate root that needs to be found again; never one for an inner entity or a value object.
- The interface is declared in the inner layer that uses it and speaks the ubiquitous language (`findById`, `save`, `findBestScores`). Its implementation is an adapter in layer 3 (`SqliteProgressRepository`, `PostgresProgressRepository`).
- It returns and accepts whole aggregates, never DTOs, rows or ORM types.

### Factory — `«Factory»`

A factory creates a complex aggregate or value object in one step, so the result satisfies its invariants from the start and clients do not need to know concrete classes.

- Use one when creation is complex or chooses among concrete types (for example, a variant's rules and components: Abstract Factory, C-06).
- A builder assembles a complex object step by step, such as a board or a level read from a file (ADR-0006). It is a GoF pattern used as a factory; the diagram marks it `«Factory»` and names the pattern in a note.

### Domain event — `«Domain Event»`

A domain event records something that happened in the domain and that matters to it (`LinesCleared`, `TilesMerged`, `LevelCompleted`).

- Named in the past tense, immutable, and carrying the time (from the injected clock) and the identities involved.
- Raised by the aggregate whose state changed; handled outside it (for example, score or sound). The handling mechanism follows the Observer pattern.
- Domain events are not part of Evans (2003); they appear in Evans's *Domain-Driven Design Reference* (2015).

### Module

Packages and folders inside the domain are grouped by domain concept and named in the ubiquitous language (`board`, `pieces`, `variants/hexa_sort`), not by technical type (`models`, `utils`).

## 3. What is not a DDD building block

Use cases, application services, ports, adapters, DTOs, mappers, view models, controllers and presenters belong to Clean Architecture, not to DDD's tactical patterns. GoF patterns (Strategy, Abstract Factory, Observer, Decorator) are design patterns that can appear in any layer.
The diagrams keep these apart so a reader can tell what is DDD and what is not (section 4).

## 4. Class diagram conventions

- **DDD stereotypes only on DDD building blocks:** `«Value Object»`, `«Entity»`, `«Aggregate Root»`, `«Domain Service»`, `«Repository»`, `«Factory»`, `«Domain Event»`. A class may carry two (`«Entity» «Aggregate Root»`).
- **Everything else** uses its UML or architectural stereotype: `«interface»` for ports, and `«Use Case»`, `«Adapter»`, `«DTO»`, `«Mapper»` or `«ViewModel»` where the role is not obvious from the name.
- **GoF patterns** are named in a note attached to the participating classes (pattern and role, for example "Strategy: concrete strategy"), not as stereotypes, so they never mix with the DDD ones.
- **Layer** by color and mark, as in [diagrams/README.md](diagrams/README.md).
- **Members:** public attributes are shown directly. Getters, setters, `add` methods and constructors are not drawn, except the constructor signature that injects dependencies.
- **Relations:** a dependency through a parameter, a return type or a local variable is a solid arrow labeled `«use»`; a dependency held in an attribute is an association, aggregation or composition.
- **Minimal:** draw the classes that explain the design; list secondary ones in a note.

## 5. Checklist for a pull request that adds or changes a domain class

- [ ] Its name is in the glossary, and the glossary says which building block it is.
- [ ] A value object is immutable, compares by value, validates itself and has behavior.
- [ ] An entity has an identity value object and changes only through intention-revealing methods.
- [ ] Each aggregate has one root; nothing outside reaches its inner objects.
- [ ] A repository exists only for an aggregate root, and its interface sits in the inner layer.
- [ ] No setter, and no getter that only wraps a private field.
- [ ] The class diagram shows its stereotype, its layer color and its relations by the rules above.
