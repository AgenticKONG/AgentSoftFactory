---
name: example-specialized
description: "Example specialized skill for demonstration purposes. This skill shows the type field in metadata."
metadata:
  type: "specialized"
  category: "data-processing"
---

# Example Specialized Skill

This is an example of a **specialized skill** that is meant to be used by specific expert agents, not by all agents.

## What is a Specialized Skill?

Specialized skills are **domain-specific capabilities** that:
- Address focused problem domains
- Maintain long-term memory for their domain
- Are assigned to expert agents based on their specialty
- Help avoid context window overflow by being selective

## Example Usage

This skill demonstrates the metadata structure:

```yaml
---
name: example-specialized
description: "..."
metadata:
  type: "specialized"  # This marks it as a specialized skill
  category: "data-processing"
---
```

## When to Create Specialized Skills?

Create specialized skills when you need:
1. **Domain-specific knowledge** (e.g., DTHBH data parsing, scientific analysis)
2. **Long-term memory** (maintain state across sessions)
3. **Focused agent expertise** (expert agents with specific capabilities)
4. **Context optimization** (avoid loading unnecessary capabilities)

## Contrast with Builtin Skills

| Aspect | Builtin Skills | Specialized Skills |
|---------|----------------|-------------------|
| **Purpose** | General capabilities all agents need | Domain-specific expertise |
| **Assignment** | Auto-loaded for all agents | Manually assigned to expert agents |
| **Scope** | Universal (file I/O, shell, etc.) | Narrow (data parsing, analysis, etc.) |
| **Memory** | Agent's general memory | Domain-specific long-term memory |

## References

See the [Skills documentation](https://copaw.agentscope.io/docs/skills/) for more details.
