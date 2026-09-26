# Code Quality

## Clean Code
- Names reveal intent (`daysUntilExpiry`, not `d`); functions do one thing and are named after that thing.
- Small functions/methods; a function that needs a comment to explain "what" usually needs a rename or split instead.
- Avoid deep nesting — use early returns / guard clauses.
- Avoid magic numbers/strings — name constants.
- Comments explain *why*, not *what* the code already says.

## SOLID Principles
- **S**ingle Responsibility — a class/module has one reason to change.
- **O**pen/Closed — open for extension, closed for modification (favor composition/strategy over editing existing logic for every new case).
- **L**iskov Substitution — subtypes must be usable wherever their base type is expected without surprising behavior.
- **I**nterface Segregation — many small, specific interfaces beat one fat interface clients are forced to implement in full.
- **D**ependency Inversion — depend on abstractions, not concrete implementations; inject dependencies rather than constructing them internally.

## Design Patterns (use when they fit, not by default)
- Creational: Factory, Builder, Singleton (use sparingly — often a testability smell), Dependency Injection.
- Structural: Adapter, Decorator, Facade, Proxy.
- Behavioral: Strategy, Observer, Command, State, Chain of Responsibility.
- Pick patterns to solve a concrete recurring problem you actually have — pattern-for-pattern's-sake adds indirection without value.

## Refactoring
- Refactor in small, behavior-preserving steps with tests green between each step.
- Common smells to fix: duplicated code, long functions/classes, long parameter lists, feature envy, shotgun surgery (one change requires edits in many places), god objects.
- Never refactor and add new functionality in the same commit/PR — separate them so review and rollback are clean.

## Documentation
- Code needs: a top-level README (what it is, how to run it, how to test it), inline docs for non-obvious public APIs, and ADRs for major decisions (see `architecture.md`).
- Keep docs next to the code they describe so they're more likely to stay current.
- Prefer self-documenting code + minimal necessary docs over exhaustive comments that will rot.
