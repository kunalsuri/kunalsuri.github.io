---
description: Publish a reviewed draft — flip draft:false, run the full gate, commit
argument-hint: <slug, e.g. what-is-an-llm>
---

Publish the reviewed post `$ARGUMENTS`.

Refuse and explain if either precondition fails:
- `docs/series/reviews/$ARGUMENTS.md` does not exist (the post was never verified), or
- the user has not said this post is ready.

Otherwise:

1. Re-run `npm run verify:post -- $ARGUMENTS`; it must pass with no errors.
2. Set `draft: false` and `pubDate` to today, unless the user named a date.
3. Run the full verification suite: `./scripts/linux/dev-tests.sh`.
4. Move the post from **In flight** to **Published** in
   `docs/series/what-is-backlog.md`.
5. Commit on the current branch with a clear message. Do not push unless asked,
   and never push directly to `main`.

Report what shipped and the live URL it will occupy.
