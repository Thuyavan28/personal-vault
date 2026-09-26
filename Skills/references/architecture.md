# Architecture & System Design

- **Start with requirements, not technology**: functional requirements, non-functional requirements (scale, latency, availability, compliance), and constraints (team size, budget, timeline) before picking a stack.
- **Favor boring technology** for the parts of the system that aren't your differentiator; save novelty budget for what actually matters.
- **Modularity & separation of concerns**: layers (presentation / business logic / data access) or services should have clear, narrow interfaces. A module should be replaceable without rewriting its neighbors.
- **Data modeling first**: get entities, relationships, and access patterns right early — schema mistakes are the most expensive to fix later.
- **Scalability approaches**: vertical vs horizontal scaling, stateless services behind a load balancer, read replicas, sharding, async processing/queues for slow work, CDNs for static assets.
- **API design**: prefer resource-oriented REST or well-typed RPC/GraphQL; version APIs from day one; design for backward compatibility; use consistent error shapes and status codes; paginate anything unbounded.
- **Document key decisions** with lightweight Architecture Decision Records (ADRs): context, decision, alternatives considered, consequences. This prevents relitigating settled trade-offs.
- **Avoid premature abstraction**: build the concrete thing twice before extracting a generic abstraction (rule of three).
