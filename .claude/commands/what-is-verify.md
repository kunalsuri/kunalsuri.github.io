---
description: Fact-check and structurally verify a draft post before publishing
argument-hint: <slug, e.g. what-is-an-llm>
---

Verify the post `$ARGUMENTS` against both halves of the gate in
`docs/series/what-is-playbook.md` §6.

1. **Mechanical:** run `npm run verify:post -- $ARGUMENTS`. Fix every error.
   Report warnings; do not paper over them.
2. **Factual:** check every claim in the post against a current primary source.
   Follow every external link. Confirm every number is either dated inline or
   cut. Resolve or escalate every `[?]` marker — none may survive this pass.
3. Write the findings to `docs/series/reviews/$ARGUMENTS.md`: a claim → source →
   verdict table, the mechanical output, and what you would still change.
4. Apply unambiguous corrections directly. Ask before any change that alters the
   post's argument.

Report the verdict and stop. **Do not publish.**
