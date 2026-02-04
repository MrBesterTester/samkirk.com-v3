# Create Blueprint

**Purpose:** Generate blueprint from specification to create `docs/BLUEPRINT.md`

**Usage:** In Claude Code, reference this skill or paste the prompt below.

## Prompt

```
@docs/Dylan-Davis-50plus-method.md @docs/SPECIFICATION.md

Draft a detailed, step-by-step blueprint for building this project. Then, once you have a solid plan, break it down into small, iterative chunks that build on each other. Look at these chunks and then go another round to break it into small steps.

Review the results and make sure that the steps are small enough to be implemented safely with strong testing, but big enough to move the project forward. Iterate until you feel that the steps are right sized for this project.

From here you should have the foundation to provide a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Make sure we're not using mock data, but real data when testing and real calls to APIs when relevant.

Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.

Make sure and separate each prompt section. Use markdown. Each prompt should be tagged as text using code tags. The goal is to output prompts, but context is important as well.

When done, please write out the blueprint as docs/BLUEPRINT.md.
```

**Model:** Claude Opus 4.5 (per Dylan Davis methodology)
