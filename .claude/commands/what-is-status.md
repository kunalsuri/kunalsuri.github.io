---
description: Show the What Is series pipeline — published, in flight, and queued
---

Report the current state of the **What Is** series pipeline. Do not modify anything.

1. Run `npm run verify:post -- --series "What Is"` for the mechanical state of
   every post in the series.
2. List posts by stage:
   - **Published** — `series: "What Is"` with `draft: false`
   - **In flight** — `series: "What Is"` with `draft: true`, and whether
     `docs/series/reviews/<slug>.md` exists (i.e. verified or not)
   - **Queued** — the ideas in `docs/series/what-is-backlog.md`
3. Flag any drift: a draft with no review report, a review report with no post,
   a backlog entry whose state does not match what is on disk, or any `[?]`
   markers still sitting in a draft.

Finish with the single most useful next action.
